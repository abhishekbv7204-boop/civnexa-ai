import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { db, hashPassword } from './server/db';
import {
  analyzeCivicIssue,
  processVoiceAssistant,
  performCivicSearchGrounding,
  performMapsGrounding,
} from './server/gemini';
import { UserProfile, ComplaintCategory, ComplaintPriority, ComplaintStatus } from './src/types';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const TOKEN_SECRET = process.env.TOKEN_SECRET || 'civicfix_secret_salt_2026';
const TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Configurable default municipality fallback
const DEFAULT_CITY = process.env.DEFAULT_CITY || 'Bengaluru Municipal Area';
const DEFAULT_LAT = Number(process.env.DEFAULT_LAT) || 12.9716;
const DEFAULT_LNG = Number(process.env.DEFAULT_LNG) || 77.5946;

declare global {
  namespace Express {
    interface Request {
      user?: UserProfile;
    }
  }
}

// Middleware: JSON body with up to 15MB for photo uploads
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Helper to create and verify tokens with expiration & timing-safe comparison
function generateToken(userId: string): string {
  const timestamp = Date.now();
  const signature = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .
