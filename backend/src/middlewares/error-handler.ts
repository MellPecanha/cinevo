import type {
  ErrorRequestHandler,
  NextFunction,
  Request,
  Response,
} from 'express';

function getPublicError(error: unknown) {
  if (error instanceof Error) {
    if (error.message === 'E-mail ou senha inválidos') {
      return { status: 401, message: error.message };
    }

    if (error.message === 'Já existe um usuário com este e-mail') {
      return { status: 409, message: error.message };
    }
  }

  return {
    status: 500,
    message: 'Erro interno do servidor',
  };
}

export const errorHandler: ErrorRequestHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  const publicError = getPublicError(error);

  res.status(publicError.status).json({
    message: publicError.message,
  });
};
