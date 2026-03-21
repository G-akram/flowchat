import { Router, type Router as ExpressRouter } from 'express';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import {
  createChannelSchema,
  channelParamsSchema,
  workspaceParamsSchema,
} from './channel.schemas';
import {
  createChannelHandler,
  listChannelsHandler,
  joinChannelHandler,
  getChannelHandler,
} from './channel.controller';

const router: ExpressRouter = Router({ mergeParams: true });

router.use(authenticate);

router.post(
  '/',
  validate({ params: workspaceParamsSchema, body: createChannelSchema }),
  createChannelHandler
);
router.get(
  '/',
  validate({ params: workspaceParamsSchema }),
  listChannelsHandler
);
router.post(
  '/:channelId/join',
  validate({ params: channelParamsSchema }),
  joinChannelHandler
);
router.get(
  '/:channelId',
  validate({ params: channelParamsSchema }),
  getChannelHandler
);

export { router as channelRouter };
