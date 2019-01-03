const weather = require('./app/weather.js');
const sensors = require('./app/sensors.js');
const http = require('http');
const querystring = require('querystring');
var fs = require('fs');
const port = 3000

const jsonDataHandler = response => {
    response.setHeader('Content-Type', 'application/json');
    
    var start = new Date();

    Promise.all([weather.getWeather(), sensors.getSensors()]).then(function (values) {
        var result = {};
        values.forEach(i => Object.assign(result, i));

        var now = new Date();
        result.sleepFor = now.getHours() >= 23 || now.getHours() < 6 ? 30 : 3;

        // console.log(result);
        var end = new Date() - start;
        console.log('Fetch Data Time: %dms', end);

        response.end(JSON.stringify(result));
    });
};

const htmlPage = (response, fileName) => {
    response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    var readSream = fs.createReadStream(fileName);
    readSream.pipe(response);
};

const espConfig = (response) => {
    response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    var readSream = fs.createReadStream('esp.json');
    readSream.pipe(response);
};

const notFoundHandler = response => {
    response.writeHead(404, { "Content-Type": "text/html" });
    response.end("<h1>Not found</h1>");
};

var request = require('request');
const send = (params) => {
    request('http://127.0.0.1:8080/json.htm?type=command&param=udevice&' + params, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log(body);
        }
    });
};

const sendSensorValue = (sensorId, value, title) => {
    if (sensorId && value) {
        console.log((title || ('Sensor #' + sensorId)) + ': ' + value);
        send('idx=' + sensorId + '&nvalue=0&svalue=' + value);
    }
};

const espStats = (response) => {
    response.writeHead(200, { "Content-Type": "text/html" });
    response.end("OK");
};

const requestHandler = (request, response) => {

    console.log(request.url);    

        if (request.url.indexOf('?') > 0) {
            var qs = querystring.parse(request.url.substr(request.url.indexOf('?') + 1));

            // Voltage
            sendSensorValue(54, qs.voltage, 'Volts');

            // Wifi Time
            sendSensorValue(56, qs.wifiTime, 'Wifi Time');            

            // Draw Time
            sendSensorValue(57, qs.drawTime, 'Draw Time');

            // Http Time
            sendSensorValue(58, qs.httpTime, 'Http Time');
        }

        switch (request.url.split('?')[0]) {
            case "/":
                htmlPage(response, 'html/index.html');
                break;
            case "/esp":
                htmlPage(response, 'html/esp.html');
                break;
            case "/config":
                espConfig(response);
                break;
            case "/stats":
                espStats(response);
                break;
            case "/json":
                jsonDataHandler(response);
                break;
            default:
                notFoundHandler(response);
        };
    
};

const server = http.createServer(requestHandler);

server.listen(port, (err) => {
    if (err) {
        return console.log('something bad happened', err)
    }

    console.log(`server is listening on ${port}`)
});
