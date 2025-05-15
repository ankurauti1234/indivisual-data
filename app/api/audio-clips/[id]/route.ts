import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import AudioClip from "@/models/AudioClip";
import User from "@/models/User";
import { authMiddleware } from "@/middleware/auth";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || "indi-radio-bucket";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authResponse = await authMiddleware(request);
    if (authResponse) return authResponse;

    const { id } = await context.params;
    const { fileName } = await request.json();

    if (!fileName) {
      return NextResponse.json(
        { error: "New file name is required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Get the current user for recording who modified the clip
    const userId = (request as any).user?.userId;
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const clip = await AudioClip.findByIdAndUpdate(
      id,
      {
        fileName,
        // Optionally track who last modified the clip
        // lastModifiedBy: userId,
        // lastModifiedByUsername: user.name
      },
      { new: true }
    );

    if (!clip) {
      return NextResponse.json(
        { error: "Audio clip not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "File name updated successfully", data: clip },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating audio clip:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authResponse = await authMiddleware(request);
    if (authResponse) return authResponse;

    const { id } = await context.params;

    await connectToDatabase();

    const clip = await AudioClip.findById(id);
    if (!clip) {
      return NextResponse.json(
        { error: "Audio clip not found" },
        { status: 404 }
      );
    }

    // Extract s3Key from s3Url
    console.log("s3Url:", clip.s3Url); // Debug
    const urlPrefix = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/`;
    let s3Key = clip.s3Url;
    if (clip.s3Url.startsWith(urlPrefix)) {
      s3Key = clip.s3Url.replace(urlPrefix, "");
    } else if (clip.s3Url.startsWith(`s3://${BUCKET_NAME}/`)) {
      s3Key = clip.s3Url.replace(`s3://${BUCKET_NAME}/`, "");
    } else if (clip.s3Url.startsWith("/")) {
      s3Key = clip.s3Url.replace(/^\//, "");
    }
    // Remove legacy UUIDs
    const uuidRegex =
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-/;
    s3Key = s3Key.replace(uuidRegex, "");
    // Remove leading/trailing slashes and decode %20 to +
    s3Key = s3Key.replace(/^\/+|\/+$/g, "");
    console.log("s3Key:", s3Key); // Debug

    if (!s3Key || s3Key === clip.s3Url) {
      console.error("Failed to extract s3Key from s3Url:", clip.s3Url);
      return NextResponse.json(
        { error: "Invalid S3 URL format" },
        { status: 400 }
      );
    }

    // Delete from S3
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
    });
    await s3Client.send(command);

    // Delete from MongoDB
    await AudioClip.findByIdAndDelete(id);

    return NextResponse.json(
      { message: "Audio clip deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting audio clip:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
