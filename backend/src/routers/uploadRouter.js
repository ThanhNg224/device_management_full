const express = require('express');
const router = express.Router();
const UploadController = require('../controller/uploadController');
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
router.post('/upload-apk', upload.single('fileApk'), UploadController.uploadFile);

module.exports = router;