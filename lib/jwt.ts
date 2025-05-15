// lib/jwt.ts
import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "your-default-secret-key";

if (!process.env.JWT_SECRET) {
  console.warn("JWT_SECRET not set, using fallback secret");
}

// Convert secret to Uint8Array for jose
const secret = new TextEncoder().encode(JWT_SECRET);

export const signJwtToken = async (
  payload: any,
  options?: { expiresIn?: string }
) => {
  try {
    console.log("Signing token with payload:", payload);
    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(options?.expiresIn || "7d")
      .sign(secret);
    return token;
  } catch (error) {
    console.error("Token signing failed:", error);
    throw error;
  }
};

export const verifyJwtToken = async (token: string) => {
  try {
    const { payload } = await jwtVerify(token, secret);
    console.log("Token verified, payload:", payload);
    return payload;
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
};
export const decodeJwtToken = (token: string) => {
  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
    console.log("Decoded token payload:", payload);
    return payload;
  } catch (error) {
    console.error("Token decoding failed:", error);
    return null;
  }
};