import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

type AuthTokenPayload = {
  sub: number;
  role: 'CUSTOMER' | 'CINEMA_ADMIN' | 'PLATFORM_ADMIN';
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthTokenPayload;
    }
  }
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET não configurado');
  }

  return secret;
}

export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authorization = req.headers.authorization;

  if (!authorization) {
    res.status(401).json({
      message: 'Token de autenticação não informado',
    });
    return;
  }

  const [scheme, token] = authorization.split(' ');

  if (scheme !== 'Bearer' || !token) {
    res.status(401).json({
      message: 'Token de autenticação inválido',
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret());

    if (typeof decoded === 'string') {
      res.status(401).json({
        message: 'Token de autenticação inválido',
      });
      return;
    }

    if (
      typeof decoded.sub !== 'string' &&
      typeof decoded.sub !== 'number'
    ) {
      res.status(401).json({
        message: 'Token de autenticação inválido',
      });
      return;
    }

    if (
      decoded.role !== 'CUSTOMER' &&
      decoded.role !== 'CINEMA_ADMIN' &&
      decoded.role !== 'PLATFORM_ADMIN'
    ) {
      res.status(401).json({
        message: 'Token de autenticação inválido',
      });
      return;
    }

    req.user = {
      sub: Number(decoded.sub),
      role: decoded.role,
    };

    next();
  } catch {
    res.status(401).json({
      message: 'Token de autenticação inválido ou expirado',
    });
  }
}
