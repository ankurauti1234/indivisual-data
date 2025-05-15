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

    // Fetch distinct dates
    const dates = await RadioData.distinct("date");

    return NextResponse.json(
      {
        message: "Dates retrieved successfully",
        data: dates.sort(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error retrieving dates:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
