// @ts-nocheck
// deno-lint-ignore-file

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const BUCKET = "recipe-images";
// Only allow Supabase storage URLs - no external image sources
const EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"] as const;

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type KnownExt = (typeof EXTENSIONS)[number];

function cors(extra: Record<string, string> = {}) {
  return {
    "Access-Control-Allow-Origin": "*",
    "Vary": "Origin",
    ...extra,
  };
}

function isUuid(value: string | null): value is string {
  return typeof value === "string" && UUID_REGEX.test(value);
}

async function sha1(input: string) {
  const hash = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function extensionFromContentType(contentType: string): KnownExt {
  const ct = contentType.toLowerCase();
  if (ct.includes("png")) return ".png";
  if (ct.includes("webp")) return ".webp";
  if (ct.includes("gif")) return ".gif";
  if (ct.includes("avif")) return ".avif";
  if (ct.includes("jpeg") || ct.includes("jpg")) return ".jpg";
  return ".jpg";
}

function contentTypeFromExt(ext: KnownExt): string {
  switch (ext) {
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    case ".avif":
      return "image/avif";
    case ".jpeg":
    case ".jpg":
    default:
      return "image/jpeg";
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: cors({ "Access-Control-Allow-Methods": "GET,OPTIONS" }),
    });
  }

  const url = new URL(req.url);
  const src = url.searchParams.get("src");
  const recipeId = url.searchParams.get("id");

  if (!src) {
    return new Response("missing src", { status: 400, headers: cors() });
  }

  let remote: URL;
  try {
    remote = new URL(src);
  } catch {
    return new Response("invalid src", { status: 400, headers: cors() });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  if (!supabaseUrl) {
    return new Response("missing supabase url", { status: 500, headers: cors() });
  }
  const supabaseHost = new URL(supabaseUrl).host;

  // ONLY allow Supabase storage URLs - reject all external sources
  const isStorageUrl =
    remote.host === supabaseHost && remote.pathname.includes("/storage/v1/object/public/");

  if (!isStorageUrl) {
    return new Response("only Supabase storage URLs are allowed", { status: 403, headers: cors() });
  }

  const keyBase = await sha1(src);

  for (const ext of EXTENSIONS) {
    const { data, error } = await supabase.storage.from(BUCKET).download(`${keyBase}${ext}`);
    if (!error && data) {
      const buffer = new Uint8Array(await data.arrayBuffer());
      return new Response(buffer, {
        status: 200,
        headers: cors({
          "Content-Type": contentTypeFromExt(ext),
          "Cache-Control": "public, max-age=31536000, immutable",
          "Cross-Origin-Resource-Policy": "cross-origin",
          "Content-Disposition": "inline",
        }),
      });
    }
  }

  const upstream = await fetch(src, { redirect: "follow" });
  if (!upstream.ok) {
    return new Response("fetch failed", { status: 502, headers: cors() });
  }

  const contentType = upstream.headers.get("content-type") ?? "image/jpeg";
  const ext = extensionFromContentType(contentType);
  const bytes = new Uint8Array(await upstream.arrayBuffer());

  await supabase.storage.from(BUCKET).upload(`${keyBase}${ext}`, bytes, {
    contentType,
    upsert: true,
  });

  if (recipeId && isUuid(recipeId)) {
    const publicUrl = supabase.storage.from(BUCKET).getPublicUrl(`${keyBase}${ext}`);
    if (publicUrl.data?.publicUrl) {
      await supabase
        .from("recipes")
        .update({ hero_image_url: publicUrl.data.publicUrl })
        .eq("id", recipeId);
    }
  }

  return new Response(bytes, {
    status: 200,
    headers: cors({
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "Cross-Origin-Resource-Policy": "cross-origin",
      "Content-Disposition": "inline",
    }),
  });
});

