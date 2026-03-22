import { Router, type Router as ExpressRouter } from 'express';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import {
  createWorkspaceSchema,
  updateWorkspaceSchema,
  workspaceParamsSchema,
  memberParamsSchema,
  inviteMemberSchema,
} from './workspace.schemas';
import {
  createWorkspaceHandler,
  listWorkspacesHandler,
  getWorkspaceHandler,
  inviteMemberHandler,
  updateWorkspaceHandler,
  deleteWorkspaceHandler,
  leaveWorkspaceHandler,
  kickMemberHandler,
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
router.patch(
  '/:workspaceId',
  validate({ params: workspaceParamsSchema, body: updateWorkspaceSchema }),
  updateWorkspaceHandler
);
router.delete(
  '/:workspaceId',
  validate({ params: workspaceParamsSchema }),
  deleteWorkspaceHandler
);
router.post(
  '/:workspaceId/leave',
  validate({ params: workspaceParamsSchema }),
  leaveWorkspaceHandler
);
router.delete(
  '/:workspaceId/members/:userId',
  validate({ params: memberParamsSchema }),
  kickMemberHandler
);

export { router as workspaceRouter };
