import { NextRequest, NextResponse } from "next/server";
import { verifyJwtToken } from "@/lib/jwt";

export async function authMiddleware(request: NextRequest) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json(
      { message: "Authentication required: No Bearer token provided" },
      { status: 401 }
    );
  }

  const token = authHeader.replace("Bearer ", "");

  try {
    const payload = await verifyJwtToken(token);
    if (!payload || !payload.userId) {
      return NextResponse.json(
        { message: "Authentication required: Invalid or expired token" },
        { status: 401 }
      );
    }

    // Attach userId to request object
    (request as any).user = { userId: payload.userId };
    console.log("Attached userId to request:", payload.userId); // Debug

    return null; // Proceed to the next handler
  } catch (error) {
    console.error("Token verification error:", error);
    return NextResponse.json(
      { message: "Authentication required: Token verification failed" },
      { status: 401 }
    );
  }
}
