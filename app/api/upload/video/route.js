import { NextResponse } from "next/server";
import { handleUpload } from "@vercel/blob/client";
import { getSessionUser } from "@/utils/roles";
import { consumeUploadQuota } from "@/lib/uploadQuota";
import { isAllowedUploadPathname } from "@/lib/uploads";
import { LISTING_VIDEO_TYPES, MAX_VIDEO_SIZE_BYTES } from "@/lib/marketplace";

// Marketplace videos are larger than a function request body allows, so the
// browser uploads them straight to Vercel Blob. This route only hands out a
// short-lived upload token after checking who is asking and where to.
export async function POST(request) {
  const body = await request.json();

  try {
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        const user = await getSessionUser();
        if (!user) throw new Error("Not signed in");
        if (!consumeUploadQuota(user.id)) {
          throw new Error("Too many uploads. Please try again in a minute.");
        }
        if (!isAllowedUploadPathname(pathname, "marketplace")) {
          throw new Error("Invalid upload path");
        }

        return {
          allowedContentTypes: LISTING_VIDEO_TYPES,
          maximumSizeInBytes: MAX_VIDEO_SIZE_BYTES,
          addRandomSuffix: false,
          allowOverwrite: false,
        };
      },
    });
    return NextResponse.json(json);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
