import crypto from 'crypto';

/**
 * Genera un token aleatorio para invitaciones
 * Formato: base64url encoded 32 bytes
 */
export function generateInvitationToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * Calcula la fecha de expiración para una invitación
 * Por defecto: 7 días desde ahora
 */
export function getInvitationExpiryDate(daysFromNow: number = 7): Date {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + daysFromNow);
  return expiresAt;
}

/**
 * Verifica si una invitación ha expirado
 */
export function isInvitationExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt;
}

/**
 * Genera la URL de aceptación de invitación
 */
export function generateInvitationLink(
  token: string,
  baseUrl: string = process.env.FRONTEND_URL || 'http://localhost:5173'
): string {
  return `${baseUrl}/accept-invitation/${token}`;
}
