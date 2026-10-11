import { describe, expect, it } from 'vitest';

import { generateSeatsSchema } from '../src/schemas/seat.schema.js';

describe('planta de assentos', () => {
  it('aceita uma quantidade diferente de assentos em cada fileira', () => {
    const layout = generateSeatsSchema.parse({
      rowSeats: [8, 10, 10, 8],
      accessibleSeats: ['A01'],
      vipSeats: ['C10'],
    });

    expect(layout.rowSeats).toEqual([8, 10, 10, 8]);
  });

  it('rejeita marcações para assentos que não existem na planta', () => {
    const result = generateSeatsSchema.safeParse({
      rowSeats: [8, 6],
      accessibleSeats: ['B07'],
      vipSeats: [],
    });

    expect(result.success).toBe(false);
  });
});
