import nodemailer from 'nodemailer';
import logger from '../logger';

/**
 * Configuración del transportador de email
 * Usa variables de entorno para configuración
 */
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'localhost',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: process.env.SMTP_USER
    ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      }
    : undefined,
});

/**
 * Plantilla HTML para invitación a workspace
 */
function getWorkspaceInvitationEmailHtml(
  inviteLink: string,
  workspaceName: string,
  invitedByName: string
): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { color: #6b7280; font-size: 12px; margin-top: 20px; text-align: center; }
          .workspace-name { font-size: 24px; font-weight: bold; margin: 10px 0; }
          .invited-by { color: rgba(255,255,255,0.9); font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">You're Invited!</h1>
            <div class="invited-by">by ${invitedByName}</div>
            <div class="workspace-name">${workspaceName}</div>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>You've been invited to join <strong>${workspaceName}</strong> workspace. Click the button below to accept the invitation.</p>
            <p style="text-align: center;">
              <a href="${inviteLink}" class="button">Accept Invitation</a>
            </p>
            <p style="color: #6b7280; font-size: 14px;">
              This invitation will expire in 7 days. If you didn't expect this invitation, you can safely ignore this email.
            </p>
          </div>
          <div class="footer">
            <p>© 2026 Project Management System. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Plantilla HTML para invitación a board
 */
function getBoardInvitationEmailHtml(
  inviteLink: string,
  boardName: string,
  workspaceName: string,
  invitedByName: string
): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { color: #6b7280; font-size: 12px; margin-top: 20px; text-align: center; }
          .board-name { font-size: 24px; font-weight: bold; margin: 10px 0; }
          .invited-by { color: rgba(255,255,255,0.9); font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">Board Invitation</h1>
            <div class="invited-by">by ${invitedByName}</div>
            <div class="board-name">${boardName}</div>
            <div style="font-size: 14px; opacity: 0.9;">in ${workspaceName}</div>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>You've been invited to join the board <strong>${boardName}</strong> in the <strong>${workspaceName}</strong> workspace. Click the button below to accept the invitation.</p>
            <p style="text-align: center;">
              <a href="${inviteLink}" class="button">Accept Invitation</a>
            </p>
            <p style="color: #6b7280; font-size: 14px;">
              This invitation will expire in 7 days. If you didn't expect this invitation, you can safely ignore this email.
            </p>
          </div>
          <div class="footer">
            <p>© 2026 Project Management System. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Envía una invitación de workspace por email
 */
export async function sendWorkspaceInvitationEmail(
  recipientEmail: string,
  workspaceName: string,
  invitedByName: string,
  invitationLink: string
): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@projectmanagement.com',
      to: recipientEmail,
      subject: `Invitation to ${workspaceName}`,
      html: getWorkspaceInvitationEmailHtml(invitationLink, workspaceName, invitedByName),
      replyTo: process.env.SMTP_REPLY_TO || 'support@projectmanagement.com',
    });

    logger.info(`Workspace invitation email sent to ${recipientEmail} for workspace ${workspaceName}`, {
      email: recipientEmail,
      workspace: workspaceName,
    });

    return true;
  } catch (error) {
    logger.error('Error sending workspace invitation email', {
      error,
      email: recipientEmail,
      workspace: workspaceName,
    });
    return false;
  }
}

/**
 * Envía una invitación de board por email
 */
export async function sendBoardInvitationEmail(
  recipientEmail: string,
  boardName: string,
  workspaceName: string,
  invitedByName: string,
  invitationLink: string
): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@projectmanagement.com',
      to: recipientEmail,
      subject: `Invitation to ${boardName}`,
      html: getBoardInvitationEmailHtml(invitationLink, boardName, workspaceName, invitedByName),
      replyTo: process.env.SMTP_REPLY_TO || 'support@projectmanagement.com',
    });

    logger.info(`Board invitation email sent to ${recipientEmail} for board ${boardName}`, {
      email: recipientEmail,
      board: boardName,
    });

    return true;
  } catch (error) {
    logger.error('Error sending board invitation email', {
      error,
      email: recipientEmail,
      board: boardName,
    });
    return false;
  }
}

/**
 * Verifica si el email está configurado correctamente
 */
export async function verifyEmailConfiguration(): Promise<boolean> {
  try {
    await transporter.verify();
    logger.info('Email service configured and verified');
    return true;
  } catch (error) {
    logger.warn('Email service not properly configured', { error });
    return false;
  }
}
