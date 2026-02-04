import { Request, Response, NextFunction } from 'express';

export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (req.session?.isAdmin) {
    next();
    return;
  }
  res.status(401).json({ success: false, error: 'Unauthorized' });
};
