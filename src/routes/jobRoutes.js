const router = require('express').Router();
const { getAllJobs, getJobById, createJob, updateJob, deleteJob } = require('../controllers/jobController');
const cache = require('../middleware/cache');

router.get('/', cache(60), getAllJobs);
router.get('/', getAllJobs);
router.get('/:id', getJobById);
router.post('/', createJob);
router.put('/:id', updateJob);
router.delete('/:id', deleteJob);

module.exports = router;