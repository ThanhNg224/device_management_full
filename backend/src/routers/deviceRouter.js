const express = require('express');
const router = express.Router();
const DeviceController = require('../controller/deviceController');
const RebootController = require('../controller/rebootController');

router.get('/listDevice', DeviceController.getList);
router.post('/reboot', RebootController.reboot);

module.exports = router;