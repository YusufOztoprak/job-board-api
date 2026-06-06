const router = require('express').Router();
const { getStats, getMyJobs, getMyApplications } = require('../controllers/adminController');
const authenticate = require('../middleware/authenticate');
const { requireRole } = require('../middleware/authorize');

/**
 * @swagger
 * /admin/stats:
 *   get:
 *     summary: Get aggregate stats for the authenticated employer
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Employer's job and application statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     jobs:
 *                       type: object
 *                       properties:
 *                         active:
 *                           type: integer
 *                           example: 4
 *                         inactive:
 *                           type: integer
 *                           example: 1
 *                         total:
 *                           type: integer
 *                           example: 5
 *                     applications:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                           example: 12
 *                         byStatus:
 *                           type: object
 *                           properties:
 *                             pending:
 *                               type: integer
 *                               example: 5
 *                             reviewed:
 *                               type: integer
 *                               example: 3
 *                             accepted:
 *                               type: integer
 *                               example: 2
 *                             rejected:
 *                               type: integer
 *                               example: 2
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden – employer role required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/stats', authenticate, requireRole('employer'), getStats);

/**
 * @swagger
 * /admin/jobs:
 *   get:
 *     summary: List all jobs posted by the authenticated employer (including inactive)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 100
 *         description: Results per page
 *     responses:
 *       200:
 *         description: Paginated list of employer's jobs (active and inactive)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Job'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden – employer role required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/jobs', authenticate, requireRole('employer'), getMyJobs);

/**
 * @swagger
 * /admin/applications:
 *   get:
 *     summary: List all applications for the authenticated employer's jobs
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 100
 *         description: Results per page
 *       - in: query
 *         name: jobId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter applications to a specific job
 *     responses:
 *       200:
 *         description: Paginated list of applications with job and candidate details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Application'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden – employer role required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/applications', authenticate, requireRole('employer'), getMyApplications);

module.exports = router;
