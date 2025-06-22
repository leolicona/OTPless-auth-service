import { cors } from 'hono/cors';
import type { MiddlewareHandler } from 'hono';

// CORS Configuration Object
export const corsConfig = {
  // Default configuration for authentication service
  default: {
    origin: ['http://localhost:3000', 'http://localhost:5173', 'https://yourdomain.com'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'X-Upload-Token'
    ],
    exposeHeaders: ['X-Upload-Progress', 'X-Rate-Limit-Remaining'],
    maxAge: 86400, // 24 hours
    credentials: true,
  },

  // Specific origins configuration
  specific: {
    origin: ['https://yourdomain.com', 'https://app.yourdomain.com'],
    credentials: true,
  },

  // Dynamic origin validation
  dynamic: {
    origin: (origin: string) => {
      // Allow localhost in development
      if (origin.includes('localhost')) return origin;
      // Allow your production domains
      const isAllowed = ['yourdomain.com', 'app.yourdomain.com'].some(domain => 
        origin.includes(domain)
      );
      return isAllowed ? origin : null;
    },
    credentials: true,
  },

  // Upload endpoints configuration
  upload: {
    origin: 'https://yourdomain.com',
    allowMethods: ['GET', 'POST', 'PUT'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Upload-Token'],
    exposeHeaders: ['X-Upload-Progress'],
    maxAge: 3600, // 1 hour
  },

  // Public endpoints (no credentials)
  public: {
    origin: '*',
    credentials: false,
  },

  // Restrictive configuration for admin/sensitive endpoints
  admin: {
    origin: 'https://admin.yourdomain.com',
    allowMethods: ['GET', 'POST'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 300, // 5 minutes
  },

  // Development configuration
  development: {
    origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:8080'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowHeaders: ['*'],
    credentials: true,
    maxAge: 0, // No caching in development
  },

  // Production configuration
  production: {
    origin: ['https://yourdomain.com', 'https://app.yourdomain.com'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400, // 24 hours
  },
};

// Pre-configured CORS middleware with default settings
export const corsMiddleware = cors(corsConfig.public);
