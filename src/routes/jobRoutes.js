const router = require('express').Router();
const { getAllJobs, getJobById, createJob, updateJob, deleteJob } = require('../controllers/jobController');
const cache = require('../middleware/cache');
const validate = require('../middleware/validate');
const { createJobSchema, updateJobSchema } = require('../validators/jobValidator');


router.get('/', cache(60), getAllJobs);
router.get('/:id', getJobById);
router.post('/', validate(createJobSchema), createJob);
router.put('/:id', validate(updateJobSchema), updateJob);
router.delete('/:id', deleteJob);

module.exports = router;