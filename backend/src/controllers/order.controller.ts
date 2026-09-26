import type { Request, Response } from 'express';

import {
  createOrder,
  getOrderById,
  listOrdersByUser,
  listTicketsByUser,
} from '../services/order.service.js';
import {
  payOrder,
} from '../services/payment.service.js';
import {
  cancelOrder,
} from '../services/cancellation.service.js';

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

function getOrderId(value: string | string[] | undefined) {
  if (typeof value !== 'string') {
    return null;
  }

  const orderId = Number(value);

  return Number.isSafeInteger(orderId) && orderId > 0
    ? orderId
    : null;
}

export async function getOrders(
  req: Request,
  res: Response,
) {
  if (!req.user) {
    res.status(401).json({
      message: 'Usuário não autenticado',
    });
    return;
  }

  const orders = await listOrdersByUser(req.user.sub);

  res.json(orders);
}

export async function getOrder(
  req: Request,
  res: Response,
) {
  if (!req.user) {
    res.status(401).json({
      message: 'Usuário não autenticado',
    });
    return;
  }

  const orderId = getOrderId(req.params.id);

  if (!orderId) {
    res.status(400).json({
      message: 'Pedido inválido',
    });
    return;
  }

  const order = await getOrderById(req.user.sub, orderId);

  if (!order) {
    res.status(404).json({
      message: 'Pedido não encontrado',
    });
    return;
  }

  res.json(order);
}

export async function getTickets(
  req: Request,
  res: Response,
) {
  if (!req.user) {
    res.status(401).json({
      message: 'Usuário não autenticado',
    });
    return;
  }

  const tickets = await listTicketsByUser(req.user.sub);

  res.json(tickets);
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

  const orderId = getOrderId(req.params.id);

  if (!orderId) {
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

export async function postCancelOrder(
  req: Request,
  res: Response,
) {
  if (!req.user) {
    res.status(401).json({
      message: 'Usuário não autenticado',
    });
    return;
  }

  const orderId = getOrderId(req.params.id);

  if (!orderId) {
    res.status(400).json({
      message: 'Pedido inválido',
    });
    return;
  }

  try {
    const order = await cancelOrder(
      req.user.sub,
      orderId,
    );

    res.json(order);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Não foi possível cancelar o pedido';

    res.status(400).json({
      message,
    });
  }
}
