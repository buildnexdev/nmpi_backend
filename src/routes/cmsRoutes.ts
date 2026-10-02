import { Router } from 'express';
import { getLeaders, getPage, getGalleryAlbums, getGeography } from '../controllers/cmsController';

const router = Router();

router.get('/leadership', getLeaders);
router.get('/pages/:key', getPage);
router.get('/gallery/albums', getGalleryAlbums);
router.get('/geography', getGeography);

export default router;
