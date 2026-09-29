import bcrypt from 'bcrypt';

import { db } from '../prisma/db.js';

import type {
  CreateUserDTO,
} from '../dtos/user.dto.js';

type UserRole = 'CUSTOMER' | 'CINEMA_ADMIN' | 'PLATFORM_ADMIN';

function safeUser(user: { id: number; name: string; email: string; phone: string | null; role: UserRole; createdAt: string; updatedAt: string }) {
  return { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, createdAt: user.createdAt, updatedAt: user.updatedAt };
}

export async function listUsers() {
  const users = await db.orm.public.User.all();

  return users.map(safeUser);
}

export async function updateUserRole(userId: number, role: UserRole, actorId: number) {
  if (userId === actorId && role !== 'PLATFORM_ADMIN') throw new Error('Você não pode remover sua própria permissão de plataforma');
  const user = await db.orm.public.User.where({ id: userId }).first();
  if (!user) throw new Error('Usuário não encontrado');
  const updated = await db.orm.public.User.where({ id: userId }).update({ role });
  if (!updated) throw new Error('Não foi possível atualizar o usuário');
  return safeUser(updated);
}

export async function createUser(
  data: CreateUserDTO,
) {
  const existingUser = await db.orm.public.User
    .where({
      email: data.email,
    })
    .first();

  if (existingUser) {
    throw new Error(
      'Já existe um usuário com este e-mail',
    );
  }

  const passwordHash = await bcrypt.hash(
    data.password,
    12,
  );

  const user = await db.orm.public.User.create({
    name: data.name,
    email: data.email,
    phone: data.phone,
    passwordHash,
  });

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
