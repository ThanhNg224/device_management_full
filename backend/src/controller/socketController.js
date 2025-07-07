const WebSocket = require('ws');
const Device = require('../model/device.model');

const websocketController = (server) => {
  const wss = new WebSocket.Server({ server });
  const clients = new Map();

  wss.on('connection', (ws) => {
    console.log('📡 A device connected');

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message);
        const {
          deviceCode,
          version,
          config,
          performance,
          location,
          timestamp,
        } = data;

        if (!deviceCode) return;

        clients.set(ws, {
          deviceCode,
          lastPing: Date.now(),
        });

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

        // console.log(`✅ Heartbeat from ${deviceCode}`);
      } catch (err) {
        console.error('❌ Invalid message format', err.message);
      }
    });

    ws.on('close', async () => {
      const info = clients.get(ws);
      if (info?.deviceCode) {
        console.log(`❌ Device ${info.deviceCode} disconnected`);
        await Device.findOneAndUpdate(
          { deviceCode: info.deviceCode },
          { $set: { status: 0 } }
        );
      }
      clients.delete(ws);
    });
  });

  setInterval(async () => {
    const now = Date.now();
    const timeout = 60 * 1000;

    let disconnectedDevices = [];

    for (const [ws, info] of clients.entries()) {
      if (now - info.lastPing > timeout) {
        disconnectedDevices.push(info.deviceCode);
        clients.delete(ws);
        try {
          ws.terminate();
        } catch (_) {}
      }
    }

    if (disconnectedDevices.length > 0) {
      await Device.updateMany(
        { deviceCode: { $in: disconnectedDevices } },
        { $set: { status: 0 } }
      );
      console.log(`⚠️ ${disconnectedDevices.length} device(s) marked offline (timeout)`);
    }
  }, 30 * 1000);
};

module.exports = websocketController;