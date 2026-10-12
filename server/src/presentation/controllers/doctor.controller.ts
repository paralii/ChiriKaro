import type { Request, Response, NextFunction, RequestHandler } from "express";

// import type { GetDoctorProfileUseCase } from "../../application/use-cases/doctor/GetDoctorProfileUseCase.js";
// import type { UpdateDoctorProfileUseCase } from "../../application/use-cases/doctor/UpdateDoctorProfileUseCase.js";
// import type { GetDoctorVerificationUseCase } from "../../application/use-cases/doctor/GetDoctorVerificationUseCase.js";
// import type { SubmitDoctorVerificationUseCase } from "../../application/use-cases/doctor/SubmitDoctorVerificationUseCase.js";
// import type { ListClinicDoctorsUseCase } from "../../application/use-cases/doctor/ListClinicDoctorsUseCase.js";
// import type { GetClinicDoctorUseCase } from "../../application/use-cases/doctor/GetClinicDoctorUseCase.js";
// import type { ApproveDoctorUseCase } from "../../application/use-cases/doctor/ApproveDoctorUseCase.js";
// import type { RejectDoctorUseCase } from "../../application/use-cases/doctor/RejectDoctorUseCase.js";
// import type { GetClinicDoctorDocumentDownloadUrlUseCase } from "../../application/use-cases/doctor/GetClinicDoctorDocumentDownloadUrlUseCase.js";
// import type { UpdateDoctorConsultationFeeUseCase } from "../../application/use-cases/doctor/UpdateDoctorConsultationFeeUseCase.js";
// import type { GenerateDoctorDocumentUploadUrlUseCase } from "../../application/use-cases/doctor/GenerateDoctorDocumentUploadUrlUseCase.js";
// import type { GetDoctorDocumentDownloadUrlUseCase } from "../../application/use-cases/doctor/GetDoctorDocumentDownloadUrlUseCase.js";
// import type { ListDoctorDocumentsUseCase } from "../../application/use-cases/doctor/ListDoctorDocumentsUseCase.js";
// import type { SaveDoctorDocumentUseCase } from "../../application/use-cases/doctor/SaveDoctorDocumentUseCase.js";
// import type { GetDoctorAvailabilityUseCase } from "../../application/use-cases/doctor/GetDoctorAvailabilityUseCase.js";
// import type { UpdateDoctorAvailabilityUseCase } from "../../application/use-cases/doctor/UpdateDoctorAvailabilityUseCase.js";
// import type { GetDoctorSlotConfigUseCase } from "../../application/use-cases/doctor/GetDoctorSlotConfigUseCase.js";
// import type { UpdateDoctorSlotConfigUseCase } from "../../application/use-cases/doctor/UpdateDoctorSlotConfigUseCase.js";
// import type { GenerateDoctorSlotsUseCase } from "../../application/use-cases/doctor/GenerateDoctorSlotsUseCase.js";



type DoctorControllerDependencies = {
getDoctorProfile: GetDoctorProfileUseCase;
updateDoctorProfile: UpdateDoctorProfileUseCase;
getDoctorVerification: GetDoctorVerificationUseCase;
submitDoctorVerification: SubmitDoctorVerificationUseCase;

listClinicDoctors: ListClinicDoctorsUseCase;
getClinicDoctor: GetClinicDoctorUseCase;
approveDoctor: ApproveDoctorUseCase;
rejectDoctor: RejectDoctorUseCase;
getClinicDoctorDocumentDownloadUrl: GetClinicDoctorDocumentDownloadUrlUseCase;
updateDoctorConsultationFee: UpdateDoctorConsultationFeeUseCase;

generateDoctorDocumentUploadUrl: GenerateDoctorDocumentUploadUrlUseCase;
getDoctorDocumentDownloadUrl: GetDoctorDocumentDownloadUrlUseCase;
listDoctorDocuments: ListDoctorDocumentsUseCase;
saveDoctorDocument: SaveDoctorDocumentUseCase;

getDoctorAvailability: GetDoctorAvailabilityUseCase;
updateDoctorAvailability: UpdateDoctorAvailabilityUseCase;
getDoctorSlotConfig: GetDoctorSlotConfigUseCase;
updateDoctorSlotConfig: UpdateDoctorSlotConfigUseCase;
generateDoctorSlots: GenerateDoctorSlotsUseCase;
};

export class DoctorController {
constructor(
private readonly dependencies: DoctorControllerDependencies,
) {}

private readonly handle = (
operation: (
req: AuthRequest,
) => Promise<{ statusCode?: number; body: unknown }>,
): RequestHandler => {
return (req: Request, res: Response, next: NextFunction): void => {
void operation(req as AuthRequest)
.then(({ statusCode = 200, body }) => {
res.status(statusCode).json(body);
})
.catch(next);
};
};

private getAuthenticatedUser(req: AuthRequest): TokenPayload {
if (!req.user) {
throw new Error("Authenticated user is missing");
}


return req.user;


}

private getParam(
req: AuthRequest,
name: string,
): string {
const value = req.params[name];


return Array.isArray(value) ? value[0] ?? "" : value ?? "";


}

private getBody(req: AuthRequest): Record<string, unknown> {
if (
typeof req.body !== "object" ||
req.body === null ||
Array.isArray(req.body)
) {
return {};
}


return req.body as Record<string, unknown>;


}

private success(data: unknown) {
return { body: { success: true, data } };
}

readonly getDoctorProfile = this.handle(async (req) => {
const user = this.getAuthenticatedUser(req);


const data = await this.dependencies.getDoctorProfile.execute({
  userId: user.sub,
  clinicId: user.clinicId,
});

return this.success(data);


});

readonly updateDoctorProfile = this.handle(async (req) => {
const user = this.getAuthenticatedUser(req);


const data = await this.dependencies.updateDoctorProfile.execute({
  userId: user.sub,
  clinicId: user.clinicId,
  input: this.getBody(req),
});

return this.success(data);


});

readonly getDoctorVerification = this.handle(async (req) => {
const user = this.getAuthenticatedUser(req);


const data =
  await this.dependencies.getDoctorVerification.execute({
    userId: user.sub,
    clinicId: user.clinicId,
  });

return this.success(data);


});

readonly submitDoctorVerification = this.handle(async (req) => {
const user = this.getAuthenticatedUser(req);


const data =
  await this.dependencies.submitDoctorVerification.execute({
    userId: user.sub,
    clinicId: user.clinicId,
  });

return {
  body: {
    success: true,
    message: "Doctor verification submitted successfully",
    data,
  },
};


});

readonly listClinicDoctors = this.handle(async (req) => {
const user = this.getAuthenticatedUser(req);


const data = await this.dependencies.listClinicDoctors.execute({
  clinicId: user.clinicId,
});

return this.success(data);


});

readonly getClinicDoctors = this.handle(async (req) => {
const user = this.getAuthenticatedUser(req);


const data = await this.dependencies.getClinicDoctor.execute({
  doctorId: this.getParam(req, "id"),
  clinicId: user.clinicId,
});

return this.success(data);


});

readonly approveDoctor = this.handle(async (req) => {
const user = this.getAuthenticatedUser(req);


const data = await this.dependencies.approveDoctor.execute({
  doctorId: this.getParam(req, "id"),
  clinicId: user.clinicId,
});

return {
  body: {
    success: true,
    message: "Doctor approved successfully",
    data,
  },
};


});

readonly rejectDoctor = this.handle(async (req) => {
const user = this.getAuthenticatedUser(req);
const body = this.getBody(req);


const data = await this.dependencies.rejectDoctor.execute({
  doctorId: this.getParam(req, "id"),
  clinicId: user.clinicId,
  reason: body.reason,
});

return {
  body: {
    success: true,
    message: "Doctor rejected successfully",
    data,
  },
};


});

readonly getClinicDoctorDocumentDownloadUrl = this.handle(
async (req) => {
const user = this.getAuthenticatedUser(req);


  const data =
    await this.dependencies
      .getClinicDoctorDocumentDownloadUrl.execute({
        doctorId: this.getParam(req, "id"),
        clinicId: user.clinicId,
        documentType: this.getParam(req, "documentType"),
      });

  return this.success(data);
},


);

readonly updateDoctorConsultationFee = this.handle(async (req) => {
const user = this.getAuthenticatedUser(req);
const body = this.getBody(req);


const data =
  await this.dependencies.updateDoctorConsultationFee.execute({
    doctorId: this.getParam(req, "id"),
    clinicId: user.clinicId,
    fee: body.fee,
  });

return {
  body: {
    success: true,
    message: "Consultation fee updated",
    data,
  },
};


});

readonly generateDoctorDocumentUploadUrl = this.handle(
async (req) => {
const user = this.getAuthenticatedUser(req);
const body = this.getBody(req);


  const data =
    await this.dependencies.generateDoctorDocumentUploadUrl.execute({
      userId: user.sub,
      clinicId: user.clinicId,
      fileName: body.fileName,
      contentType: body.contentType,
      fileSize: body.fileSize,
    });

  return this.success(data);
},


);

readonly getDoctorDocumentUrl = this.handle(async (req) => {
const user = this.getAuthenticatedUser(req);


const data =
  await this.dependencies.getDoctorDocumentDownloadUrl.execute({
    userId: user.sub,
    clinicId: user.clinicId,
    documentType: this.getParam(req, "documentType"),
  });

return this.success(data);


});

readonly getDoctorDocuments = this.handle(async (req) => {
const user = this.getAuthenticatedUser(req);


const data = await this.dependencies.listDoctorDocuments.execute({
  userId: user.sub,
  clinicId: user.clinicId,
});

return this.success(data);


});

readonly saveDoctorDocument = this.handle(async (req) => {
const user = this.getAuthenticatedUser(req);
const body = this.getBody(req);


const data = await this.dependencies.saveDoctorDocument.execute({
  userId: user.sub,
  clinicId: user.clinicId,
  documentType: body.documentType,
  documentKey: body.documentKey,
});

return {
  body: {
    success: true,
    message: "Document saved",
    data,
  },
};


});

readonly getDoctorAvailability = this.handle(async (req) => {
const user = this.getAuthenticatedUser(req);


const data =
  await this.dependencies.getDoctorAvailability.execute({
    userId: user.sub,
    clinicId: user.clinicId,
  });

return this.success(data);


});

readonly updateDoctorAvailability = this.handle(async (req) => {
const user = this.getAuthenticatedUser(req);
const body = this.getBody(req);


const data =
  await this.dependencies.updateDoctorAvailability.execute({
    userId: user.sub,
    clinicId: user.clinicId,
    workingHours: body.workingHours,
  });

return this.success(data);


});

readonly getDoctorSlotConfig = this.handle(async (req) => {
const user = this.getAuthenticatedUser(req);


const data = await this.dependencies.getDoctorSlotConfig.execute({
  userId: user.sub,
  clinicId: user.clinicId,
});

return this.success(data);


});

readonly updateDoctorSlotConfig = this.handle(async (req) => {
const user = this.getAuthenticatedUser(req);
const body = this.getBody(req);


const data =
  await this.dependencies.updateDoctorSlotConfig.execute({
    userId: user.sub,
    clinicId: user.clinicId,
    slotDuration: body.slotDuration,
    bufferMinutes: body.bufferMinutes,
  });

return this.success(data);


});

readonly generateDoctorSlots = this.handle(async (req) => {
const user = this.getAuthenticatedUser(req);


const data = await this.dependencies.generateDoctorSlots.execute({
  userId: user.sub,
  clinicId: user.clinicId,
});

return this.success(data);


});
}
