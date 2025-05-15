import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import RadioData from "@/models/RadioData";
import { authMiddleware } from "@/middleware/auth";

export async function POST(request: NextRequest) {
  try {
    // Check authentication (admin role required)
    const authResponse = await authMiddleware(request);
    if (authResponse) return authResponse;

    const body = await request.json();
    const { date, channel, start, end, title, description } = body;

    // Validate required fields
    if (!date || !channel || !start || !end || !title) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate date and time formats
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!dateRegex.test(date)) {
      return NextResponse.json(
        { error: "Invalid date format. Use YYYY-MM-DD" },
        { status: 400 }
      );
    }
    if (!timeRegex.test(start) || !timeRegex.test(end)) {
      return NextResponse.json(
        { error: "Invalid time format. Use HH:MM" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Upsert EPG data
    const epgData = await RadioData.findOneAndUpdate(
      { date, channel, start },
      { date, channel, start, end, title, description },
      { upsert: true, new: true }
    );

    return NextResponse.json(
      {
        message: "EPG data saved successfully",
        data: epgData,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error saving EPG data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
