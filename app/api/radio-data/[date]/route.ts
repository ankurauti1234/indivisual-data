import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import RadioData from "@/models/RadioData";
import { authMiddleware } from "@/middleware/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { date: string } }
) {
  try {
    // Check authentication
    const authResponse = await authMiddleware(request);
    if (authResponse) return authResponse;

    const { date } = params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const startTime = searchParams.get("startTime");
    const endTime = searchParams.get("endTime");

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return NextResponse.json(
        { error: "Invalid date format. Use YYYY-MM-DD" },
        { status: 400 }
      );
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (startTime && !timeRegex.test(startTime)) {
      return NextResponse.json(
        { error: "Invalid start time format. Use HH:MM" },
        { status: 400 }
      );
    }
    if (endTime && !timeRegex.test(endTime)) {
      return NextResponse.json(
        { error: "Invalid end time format. Use HH:MM" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Build query
    const query: any = { date };
    if (startTime) {
      query.start = { $gte: startTime };
    }
    if (endTime) {
      query.end = { $lte: endTime };
    }

    // Find RadioData with pagination
    const total = await RadioData.countDocuments(query);
    const radioData = await RadioData.find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    if (radioData.length === 0) {
      return NextResponse.json(
        { message: "No RadioData found for this date", data: [], total },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        message: "RadioData retrieved successfully",
        data: radioData,
        total,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error retrieving RadioData:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
