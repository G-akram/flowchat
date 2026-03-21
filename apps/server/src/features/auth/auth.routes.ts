import { Router, type Router as ExpressRouter } from 'express';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import { authRateLimit } from '../../middleware/rate-limit';
import { loginSchema, registerSchema } from './auth.schemas';
import {
  loginHandler,
  registerHandler,
  refreshHandler,
  logoutHandler,
  meHandler,
} from './auth.controller';

const router: ExpressRouter = Router();

router.post('/login', authRateLimit, validate({ body: loginSchema }), loginHandler);
router.post('/register', authRateLimit, validate({ body: registerSchema }), registerHandler);
router.post('/refresh', refreshHandler);
router.post('/logout', logoutHandler);
router.get('/me', authenticate, meHandler);

export { router as authRouter };
