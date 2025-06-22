import { getDb } from '../../db/db';
import { users, verificationTokens } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { generateToken, generateRefreshToken, verifyToken } from '../../utils/jwt';
import { Context } from 'hono';


export const findUserByPhone = async (c: Context, phoneNumber: string) => {
  console.log("phoneNumber", phoneNumber);
  const db = getDb(c.env.DB);
  const user = await db.select().from(users).where(eq(users.phoneNumber, phoneNumber)).get();
  return user;
};

export const createUser = async (c: Context, phoneNumber: string) => {
  const db = getDb(c.env.DB);
  const newUser = {
    id: crypto.randomUUID(),
    phoneNumber,
    name: null,
    createdAt: Date.now(),
    lastLogin: Date.now(),
  };
  await db.insert(users).values(newUser);
  return newUser;
};

export const createVerificationToken = async (c: Context, phoneNumber: string) => {
  const db = getDb(c.env.DB);
  const token = crypto.randomUUID();
  const tokenHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  const tokenHashString = Array.from(new Uint8Array(tokenHash)).map(b => b.toString(16).padStart(2, '0')).join('');

  const verificationToken = {
    id: crypto.randomUUID(),
    tokenHash: tokenHashString,
    phoneNumber,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    usedAt: null,
    createdAt: Date.now(),
  };

  await db.insert(verificationTokens).values(verificationToken);
  return token;
};

export const verifyAndLogin = async (c: Context, token: string) => {
  console.log('Starting verifyAndLogin with token:', token);
  
  const db = getDb(c.env.DB);
  const tokenHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  const tokenHashString = Array.from(new Uint8Array(tokenHash)).map(b => b.toString(16).padStart(2, '0')).join('');
  
  console.log('Generated token hash:', tokenHashString);

  const vToken = await db.select().from(verificationTokens).where(eq(verificationTokens.tokenHash, tokenHashString)).get();
  console.log('Retrieved verification token:', vToken);

  if (!vToken || vToken.expiresAt < Date.now() || vToken.usedAt) {
    console.log('Token validation failed:', {
      exists: !!vToken,
      expired: vToken ? vToken.expiresAt < Date.now() : false,
      alreadyUsed: !!vToken?.usedAt
    });
    return null;
  }

  await db.update(verificationTokens).set({ usedAt: Date.now() }).where(eq(verificationTokens.id, vToken.id));
  console.log('Updated verification token as used');

  let user = await findUserByPhone(c, vToken.phoneNumber);
  console.log('Found existing user:', user);
  
  if (!user) {
    console.log('Creating new user for phone:', vToken.phoneNumber);
    user = await createUser(c, vToken.phoneNumber);
  }

  if (!user) {
    console.log('Failed to create/find user');
    return null;
  }

  const accessToken = await generateToken(c, { userId: user.id });
  const refreshToken = await generateRefreshToken(c, { userId: user.id });
  console.log('Generated tokens for user:', { userId: user.id });

  return { user, accessToken, refreshToken };
};



