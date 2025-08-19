const deviceRouter = require('./deviceRouter');
const uploadRouter = require('./uploadRouter');
const deviceLogRouter = require('./deviceLogRouter');

function route(app) {
    app.use('/api/device', deviceRouter);
    app.use('/api', uploadRouter);
    app.use('/api/deviceLog', deviceLogRouter);
}
module.exports = route;