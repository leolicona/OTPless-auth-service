import { Context } from 'hono';
import { verifyAndLogin, findUserByPhone, createUser, createVerificationToken } from '../../core/auth/auth';
import { HTTPException } from 'hono/http-exception';

export const authHandler = {
  login: async (c: Context) => {
    try {
      const { phoneNumber, redirectUrl } = await c.req.json();

      if (!phoneNumber) {
        throw new HTTPException(400, { message: 'Phone number is required' });
      }

      console.log(`🔐 [AuthHandler] Initiating login for ${phoneNumber}`);

      // 1. Buscar usuario
      let user = await findUserByPhone(c, phoneNumber);
      let isNewUser = false;

      // 2. Si no existe, crear (Registro Implícito)
      if (!user) {
        console.log(`🆕 [AuthHandler] User not found. Creating new user for ${phoneNumber}`);
        user = await createUser(c, phoneNumber);
        isNewUser = true;
      }

      // 3. Generar Token de Verificación
      const token = await createVerificationToken(c, phoneNumber);

      // 4. Construir Magic Link
      // Prioridad: 1. URL de la petición -> 2. Variable de entorno -> 3. Fallback hardcodeado
      const baseUrl = redirectUrl || c.env.OTPLESS_API_URL || 'https://tu-dominio.com';
      
      // Asegurarse de no duplicar barras al unir
      const cleanBaseUrl = baseUrl.replace(/\/$/, '');
      const magicLink = `${cleanBaseUrl}/verify?token=${token}`;

      return c.json({
        success: true,
        message: isNewUser ? 'User created and login initiated' : 'Login initiated',
        data: {
          token, // En producción, quizás no devolver el token directamente si se envía por otro canal
          magicLink,
          isNewUser
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      if (error instanceof HTTPException) {
        throw error;
      }
      throw new HTTPException(500, { message: 'Internal Server Error during login initiation' });
    }
  },
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