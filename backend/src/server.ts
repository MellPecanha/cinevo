import 'dotenv/config';
import { app } from './app.js';
import { expireSeatHolds } from './services/seat-hold.service.js';

const PORT = 3334;
const HOLD_EXPIRATION_INTERVAL_MS = 60 * 1000;

function runSeatHoldExpiration() {
  void expireSeatHolds().catch((error) => {
    console.error('Não foi possível expirar as reservas de assento', error);
  });
}

runSeatHoldExpiration();

const expirationTimer = setInterval(
  runSeatHoldExpiration,
  HOLD_EXPIRATION_INTERVAL_MS,
);

expirationTimer.unref();

app.listen(PORT, () => {
  console.log(`Cinevo API running on http://localhost:${PORT}`);
});
