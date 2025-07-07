const deviceRouter = require('./deviceRouter');

function route(app) {
    app.use('/api/device', deviceRouter);
}
module.exports = route;