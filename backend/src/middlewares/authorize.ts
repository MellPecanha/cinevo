import type {
  NextFunction,
  Request,
  Response,
} from 'express';

type UserRole =
  | 'CUSTOMER'
  | 'CINEMA_ADMIN'
  | 'PLATFORM_ADMIN';

export function authorize(...allowedRoles: UserRole[]) {
  return (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    if (!req.user) {
      res.status(401).json({
        message: 'Usuário não autenticado',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        message: 'Usuário não possui permissão para esta operação',
      });
      return;
    }

    next();
  };
}
