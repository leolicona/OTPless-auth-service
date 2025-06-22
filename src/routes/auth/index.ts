// Authentication routes
// This file defines the Hono router for authentication endpoints
import { Hono } from 'hono';
import { authHandler } from './auth.handler';
import { HTTPException } from 'hono/http-exception'
import { zodValidator } from '../../middleware/zod.validator'
import { AuthErrors } from '../../middleware/error.handler'
import { z } from 'zod'
import type { Env } from '../../bindings'

const auth = new Hono<{ Bindings: Env }>()

// Example schema for demonstration
const loginSchema = z.object({
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  otp: z.string().length(6, 'OTP must be exactly 6 digits')
})

// Example route that demonstrates error handling
auth.post('/login', zodValidator('json', loginSchema), async (c) => {
  try {
    const { phone, otp } = c.req.valid('json')
    
    // Simulate validation logic
    if (phone === '1234567890' && otp === '123456') {
      return c.json({
        success: true,
        message: 'Login successful',
        token: 'example-jwt-token'
      })
    }
    
    // Throw HTTPException for invalid credentials
    throw AuthErrors.INVALID_CREDENTIALS()
    
  } catch (error) {
    // If it's already an HTTPException, re-throw it
    if (error instanceof HTTPException) {
      throw error
    }
    
    // For unexpected errors, throw a generic server error
    throw AuthErrors.DATABASE_ERROR()
  }
})

// Example route that demonstrates different error types
auth.get('/profile/:userId', async (c) => {
  const userId = c.req.param('userId')
  
  // Simulate user lookup
  if (userId === 'invalid') {
    throw AuthErrors.USER_NOT_FOUND()
  }
  
  if (userId === 'unauthorized') {
    throw AuthErrors.INSUFFICIENT_PERMISSIONS()
  }
  
  if (userId === 'error') {
    // This will trigger the unexpected error handler
    throw new Error('Simulated database connection error')
  }
  
  return c.json({
    success: true,
    user: {
      id: userId,
      phone: '+1234567890',
      createdAt: new Date().toISOString()
    }
  })
})

// Health check endpoint
auth.get('/health', (c) => {
  return c.json({
    success: true,
    message: 'Auth service is healthy',
    timestamp: new Date().toISOString()
  })
})

auth.post('/verify', authHandler.verify);

export { auth };