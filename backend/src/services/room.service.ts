import { db } from '../prisma/db.js';
import type { CreateRoomDTO } from '../dtos/room.dto.js';

export async function listRooms() {
  return db.orm.public.Room.all();
}

export async function createRoom(data: CreateRoomDTO) {
  return db.orm.public.Room.create({
    number: data.number,
    type: data.type,
    cinemaId: data.cinemaId,
  });
}
