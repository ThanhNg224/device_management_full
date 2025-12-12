const WebSocket = require('ws');
const Device = require('../model/device.model');

const clients = new Map();

const websocketController = (server) => {
  const wss = new WebSocket.Server({ server });

  wss.on('connection', (ws) => {
    console.log('📡 A device connected');

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message);
        const { deviceCode, version, config, performance, timestamp, ipAddress } = data;
        if (!deviceCode) return;

        clients.set(ws, { deviceCode, lastPing: Date.now() });

        await Device.findOneAndUpdate(
          { deviceCode },
          {
            $set: {
              status: 1,
              lastConnected: timestamp || new Date(),
              version,
              config,
              ipAddress,
              lastPerformance: performance,
            },
          },
          { upsert: true }
        );
      } catch (err) {
        console.error('❌ Invalid message format', err.message);
      }
    });

    ws.on('close', async () => {
      const info = clients.get(ws);
      if (info?.deviceCode) {
        console.log(`❌ Device ${info.deviceCode} disconnected`);
        await Device.findOneAndUpdate({ deviceCode: info.deviceCode }, { $set: { status: 0 } });
      }
      clients.delete(ws);
    });
  });

  setInterval(async () => {
    const now = Date.now();
    for (const [ws, info] of clients) {
      if (now - info.lastPing > 5000) {
        console.log(`⚠️ Device ${info.deviceCode} timeout`);
        await Device.findOneAndUpdate({ deviceCode: info.deviceCode }, { $set: { status: 0 } });
        clients.delete(ws);
        ws.terminate();
      }
    }
  }, 30000);

};

module.exports = {websocketController, clients};