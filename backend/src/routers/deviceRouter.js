const express = require('express');
const router = express.Router();
const DeviceController = require('../controller/deviceController');

router.get('/listDevice', DeviceController.getList);

module.exports = router;