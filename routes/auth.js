const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const {
    registerUser,
    loginUser,
    updateUser,
    getMe,
    logoutUser,
    deleteUser,
} = require('../controllers/auth');

const router = express.Router();


router.get('/me', authMiddleware, getMe);
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', authMiddleware, logoutUser);
router.post('/updateuser',authMiddleware, updateUser);
router.delete('/deleteuser',authMiddleware, deleteUser);

module.exports = router;
