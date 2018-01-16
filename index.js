const weather = require('./app/weather.js');
const sensors = require('./app/sensors.js');
const http = require('http')
const port = 3000

const requestHandler = (request, response) => {
    response.setHeader('Content-Type', 'application/json');
    
    Promise.all([weather.getWeather(), sensors.getSensors()]).then(function (values) {
        var result = {};
        values.forEach(i => Object.assign(result, i));

        // console.log(result);

        response.end(JSON.stringify(result));
    });
};

const server = http.createServer(requestHandler);

server.listen(port, (err) => {
    if (err) {
        return console.log('something bad happened', err)
    }

    console.log(`server is listening on ${port}`)
});
