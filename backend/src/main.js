const express = require('express');
const mongoose = require('mongoose');
const route = require('./routers/mainRouter');
const os = require('os');
const http = require('http');
const websocketController = require('./controller/socketController');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const PORT = 3000;

app.use(cors());
app.use(express.json());

mongoose.connect('mongodb://localhost:27017/myapp', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Đã kết nối MongoDB'))
.catch((err) => console.error('❌ Lỗi kết nối MongoDB:', err));
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
websocketController(server);``
const IP = getLocalIP();
server.listen(PORT, IP, () => {
  console.log(`🚀 Server chạy tại http://${IP}:${PORT}`);
});