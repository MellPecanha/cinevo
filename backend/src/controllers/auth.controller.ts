import type { Request, Response } from 'express';

import {
  getAuthenticatedUser,
  login,
} from '../services/auth.service.js';

export async function postLogin(
  req: Request,
  res: Response,
) {
  const result = await login(req.body);

  res.json(result);
}

export async function getMe(
  req: Request,
  res: Response,
) {
  if (!req.user) {
    res.status(401).json({
      message: 'Usuário não autenticado',
    });
    return;
  }

  const user = await getAuthenticatedUser(req.user.sub);

  if (!user) {
    res.status(404).json({
      message: 'Usuário não encontrado',
    });
    return;
  }

  res.json(user);
}
