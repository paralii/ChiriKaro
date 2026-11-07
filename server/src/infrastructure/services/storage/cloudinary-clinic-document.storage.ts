import { createHash, randomUUID } from "node:crypto";
import type { IClinicDocumentStorage, StoredClinicDocument } from "@application/interfaces/services/IClinicDocumentStorage.ts";
import { env } from "@infrastructure/config/env.ts";
import { BadRequestError, InternalServerError, NotFoundError } from "@shared/errors/index.ts";

const CONTENT_TYPES: Record<string, string> = {
  "application/pdf": ".pdf",
  "image/jpeg": ".jpg",
  "image/png": ".png",
};
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const CLOUDINARY_FOLDER = "clinic-documents";

function signParameters(parameters: Record<string, string>): string {
  const serialized = Object.entries(parameters)
    .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
  return createHash("sha1")
    .update(`${serialized}${env.CLOUDINARY_API_SECRET}`)
    .digest("hex");
}

export class CloudinaryClinicDocumentStorage implements IClinicDocumentStorage {
  async save(content: Buffer, contentType: string): Promise<string> {
    const extension = CONTENT_TYPES[contentType];
    if (!extension) throw new BadRequestError("Clinic documents must be PDF, JPEG, or PNG files");
    if (!content.length || content.length > MAX_FILE_SIZE) {
      throw new BadRequestError("Clinic document must be between 1 byte and 10 MB");
    }

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const publicId = `${CLOUDINARY_FOLDER}/${randomUUID()}${extension}`;
    const signedParameters = { public_id: publicId, timestamp, type: "private" };
    const form = new FormData();
    form.set("file", `data:${contentType};base64,${content.toString("base64")}`);
    form.set("api_key", env.CLOUDINARY_API_KEY);
    form.set("timestamp", timestamp);
    form.set("public_id", publicId);
    form.set("type", "private");
    form.set("signature", signParameters(signedParameters));

    let response: Response;
    try {
      response = await fetch(
        `https://api.cloudinary.com/v1_1/${encodeURIComponent(env.CLOUDINARY_CLOUD_NAME)}/raw/upload`,
        { method: "POST", body: form },
      );
    } catch {
      throw new InternalServerError("Clinic document storage is unavailable");
    }

    if (!response.ok) {
      throw new InternalServerError("Cloudinary could not store the clinic document");
    }
    const result = (await response.json()) as { public_id?: unknown };
    if (result.public_id !== publicId) {
      throw new InternalServerError("Cloudinary returned an invalid document reference");
    }
    return publicId;
  }

  async read(key: string): Promise<StoredClinicDocument> {
    const match = /^clinic-documents\/[a-f\d-]{36}\.(pdf|jpg|png)$/i.exec(key);
    if (!match) throw new NotFoundError("Clinic document");

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const expiresAt = (Number(timestamp) + 60).toString();
    const signedParameters = {
      attachment: "true",
      expires_at: expiresAt,
      public_id: key,
      timestamp,
    };
    const query = new URLSearchParams({
      ...signedParameters,
      api_key: env.CLOUDINARY_API_KEY,
      signature: signParameters(signedParameters),
    });

    let response: Response;
    try {
      response = await fetch(
        `https://api.cloudinary.com/v1_1/${encodeURIComponent(env.CLOUDINARY_CLOUD_NAME)}/raw/download?${query.toString()}`,
      );
    } catch {
      throw new InternalServerError("Clinic document storage is unavailable");
    }
    if (response.status === 404) throw new NotFoundError("Clinic document");
    if (!response.ok) throw new InternalServerError("Cloudinary could not retrieve the clinic document");

    const extension = key.slice(key.lastIndexOf(".")).toLowerCase();
    const contentType = Object.entries(CONTENT_TYPES).find(([, value]) => value === extension)?.[0];
    if (!contentType) throw new NotFoundError("Clinic document");
    return { key, contentType, content: Buffer.from(await response.arrayBuffer()) };
  }
}
