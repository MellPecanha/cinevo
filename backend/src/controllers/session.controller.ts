import type { Request, Response } from 'express';

import {
  createSession,
  deactivateSession,
  getSessionById,
  listSessions,
  updateSession,
} from '../services/session.service.js';
import { cancelSession } from '../services/session-cancellation.service.js';

export async function getSessions(
  _req: Request,
  res: Response,
) {
  const sessions = await listSessions();

  res.json(sessions);
}

export async function patchDeactivateSession(req: Request, res: Response) {
  const sessionId = Number(req.params.id);
  res.json(await deactivateSession(sessionId));
}

export async function patchCancelSession(req: Request, res: Response) {
  const sessionId = Number(req.params.id);
  res.json(await cancelSession(sessionId));
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
  const sessions = await createSession(req.body);

  res.status(201).json({ sessions });
}

export async function patchSession(req: Request, res: Response) {
  const sessionId = Number(req.params.id);

  if (!Number.isSafeInteger(sessionId) || sessionId <= 0) {
    res.status(400).json({ message: 'Sessão inválida' });
    return;
  }

  try {
    res.json(await updateSession(sessionId, req.body));
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : 'Não foi possível atualizar a sessão' });
  }
}
