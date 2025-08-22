const deviceRouter = require('./deviceRouter');
const versionRouter = require('./versionRouter');
const deviceLogRouter = require('./deviceLogRouter');

function route(app) {
    app.use('/api/device', deviceRouter);
    app.use('/api', versionRouter);
    app.use('/api/deviceLog', deviceLogRouter);
    
}
module.exports = route;