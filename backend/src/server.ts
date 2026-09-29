import 'dotenv/config';
import { app } from './app.js';
import { expireSeatHolds } from './services/seat-hold.service.js';

const PORT = Number(process.env.PORT ?? 3333);
const HOLD_EXPIRATION_INTERVAL_MS = 60 * 1000;

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) {
  throw new Error('JWT_SECRET deve estar configurado e ter ao menos 16 caracteres');
}

function runSeatHoldExpiration() {
  void expireSeatHolds().catch((error) => {
    console.error(JSON.stringify({ level: 'error', event: 'seat_hold_expiration_failed', error: error instanceof Error ? error.message : 'unknown' }));
  });
}

runSeatHoldExpiration();

const expirationTimer = setInterval(
  runSeatHoldExpiration,
  HOLD_EXPIRATION_INTERVAL_MS,
);

expirationTimer.unref();

app.listen(PORT, () => {
  console.log(JSON.stringify({ level: 'info', event: 'api_started', port: PORT, environment: process.env.NODE_ENV ?? 'development' }));
});
