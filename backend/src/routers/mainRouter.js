const deviceRouter = require('./deviceRouter');
const uploadRouter = require('./uploadRouter');

function route(app) {
    app.use('/api/device', deviceRouter);
    app.use('/api', uploadRouter);
}
module.exports = route;