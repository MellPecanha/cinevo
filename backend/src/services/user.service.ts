import bcrypt from 'bcrypt';

import { db } from '../prisma/db.js';

import type {
  CreateUserDTO,
  UpdateProfileDTO,
} from '../dtos/user.dto.js';
import { AppError, ConflictError } from '../errors/app-error.js';

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

export async function updateProfile(userId: number, data: UpdateProfileDTO) {
  const user = await db.orm.public.User.where({ id: userId }).first();
  if (!user) throw new AppError('Usuário não encontrado', 404);

  if (data.email !== user.email) {
    const userWithEmail = await db.orm.public.User.where({ email: data.email }).first();
    if (userWithEmail) throw new ConflictError('Já existe um usuário com este e-mail');
  }

  let passwordHash = user.passwordHash;
  if (data.password) {
    const matches = await bcrypt.compare(data.currentPassword!, user.passwordHash);
    if (!matches) throw new AppError('Senha atual inválida', 401);
    passwordHash = await bcrypt.hash(data.password, 12);
  }

  const updated = await db.orm.public.User.where({ id: userId }).update({
    name: data.name,
    email: data.email,
    phone: data.phone,
    passwordHash,
  });

  if (!updated) throw new AppError('Não foi possível atualizar o perfil', 500);
  return safeUser(updated);
}
