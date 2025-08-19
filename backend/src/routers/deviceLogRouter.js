const express = require('express');
const router = express.Router();
const DeviceLogController = require('../controller/deviceLogController');

router.get('/getListDeviceLog', DeviceLogController.getList);
router.post('/saveLog', DeviceLogController.saveLog);

module.exports = router;