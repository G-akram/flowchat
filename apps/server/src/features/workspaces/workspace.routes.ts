import { Router, type Router as ExpressRouter } from 'express';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import {
  createWorkspaceSchema,
  workspaceParamsSchema,
  inviteMemberSchema,
} from './workspace.schemas';
import {
  createWorkspaceHandler,
  listWorkspacesHandler,
  getWorkspaceHandler,
  inviteMemberHandler,
} from './workspace.controller';
import { listWorkspaceMembersHandler } from '../users/user.controller';

const router: ExpressRouter = Router();

router.use(authenticate);

router.post('/', validate({ body: createWorkspaceSchema }), createWorkspaceHandler);
router.get('/', listWorkspacesHandler);
router.get(
  '/:workspaceId',
  validate({ params: workspaceParamsSchema }),
  getWorkspaceHandler
);
router.get(
  '/:workspaceId/members',
  validate({ params: workspaceParamsSchema }),
  listWorkspaceMembersHandler
);
router.post(
  '/:workspaceId/members',
  validate({ params: workspaceParamsSchema, body: inviteMemberSchema }),
  inviteMemberHandler
);

export { router as workspaceRouter };
