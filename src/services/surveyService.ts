import { getDbConnection } from '../config/database';
import { HttpError } from '../types';

export class SurveyService {
  static async listOpen(viewerUserId?: number | null) {
    const db = await getDbConnection();
    const [rows]: any = await db.query(
      `SELECT s.id, s.title, s.description, s.status, s.district_id, s.starts_at, s.ends_at, s.created_at,
              (SELECT COUNT(*) FROM tblSurvey_questions q WHERE q.survey_id = s.id) AS question_count,
              EXISTS(
                SELECT 1 FROM tblSurvey_answers a WHERE a.survey_id = s.id AND a.user_id = ?
              ) AS already_answered
       FROM tblSurveys s
       WHERE s.status = 'OPEN'
         AND (s.starts_at IS NULL OR s.starts_at <= NOW())
         AND (s.ends_at IS NULL OR s.ends_at >= NOW())
       ORDER BY s.created_at DESC`,
      [viewerUserId || 0]
    );

    return rows.map((r: any) => ({
      ...r,
      already_answered: Boolean(r.already_answered),
      question_count: Number(r.question_count) || 0,
    }));
  }

  static async getWithQuestions(surveyId: number, viewerUserId?: number | null) {
    const db = await getDbConnection();
    const [surveys]: any = await db.query('SELECT * FROM tblSurveys WHERE id = ? LIMIT 1', [surveyId]);
    if (!surveys[0]) throw new HttpError(404, 'Survey not found', 'NOT_FOUND');

    const [questions]: any = await db.query(
      `SELECT id, survey_id, question_text, question_type, display_order, is_required
       FROM tblSurvey_questions WHERE survey_id = ? ORDER BY display_order ASC, id ASC`,
      [surveyId]
    );

    const qIds = questions.map((q: any) => q.id);
    let options: any[] = [];
    if (qIds.length) {
      const [optRows]: any = await db.query(
        `SELECT id, question_id, option_text, display_order
         FROM tblSurvey_options WHERE question_id IN (?)
         ORDER BY display_order ASC, id ASC`,
        [qIds]
      );
      options = optRows;
    }

    const questionsWithOptions = questions.map((q: any) => ({
      ...q,
      is_required: Boolean(q.is_required),
      options: options.filter((o) => o.question_id === q.id),
    }));

    let alreadyAnswered = false;
    if (viewerUserId) {
      const [ans]: any = await db.query(
        'SELECT id FROM tblSurvey_answers WHERE survey_id = ? AND user_id = ? LIMIT 1',
        [surveyId, viewerUserId]
      );
      alreadyAnswered = Boolean(ans[0]);
    }

    return {
      ...surveys[0],
      already_answered: alreadyAnswered,
      questions: questionsWithOptions,
    };
  }

  static async create(userId: number, data: any) {
    const title = String(data.title || '').trim();
    if (!title) throw new HttpError(400, 'Survey title is required', 'VALIDATION_ERROR');
    const questions = Array.isArray(data.questions) ? data.questions : [];
    if (!questions.length) throw new HttpError(400, 'At least one question is required', 'VALIDATION_ERROR');

    const db = await getDbConnection();
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      const [result]: any = await conn.query(
        `INSERT INTO tblSurveys (title, description, status, district_id, created_by, starts_at, ends_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          title,
          data.description || null,
          data.status === 'DRAFT' ? 'DRAFT' : 'OPEN',
          data.district_id ? Number(data.district_id) : null,
          userId,
          data.starts_at || null,
          data.ends_at || null,
        ]
      );
      const surveyId = result.insertId;

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const qText = String(q.question_text || '').trim();
        if (!qText) continue;
        const qType = ['SINGLE', 'MULTI', 'TEXT'].includes(q.question_type) ? q.question_type : 'SINGLE';
        const [qRes]: any = await conn.query(
          `INSERT INTO tblSurvey_questions (survey_id, question_text, question_type, display_order, is_required)
           VALUES (?, ?, ?, ?, ?)`,
          [surveyId, qText, qType, i, q.is_required === false ? 0 : 1]
        );

        if (qType !== 'TEXT' && Array.isArray(q.options)) {
          for (let j = 0; j < q.options.length; j++) {
            const opt = String(q.options[j]?.option_text || q.options[j] || '').trim();
            if (!opt) continue;
            await conn.query(
              `INSERT INTO tblSurvey_options (question_id, option_text, display_order) VALUES (?, ?, ?)`,
              [qRes.insertId, opt, j]
            );
          }
        }
      }

      await conn.commit();
      return this.getWithQuestions(surveyId);
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  static async submitAnswers(surveyId: number, userId: number, answers: any[]) {
    const survey = await this.getWithQuestions(surveyId, userId);
    if (survey.status !== 'OPEN') throw new HttpError(400, 'Survey is not open', 'VALIDATION_ERROR');
    if (survey.already_answered) throw new HttpError(400, 'You already answered this survey', 'VALIDATION_ERROR');
    if (!Array.isArray(answers) || !answers.length) {
      throw new HttpError(400, 'Answers are required', 'VALIDATION_ERROR');
    }

    const db = await getDbConnection();
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      for (const q of survey.questions) {
        const ans = answers.find((a) => Number(a.question_id) === Number(q.id));
        if (q.is_required && !ans) {
          throw new HttpError(400, `Question required: ${q.question_text}`, 'VALIDATION_ERROR');
        }
        if (!ans) continue;

        if (q.question_type === 'TEXT') {
          const text = String(ans.text_answer || '').trim();
          if (q.is_required && !text) {
            throw new HttpError(400, `Answer required: ${q.question_text}`, 'VALIDATION_ERROR');
          }
          await conn.query(
            `INSERT INTO tblSurvey_answers (survey_id, question_id, user_id, text_answer) VALUES (?, ?, ?, ?)`,
            [surveyId, q.id, userId, text || null]
          );
        } else if (q.question_type === 'MULTI') {
          const optionIds = Array.isArray(ans.option_ids) ? ans.option_ids : [ans.option_id].filter(Boolean);
          if (q.is_required && !optionIds.length) {
            throw new HttpError(400, `Answer required: ${q.question_text}`, 'VALIDATION_ERROR');
          }
          for (const oid of optionIds) {
            await conn.query(
              `INSERT INTO tblSurvey_answers (survey_id, question_id, user_id, option_id) VALUES (?, ?, ?, ?)`,
              [surveyId, q.id, userId, Number(oid)]
            );
          }
        } else {
          const optionId = Number(ans.option_id);
          if (q.is_required && !optionId) {
            throw new HttpError(400, `Answer required: ${q.question_text}`, 'VALIDATION_ERROR');
          }
          if (optionId) {
            await conn.query(
              `INSERT INTO tblSurvey_answers (survey_id, question_id, user_id, option_id) VALUES (?, ?, ?, ?)`,
              [surveyId, q.id, userId, optionId]
            );
          }
        }
      }

      await conn.commit();
      return { survey_id: surveyId, submitted: true };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  static async updateStatus(surveyId: number, status: string) {
    if (!['DRAFT', 'OPEN', 'CLOSED'].includes(status)) {
      throw new HttpError(400, 'Invalid survey status', 'VALIDATION_ERROR');
    }
    const db = await getDbConnection();
    const [rows]: any = await db.query('SELECT id FROM tblSurveys WHERE id = ? LIMIT 1', [surveyId]);
    if (!rows[0]) throw new HttpError(404, 'Survey not found', 'NOT_FOUND');
    await db.query('UPDATE tblSurveys SET status = ? WHERE id = ?', [status, surveyId]);
    return this.getWithQuestions(surveyId);
  }
}
