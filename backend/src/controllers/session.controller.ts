import type { Request, Response } from 'express';

import {
  createSession,
  listSessions,
} from '../services/session.service.js';

export async function getSessions(
  _req: Request,
  res: Response,
) {
  const sessions = await listSessions();

  res.json(sessions);
}

export async function postSession(
  req: Request,
  res: Response,
) {
  const session = await createSession(req.body);

  res.status(201).json(session);
}
