import { app } from './app.js';

const PORT = 3333;

app.listen(PORT, () => {
  console.log(`Cinevo API running on http://localhost:${PORT}`);
});
