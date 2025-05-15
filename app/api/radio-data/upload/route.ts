import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import RadioData from "@/models/RadioData";
import { authMiddleware } from "@/middleware/auth";

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authResponse = await authMiddleware(request);
    if (authResponse) return authResponse;

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    console.log("FormData received:", Array.from(formData.entries()));
    if (!file) {
      console.error("No file provided in formData");
      return NextResponse.json(
        { message: "Missing JSON file" },
        { status: 400 }
      );
    }

    // Relaxed MIME type check (accept any file, validate content)
    console.log("File received:", { name: file.name, size: file.size, type: file.type });

    // Read and parse JSON file
    const text = await file.text();
    if (!text) {
      console.error("File is empty");
      return NextResponse.json(
        { message: "JSON file is empty" },
        { status: 400 }
      );
    }

    let entries: any[];
    try {
      entries = JSON.parse(text);
      if (!Array.isArray(entries)) {
        console.error("JSON is not an array");
        return NextResponse.json(
          { message: "JSON file must contain an array of radio data entries" },
          { status: 400 }
        );
      }
    } catch (error) {
      console.error("Invalid JSON:", error);
      return NextResponse.json(
        { message: "Invalid JSON format" },
        { status: 400 }
      );
    }

    // Validate required fields for each entry
    const requiredFields = [
      "program",
      "channel",
      "id",
      "date",
      "start",
      "end",
      "type",
      "audio",
      "region",
    ];
    const invalidEntries: string[] = [];
    const validEntries: any[] = [];

    for (const [index, entry] of entries.entries()) {
      let isValid = true;
      for (const field of requiredFields) {
        if (!entry[field]) {
          invalidEntries.push(`Entry ${index}: Missing required field: ${field}`);
          isValid = false;
        }
      }
      // Validate date format
      if (isValid && !/^\d{4}-\d{2}-\d{2}$/.test(entry.date)) {
        invalidEntries.push(`Entry ${index}: Invalid date format. Use YYYY-MM-DD`);
        isValid = false;
      }
      // Validate time format
      if (
        isValid &&
        (!/^\d{2}:\d{2}:\d{2}$/.test(entry.start) ||
          !/^\d{2}:\d{2}:\d{2}$/.test(entry.end))
      ) {
        invalidEntries.push(`Entry ${index}: Invalid time format. Use HH:MM:SS`);
        isValid = false;
      }
      if (isValid) {
        validEntries.push(entry);
      }
    }

    if (validEntries.length === 0) {
      console.error("No valid entries:", invalidEntries);
      return NextResponse.json(
        {
          message: "No valid entries to process",
          errors: invalidEntries,
        },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Check for duplicates
    const existingIds = await RadioData.find(
      { id: { $in: validEntries.map((e) => e.id) } },
      "id"
    ).lean();
    const existingIdSet = new Set(existingIds.map((e) => e.id));
    const newEntries = validEntries.filter((entry) => !existingIdSet.has(entry.id));

    if (newEntries.length === 0) {
      console.log("All entries are duplicates");
      return NextResponse.json(
        {
          message: "All entries are duplicates",
          processed: validEntries.length,
          inserted: 0,
          skipped: validEntries.length,
          errors: invalidEntries,
        },
        { status: 200 }
      );
    }

    // Insert new entries
    const insertedDocs = await RadioData.insertMany(newEntries, {
      ordered: false,
    });

    console.log(`Inserted ${insertedDocs.length} documents`);
    return NextResponse.json(
      {
        message: "Radio data uploaded successfully",
        processed: validEntries.length,
        inserted: insertedDocs.length,
        skipped: validEntries.length - insertedDocs.length,
        errors: invalidEntries,
        data: insertedDocs,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error uploading radio data:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}