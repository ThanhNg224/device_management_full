const express = require('express');
const router = express.Router();
const VersionApkController = require('../controller/versionApkController');
const Tes = require('../controller/uploadController');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'src/uploads');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });
router.post('/versions', upload.single('file'), VersionApkController.postVersion);
router.get('/versions', VersionApkController.getVersion);
router.put('/versions/:id', VersionApkController.updateVersion);
router.delete('/versions/:id', VersionApkController.removeVersion);
router.delete('/versions/clear', VersionApkController.clearVersionError);
router.post('/versions/:id/install', VersionApkController.installVersion);
router.post('/upload-apk', upload.single('fileApk'), Tes.uploadFile);

module.exports = router;