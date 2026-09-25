import type { Request, Response } from 'express';

import { login } from '../services/auth.service.js';

export async function postLogin(
  req: Request,
  res: Response,
) {
  const result = await login(req.body);

  res.json(result);
}
