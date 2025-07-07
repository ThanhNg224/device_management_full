const Device = require('../model/device.model');

const DeviceController = {
  getList: async (req, res) => {
    try {
      const devices = await Device.find().select('-__v').sort({ lastConnected: -1 });
      res.json({
        message: 'Lấy dữ liệu thành công',
        data: devices,
      });
    } catch (err) {``
      console.error('Lỗi lấy danh sách thiết bị:', err);
      res.status(500).json({ error: err.message });
    }
  },

};

module.exports = DeviceController;
