const weather = require('./app/weather.js');
const http = require('http')
const port = 3000

const requestHandler = (request, response) => {
    console.log('Request: ', request.url);

    response.setHeader('Content-Type', 'application/json');

    weather.getWeather().then(function (data) {
//        console.log(data);

        response.end(JSON.stringify(data));
    });
};

const server = http.createServer(requestHandler);

server.listen(port, (err) => {
    if (err) {
        return console.log('something bad happened', err)
    }

    console.log(`server is listening on ${port}`)
});
