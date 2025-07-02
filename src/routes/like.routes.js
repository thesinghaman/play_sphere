import { Router } from 'express';
import {
    getLikedVideos,
    toggleCommentLike,
    toggleVideoLike,
    toggleTweetLike,
} from '../controllers/like.controllers.js';
import {verifyJWT} from '../middlewares/auth.middlewares.js';

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes

router.route('/videos').get(getLikedVideos);
router.route('/toggle/v/:videoId').post(toggleVideoLike);
router.route('/toggle/c/:commentId').post(toggleCommentLike);
router.route('/toggle/t/:tweetId').post(toggleTweetLike);

export default router;