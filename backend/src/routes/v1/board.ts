import { Router } from 'express';
import * as boardController from '../../controllers/board.controller';
import { requireWorkspaceMember } from '../../middlewares/requireWorkspaceMember';
import columnRoutes from './column';

const router = Router({ mergeParams: true });

router.post('/', requireWorkspaceMember('MEMBER'), boardController.createBoard);
router.get('/', requireWorkspaceMember('VIEWER'), boardController.getBoards);
router.patch('/:boardId', requireWorkspaceMember('MEMBER'), boardController.updateBoard);
router.delete('/:boardId', requireWorkspaceMember('MEMBER'), boardController.deleteBoard);

// Mount column routes under specific board
router.use('/:boardId/columns', columnRoutes);

export default router;
