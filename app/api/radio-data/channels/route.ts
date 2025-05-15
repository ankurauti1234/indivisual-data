import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import RadioData from "@/models/RadioData";
import { authMiddleware } from "@/middleware/auth";

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const authResponse = await authMiddleware(request);
    if (authResponse) return authResponse;

    await connectToDatabase();

    // Fetch distinct channels
    const channels = await RadioData.distinct("channel");

    return NextResponse.json(
      {
        message: "Channels retrieved successfully",
        data: channels,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error retrieving channels:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
