import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import db from '../config/database';
import { requireAuth } from '../middleware/auth';
import { Survey, SurveyWithCount, Submission, SubmissionRow } from '../types';

const router = Router();

const generateCode = (): string => {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
};

// Check auth status
router.get('/check-auth', (req: Request, res: Response): void => {
  res.json({ success: true, data: { authenticated: !!req.session?.isAdmin } });
});

// Login
router.post('/login', (req: Request, res: Response): void => {
  const { password } = req.body as { password: string };

  if (password === process.env.ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, error: 'Invalid password' });
  }
});

// Logout
router.post('/logout', (req: Request, res: Response): void => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

// Get all surveys
router.get('/surveys', requireAuth, (req: Request, res: Response): void => {
  const surveys = db
    .prepare(
      `SELECT s.*, COUNT(sub.id) as submission_count
       FROM surveys s
       LEFT JOIN submissions sub ON s.id = sub.survey_id
       GROUP BY s.id
       ORDER BY s.created_at DESC`
    )
    .all() as SurveyWithCount[];

  res.json({ success: true, data: surveys });
});

// Create survey
router.post('/surveys', requireAuth, (req: Request, res: Response): void => {
  const { name } = req.body as { name: string };

  if (!name?.trim()) {
    res.status(400).json({ success: false, error: 'Survey name is required' });
    return;
  }

  const code = generateCode();

  try {
    const result = db
      .prepare('INSERT INTO surveys (code, name) VALUES (?, ?)')
      .run(code, name.trim());

    const survey = db
      .prepare('SELECT * FROM surveys WHERE id = ?')
      .get(result.lastInsertRowid) as Survey;

    res.json({ success: true, data: survey });
  } catch (error) {
    console.error('Error creating survey:', error);
    res.status(500).json({ success: false, error: 'Failed to create survey' });
  }
});

// Delete survey
router.delete(
  '/surveys/:id',
  requireAuth,
  (req: Request, res: Response): void => {
    const { id } = req.params;

    try {
      db.prepare('DELETE FROM surveys WHERE id = ?').run(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting survey:', error);
      res.status(500).json({ success: false, error: 'Failed to delete survey' });
    }
  }
);

// Get submissions for survey
router.get(
  '/surveys/:id/submissions',
  requireAuth,
  (req: Request, res: Response): void => {
    const { id } = req.params;

    const rows = db
      .prepare(
        'SELECT * FROM submissions WHERE survey_id = ? ORDER BY created_at DESC'
      )
      .all(id) as SubmissionRow[];

    const submissions: Submission[] = rows.map((row) => ({
      ...row,
      unavailable_dates: JSON.parse(row.unavailable_dates),
    }));

    res.json({ success: true, data: submissions });
  }
);

// Reset all submissions for survey
router.delete(
  '/surveys/:id/submissions',
  requireAuth,
  (req: Request, res: Response): void => {
    const { id } = req.params;

    try {
      db.prepare('DELETE FROM submissions WHERE survey_id = ?').run(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error resetting submissions:', error);
      res.status(500).json({ success: false, error: 'Failed to reset' });
    }
  }
);

// Delete single submission
router.delete(
  '/submissions/:id',
  requireAuth,
  (req: Request, res: Response): void => {
    const { id } = req.params;

    try {
      db.prepare('DELETE FROM submissions WHERE id = ?').run(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting submission:', error);
      res.status(500).json({ success: false, error: 'Failed to delete' });
    }
  }
);

export default router;
