const weather = require('./app/weather.js');
const sensors = require('./app/sensors.js');
const http = require('http');
var fs = require('fs');
const port = 3000

const jsonDataHandler = response => {
    response.setHeader('Content-Type', 'application/json');

    Promise.all([weather.getWeather(), sensors.getSensors()]).then(function (values) {
        var result = {};
        values.forEach(i => Object.assign(result, i));

        // console.log(result);

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

const requestHandler = (request, response) => {

    if (request.url.startsWith('/json')) {
        jsonDataHandler(response);
    } else {
        switch (request.url) {
            case "/":
                htmlPage(response, 'html/index.html');
                break;
            case "/esp":
                htmlPage(response, 'html/esp.html');
                break;
            case "/config":
                espConfig(response);
                break;
            default:
                notFoundHandler(response);
        };
    }
};

const server = http.createServer(requestHandler);

server.listen(port, (err) => {
    if (err) {
        return console.log('something bad happened', err)
    }

    console.log(`server is listening on ${port}`)
});
