// import { GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
// import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
// import { env } from "../config/env.js";

// const s3Client = new S3Client({ region: env.AWS_REGION });

// export const isS3Configured = (): boolean => Boolean(env.S3_BUCKET);

// const getBucket = (): string => {
//   if (!env.S3_BUCKET) {
//     throw new Error("S3_BUCKET is not configured");
//   }
//   return env.S3_BUCKET;
// };

// export const createS3UploadUrl = (key: string, contentType: string): Promise<string> =>
//   getSignedUrl(
//     s3Client,
//     new PutObjectCommand({ Bucket: getBucket(), Key: key, ContentType: contentType }),
//     { expiresIn: 300 },
//   );

// export const createS3DownloadUrl = (key: string): Promise<string> =>
//   getSignedUrl(
//     s3Client,
//     new GetObjectCommand({ Bucket: getBucket(), Key: key }),
//     { expiresIn: 300 },
//   );

// export const s3ObjectExists = async (key: string): Promise<boolean> => {
//   try {
//     await s3Client.send(new HeadObjectCommand({ Bucket: getBucket(), Key: key }));
//     return true;
//   } catch (error) {
//     const s3Error = error as { name?: string; $metadata?: { httpStatusCode?: number } };
//     if (s3Error.name === "NotFound" || s3Error.$metadata?.httpStatusCode === 404) {
//       return false;
//     }
//     throw error;
//   }
// };