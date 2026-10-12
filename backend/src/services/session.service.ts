import { db } from '../prisma/db.js';

import type {
  CreateSessionDTO,
  UpdateSessionDTO,
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

  return db.transaction(async (tx) => {
    const room = await tx.orm.public.Room
      .where({ id: data.roomId })
      .first();

    if (!room) {
      throw new Error('Sala não encontrada');
    }

    // Atualizar a própria linha da sala adquire um lock de linha no PostgreSQL.
    // Assim, criações concorrentes para a mesma sala são serializadas antes da
    // consulta de conflito e da inserção das sessões.
    await tx.orm.public.Room
      .where({ id: room.id })
      .update({ isActive: room.isActive });

    const conflictingSessions = await tx.orm.public.Session
      .where({ roomId: data.roomId })
      .all();

    const hasConflict = occurrences.some((occurrence) =>
      conflictingSessions.some((session) =>
        occurrence.startsAt < session.endsAt && occurrence.endsAt > session.startsAt,
      ),
    );

    if (hasConflict) {
      throw new Error('A sala já possui uma sessão neste horário');
    }

    return Promise.all(occurrences.map((occurrence) => tx.orm.public.Session.create({
      movieId: data.movieId,
      roomId: data.roomId,
      startsAt: occurrence.startsAt,
      endsAt: occurrence.endsAt,
      price: data.price.toFixed(2),
    })));
  });
}

export async function updateSession(sessionId: number, data: UpdateSessionDTO) {
  const session = await db.orm.public.Session.where({ id: sessionId }).first();

  if (!session) throw new Error('Sessão não encontrada');

  const [movie, room] = await Promise.all([
    db.orm.public.Movie.where({ id: data.movieId }).first(),
    db.orm.public.Room.where({ id: data.roomId }).first(),
  ]);

  if (!movie) throw new Error('Filme não encontrado');
  if (!room) throw new Error('Sala não encontrada');

  const startsAt = new Date(data.startsAt);
  const endsAt = new Date(startsAt.getTime() + movie.duration * 60 * 1000);

  await db.transaction(async (tx) => {
    await tx.orm.public.Room.where({ id: room.id }).update({ isActive: room.isActive });

    const sessionsInRoom = await tx.orm.public.Session.where({ roomId: room.id }).all();
    const hasConflict = sessionsInRoom.some((item) =>
      item.id !== sessionId && startsAt.toISOString() < item.endsAt && endsAt.toISOString() > item.startsAt,
    );

    if (hasConflict) throw new Error('A sala já possui uma sessão neste horário');

    await tx.orm.public.Session.where({ id: sessionId }).update({
      movieId: movie.id,
      roomId: room.id,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      price: data.price.toFixed(2),
    });
  });

  const updated = await getSessionById(sessionId);
  if (!updated) throw new Error('Sessão não encontrada');
  return updated;
}
