const { clients } = require('../controller/socketController');

const RebootController = {
  reboot: async (req, res) => {
    const { deviceCode } = req.body || {};
    if (!deviceCode) {
    return res.status(400).json({ success: false, message: 'deviceCode is required' });
    }
    const wsEntry = [...clients].find(([ws, info]) => info.deviceCode === deviceCode);
    if (!wsEntry) {
    return res.status(404).json({ success: false, message: 'Device not connected' });
    }
    const [ws] = wsEntry;
    ws.send(JSON.stringify({ action: 'reboot' }));
    return res.json({ success: true, message: `Reboot command sent to device ${deviceCode}` });
  }
};

module.exports = RebootController;