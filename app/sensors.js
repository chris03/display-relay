const Config = {
    url: 'http://10.13.37.3:8080/json.htm?type=devices&filter=all&used=true'
};

var request = require('request');

function getValue(sensors, id, property) {
    var sensor = sensors.find(s => s.idx == id);
    return sensor == undefined || sensor[property] == undefined ? undefined : sensor[property];
}

function getFloat(sensors, id, property, precision) {
    var sensor = sensors.find(s => s.idx == id);
    return sensor == undefined || sensor[property] == undefined ? '' : parseFloat(sensor[property]).toFixed(precision || 0);
}

function formatNegativeNumber(val) {
    var result = val.toString();

    if (Math.abs(val) < 10) {
        result = " " + result;
    }

    if (val > 0) {
        result = " " + result;
    }
    return result;
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
                        water: getValue(sensors, 43, 'Temp'),
                        heat: getValue(sensors, 46, 'Temp'),
                        flow: getValue(sensors, 48, 'Data'),
                        lux: getValue(sensors, 47, 'Data'),
                        energy: getValue(sensors, 52, 'Data'),
                        pump: getValue(sensors, 49, 'Data'),
                    },
                    outside: {
                        temp: getValue(sensors, 45, 'Temp'),
                        hum: getValue(sensors, 45, 'Humidity'),
                    },
                    air: {
                        temp: getValue(sensors, 51, 'Temp'),
                        hum: getValue(sensors, 51, 'Humidity'),
                    },
                    arduino1: {
                        temp: getValue(sensors, 38, 'Temp'),
                        hum: getValue(sensors, 38, 'Humidity'),
                        volt: getValue(sensors, 44, 'Voltage', 2),
                    },
                    arduino2: {
                        temp: getValue(sensors, 39, 'Temp'),
                        hum: getValue(sensors, 39, 'Humidity'),
                        volt: getValue(sensors, 42, 'Voltage', 2),
                    },
                    garage: {
                        temp: getValue(sensors, 59, 'Temp'),
                        hum: getValue(sensors, 59, 'Humidity'),
                        volt: getValue(sensors, 60, 'Voltage', 2),
                    },
                });
            }
        });
    });
}

module.exports.getSensors = getSensors;
