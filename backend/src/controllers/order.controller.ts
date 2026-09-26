import type { Request, Response } from 'express';

import {
  createOrder,
} from '../services/order.service.js';
import {
  payOrder,
} from '../services/payment.service.js';

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

  try {
    const order = await createOrder(
      req.user.sub,
      req.body,
    );

    res.status(201).json(order);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Não foi possível criar o pedido';

    res.status(400).json({
      message,
    });
  }
}

export async function postPayOrder(
  req: Request,
  res: Response,
) {
  if (!req.user) {
    res.status(401).json({
      message: 'Usuário não autenticado',
    });
    return;
  }

  const orderId = Number(req.params.id);

  if (!Number.isSafeInteger(orderId) || orderId <= 0) {
    res.status(400).json({
      message: 'Pedido inválido',
    });
    return;
  }

  try {
    const payment = await payOrder(
      req.user.sub,
      orderId,
    );

    res.json(payment);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Não foi possível realizar o pagamento';

    res.status(400).json({
      message,
    });
  }
}
