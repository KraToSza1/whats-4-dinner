/// <reference types="vite/client" />

import type { SyntheticEvent } from "react";
import { FEATURES } from "../config.js";

const PLACEHOLDER_SVG =
  "<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300' role='img' aria-label='Recipe placeholder'><defs><linearGradient id='g' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='#e2e8f0' /><stop offset='100%' stop-color='#cbd5f5' /></linearGradient></defs><rect width='400' height='300' fill='url(#g)' /><g fill='#475569' font-family='sans-serif' text-anchor='middle'><text x='200' y='154' font-size='48'>🍽️</text><text x='200' y='188' font-size='18'>Something tasty is loading…</text></g></svg>";

export const PLACEHOLDER = `data:image/svg+xml;utf8,${encodeURIComponent(PLACEHOLDER_SVG)}`;
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? "";
const IMAGE_PROXY_DISABLED = FEATURES.disableImageProxy;

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value?: string): value is string {
  return !!value && UUID_REGEX.test(value);
}

function isStorageUrl(candidate: string): boolean {
  if (!SUPABASE_URL) return false;
  try {
    const base = new URL(SUPABASE_URL);
    const target = new URL(candidate);
    return (
      base.host === target.host &&
      target.pathname.includes("/storage/v1/object/public/recipe-images/")
    );
  } catch {
    return false;
  }
}

function isExternalUrl(src: string): boolean {
  try {
    const url = new URL(src);
    // Check if it's an external URL (not Supabase storage)
    if (SUPABASE_URL) {
      const supabaseBase = new URL(SUPABASE_URL);
      // If same host, check if it's storage
      if (url.host === supabaseBase.host) {
        return !url.pathname.includes("/storage/v1/object/public/recipe-images/");
      }
    }
    // Different host = external
    return true;
  } catch {
    return false;
  }
}

export function recipeImg(src?: string, id?: string) {
  if (!src) {
    return PLACEHOLDER;
  }

  // Allow data URLs and blob URLs (for local uploads)
  if (src.startsWith("data:") || src.startsWith("blob:")) {
    return src;
  }

  // Reject external URLs (Unsplash, Spoonacular, etc.)
  if (isExternalUrl(src)) {
    return PLACEHOLDER;
  }

  // Allow Supabase storage URLs
  if (isStorageUrl(src)) {
    return src;
  }

  // Allow relative paths (for local development)
  if (src.startsWith("/")) {
    return src;
  }

  // Fallback to placeholder for any other case
  return PLACEHOLDER;
}

export function fallbackOnce(e: SyntheticEvent<HTMLImageElement, Event>) {
  const img = e.currentTarget as HTMLImageElement & { _fallbackStage?: "original" | "placeholder" };
  const originalSrc = img.dataset?.originalSrc;

  if (!img._fallbackStage && originalSrc && img.src !== originalSrc) {
    img._fallbackStage = "original";
    img.src = originalSrc;
    return;
  }

  if (img._fallbackStage !== "placeholder") {
    img._fallbackStage = "placeholder";
    img.onerror = null;
    img.src = PLACEHOLDER;
  }
}

export { isUuid };

