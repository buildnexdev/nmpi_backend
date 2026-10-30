import { Response, NextFunction } from 'express';
import { SurveyService } from '../services/surveyService';
import { sendSuccess } from '../utils/response';
import { AuthRequest } from '../types';

export async function listSurveys(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    return sendSuccess(res, 'Surveys retrieved', await SurveyService.listOpen(req.user?.id || null));
  } catch (err) {
    next(err);
  }
}

export async function getSurvey(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    return sendSuccess(
      res,
      'Survey retrieved',
      await SurveyService.getWithQuestions(Number(req.params.id), req.user?.id || null)
    );
  } catch (err) {
    next(err);
  }
}

export async function createSurvey(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    return sendSuccess(res, 'Survey created', await SurveyService.create(req.user!.id, req.body), 201);
  } catch (err) {
    next(err);
  }
}

export async function submitSurvey(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    return sendSuccess(
      res,
      'Survey submitted',
      await SurveyService.submitAnswers(Number(req.params.id), req.user!.id, req.body.answers || [])
    );
  } catch (err) {
    next(err);
  }
}

export async function updateSurveyStatus(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    return sendSuccess(
      res,
      'Survey updated',
      await SurveyService.updateStatus(Number(req.params.id), String(req.body.status || ''))
    );
  } catch (err) {
    next(err);
  }
}
