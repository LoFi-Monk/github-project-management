import { afterAll } from 'vitest';
import { closeDb } from '../src/db/client';

afterAll(async () => {
  await closeDb();
});
