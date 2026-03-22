import { Router, type Router as ExpressRouter } from 'express';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import { dmWorkspaceParamsSchema, openDmSchema } from './dm.schemas';
import { openDmHandler, listDmsHandler } from './dm.controller';

const router: ExpressRouter = Router({ mergeParams: true });

router.use(authenticate);

router.post(
  '/',
  validate({ params: dmWorkspaceParamsSchema, body: openDmSchema }),
  openDmHandler
);

router.get(
  '/',
  validate({ params: dmWorkspaceParamsSchema }),
  listDmsHandler
);

export { router as dmRouter };
