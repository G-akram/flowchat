import { Router, type Router as ExpressRouter } from 'express';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import { notificationParamsSchema } from './notification.schemas';
import {
  listNotificationsHandler,
  markNotificationReadHandler,
  markAllReadHandler,
  deleteNotificationHandler,
  clearAllNotificationsHandler,
} from './notification.controller';

const router: ExpressRouter = Router();

router.use(authenticate);

router.get('/', listNotificationsHandler);

router.post('/read-all', markAllReadHandler);

router.delete('/all', clearAllNotificationsHandler);

router.patch(
  '/:notificationId/read',
  validate({ params: notificationParamsSchema }),
  markNotificationReadHandler
);

router.delete(
  '/:notificationId',
  validate({ params: notificationParamsSchema }),
  deleteNotificationHandler
);

export { router as notificationRouter };
