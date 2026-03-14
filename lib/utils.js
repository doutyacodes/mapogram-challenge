import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"
import { v4 as uuidv4 } from "uuid";
import base64url from "base64-url";

export function generateUniqueSlug() {
  return base64url.encode(uuidv4());
}
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
