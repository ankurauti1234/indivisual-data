import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import AudioClip from "@/models/AudioClip";
import User from "@/models/User";
import { authMiddleware } from "@/middleware/auth";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || "indi-radio-bucket";

export async function POST(request: NextRequest) {
  try {
    const authResponse = await authMiddleware(request);
    if (authResponse) return authResponse;

    const uploadedBy = (request as any).user?.userId;
    console.log("uploadedBy:", uploadedBy); // Debug
    if (!uploadedBy) {
      return NextResponse.json(
        { error: "User ID not found in request" },
        { status: 401 }
      );
    }

    await connectToDatabase();

    // Get the username from the User model
    const user = await User.findById(uploadedBy);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log("Username found:", user.name); // Debug

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const date = formData.get("date") as string;
    const type = formData.get("type") as "ads" | "songs";
    const channel = formData.get("channel") as string;
    const region = formData.get("region") as string;

    // Validate inputs
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return NextResponse.json(
        { error: "Invalid date format. Use YYYY-MM-DD" },
        { status: 400 }
      );
    }
    if (!["ads", "songs"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid type. Use 'ads' or 'songs'" },
        { status: 400 }
      );
    }
    if (!files.length) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
    }

    const results = {
      processed: files.length,
      inserted: 0,
      skipped: 0,
      errors: [] as string[],
    };

    for (const file of files) {
      const originalFileName = file.name;

      // Encode file name with + for spaces for MongoDB
      const mongoFileName = originalFileName.replace(/\s/g, "+");

      // Create S3 key with raw region, channel, and original file name (preserving spaces)
      const s3Key = `${region}/${channel}/${type}/${date}/${originalFileName}`;

      // Check for duplicate using the MongoDB-encoded file name
      const existingClip = await AudioClip.findOne({
        fileName: mongoFileName,
        date,
        type,
        channel,
        region,
      });
      if (existingClip) {
        results.skipped++;
        results.errors.push(`Duplicate file: ${originalFileName}`);
        continue;
      }

      // Upload to S3
      const buffer = Buffer.from(await file.arrayBuffer());
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: s3Key,
        Body: buffer,
        ContentType: file.type,
      });
      await s3Client.send(command);

      // Construct S3 URL for MongoDB with %20 for spaces in region, channel, and file name
      const encodedS3Key = `${encodeURIComponent(region)}/${encodeURIComponent(
        channel
      )}/${type}/${date}/${encodeURIComponent(originalFileName)}`;
      const s3Url = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${encodedS3Key}`;
      console.log("Uploaded s3Url:", s3Url); // Debug

      // Save metadata to MongoDB with username and MongoDB-encoded file name
      const newClip = await AudioClip.create({
        fileName: mongoFileName, // Store file name with + for spaces
        s3Url, // Store URL with %20 for folder and file name spaces
        type,
        channel,
        region,
        date,
        uploadedBy,
        uploadedByUsername: user.name, // Store the username
      });

      console.log("Created clip with username:", newClip.uploadedByUsername); // Debug
      results.inserted++;
    }

    return NextResponse.json(
      {
        message: "Upload completed",
        ...results,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error uploading audio clips:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
