import type { Request, Response } from 'express';

import {
  createOrder,
} from '../services/order.service.js';

export async function postOrder(
  req: Request,
  res: Response,
) {
  if (!req.user) {
    res.status(401).json({
      message: 'Usuário não autenticado',
    });

    return;
  }

  const order = await createOrder(
    req.user.sub,
    req.body,
  );

  res.status(201).json(order);
}
