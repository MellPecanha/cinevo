import type { Request, Response } from 'express';

import {
  createSession,
  getSessionById,
  listSessions,
} from '../services/session.service.js';

export async function getSessions(
  _req: Request,
  res: Response,
) {
  const sessions = await listSessions();

  res.json(sessions);
}

export async function getSession(
  req: Request,
  res: Response,
) {
  const sessionId = Number(req.params.id);

  const session = await getSessionById(sessionId);

  if (!session) {
    res.status(404).json({
      message: 'Sessão não encontrada',
    });

    return;
  }

  res.json(session);
}

export async function postSession(
  req: Request,
  res: Response,
) {
  const session = await createSession(req.body);

  res.status(201).json(session);
}
