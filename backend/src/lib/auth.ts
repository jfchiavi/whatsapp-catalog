import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
//import { Role } from '@prisma/client';
import { Role } from '@prisma/client';

const ACCESS_TOKEN_EXPIRES = '60m';
const REFRESH_TOKEN_EXPIRES = '7d';

export const hashPassword = async (password: string) => {
  return bcrypt.hash(password, 10);
};

export const comparePassword = async (
  password: string,
  hashedPassword: string
) => {
  return bcrypt.compare(password, hashedPassword);
};

export const generateAccessToken = (payload: {
  userId: string;
  role: Role;
  tenantId: string; // <-- Línea agregada
  branchId?: string | null;
}) => {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET!, {
    expiresIn: ACCESS_TOKEN_EXPIRES,
  });
};

export const generateRefreshToken = (payload: { userId: string }) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: REFRESH_TOKEN_EXPIRES,
  });
};

export const verifyAccessToken = (token: string) => {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as {
    userId: string;
    role: Role;
    tenantId: string; // <-- Línea agregada
    branchId?: string | null;
  };
};

export const verifyRefreshToken = (token: string) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as {
    userId: string;
  };
};
