const deviceRouter = require('./deviceRouter');
const versionRouter = require('./versionRouter');
const deviceLogRouter = require('./deviceLogRouter');
const authRouter = require('./authRouter');

function route(app) {
    app.use('/api/device', deviceRouter);
    app.use('/api', versionRouter);
    app.use('/auth', authRouter);
    app.use('/api/deviceLog', deviceLogRouter);
}
module.exports = route;