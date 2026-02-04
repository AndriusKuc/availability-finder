import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import db from '../config/database';
import { Survey, Submission, SubmissionRow } from '../types';

const router = Router();

// Get survey by code
router.get('/:code', (req: Request, res: Response): void => {
  const { code } = req.params;

  const survey = db
    .prepare('SELECT * FROM surveys WHERE code = ?')
    .get(code.toUpperCase()) as Survey | undefined;

  if (!survey) {
    res.status(404).json({ success: false, error: 'Survey not found' });
    return;
  }

  res.json({ success: true, data: survey });
});

// Check if name exists for survey
router.get('/:code/check-name/:name', (req: Request, res: Response): void => {
  const { code, name } = req.params;

  const survey = db
    .prepare('SELECT id FROM surveys WHERE code = ?')
    .get(code.toUpperCase()) as { id: number } | undefined;

  if (!survey) {
    res.status(404).json({ success: false, error: 'Survey not found' });
    return;
  }

  const submission = db
    .prepare(
      'SELECT id FROM submissions WHERE survey_id = ? AND person_name = ? COLLATE NOCASE'
    )
    .get(survey.id, name.trim()) as { id: number } | undefined;

  res.json({ success: true, data: { exists: !!submission } });
});

// Submit availability
router.post('/:code/submit', (req: Request, res: Response): void => {
  const { code } = req.params;
  const { personName, unavailableDates } = req.body as {
    personName: string;
    unavailableDates: string[];
  };

  if (!personName?.trim()) {
    res.status(400).json({ success: false, error: 'Name is required' });
    return;
  }

  const survey = db
    .prepare('SELECT id FROM surveys WHERE code = ?')
    .get(code.toUpperCase()) as { id: number } | undefined;

  if (!survey) {
    res.status(404).json({ success: false, error: 'Survey not found' });
    return;
  }

  const existing = db
    .prepare(
      'SELECT id FROM submissions WHERE survey_id = ? AND person_name = ? COLLATE NOCASE'
    )
    .get(survey.id, personName.trim()) as { id: number } | undefined;

  if (existing) {
    res.status(409).json({
      success: false,
      error:
        'You have already submitted your availability. Contact the admin to make changes.',
    });
    return;
  }

  try {
    const editToken = randomUUID();
    db.prepare(
      'INSERT INTO submissions (survey_id, person_name, unavailable_dates, edit_token) VALUES (?, ?, ?, ?)'
    ).run(survey.id, personName.trim(), JSON.stringify(unavailableDates || []), editToken);

    res.json({ success: true, data: { editToken } });
  } catch (error) {
    console.error('Error submitting availability:', error);
    res.status(500).json({ success: false, error: 'Failed to submit' });
  }
});

// Get submission by edit token (for editing)
router.get('/edit/:token', (req: Request, res: Response): void => {
  const { token } = req.params;

  const row = db
    .prepare(`
      SELECT s.*, sv.name as survey_name, sv.code as survey_code,
             sv.start_date, sv.end_date
      FROM submissions s
      JOIN surveys sv ON s.survey_id = sv.id
      WHERE s.edit_token = ?
    `)
    .get(token) as (SubmissionRow & { survey_name: string; survey_code: string; start_date: string; end_date: string }) | undefined;

  if (!row) {
    res.status(404).json({ success: false, error: 'Submission not found' });
    return;
  }

  const submission: Submission & { survey_name: string; survey_code: string; start_date: string; end_date: string } = {
    ...row,
    unavailable_dates: JSON.parse(row.unavailable_dates),
  };

  res.json({ success: true, data: submission });
});

// Update submission by edit token
router.put('/edit/:token', (req: Request, res: Response): void => {
  const { token } = req.params;
  const { unavailableDates } = req.body as { unavailableDates: string[] };

  const existing = db
    .prepare('SELECT id FROM submissions WHERE edit_token = ?')
    .get(token) as { id: number } | undefined;

  if (!existing) {
    res.status(404).json({ success: false, error: 'Submission not found' });
    return;
  }

  try {
    db.prepare('UPDATE submissions SET unavailable_dates = ? WHERE edit_token = ?')
      .run(JSON.stringify(unavailableDates || []), token);

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating submission:', error);
    res.status(500).json({ success: false, error: 'Failed to update' });
  }
});

export default router;
