import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import AudioClip from "@/models/AudioClip";
import { authMiddleware } from "@/middleware/auth";

export async function GET(request: NextRequest) {
  try {
    const authResponse = await authMiddleware(request);
    if (authResponse) return authResponse;

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const type = searchParams.get("type");
    const channel = searchParams.get("channel");
    const region = searchParams.get("region");
    const name = searchParams.get("name");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    await connectToDatabase();

    const query: any = {};
    if (date) query.date = date;
    if (type) query.type = type;
    if (channel) query.channel = channel;
    if (region) query.region = region;
    if (name) query.fileName = { $regex: name, $options: "i" };

    const total = await AudioClip.countDocuments(query);
    const clips = await AudioClip.find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return NextResponse.json(
      {
        message: "Audio clips retrieved successfully",
        data: clips,
        total,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error retrieving audio clips:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
