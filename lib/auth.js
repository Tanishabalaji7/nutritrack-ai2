import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "nutritrack_session";
const SESSION_DAYS = 30;

function getSecretKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not set");
  }
  return new TextEncoder().encode(secret);
}

export async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(userId) {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(getSecretKey());
}

export async function verifySessionToken(token) {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload.sub;
  } catch (e) {
    return null;
  }
}

export async function setSessionCookie(userId) {
  const token = await createSessionToken(userId);
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export function clearSessionCookie() {
  cookies().set(COOKIE_NAME, "", { path: "/", maxAge: 0 });
}

export async function getCurrentUserId() {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
