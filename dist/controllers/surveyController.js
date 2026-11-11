"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listSurveys = listSurveys;
exports.getSurvey = getSurvey;
exports.createSurvey = createSurvey;
exports.submitSurvey = submitSurvey;
exports.updateSurveyStatus = updateSurveyStatus;
const surveyService_1 = require("../services/surveyService");
const response_1 = require("../utils/response");
async function listSurveys(req, res, next) {
    try {
        return (0, response_1.sendSuccess)(res, 'Surveys retrieved', await surveyService_1.SurveyService.listOpen(req.user?.id || null));
    }
    catch (err) {
        next(err);
    }
}
async function getSurvey(req, res, next) {
    try {
        return (0, response_1.sendSuccess)(res, 'Survey retrieved', await surveyService_1.SurveyService.getWithQuestions(Number(req.params.id), req.user?.id || null));
    }
    catch (err) {
        next(err);
    }
}
async function createSurvey(req, res, next) {
    try {
        return (0, response_1.sendSuccess)(res, 'Survey created', await surveyService_1.SurveyService.create(req.user.id, req.body), 201);
    }
    catch (err) {
        next(err);
    }
}
async function submitSurvey(req, res, next) {
    try {
        return (0, response_1.sendSuccess)(res, 'Survey submitted', await surveyService_1.SurveyService.submitAnswers(Number(req.params.id), req.user.id, req.body.answers || []));
    }
    catch (err) {
        next(err);
    }
}
async function updateSurveyStatus(req, res, next) {
    try {
        return (0, response_1.sendSuccess)(res, 'Survey updated', await surveyService_1.SurveyService.updateStatus(Number(req.params.id), String(req.body.status || '')));
    }
    catch (err) {
        next(err);
    }
}
