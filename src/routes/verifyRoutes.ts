import { Router } from 'express';
import { verifyMemberByToken } from '../controllers/memberController';

const router = Router();

router.get('/:token', verifyMemberByToken);

export default router;
