
import type { Request, Response } from "express";
import type { TokenPayload } from "../../application/interfaces/ITokenService.js";
import type { ClinicAdminService } from "../../application/services/clinic-admin.service.js";
import type { ClinicDocumentService } from "../../application/services/clinic-document.service.js";
import type { ClinicProfileService } from "../../application/services/clinic-profile.service.js";
import type { ClinicRegistrationService } from "../../application/services/clinic-registration.service.js";
import { BadRequestError } from "../../shared/errors/index.js";
import {
  parseClinicStatus,
  parseProfileUpdateBody,
  parseRegisterClinicBody,
  parseSaveDocumentBody,
  parseSpecializationsBody,
  parseUploadUrlBody,
  parseWorkingHoursBody,
} from "../validations/clinic.validators.js";
 
type AuthRequest = Request & { user?: TokenPayload };
 
const firstParam = (value: string | string[] | undefined): string | undefined =>
  Array.isArray(value) ? value[0] : value;
 
const requireClinicId = (req: AuthRequest): string => {
  const clinicId = req.user?.clinicId;
  if (!clinicId) throw new BadRequestError("Clinic id is required");
  return clinicId;
};
 
/**
 * HTTP adapter only: parse input, call a use case, shape the response.
 * Handlers are arrow properties so they can be passed to the router directly.
 */
export class ClinicController {
  constructor(
    private readonly registrationService: ClinicRegistrationService,
    private readonly profileService: ClinicProfileService,
    private readonly documentService: ClinicDocumentService,
    private readonly adminService: ClinicAdminService,
  ) {}
 
  /* ------------------------------ Registration ------------------------------ */
 
  register = async (req: Request, res: Response): Promise<void> => {
    const clinic = await this.registrationService.register(parseRegisterClinicBody(req.body));
 
    res.status(201).json({
      success: true,
      message: "Clinic registration submitted successfully and is pending approval",
      data: {
        id: clinic.id,
        name: clinic.name,
        status: clinic.status,
        isActive: clinic.isActive,
        ownerName: clinic.ownerName,
        email: clinic.contactEmail,
        ownerAdminId: clinic.ownerAdminId,
      },
    });
  };
 
  /* ---------------------------- Clinic profile ---------------------------- */
 
  getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    const profile = await this.profileService.getProfile(requireClinicId(req));
    res.status(200).json({ success: true, data: profile });
  };
 
  updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    const clinicId = requireClinicId(req);
    const profile = await this.profileService.updateProfile(clinicId, parseProfileUpdateBody(req.body));
 
    res.status(200).json({
      success: true,
      message: "Clinic profile updated successfully",
      data: profile,
    });
  };
 
  getDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
    const dashboard = await this.profileService.getDashboard(requireClinicId(req));
    res.status(200).json({ success: true, data: dashboard });
  };
 
  updateSpecializations = async (req: AuthRequest, res: Response): Promise<void> => {
    const clinicId = requireClinicId(req);
    const data = await this.profileService.updateSpecializations(clinicId, parseSpecializationsBody(req.body));
    res.status(200).json({ success: true, data });
  };
 
  updateWorkingHours = async (req: AuthRequest, res: Response): Promise<void> => {
    const clinicId = requireClinicId(req);
    const data = await this.profileService.updateWorkingHours(clinicId, parseWorkingHoursBody(req.body));
    res.status(200).json({ success: true, data });
  };
 
  /* ---------------------------- Clinic documents ---------------------------- */
 
  createDocumentUploadUrl = async (req: AuthRequest, res: Response): Promise<void> => {
    const clinicId = requireClinicId(req);
    const data = await this.documentService.createUploadUrl(clinicId, parseUploadUrlBody(req.body));
    res.status(200).json({ success: true, data });
  };
 
  getDocuments = async (req: AuthRequest, res: Response): Promise<void> => {
    const data = await this.documentService.getDocuments(requireClinicId(req));
    res.status(200).json({ success: true, data });
  };
 
  saveDocument = async (req: AuthRequest, res: Response): Promise<void> => {
    const clinicId = requireClinicId(req);
    const data = await this.documentService.saveDocument(clinicId, parseSaveDocumentBody(req.body));
    res.status(200).json({ success: true, message: "Clinic document saved", data });
  };
 
  getDocumentDownloadUrl = async (req: AuthRequest, res: Response): Promise<void> => {
    const clinicId = req.user?.clinicId;
    const documentType = firstParam(req.params.documentType);
    if (!clinicId || !documentType) {
      throw new BadRequestError("Clinic and document type are required");
    }
 
    const url = await this.documentService.getDownloadUrl(clinicId, documentType);
    res.status(200).json({ success: true, data: { url } });
  };
 
  /* ------------------------------ Super admin ------------------------------ */
 
  listClinics = async (_req: Request, res: Response): Promise<void> => {
    const clinics = await this.adminService.listClinics();
 
    res.status(200).json({
      success: true,
      data: clinics.map((clinic) => ({
        id: clinic.id,
        name: clinic.name,
        address: clinic.address,
        phone: clinic.phone,
        ownerName: clinic.ownerName,
        contactEmail: clinic.contactEmail,
        ownerAdminId: clinic.ownerAdminId,
        status: clinic.status,
        isActive: clinic.isActive,
        createdAt: clinic.createdAt,
        updatedAt: clinic.updatedAt,
      })),
    });
  };
 
  getClinicsDashboard = async (_req: Request, res: Response): Promise<void> => {
    const summary = await this.adminService.getStatusSummary();
    res.status(200).json({ success: true, data: summary });
  };
 
  updateClinicStatus = async (req: Request, res: Response): Promise<void> => {
    const id = firstParam(req.params.id);
    if (!id) throw new BadRequestError("Clinic id is required");
 
    const clinic = await this.adminService.updateStatus(id, parseClinicStatus(req.body));
 
    res.status(200).json({
      success: true,
      message: `Clinic status updated to ${clinic.status}`,
      data: {
        id: clinic.id,
        name: clinic.name,
        status: clinic.status,
        isActive: clinic.isActive,
        ownerAdminId: clinic.ownerAdminId,
      },
    });
  };
}
 
