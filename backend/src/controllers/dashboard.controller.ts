import type { Request, Response } from 'express';

import { getDashboardMetrics } from '../services/dashboard.service.js';

export async function getDashboard(
  _req: Request,
  res: Response,
) {
  res.json(await getDashboardMetrics());
}
