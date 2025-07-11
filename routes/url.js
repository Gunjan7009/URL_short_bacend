const express = require('express');
const { handleUrl, getCountOfUrls, editUrl, deleteUrl, getAggregatedAnalytics } = require('../controllers/url');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/shorten',authMiddleware, handleUrl);
router.get('/count',authMiddleware, getCountOfUrls);
router.get("/analytics/cumulative", authMiddleware, getAggregatedAnalytics);
router.put('/edit/:shortId', authMiddleware, editUrl);
router.delete('/delete/:shortId', authMiddleware, deleteUrl);




module.exports = router;
