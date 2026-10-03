"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const memberController_1 = require("../controllers/memberController");
const router = (0, express_1.Router)();
router.get('/:token', memberController_1.verifyMemberByToken);
exports.default = router;
