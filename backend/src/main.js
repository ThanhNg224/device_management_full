const express = require('express');
const mongoose = require('mongoose');
const route = require('./routers/mainRouter');
const os = require('os');
const http = require('http');
const { websocketController } = require('./controller/socketController');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const server = http.createServer(app);
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

mongoose.connect('mongodb://localhost:27017/myapp', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then( async () => {
  console.log('✅ Đã kết nối MongoDB');
  const Device = require('./model/device.model');
  await Device.updateMany({}, { $set: { status: 0 } });
})
.catch((err) => console.error('❌ Lỗi kết nối MongoDB:', err));
require('./utils/clearUploads');

websocketController(server);
route(app);

const getLocalIP = () => {
  const interfaces = os.networkInterfaces();
  for (let name in interfaces) {
    for (let iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
};

const IP = getLocalIP();
server.listen(PORT, IP, () => {
  console.log(`🚀 Server chạy tại http://${IP}:${PORT}`);
});