import { db } from '../prisma/db.js';

import type {
  CreateSessionDTO,
} from '../dtos/session.dto.js';

export async function listSessions() {
  return db.orm.public.Session
    .include('movie')
    .include('room')
    .where({ isActive: true })
    .all();
}

export async function deactivateSession(sessionId: number) {
  return db.orm.public.Session.where({ id: sessionId }).update({ isActive: false });
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
  const movie = await db.orm.public.Movie
    .where({ id: data.movieId })
    .first();

  if (!movie) {
    throw new Error('Filme não encontrado');
  }

  const startsAt = new Date(data.startsAt);
  const recurrenceUntil = data.recurrenceUntil ? new Date(data.recurrenceUntil) : null;

  if (recurrenceUntil && recurrenceUntil < startsAt) {
    throw new Error('A data final da recorrência deve ser posterior ao início');
  }

  if (recurrenceUntil && recurrenceUntil.getTime() - startsAt.getTime() > 90 * 24 * 60 * 60 * 1000) {
    throw new Error('A recorrência pode abranger no máximo 90 dias');
  }

  const occurrenceStarts = [startsAt];
  const recurrenceDays = new Set(data.recurrenceDays ?? []);

  if (recurrenceUntil) {
    const cursor = new Date(startsAt);
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    while (cursor <= recurrenceUntil) {
      if (recurrenceDays.has(cursor.getUTCDay())) occurrenceStarts.push(new Date(cursor));
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
  }

  const occurrences = occurrenceStarts.map((occurrenceStart) => ({
    startsAt: occurrenceStart.toISOString(),
    endsAt: new Date(occurrenceStart.getTime() + movie.duration * 60 * 1000).toISOString(),
  }));

  const conflictingSessions = await db.orm.public.Session
    .where({
      roomId: data.roomId,
    })
    .all();

  const hasConflict = occurrences.some((occurrence) => conflictingSessions.some((session) => occurrence.startsAt < session.endsAt && occurrence.endsAt > session.startsAt));

  if (hasConflict) {
    throw new Error(
      'A sala já possui uma sessão neste horário',
    );
  }

  return db.transaction(async (tx) => Promise.all(occurrences.map((occurrence) => tx.orm.public.Session.create({
    movieId: data.movieId,
    roomId: data.roomId,
    startsAt: occurrence.startsAt,
    endsAt: occurrence.endsAt,
    price: data.price.toFixed(2),
  }))));
}
