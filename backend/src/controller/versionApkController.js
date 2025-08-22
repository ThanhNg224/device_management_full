const VersionApk = require('../model/version.model');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const moment = require('moment');

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
      const fileUrl = `http://${serverIp}:3000/uploads/${file.filename}`;
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

  getVersion: async (req, res) => {
    try {
      const versions = await VersionApk.find()
        .sort({ createAT: -1 }) // mới nhất lên đầu
        .select('_id versionCode versionName fileUrl fileSize sha256 note createAT');

      const data = versions.map(v => {
        // Lấy tên file từ fileUrl
        const filename = v.fileUrl.split('/').pop();
        const filePath = path.join(__dirname, '../uploads', filename);

        // Kiểm tra file có tồn tại trong uploads không
        const fileExists = fs.existsSync(filePath);

        return {
          id: v._id,
          versionCode: v.versionCode,
          versionName: v.versionName,
          fileUrl: v.fileUrl,
          fileSize: v.fileSize,
          sha256: v.sha256,
          note: v.note,
          createdAt: v.createAT,
          status: fileExists ? 1 : 0,
          statusTitle: fileExists ? 'Ready' : 'Corrupted or Missing APK'
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
  }

};


module.exports = VersionApkController;