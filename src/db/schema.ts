import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  phoneNumber: text('phone_number').unique().notNull(),
  name: text('name'),
  createdAt: integer('created_at').notNull(),
  lastLogin: integer('last_login').notNull(),
});

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  createdAt: integer('created_at').notNull(),
  expiresAt: integer('expires_at').notNull(),
  authToken: text('auth_token'),
  refreshToken: text('refresh_token'),
  status: text('status').notNull().default('pending'),
});

export const verificationTokens = sqliteTable('verification_tokens', {
  id: text('id').primaryKey(),
  tokenHash: text('token_hash').unique().notNull(),
  phoneNumber: text('phone_number').notNull(),
  expiresAt: integer('expires_at').notNull(),
  usedAt: integer('used_at'),
  createdAt: integer('created_at').notNull()
});

export const refreshTokens = sqliteTable('refresh_tokens', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  tokenHash: text('token_hash').unique().notNull(),
  expiresAt: integer('expires_at').notNull(),
  createdAt: integer('created_at').notNull(),
  revokedAt: integer('revoked_at'),
});