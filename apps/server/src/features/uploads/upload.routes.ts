import { Router, type Router as ExpressRouter } from 'express';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import { presignUploadSchema, confirmUploadSchema } from './upload.schemas';
import { presignUploadHandler, confirmUploadHandler } from './upload.controller';

const router: ExpressRouter = Router();

router.use(authenticate);

router.post(
  '/presign',
  validate({ body: presignUploadSchema }),
  presignUploadHandler
);

router.post(
  '/confirm',
  validate({ body: confirmUploadSchema }),
  confirmUploadHandler
);

export { router as uploadRouter };
