import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { prisma } from './prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'ps-project-secret-key-change-in-production';

/**
 * Estrategia de Google OAuth 2.0
 * Verifica o crea usuarios basados en perfil de Google
 */
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:4000/auth/google/callback'
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Buscar usuario por email de Google
        let user = await prisma.user.findUnique({
          where: { email: profile.emails?.[0]?.value }
        });

        // Si no existe, crear usuario
        if (!user) {
          user = await prisma.user.create({
            data: {
              email: profile.emails?.[0]?.value || '',
              name: profile.displayName || '',
              avatarUrl: profile.photos?.[0]?.value,
              // No tenemos password para OAuth users, se genera una aleatoria
              password: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
            }
          });
        }

        // Generar JWT para ser usado en la aplicación
        const token = jwt.sign(
          { userId: user.id, email: user.email },
          JWT_SECRET,
          { expiresIn: '7d' }
        );

        // Retornar usuario y token
        done(null, { user, token });
      } catch (error) {
        done(error as any);
      }
    }
  )
);

/**
 * Serializar usuario para sesiones (requerido por Passport)
 * En nuestro caso, solo guardamos el userId
 */
passport.serializeUser((profile: any, done) => {
  done(null, profile.user.id);
});

/**
 * Deserializar usuario desde sesión
 */
passport.deserializeUser(async (userId: string, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    done(null, user || undefined);
  } catch (error) {
    done(error);
  }
});

export default passport;
