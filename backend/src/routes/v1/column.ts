import { Router } from 'express';
import * as columnController from '../../controllers/column.controller';
import { requireWorkspaceMember } from '../../middlewares/requireWorkspaceMember';

const router = Router({ mergeParams: true });

router.use(requireWorkspaceMember('MEMBER')); // Need MEMBER role to manage columns

router.post('/', columnController.createColumn);
router.patch('/:columnId', columnController.updateColumn);
router.delete('/:columnId', columnController.deleteColumn);

export default router;
