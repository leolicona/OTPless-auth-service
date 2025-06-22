import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import type { Context } from 'hono';

export const generateToken = async (c: Context, payload: JWTPayload) => {
  const secret = new TextEncoder().encode(c.env.JWT_SECRET);
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m') // Access token expiration
    .sign(secret);
};

export const generateRefreshToken = async (c: Context, payload: JWTPayload) => {
  const secret = new TextEncoder().encode(c.env.JWT_SECRET);
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d') // Refresh token expiration
    .sign(secret);
};

export const verifyToken = async (c: Context, token: string) => {
  const secret = new TextEncoder().encode(c.env.JWT_SECRET);
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch (error) {
    return null;
  }
};