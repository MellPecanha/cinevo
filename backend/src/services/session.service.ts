import { db } from '../prisma/db.js';

import type {
  CreateSessionDTO,
} from '../dtos/session.dto.js';

export async function listSessions() {
  return db.orm.public.Session
    .include('movie')
    .include('room')
    .all();
}

export async function getSessionById(sessionId: number) {
  return db.orm.public.Session
    .include('movie')
    .include('room')
    .where({
      id: sessionId,
    })
    .first();
}

export async function createSession(
  data: CreateSessionDTO,
) {
  if (data.endsAt <= data.startsAt) {
    throw new Error(
      'O horário de término deve ser posterior ao horário de início',
    );
  }

  const conflictingSessions = await db.orm.public.Session
    .where({
      roomId: data.roomId,
    })
    .all();

  const hasConflict = conflictingSessions.some((session) => {
    return (
      data.startsAt < session.endsAt &&
      data.endsAt > session.startsAt
    );
  });

  if (hasConflict) {
    throw new Error(
      'A sala já possui uma sessão neste horário',
    );
  }

  return db.orm.public.Session.create({
    movieId: data.movieId,
    roomId: data.roomId,
    startsAt: data.startsAt,
    endsAt: data.endsAt,
    price: data.price.toFixed(2),
  });
}
