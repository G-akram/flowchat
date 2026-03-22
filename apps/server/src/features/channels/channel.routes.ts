import { Router, type Router as ExpressRouter } from 'express';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import {
  createChannelSchema,
  updateChannelSchema,
  addChannelMemberSchema,
  channelParamsSchema,
  workspaceParamsSchema,
} from './channel.schemas';
import {
  createChannelHandler,
  listChannelsHandler,
  joinChannelHandler,
  getChannelHandler,
  updateChannelHandler,
  deleteChannelHandler,
  leaveChannelHandler,
  addChannelMemberHandler,
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
router.patch(
  '/:channelId',
  validate({ params: channelParamsSchema, body: updateChannelSchema }),
  updateChannelHandler
);
router.delete(
  '/:channelId',
  validate({ params: channelParamsSchema }),
  deleteChannelHandler
);
router.post(
  '/:channelId/leave',
  validate({ params: channelParamsSchema }),
  leaveChannelHandler
);
router.post(
  '/:channelId/members',
  validate({ params: channelParamsSchema, body: addChannelMemberSchema }),
  addChannelMemberHandler
);

export { router as channelRouter };
