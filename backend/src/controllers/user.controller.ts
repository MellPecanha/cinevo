import type { Request, Response } from 'express';

import {
  createUser,
  listUsers,
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
