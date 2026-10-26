import axios from 'axios';

export async function uploadToSignedUrl(uploadUrl: string, file: File) {
  try {
    await axios.put(uploadUrl, file, { headers: { 'Content-Type': file.type } });
  } catch {
    throw new Error('The file could not be uploaded to secure storage. Try again.');
  }
}
export async function openSignedUrl(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer');
}