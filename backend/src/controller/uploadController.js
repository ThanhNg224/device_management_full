// uploadController.js
const path = require('path');
const fs = require('fs');
const { clients } = require('../controller/socketController'); // Now correctly imports clients
const Device = require('../model/device.model');
const WebSocket = require('ws');

const UploadController = {
  uploadFile: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: 'No APK file uploaded' });
      }
      const allDevices = await Device.find({}, { deviceCode: 1, _id: 0 }).lean();

      console.log(allDevices);

      const dbSerials = allDevices.map(d => d.deviceCode);
      let inputSerials = [];
      try {
        if (typeof req.body.devices === 'string') {
          inputSerials = JSON.parse(req.body.devices);
        } else if (Array.isArray(req.body.devices)) {
          inputSerials = req.body.devices;
        }
        inputSerials = inputSerials
          .filter(d => d && d.serial)
          .map(d => d.serial);
      } catch (e) {
        return res.status(400).json({ success: false, error: 'Devices must be a valid JSON array' });
      }

      if (inputSerials.length === 0) {
        return res.status(400).json({ success: false, error: 'No valid device serials provided' });
      }
      const validSerials = inputSerials.filter(serial => dbSerials.includes(serial));

      if (validSerials.length === 0) {
        return res.status(400).json({ success: false, error: 'No matching devices found in database' });
      }
      const apkUrl = `http://${req.headers.host}/uploads/${req.file.filename}`;
      const message = {
        apkUrl,
        filename: req.file.originalname,
        namePackage: "com.atin.arcface",
        type: "apk:update"
      };
      const sentDevicesSet = new Set();
      for (const [ws, info] of clients.entries()) {
        if (
          validSerials.includes(info.deviceCode) &&
          ws.readyState === WebSocket.OPEN &&
          !sentDevicesSet.has(info.deviceCode)
        ) {
          try {
            ws.send(JSON.stringify(message));
            sentDevicesSet.add(info.deviceCode);
            console.log(`📤 Sent APK update to ${info.deviceCode}`);
          } catch (err) {
            console.error(`❌ Error sending to ${info.deviceCode}: ${err.message}`);
          }
        }
      }
      res.status(200).json({
        success: true,
        file: req.file.originalname,
        sentDevices: Array.from(sentDevicesSet),
        downloadUrl: `/uploads/${req.file.filename}`
      });

    } catch (err) {
      console.error('Upload error:', err);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
};

module.exports = UploadController;