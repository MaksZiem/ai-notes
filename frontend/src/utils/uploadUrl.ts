import { API_BASE_URL } from "../api/client";

const UPLOAD_FILE = String.raw`/uploads/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(?:png|jpe?g|gif|webp)`;

const ABSOLUTE_UPLOAD = new RegExp(String.raw`^https?://[^/]+(${UPLOAD_FILE})$`, "i");
const RELATIVE_UPLOAD = new RegExp(String.raw`^${UPLOAD_FILE}$`, "i");
const RELATIVE_UPLOAD_IN_TEXT = new RegExp(String.raw`(?<=[("'])${UPLOAD_FILE}`, "gi");

const apiOrigin = () => API_BASE_URL.replace(/\/+$/, "");

export function toStoredImageSrc(src: string): string {
  return src.match(ABSOLUTE_UPLOAD)?.[1] ?? src;
}

export function toDisplayImageSrc(src: string): string {
  const stored = toStoredImageSrc(src);
  return RELATIVE_UPLOAD.test(stored) ? `${apiOrigin()}${stored}` : src;
}

export function absolutizeUploadUrls(markdown: string): string {
  return markdown.replace(RELATIVE_UPLOAD_IN_TEXT, (path) => `${apiOrigin()}${path}`);
}
