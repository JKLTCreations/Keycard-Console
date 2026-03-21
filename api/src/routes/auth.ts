import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db';
import { generateToken, authMiddleware, AuthRequest, AuthUser } from '../middleware/auth';

const router = Router();

// In-memory store for device codes (Phase 1 only)
const deviceCodes = new Map<string, { userCode: string; expiresAt: number; approved: boolean }>();

// POST /auth/device-code - Start device auth flow
router.post('/device-code', (_req, res: Response) => {
  const deviceCode = uuidv4();
  const userCode = Math.random().toString(36).substring(2, 8).toUpperCase();

  deviceCodes.set(deviceCode, {
    userCode,
    expiresAt: Date.now() + 600000, // 10 minutes
    approved: true, // Auto-approve in Phase 1
  });

  res.json({
    data: {
      device_code: deviceCode,
      user_code: userCode,
      verification_uri: 'http://localhost:3000/auth/verify',
      expires_in: 600,
      interval: 5,
    },
  });
});

// POST /auth/token - Exchange device code for access token
router.post('/token', (req, res: Response) => {
  const { device_code, grant_type } = req.body;

  if (grant_type && grant_type !== 'urn:ietf:params:oauth:grant-type:device_code') {
    res.status(400).json({
      error: { code: 'UNSUPPORTED_GRANT_TYPE', message: 'Only device_code grant type is supported' },
    });
    return;
  }

  if (!device_code) {
    res.status(400).json({
      error: { code: 'MISSING_DEVICE_CODE', message: 'device_code is required' },
    });
    return;
  }

  const entry = deviceCodes.get(device_code);

  if (!entry) {
    res.status(400).json({
      error: { code: 'INVALID_DEVICE_CODE', message: 'Device code not found or expired' },
    });
    return;
  }

  if (Date.now() > entry.expiresAt) {
    deviceCodes.delete(device_code);
    res.status(400).json({
      error: { code: 'EXPIRED_TOKEN', message: 'Device code has expired' },
    });
    return;
  }

  if (!entry.approved) {
    res.status(428).json({
      error: { code: 'AUTHORIZATION_PENDING', message: 'User has not yet approved' },
    });
    return;
  }

  // Get the demo user from DB
  const db = getDb();
  const user = db.prepare('SELECT id, email, name, org_id FROM users LIMIT 1').get() as {
    id: string; email: string; name: string; org_id: string;
  } | undefined;

  if (!user) {
    res.status(500).json({
      error: { code: 'NO_USER', message: 'No user found in database' },
    });
    return;
  }

  const authUser: AuthUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    orgId: user.org_id,
  };

  const token = generateToken(authUser);
  deviceCodes.delete(device_code);

  res.json({
    data: {
      access_token: token,
      token_type: 'Bearer',
      expires_in: 86400,
      user: authUser,
    },
  });
});

// GET /auth/me - Get current user
router.get('/me', authMiddleware, (req: AuthRequest, res: Response) => {
  const db = getDb();
  const user = db.prepare(
    'SELECT u.id, u.email, u.name, u.org_id, u.created_at, o.name as org_name FROM users u JOIN organizations o ON u.org_id = o.id WHERE u.id = ?'
  ).get(req.user!.id) as Record<string, unknown> | undefined;

  if (!user) {
    res.status(404).json({
      error: { code: 'USER_NOT_FOUND', message: 'User not found' },
    });
    return;
  }

  res.json({
    data: {
      id: user.id,
      email: user.email,
      name: user.name,
      org_id: user.org_id,
      org_name: user.org_name,
      created_at: user.created_at,
    },
  });
});

export default router;
