import { Router, type Router as ExpressRouter } from 'express';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import { searchParamsSchema, searchQuerySchema } from './search.schemas';
import { searchMessagesHandler } from './search.controller';

const router: ExpressRouter = Router({ mergeParams: true });

router.use(authenticate);

router.get(
  '/',
  validate({ params: searchParamsSchema, query: searchQuerySchema }),
  searchMessagesHandler
);

export { router as searchRouter };
