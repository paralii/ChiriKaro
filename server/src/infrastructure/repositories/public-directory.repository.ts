import { ClinicModel } from "@infrastructure/database/mongodb/models/ClinicModel.ts";
import { DentistModel } from "@infrastructure/database/mongodb/models/DentistModel.ts";
import { ClinicStatus } from "@domain/enum/clinic-status.enum.ts";
import { ClinicSetupStatus } from "@domain/enum/clinic-setup-status.enum.ts";
import type { PipelineStage } from "mongoose";
import type { IPublicDirectoryRepository, PublicDirectoryCandidateDTO, PublicDirectoryRepositoryQuery, PublicDirectoryRepositoryPage } from "@application/interfaces/repositories/IPublicDirectoryRepository.ts";
import type { PublicDirectoryListingDTO } from "@application/dto/search/public-directory.dto.ts";

interface PublicDirectoryAggregate {
  items: Array<Omit<PublicDirectoryListingDTO, "listingId"> & { clinicId: string; doctorUserId: string }>;
  total: Array<{ count: number }>;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export class PublicDirectoryRepository implements IPublicDirectoryRepository {
  async search(query: PublicDirectoryRepositoryQuery): Promise<PublicDirectoryRepositoryPage> {
    const clinicMatch: PipelineStage.Match["$match"] = {
      status: ClinicStatus.APPROVED,
      setupStatus: ClinicSetupStatus.VERIFIED,
    };
    if (query.city) clinicMatch.city = { $regex: escapeRegex(query.city), $options: "i" };
    if (query.specialization) clinicMatch.services = { $regex: escapeRegex(query.specialization), $options: "i" };

    const doctorMatch: PipelineStage.Match["$match"] = {
      verificationStatus: "VERIFIED",
      consultationFee: { $gt: 0 },
      workingHours: { $elemMatch: { isOpen: true } },
    };
    if (query.specialization) doctorMatch.specializations = { $regex: escapeRegex(query.specialization), $options: "i" };

    const textMatch: PipelineStage.Match["$match"] | undefined = query.query ? {
      $or: [
        { name: { $regex: escapeRegex(query.query), $options: "i" } },
        { city: { $regex: escapeRegex(query.query), $options: "i" } },
        { "doctor.firstName": { $regex: escapeRegex(query.query), $options: "i" } },
        { "doctor.lastName": { $regex: escapeRegex(query.query), $options: "i" } },
      ],
    } : undefined;

    const clinicOpenHours = {
      $filter: {
        input: { $ifNull: ["$workingHours", []] },
        as: "clinicHour",
        cond: { $eq: ["$$clinicHour.isOpen", true] },
      },
    };
    const doctorOpenHours = {
      $filter: {
        input: { $ifNull: ["$doctor.workingHours", []] },
        as: "doctorHour",
        cond: { $eq: ["$$doctorHour.isOpen", true] },
      },
    };
    const scheduleOverlap = {
      $anyElementTrue: {
        $map: {
          input: clinicOpenHours,
          as: "clinicHour",
          in: {
            $gt: [
              {
                $size: {
                  $filter: {
                    input: doctorOpenHours,
                    as: "doctorHour",
                    cond: {
                      $and: [
                        { $eq: [{ $toUpper: "$$clinicHour.day" }, { $toUpper: "$$doctorHour.day" }] },
                        { $lt: [
                          { $max: ["$$clinicHour.startTime", "$$doctorHour.startTime"] },
                          { $min: ["$$clinicHour.endTime", "$$doctorHour.endTime"] },
                        ] },
                      ],
                    },
                  },
                },
              },
              0,
            ],
          },
        },
      },
    };

    const doctorPipeline: Exclude<PipelineStage, PipelineStage.Merge | PipelineStage.Out>[] = [
      { $match: { ...doctorMatch, $expr: { $eq: ["$clinicId", "$$clinicId"] } } },
      { $project: { userId: 1, firstName: 1, lastName: 1, professionalTitle: 1, specializations: 1, consultationFee: 1, workingHours: 1 } },
    ];
    const pipeline: PipelineStage[] = [
      { $match: clinicMatch },
      { $lookup: {
        from: DentistModel.collection.name,
        let: { clinicId: "$_id" },
        pipeline: doctorPipeline,
        as: "doctor",
      } },
      { $unwind: "$doctor" },
      { $match: { $expr: scheduleOverlap } },
      ...(textMatch ? [{ $match: textMatch }] : []),
      { $sort: { name: 1, "doctor.firstName": 1, "doctor.lastName": 1, _id: 1 } },
      { $facet: {
        items: [
          { $skip: query.skip },
          { $limit: query.limit },
          { $project: {
            _id: 0,
            clinicId: { $toString: "$_id" },
            doctorUserId: { $toString: "$doctor.userId" },
            clinicName: "$name",
            address: { $ifNull: ["$address", null] },
            city: { $ifNull: ["$city", null] },
            state: { $ifNull: ["$state", null] },
            pincode: { $ifNull: ["$pincode", null] },
            phone: { $ifNull: ["$phone", null] },
            doctorName: { $concat: ["$doctor.firstName", " ", "$doctor.lastName"] },
            professionalTitle: { $ifNull: ["$doctor.professionalTitle", null] },
            specializations: "$doctor.specializations",
            consultationFee: "$doctor.consultationFee",
            currency: { $literal: "INR" },
          } },
        ],
        total: [{ $count: "count" }],
      } },
    ];

    const [result] = await ClinicModel.aggregate<PublicDirectoryAggregate>(pipeline).exec();
    const items: PublicDirectoryCandidateDTO[] = (result?.items ?? []).map(({ clinicId, doctorUserId, ...listing }) => ({
      ...listing,
      clinicId,
      doctorUserId,
    }));
    return { items, totalItems: result?.total[0]?.count ?? 0 };
  }
}
