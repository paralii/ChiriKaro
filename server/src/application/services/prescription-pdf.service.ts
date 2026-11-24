import { Readable } from "node:stream";
import type { ConsultationRecord } from "@domain/entities/consultation.entity.ts";
import type { Clinic } from "@domain/entities/clinic.entity.ts";
import type { Doctor } from "@domain/entities/doctor.entity.ts";

type PrescriptionDocument = { record: ConsultationRecord; clinic: Clinic; doctor: Doctor; patientName: string; patientEmail: string | null };

const escapePdfText = (value: string): string => value.normalize("NFKD").replace(/[^\x20-\x7E]/g, "?").replace(/([\\()])/g, "\\$1");

/** Creates a self-contained, printable one-page prescription PDF without storing it. */
export class PrescriptionPdfService {
  generate(input: PrescriptionDocument): Readable {
    const { record, clinic, doctor } = input;
    const margin = 48;
    const pageWidth = 595;
    const pageHeight = 842;
    const pages: string[][] = [[]];
    let commands = pages[0]!;
    let y = 790;
    const line = (value: string, size = 11, bold = false, color = "0.13 0.20 0.29") => {
      if (y < 58) {
        commands = [];
        pages.push(commands);
        y = 790;
        commands.push("0.08 0.32 0.40 rg 0 810 595 32 re f");
        commands.push(`BT /F2 11 Tf 1 1 1 rg ${margin} 821 Td (${escapePdfText(clinic.name)} — Prescription continued) Tj ET`);
        y = 785;
      }
      commands.push(`BT /${bold ? "F2" : "F1"} ${size} Tf ${color} rg ${margin} ${y} Td (${escapePdfText(value)}) Tj ET`);
      y -= size + 8;
    };
    const rule = (shade = "0.82 0.86 0.90") => {
      commands.push(`${shade} RG 0.7 w ${margin} ${y} m ${pageWidth - margin} ${y} l S`);
      y -= 18;
    };
    const wrapped = (label: string, value: string, max = 86) => {
      const content = value || "Not provided";
      const words = `${label}: ${content}`.split(/\s+/);
      let row = "";
      for (const word of words) {
        if ((row + " " + word).trim().length > max && row) { line(row); row = word; }
        else row = `${row} ${word}`.trim();
      }
      if (row) line(row);
    };

    commands.push("0.08 0.32 0.40 rg 0 760 595 82 re f");
    commands.push(`BT /F2 19 Tf 1 1 1 rg ${margin} 811 Td (${escapePdfText(clinic.name)}) Tj ET`);
    commands.push(`BT /F1 9 Tf 0.90 0.95 0.97 rg ${margin} 789 Td (${escapePdfText([clinic.address, clinic.city, clinic.state, clinic.pincode].filter(Boolean).join(", ") || "Clinic address not provided")}) Tj ET`);
    commands.push(`BT /F1 9 Tf 0.90 0.95 0.97 rg ${margin} 773 Td (${escapePdfText([clinic.phone && `Phone: ${clinic.phone}`, clinic.contactEmail && `Email: ${clinic.contactEmail}`].filter(Boolean).join("  |  ") || "Contact details not provided")}) Tj ET`);
    y = 732;
    line("MEDICAL PRESCRIPTION", 15, true, "0.08 0.32 0.40");
    rule();
    const date = record.completedAt ?? record.startedAt;
    wrapped("Patient", input.patientName || record.patientNameSnapshot || "Not provided");
    if (input.patientEmail) wrapped("Patient email", input.patientEmail);
    wrapped("Prescribing doctor", `${doctor.professionalTitle ? `${doctor.professionalTitle} ` : ""}Dr. ${doctor.firstName} ${doctor.lastName}`);
    if (doctor.qualifications.length) wrapped("Qualifications", doctor.qualifications.join(", "));
    if (doctor.registrationNumber) wrapped("Registration", [doctor.registrationNumber, doctor.registrationAuthority].filter(Boolean).join(" · "));
    wrapped("Prescription date", new Intl.DateTimeFormat("en-IN", { dateStyle: "long", timeZone: clinic.timeZone }).format(date));
    wrapped("Consultation reference", record.id);
    wrapped("Consultation date", record.visitDetails.localDate);
    rule();
    line("PRESCRIBED MEDICINES", 12, true, "0.08 0.32 0.40");
    record.data.prescriptions.forEach((prescription, index) => {
      line(`${index + 1}. ${prescription.medicine}`, 12, true);
      wrapped("Dosage", prescription.dosage);
      wrapped("Frequency", prescription.frequency);
      wrapped("Duration", prescription.duration);
      if (prescription.instructions) wrapped("Instructions", prescription.instructions);
      y -= 6;
    });
    rule();
    line(`Prescribed by ${doctor.professionalTitle ? `${doctor.professionalTitle} ` : ""}Dr. ${doctor.firstName} ${doctor.lastName}`, 10, true);
    if (doctor.registrationNumber) line(`Registration: ${doctor.registrationNumber}`, 9);
    line("This document was generated electronically from the finalized consultation record.", 8, false, "0.40 0.45 0.50");

    const pageRefs = pages.map((_, index) => `${6 + index * 2} 0 R`).join(" ");
    const objects = ["<< /Type /Catalog /Pages 2 0 R >>", `<< /Type /Pages /Kids [${pageRefs}] /Count ${pages.length} >>`];
    pages.forEach((page, index) => {
      const pageObject = 3 + index * 2;
      const contentObject = pageObject + 1;
      const streamData = page.join("\n");
      objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${3 + pages.length * 2} 0 R /F2 ${4 + pages.length * 2} 0 R >> >> /Contents ${contentObject} 0 R >>`);
      objects.push(`<< /Length ${Buffer.byteLength(streamData, "ascii")} >>\nstream\n${streamData}\nendstream`);
    });
    objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>", "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");
    let pdf = "%PDF-1.4\n%âãÏÓ\n";
    const offsets = [0];
    objects.forEach((object, index) => { offsets.push(Buffer.byteLength(pdf, "binary")); pdf += `${index + 1} 0 obj\n${object}\nendobj\n`; });
    const xrefOffset = Buffer.byteLength(pdf, "binary");
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${offset.toString().padStart(10, "0")} 00000 n \n`).join("")}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
    return Readable.from([Buffer.from(pdf, "binary")]);
  }
}
