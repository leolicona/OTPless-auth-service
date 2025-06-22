import { Context } from 'hono';
import { verifyAndLogin } from '../../core/auth/auth';
import { HTTPException } from 'hono/http-exception';

export const authHandler = {
  verify: async (c: Context) => {
    console.log('Starting verification process...');
    
    const { token } = await c.req.json();
    console.log('Received token:', token);
    
    if (!token) {
      console.log('Token validation failed: Token is missing');
      throw new HTTPException(400, { message: 'Verification token is required' });
    }

    console.log('Attempting to verify and login with token...');
    const result = await verifyAndLogin(c, token);
    console.log('Verification result:', result);

    if (!result) {
      console.log('Token validation failed: Invalid or expired token');
      throw new HTTPException(400, { message: 'Invalid or expired token' });
    }

    console.log('Verification successful, returning result');
    return c.json(result);
  },
};