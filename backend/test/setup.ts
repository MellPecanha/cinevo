const databaseUrl = process.env.DATABASE_URL_TEST;

if (!databaseUrl) {
  throw new Error(
    'DATABASE_URL_TEST deve apontar para o banco exclusivo dos testes',
  );
}

process.env.DATABASE_URL = databaseUrl;
process.env.JWT_SECRET ??= 'cinevo-test-secret';
