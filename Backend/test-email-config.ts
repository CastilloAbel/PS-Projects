#!/usr/bin/env node

/**
 * Email Configuration Test Script
 * Verifica que el servicio de email está correctamente configurado
 */

import dotenv from 'dotenv';
import path from 'path';
import nodemailer from 'nodemailer';

// Cargar variables de entorno
dotenv.config({ path: path.join(process.cwd(), '.env') });

async function testEmailConfiguration() {
  console.log('\n📧 Email Configuration Test\n');
  console.log('=' .repeat(50));

  // Verificar variables de entorno
  const requiredVars = [
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_USER',
    'SMTP_PASSWORD',
    'SMTP_FROM'
  ];

  console.log('\n1️⃣  Checking environment variables...\n');

  let allConfigured = true;
  for (const varName of requiredVars) {
    const value = process.env[varName];
    if (value) {
      const displayValue = varName === 'SMTP_PASSWORD' ? '***' : value;
      console.log(`✅ ${varName}: ${displayValue}`);
    } else {
      console.log(`❌ ${varName}: NOT SET`);
      allConfigured = false;
    }
  }

  if (!allConfigured) {
    console.log('\n❌ Missing required environment variables!');
    console.log('Please set all required variables in your .env file');
    process.exit(1);
  }

  // Crear transportador
  console.log('\n2️⃣  Creating SMTP transporter...\n');

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  // Verificar conexión
  console.log('3️⃣  Verifying SMTP connection...\n');

  try {
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully!\n');
  } catch (error) {
    console.error('❌ SMTP connection failed!');
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }

  // Resumen
  console.log('=' .repeat(50));
  console.log('\n✅ Email service is properly configured!\n');
  console.log('Summary:');
  console.log(`- SMTP Host: ${process.env.SMTP_HOST}:${process.env.SMTP_PORT}`);
  console.log(`- From: ${process.env.SMTP_FROM}`);
  console.log(`- Secure: ${process.env.SMTP_SECURE === 'true' ? 'Yes' : 'No'}`);
  console.log('\n✨ You can now start the server and test invitations!\n');
}

testEmailConfiguration().catch(error => {
  console.error('\n❌ Test failed:', error);
  process.exit(1);
});
