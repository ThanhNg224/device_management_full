const Device = require('../model/device.model');
const dayjs = require("dayjs");

const DeviceController = {
  getList: async (req, res) => {
    try {
      const devices = await Device.find().select("-__v").sort({ lastConnected: -1 });

      const formattedDevices = devices.map(device => ({
        ...device._doc, // hoặc device.toObject()
        createdAt: dayjs(device.createdAt).format("DD/MM/YYYY HH:mm"),
        updatedAt: dayjs(device.updatedAt).format("DD/MM/YYYY HH:mm"),
        lastConnected: dayjs(device.lastConnected).format("DD/MM/YYYY HH:mm"),
      }));

      res.json({
        message: "Lấy dữ liệu thành công",
        data: formattedDevices,
      });
    } catch (err) {
      console.error("Lỗi lấy danh sách thiết bị:", err);
      res.status(500).json({ error: err.message });
    }
  }

};

module.exports = DeviceController;
