const VersionApk = require('../model/version.model');
const Device = require('../model/device.model');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const mongoose = require('mongoose');
const { clients } = require('../controller/socketController');

const VersionApkController = {
  postVersion: async (req, res) => {
    try {
      const { versionCode, versionName, note } = req.body;
      const file = req.file;
      if (!file || !versionCode) {
        return res.status(400).json({ message: 'fileApk và versionCode là bắt buộc' });
      }
      const exist = await VersionApk.findOne({ versionCode });
      if (exist) {
        return res.status(409).json({ message: 'versionCode đã tồn tại' });
      }
      const createAT = moment().format('DD/MM/YYYY HH:mm');
      const serverIp = req.hostname; 
      const fileUrl = `http://${serverIp}:4000/uploads/${file.filename}`;
      const fileSize = file.size;
      const fileBuffer = fs.readFileSync(file.path);
      const sha256 = crypto.createHash('sha256').update(fileBuffer).digest('hex');
      const newVersion = new VersionApk({
        createAT,
        fileUrl,
        versionCode,
        versionName,
        note,
        fileSize,
        sha256
      });

      await newVersion.save();

      res.status(201).json({
        message: 'Upload thành công',
        data: newVersion
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
  },

  // getVersion: async (req, res) => {
  //   try {
  //     const versions = await VersionApk.find()
  //       .sort({ createAT: -1 }) // mới nhất lên đầu
  //       .select('_id versionCode versionName fileUrl fileSize sha256 note createAT');

  //     const data = versions.map(v => {
  //       // Lấy tên file từ fileUrl
  //       const filename = v.fileUrl.split('/').pop();
  //       const filePath = path.join(__dirname, '../uploads', filename);

  //       // Kiểm tra file có tồn tại trong uploads không
  //       const fileExists = fs.existsSync(filePath);

  //       return {
  //         id: v._id,
  //         versionCode: v.versionCode,
  //         versionName: v.versionName,
  //         fileUrl: v.fileUrl,
  //         fileSize: v.fileSize,
  //         sha256: v.sha256,
  //         note: v.note,
  //         createdAt: v.createAT,
  //         status: fileExists ? 1 : 0,
  //         statusTitle: fileExists ? 'Ready' : 'Corrupted or Missing APK'
  //       };
  //     });

  //     res.status(200).json({
  //       message: 'Danh sách version',
  //       data
  //     });
  //   } catch (err) {
  //     console.error(err);
  //     res.status(500).json({ message: 'Lỗi server', error: err.message });
  //   }
  // },

  getVersion: async (req, res) => {
    try {
      const versions = await VersionApk.find()
        .sort({ createAT: -1 }) // mới nhất lên đầu
        .select('_id versionCode versionName fileUrl fileSize sha256 note createAT');

      const data = versions.map(v => {
        // Lấy tên file từ fileUrl
        const filename = v.fileUrl.split('/').pop();
        const filePath = path.join(__dirname, '../uploads', filename);

        let status = 0;
        let statusTitle = 'Corrupted or Missing APK';
        let actualSize = 0;

        if (fs.existsSync(filePath)) {
          const stats = fs.statSync(filePath);
          actualSize = stats.size;

          if (actualSize > 0) {
            status = 1;
            statusTitle = 'Ready';
          } else {
            status = 0;
            statusTitle = 'Corrupted or missing';
          }
        }

        return {
          id: v._id,
          versionCode: v.versionCode,
          versionName: v.versionName,
          fileUrl: v.fileUrl,
          fileSize: actualSize, // trả về kích thước thực tế
          sha256: v.sha256,
          note: v.note,
          createdAt: v.createAT,
          status,
          statusTitle
        };
      });

      res.status(200).json({
        message: 'Danh sách version',
        data
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
  },

  clearVersionError: async (req, res) => {
    try {
      const versions = await VersionApk.find().select('_id fileUrl');

      const errorVersions = versions.filter(v => {
        const filename = v.fileUrl.split('/').pop();
        const filePath = path.join(__dirname, '../uploads', filename);
        return !fs.existsSync(filePath);
      });

      const idsToDelete = errorVersions.map(v => v._id);

      if (idsToDelete.length > 0) {
        await VersionApk.deleteMany({ _id: { $in: idsToDelete } });
      }

      res.status(200).json({
        message: `Đã xoá ${idsToDelete.length} version lỗi`,
        deletedIds: idsToDelete
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
  },

  removeVersion: async (req, res) => {
    try {
      const { id } = req.params;

      const version = await VersionApk.findById(id);
      if (!version) {
        return res.status(404).json({ message: 'Version không tồn tại' });
      }

      const filePath = path.join(__dirname, '..', 'uploads', path.basename(version.fileUrl));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      await VersionApk.findByIdAndDelete(id);

      res.status(200).json({ message: 'Xoá version thành công', id });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
  },

  updateVersion: async (req, res) => {
    try {
      const { id } = req.params;
      const { versionName, note } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'ID không hợp lệ' });
      }

      const updatedVersion = await VersionApk.findByIdAndUpdate(
        id,
        { versionName, note },
        { new: true, runValidators: true } // new: true => trả về bản ghi sau khi update
      );

      if (!updatedVersion) {
        return res.status(404).json({ message: 'Version không tồn tại' });
      }

      res.status(200).json({
        message: 'Cập nhật version thành công',
        data: {
          id: updatedVersion._id,
          versionCode: updatedVersion.versionCode,
          versionName: updatedVersion.versionName,
          fileUrl: updatedVersion.fileUrl,
          fileSize: updatedVersion.fileSize,
          sha256: updatedVersion.sha256,
          note: updatedVersion.note,
          createdAt: updatedVersion.createAT
        }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
  },

  installVersion: async (req, res) => {
    try {
      const { id } = req.params;
      let { deviceCodes } = req.body;

      // Validate input
      if (!id) {
        return res.status(400).json({ success: false, error: 'Missing version id' });
      }
      if (!deviceCodes || !Array.isArray(deviceCodes) || deviceCodes.length === 0) {
        return res.status(400).json({ success: false, error: 'deviceCodes must be a non-empty array' });
      }

      // Lấy version từ DB
      const version = await VersionApk.findById(id).lean();
      if (!version) {
        return res.status(404).json({ success: false, error: 'Version not found' });
      }

      // Lấy danh sách thiết bị trong DB
      const allDevices = await Device.find({}, { deviceCode: 1, _id: 0 }).lean();
      const dbSerials = allDevices.map(d => d.deviceCode);

      // Lọc thiết bị hợp lệ
      const validSerials = deviceCodes.filter(serial => dbSerials.includes(serial));
      if (validSerials.length === 0) {
        return res.status(400).json({ success: false, error: 'No matching devices found in database' });
      }

      // Tạo message giống uploadFile
      const fileUrl = version.fileUrl;
      const filename = path.basename(fileUrl);

      const message = {
        apkUrl: fileUrl,
        filename: filename,
        namePackage: "com.atin.arcface",
        type: "apk:update",
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
            console.log(`📤 Sent installVersion to ${info.deviceCode}`);
          } catch (err) {
            console.error(`❌ Error sending to ${info.deviceCode}: ${err.message}`);
          }
        }
      }

      return res.status(200).json({
        success: true,
        versionId: id,
        sentDevices: Array.from(sentDevicesSet),
        apkUrl: version.apkUrl
      });

    } catch (err) {
      console.error('installVersion error:', err);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
}


module.exports = VersionApkController;