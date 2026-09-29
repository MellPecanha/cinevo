import type { Request, Response } from 'express';

import {
  createUser,
  listUsers,
  updateUserRole,
} from '../services/user.service.js';

export async function getUsers(
  _req: Request,
  res: Response,
) {
  const users = await listUsers();

  res.json(users);
}

export async function postUser(
  req: Request,
  res: Response,
) {
  const user = await createUser(req.body);

  res.status(201).json(user);
}

export async function patchUserRole(req: Request, res: Response) {
  if (!req.user) return void res.status(401).json({ message: 'Usuário não autenticado' });
  const userId = Number(req.params.id);
  if (!Number.isSafeInteger(userId) || userId <= 0) return void res.status(400).json({ message: 'Usuário inválido' });
  try {
    res.json(await updateUserRole(userId, req.body.role, req.user.sub));
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : 'Não foi possível atualizar o usuário' });
  }
}
