import { NextResponse } from "next/server";

export async function POST() {
  try {
    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully",
    });
    // Delete cookies
    response.cookies.delete("token");
    response.cookies.delete("user");
    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to log out" },
      { status: 500 }
    );
  }
}
