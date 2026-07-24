import { Router } from 'express';
import * as blogController from '../controllers/blogController';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createBlogPostSchema, updateBlogPostSchema } from '../utils/validators/communityValidators';

const router = Router();

/**
 * @openapi
 * /blog:
 *   get:
 *     tags: [Blog]
 *     summary: List published blog posts
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Posts returned }
 */
router.get('/', blogController.listPublishedPosts);

/**
 * @openapi
 * /blog/admin:
 *   get:
 *     tags: [Blog]
 *     summary: List all blog posts including drafts (admin)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Posts returned }
 */
router.get('/admin', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), blogController.listAllPostsForAdmin);

/**
 * @openapi
 * /blog/{slug}:
 *   get:
 *     tags: [Blog]
 *     summary: Get a single published blog post by slug
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Post returned }
 *       404: { description: Post not found or unpublished }
 */
router.get('/:slug', blogController.getPostBySlug);

/**
 * @openapi
 * /blog:
 *   post:
 *     tags: [Blog]
 *     summary: Create a new blog post as a draft (admin)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, excerpt, content]
 *             properties:
 *               title: { type: string }
 *               excerpt: { type: string }
 *               content: { type: string }
 *               coverImageUrl: { type: string }
 *     responses:
 *       201: { description: Post created as draft }
 */
router.post(
  '/',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  validate(createBlogPostSchema),
  blogController.createPost
);

/**
 * @openapi
 * /blog/{id}:
 *   patch:
 *     tags: [Blog]
 *     summary: Update a blog post, including publishing it (admin)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Post updated }
 */
router.patch(
  '/:id',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  validate(updateBlogPostSchema),
  blogController.updatePost
);

/**
 * @openapi
 * /blog/{id}:
 *   delete:
 *     tags: [Blog]
 *     summary: Delete a blog post (admin)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Post deleted }
 */
router.delete('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), blogController.deletePost);

export default router;
