import { createHash, randomUUID } from "node:crypto";
import type { IDocumentStorage, StoredDocument } from "@application/interfaces/services/IDocumentStorage.ts";
import { env } from "@infrastructure/config/env.ts";
import { logger } from "@infrastructure/logger/logger.ts";
import { BadRequestError, InternalServerError, NotFoundError } from "@shared/errors/index.ts";

const CONTENT_TYPES: Record<string, string> = {
  "application/pdf": ".pdf",
  "image/jpeg": ".jpg",
  "image/png": ".png",
};
const MAX_FILE_SIZE = 10 * 1024 * 1024;

function signParameters(parameters: Record<string, string>): string {
  const serialized = Object.entries(parameters)
    .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
  return createHash("sha1").update(`${serialized}${env.CLOUDINARY_API_SECRET}`).digest("hex");
}

export class CloudinaryDocumentStorage implements IDocumentStorage {
  constructor(private readonly folder: string) {}

  async save(content: Buffer, contentType: string): Promise<string> {
    const extension = CONTENT_TYPES[contentType];
    if (!extension) throw new BadRequestError("Documents must be PDF, JPEG, or PNG files");
    if (!content.length || content.length > MAX_FILE_SIZE) {
      throw new BadRequestError("Document must be between 1 byte and 10 MB");
    }

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const publicId = `${this.folder}/${randomUUID()}${extension}`;
    const signedParameters = { public_id: publicId, timestamp, type: "private" };
    const form = new FormData();
    form.set("file", new Blob([new Uint8Array(content)], { type: contentType }), `${randomUUID()}${extension}`);
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
      throw new InternalServerError("Document storage is unavailable");
    }
    let result: { public_id?: unknown; error?: { message?: unknown; http_code?: unknown } };
    try {
      result = (await response.json()) as typeof result;
    } catch {
      throw new InternalServerError(`Cloudinary returned an unreadable response (${response.status})`);
    }
    if (!response.ok) {
      const providerMessage = typeof result.error?.message === "string"
        ? result.error.message.slice(0, 500)
        : "Unknown upload error";
      const providerCode = typeof result.error?.http_code === "number"
        ? result.error.http_code
        : response.status;
      logger.error("Cloudinary document upload rejected", {
        providerCode,
        providerMessage,
        contentType,
        sizeBytes: content.length,
      });
      throw new InternalServerError(`Cloudinary upload failed (${providerCode}): ${providerMessage}`);
    }

    if (result.public_id !== publicId) throw new InternalServerError("Cloudinary returned an invalid document reference");
    return publicId;
  }

  async read(key: string): Promise<StoredDocument> {
    const escapedFolder = this.folder.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = new RegExp(`^${escapedFolder}/[a-f\\d-]{36}\\.(pdf|jpg|png)$`, "i").exec(key);
    if (!match) throw new NotFoundError("Document");

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const expiresAt = (Number(timestamp) + 60).toString();
    const signedParameters = { attachment: "true", expires_at: expiresAt, public_id: key, timestamp };
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
      throw new InternalServerError("Document storage is unavailable");
    }
    if (response.status === 404) throw new NotFoundError("Document");
    if (!response.ok) throw new InternalServerError("Cloudinary could not retrieve the document");

    const extension = key.slice(key.lastIndexOf(".")).toLowerCase();
    const contentType = Object.entries(CONTENT_TYPES).find(([, value]) => value === extension)?.[0];
    if (!contentType) throw new NotFoundError("Document");
    return { key, contentType, content: Buffer.from(await response.arrayBuffer()) };
  }

  async delete(key: string): Promise<void> {
    const escapedFolder = this.folder.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = new RegExp(`^${escapedFolder}/[a-f\\d-]{36}\\.(pdf|jpg|png)$`, "i").exec(key);
    if (!match) throw new NotFoundError("Document");

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signedParameters = { public_id: key, timestamp, type: "private" };
    const form = new FormData();
    form.set("public_id", key);
    form.set("timestamp", timestamp);
    form.set("type", "private");
    form.set("api_key", env.CLOUDINARY_API_KEY);
    form.set("signature", signParameters(signedParameters));

    let response: Response;
    try {
      response = await fetch(
        `https://api.cloudinary.com/v1_1/${encodeURIComponent(env.CLOUDINARY_CLOUD_NAME)}/raw/destroy`,
        { method: "POST", body: form },
      );
    } catch {
      throw new InternalServerError("Document storage is unavailable");
    }

    const result = await response.json().catch(() => null) as { result?: unknown; error?: { message?: unknown } } | null;
    if (!response.ok || (result?.result !== "ok" && result?.result !== "not found")) {
      const providerMessage = typeof result?.error?.message === "string" ? result.error.message.slice(0, 300) : "Unknown deletion error";
      throw new InternalServerError(`Cloudinary could not delete the document: ${providerMessage}`);
    }
  }
}
