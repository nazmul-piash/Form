import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma.js';
import { AuthRequest } from '../middleware/auth.js';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';
const ADMIN_KEY = process.env.ADMIN_KEY || '1924';

export const login = async (req: Request, res: Response) => {
  const { type, fullName, dateOfBirth, accessKey } = req.body;

  try {
    let user;

    // --- ADMIN LOGIN ---
    if (type === 'admin') {
      if (accessKey !== ADMIN_KEY) {
        return res.status(401).json({ error: 'Invalid Access Key' });
      }

      // Find or create the Admin user
      // We use a fixed email or identifier for the admin to keep it simple
      const adminEmail = 'admin@system.local';
      
      user = await prisma.user.findUnique({
        where: { email: adminEmail }
      });

      if (!user) {
        // Ensure organization exists
        let organization = await prisma.organization.findFirst();
        if (!organization) {
            organization = await prisma.organization.create({ data: { name: 'System Org' } });
        }

        user = await prisma.user.create({
          data: {
            email: adminEmail,
            role: 'ADMIN',
            organizationId: organization.id,
            fullName: 'System Administrator'
          }
        });
      }
    } 
    
    // --- CLIENT LOGIN ---
    else if (type === 'client') {
      if (!fullName || !dateOfBirth) {
        return res.status(400).json({ error: 'Full Name and Date of Birth are required' });
      }

      // Check if user exists with this Name + DOB
      // Since we have a composite unique constraint, we can try to find it.
      // However, Prisma findUnique requires the unique identifier.
      // We can use findFirst for now as we added @@unique([fullName, dateOfBirth])
      
      user = await prisma.user.findFirst({
        where: {
          fullName,
          dateOfBirth
        }
      });

      if (!user) {
        // Create new Client user
        let organization = await prisma.organization.findFirst();
        if (!organization) {
            organization = await prisma.organization.create({ data: { name: 'Default Org' } });
        }

        user = await prisma.user.create({
          data: {
            fullName,
            dateOfBirth,
            role: 'CLIENT',
            organizationId: organization.id,
            // Email is optional now, so we can leave it null or generate a fake one if needed
            // But schema allows null.
          }
        });
      }
    } else {
      return res.status(400).json({ error: 'Invalid login type' });
    }

    // Generate JWT
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role, 
        organizationId: user.organizationId,
        fullName: user.fullName 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ 
      token, 
      user: { 
        id: user.id, 
        email: user.email, 
        role: user.role, 
        fullName: user.fullName,
        dateOfBirth: user.dateOfBirth
      } 
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

// Register is essentially the same as Client Login now, 
// but we keep it if the frontend calls it specifically, 
// or we can just deprecate it. 
// For now, let's make it redirect to the same logic or just return error.
export const register = async (req: Request, res: Response) => {
    // Reuse login logic or just tell them to use login
    return login(req, res);
};

export const verifyMagicLink = async (req: Request, res: Response) => {
    res.status(410).json({ error: 'Magic link login is deprecated' });
};

export const me = async (req: AuthRequest, res: Response) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user?.id },
            select: { 
                id: true, 
                email: true, 
                role: true, 
                organizationId: true,
                fullName: true,
                dateOfBirth: true
            }
        });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch user' });
    }
};
