const DeviceLog = require('../model/deviceLog.model');
const Device = require('../model/device.model');
const dayjs = require('dayjs');

const formatDateTime = (dateStr) => {
  if (!dateStr) return '';
  return dayjs(dateStr).format('DD/MM/YYYY HH:mm');
};

const DeviceLogController = {
  getList: async (req, res) => {
    try {
      const { fromDate, toDate } = req.query;

      let query = {};
      if (fromDate && toDate) {
        query.accessDate = {
          $gte: dayjs(fromDate, 'DD/MM/YYYY').format('YYYY-MM-DD'),
          $lte: dayjs(toDate, 'DD/MM/YYYY').format('YYYY-MM-DD'),
        };
      }

      // lấy logs
      const logs = await DeviceLog.find(query).sort({ createdAt: -1 });

      // lấy device list để map compId -> deviceCode
      const devices = await Device.find({});
      const deviceMap = {};
      devices.forEach(d => { deviceMap[d._id] = d.deviceCode; });

      // map dữ liệu theo cấu trúc mới
      const result = logs.map(log => ({
        serial: deviceMap[log.compId] || null,
        fullName: log.eventName || null,
        accessType: log.accessType,
        accessTime: formatDateTime(log.accessTime),
        errorMessage: log.errorCode,
        scoreMatch: (log.scoreMatch * 100).toFixed(2)
      }));

      res.json({ success: true, data: result });
    } catch (err) {
      console.error('❌ Error fetching device logs:', err);
      res.status(500).json({ success: false, error: 'Server error' });
    }

  },

  saveLog: async (req, res) => {
    try {
      const {
        accessDate,
        accessTime,
        accessType,
        age,
        cardNo,
        compId,
        errorCode,
        eventCode,
        eventId,
        eventName,
        scoreMatch
        // faceFeature,
        // faceImage,
        // faceImageBase64
      } = req.body;

      console.log(req.body);

      // tạo bản ghi mới
      const newLog = new DeviceLog({
        accessDate,
        accessTime,
        accessType,
        age,
        cardNo,
        compId,
        errorCode,
        eventCode,
        eventId,
        eventName,
        scoreMatch
        // faceFeature,
        // faceImage,
        // faceImageBase64
      });

      // lưu vào database
      const saved = await newLog.save();

      res.json({
        success: true,
        message: 'Log saved successfully',
        data: saved
      });
    } catch (err) {
      console.error('❌ Error saving device log:', err);
      res.status(500).json({
        success: false,
        error: 'Server error'
      });
    }
  }

};

module.exports = DeviceLogController;