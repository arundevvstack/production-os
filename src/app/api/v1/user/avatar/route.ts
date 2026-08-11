import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { uploadToSupabaseStorage } from "@/lib/supabase/storage";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const uid = formData.get("uid") as string;

    if (!file || !uid) {
      return NextResponse.json(
        { error: "File and User ID are required." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const timestamp = Date.now();
    const extension = file.name.split('.').pop() || 'png';
    const filename = `avatars/${uid}-${timestamp}.${extension}`;

    // Upload to Supabase 'assets' bucket
    const publicUrl = await uploadToSupabaseStorage("assets", filename, buffer, file.type);

    // Update Prisma User profile
    const updatedUser = await prisma.user.update({
      where: { id: uid },
      data: { avatar: publicUrl }
    });

    return NextResponse.json({
      success: true,
      avatar_url: updatedUser.avatar,
      user: updatedUser
    });
  } catch (error: any) {
    console.error("Avatar Upload Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload avatar" },
      { status: 500 }
    );
  }
}
