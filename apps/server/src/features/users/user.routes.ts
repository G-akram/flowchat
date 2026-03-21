import { Router, type Router as ExpressRouter } from 'express';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import {
  userParamsSchema,
  updateProfileSchema,
  workspacePresenceParamsSchema,
} from './user.schemas';
import {
  getMeHandler,
  updateMeHandler,
  getUserHandler,
  getWorkspacePresenceHandler,
} from './user.controller';

const router: ExpressRouter = Router();

router.use(authenticate);

router.get('/me', getMeHandler);
router.patch('/me', validate({ body: updateProfileSchema }), updateMeHandler);
router.get('/:userId', validate({ params: userParamsSchema }), getUserHandler);

export { router as userRouter };

const presenceRouter: ExpressRouter = Router({ mergeParams: true });

presenceRouter.use(authenticate);

presenceRouter.get(
  '/',
  validate({ params: workspacePresenceParamsSchema }),
  getWorkspacePresenceHandler
);

export { presenceRouter };
