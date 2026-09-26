import QRCode from 'qrcode';

import { db } from '../prisma/db.js';

export async function getTicketQrCode(
  userId: number,
  ticketCode: string,
) {
  const ticket = await db.orm.public.Ticket
    .include('order')
    .where({ code: ticketCode })
    .first();

  if (
    !ticket ||
    ticket.order.userId !== userId ||
    ticket.status !== 'ACTIVE'
  ) {
    throw new Error('Ingresso não encontrado');
  }

  const payload = `CINEVO:TICKET:${ticket.code}`;

  const qrCodeDataUrl = await QRCode.toDataURL(payload, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 300,
  });

  return {
    ticketCode: ticket.code,
    qrCodeDataUrl,
  };
}
