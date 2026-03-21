import { Router, type Router as ExpressRouter } from 'express';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import {
  channelParamsSchema,
  messageParamsSchema,
  createMessageSchema,
  updateMessageSchema,
  listMessagesQuerySchema,
} from './message.schemas';
import {
  listMessagesHandler,
  createMessageHandler,
  updateMessageHandler,
  deleteMessageHandler,
} from './message.controller';

const router: ExpressRouter = Router({ mergeParams: true });

router.use(authenticate);

router.get(
  '/',
  validate({ params: channelParamsSchema, query: listMessagesQuerySchema }),
  listMessagesHandler
);
router.post(
  '/',
  validate({ params: channelParamsSchema, body: createMessageSchema }),
  createMessageHandler
);
router.patch(
  '/:messageId',
  validate({ params: messageParamsSchema, body: updateMessageSchema }),
  updateMessageHandler
);
router.delete(
  '/:messageId',
  validate({ params: messageParamsSchema }),
  deleteMessageHandler
);

export { router as messageRouter };
