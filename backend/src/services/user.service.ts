import bcrypt from 'bcrypt';

import { db } from '../prisma/db.js';

import type {
  CreateUserDTO,
} from '../dtos/user.dto.js';

export async function listUsers() {
  const users = await db.orm.public.User.all();

  return users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }));
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
