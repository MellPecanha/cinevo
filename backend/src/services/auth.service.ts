import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import { db } from '../prisma/db.js';

import type { LoginInput } from '../schemas/auth.schema.js';

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET não configurado');
  }

  return secret;
}

export async function login(data: LoginInput) {
  const user = await db.orm.public.User
    .where({
      email: data.email,
    })
    .first();

  if (!user) {
    throw new Error('E-mail ou senha inválidos');
  }

  const passwordMatches = await bcrypt.compare(
    data.password,
    user.passwordHash,
  );

  if (!passwordMatches) {
    throw new Error('E-mail ou senha inválidos');
  }

  const token = jwt.sign(
    {
      sub: user.id,
      role: user.role,
    },
    getJwtSecret(),
    {
      expiresIn: '1h',
    },
  );

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}

export async function getAuthenticatedUser(userId: number) {
  const user = await db.orm.public.User
    .where({ id: userId })
    .first();

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    createdAt: user.createdAt,
  };
}
