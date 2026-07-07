import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(req: NextRequest, { params }: { params: Promise<{ filename: string }> }) {
  const { filename } = await params;
  
  // Prevent directory traversal
  const safeFilename = path.basename(filename);
  const fullPath = path.resolve(process.cwd(), "storage", safeFilename);
  
  if (!fs.existsSync(fullPath)) {
    return new NextResponse("File not found", { status: 404 });
  }

  const fileBuffer = fs.readFileSync(fullPath);
  
  // Guess content type from extension
  let contentType = "application/octet-stream";
  if (safeFilename.endsWith(".png")) contentType = "image/png";
  if (safeFilename.endsWith(".jpg") || safeFilename.endsWith(".jpeg")) contentType = "image/jpeg";
  if (safeFilename.endsWith(".mp4")) contentType = "video/mp4";

  return new NextResponse(fileBuffer, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable"
    }
  });
}
