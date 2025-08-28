const express = require('express');
const router = express.Router();
const AuthController = require('../controller/authController');

router.post('/login', AuthController.login);
router.post('/logout', AuthController.logout);
router.post('/refresh', AuthController.refresh);

module.exports = router;