import { Router } from 'express';
import { requireAuth } from '../../middlewares/requireAuth';
import { requireWorkspaceMember } from '../../middlewares/requireWorkspaceMember';
import * as workspaceController from '../../controllers/workspace.controller';
import * as projectController from '../../controllers/project.controller';
import * as dashboardController from '../../controllers/dashboard.controller';
import sprintRoutes from './sprint';
import issueRoutes from './issue';
import boardRoutes from './board';
import milestoneRoutes from './milestone';
import dependencyRoutes from './dependency';
import analyticsRoutes from './analytics';
import automationRoutes from './automation';

const router = Router();

// All workspace routes require authentication
router.use(requireAuth);

// === WORKSPACES ===
router.post('/', workspaceController.createWorkspace);
router.get('/', workspaceController.getWorkspaces);
router.get('/:workspaceId', requireWorkspaceMember('VIEWER'), workspaceController.getWorkspace);
router.delete('/:workspaceId', requireWorkspaceMember('ADMIN'), workspaceController.deleteWorkspace);
router.get('/:workspaceId/dashboard', requireWorkspaceMember('VIEWER'), dashboardController.getWorkspaceDashboard);

// === MEMBERS ===
// List members (VIEWER+)
router.get('/:workspaceId/members', requireWorkspaceMember('VIEWER'), workspaceController.getMembers);
// Add member (ADMIN only)
router.post('/:workspaceId/members', requireWorkspaceMember('ADMIN'), workspaceController.addMember);
// Change role (ADMIN only)
router.patch('/:workspaceId/members/:userId', requireWorkspaceMember('ADMIN'), workspaceController.updateMember);
// Remove member (ADMIN only)
router.delete('/:workspaceId/members/:userId', requireWorkspaceMember('ADMIN'), workspaceController.removeMember);

// === PROJECTS ===
// List projects (VIEWER+)
router.get('/:workspaceId/projects', requireWorkspaceMember('VIEWER'), projectController.getProjects);
// Get project (VIEWER+)
router.get('/:workspaceId/projects/:projectId', requireWorkspaceMember('VIEWER'), projectController.getProject);
// Create project (ADMIN only)
router.post('/:workspaceId/projects', requireWorkspaceMember('ADMIN'), projectController.createProject);
// Update project (ADMIN only)
router.patch('/:workspaceId/projects/:projectId', requireWorkspaceMember('ADMIN'), projectController.updateProject);
// Delete project (ADMIN only)
router.delete('/:workspaceId/projects/:projectId', requireWorkspaceMember('ADMIN'), projectController.deleteProject);

// === SPRINTS & ISSUES (Nested under Project) ===
router.get('/:workspaceId/projects/:projectId/board', requireWorkspaceMember('VIEWER'), projectController.getBoard);
router.get('/:workspaceId/projects/:projectId/activity', requireWorkspaceMember('VIEWER'), projectController.getProjectActivity);
router.use('/:workspaceId/projects/:projectId/sprints', sprintRoutes);
router.use('/:workspaceId/projects/:projectId/issues', issueRoutes);
router.use('/:workspaceId/projects/:projectId/boards', boardRoutes);
router.use('/:workspaceId/projects/:projectId/milestones', milestoneRoutes);
router.use('/:workspaceId/projects/:projectId/dependencies', dependencyRoutes);
router.use('/:workspaceId/projects/:projectId/analytics', analyticsRoutes);
router.use('/:workspaceId/projects/:projectId/automations', automationRoutes);

export default router;
