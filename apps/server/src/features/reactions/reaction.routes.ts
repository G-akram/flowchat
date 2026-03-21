import { Router, type Router as ExpressRouter } from 'express';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import {
  reactionParamsSchema,
  removeReactionParamsSchema,
  addReactionSchema,
} from './reaction.schemas';
import {
  addReactionHandler,
  removeReactionHandler,
} from './reaction.controller';

const router: ExpressRouter = Router({ mergeParams: true });

router.use(authenticate);

router.post(
  '/',
  validate({ params: reactionParamsSchema, body: addReactionSchema }),
  addReactionHandler
);

router.delete(
  '/:emoji',
  validate({ params: removeReactionParamsSchema }),
  removeReactionHandler
);

export { router as reactionRouter };
