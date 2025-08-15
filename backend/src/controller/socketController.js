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
        const { deviceCode, version, config, performance, location, timestamp } = data;
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
              lastPerformance: performance,
              location,
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
};

module.exports = {websocketController, clients};