const Config = {
    url: 'http://192.168.1.3:8080/json.htm?type=devices&filter=all&used=true'
};

var request = require('request');

function getValue(sensors, id, property) {
    var sensor = sensors.find(s => s.idx == id);
    return sensor == undefined || sensor[property] == undefined ? '' : sensor[property].toString();
}

function getFloat(sensors, id, property) {
    var sensor = sensors.find(s => s.idx == id);
    return sensor == undefined || sensor[property] == undefined ? '' : parseFloat(sensor[property]).toFixed(0).toString();
}

function getSensors() {

    return new Promise(function (resolve, reject) {

        request(Config.url, function (error, response, body) {
            if (error) {
                reject(error);
            } else {
                var sensors = JSON.parse(body).result;
                // Return data
                resolve({
                    pool: {
                        water: getFloat(sensors, 43, 'Temp') + '°',
                        heat: getFloat(sensors, 46, 'Temp') + '°',
                        flow: getValue(sensors, 48, 'Data'),
                        lux: getValue(sensors, 47, 'Data'),
                        energy: getValue(sensors, 52, 'Data'),
                        pump: getValue(sensors, 49, 'Data'),
                    },
                    outside: {
                        temp: getFloat(sensors, 45, 'Temp') + '°',
                        hum: getValue(sensors, 45, 'Humidity') + '%',
                    },
                    air: {
                        temp: getFloat(sensors, 51, 'Temp') + '°',
                        hum: getValue(sensors, 51, 'Humidity') + '%',
                    },
                    arduino1: {
                        temp: getFloat(sensors, 38, 'Temp') + '°',
                        hum: getValue(sensors, 38, 'Humidity') + '%',
                        volt: getFloat(sensors, 44, 'Voltage'),
                    },
                    arduino2: {
                        temp: getFloat(sensors, 39, 'Temp'),
                        hum: getValue(sensors, 39, 'Humidity'),
                        volt: getFloat(sensors, 42, 'Voltage'),
                    }
                });
            }
        });
    });
}

module.exports.getSensors = getSensors;
