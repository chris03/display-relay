var request = require('request');

function getValue(sensors, id, property) {
    var sensor = sensors.find(s => s.idx == id);
    return sensor == undefined || sensor[property] == undefined ? undefined : sensor[property];
}

function getFloat(sensors, id, property, precision) {
    var sensor = sensors.find(s => s.idx == id);
    return sensor == undefined || sensor[property] == undefined ? '' : parseFloat(sensor[property]).toFixed(precision || 0);
}

function isUp(sensors, id) {
    var result = false;
    var sensor = sensors.find(s => s.idx == id);

    if (sensor != undefined && sensor['LastUpdate'] != undefined) {
        var now = new Date();
        var lastUpdate = new Date(sensor['LastUpdate']);

        // Total minutes difference
        var diff = Math.abs(now - lastUpdate);
        result = Math.floor((diff / 1000) / 60) <= 10;
    }

    return result;
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

function getSensors(serverUrl) {

    return new Promise(function (resolve, reject) {

        request(serverUrl + '/json.htm?type=devices&filter=all&used=true', function (error, response, body) {
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
                        up: isUp(sensors, 43)
                    },
                    sensors: [
                        {
                            name: getValue(sensors, 45, 'Name'),
                            temp: getValue(sensors, 45, 'Temp'),
                            hum: getValue(sensors, 45, 'Humidity'),
                            up: isUp(sensors, 45)
                        },
                        {
                            name: getValue(sensors, 51, 'Name'),
                            temp: getValue(sensors, 51, 'Temp'),
                            hum: getValue(sensors, 51, 'Humidity'),
                            up: isUp(sensors, 51)
                        },
                        {
                            name: getValue(sensors, 38, 'Name'),
                            temp: getValue(sensors, 38, 'Temp'),
                            hum: getValue(sensors, 38, 'Humidity'),
                            volt: getValue(sensors, 44, 'Voltage', 2),
                            up: isUp(sensors, 38)
                        },
                        {
                            name: getValue(sensors, 39, 'Name'),
                            temp: getValue(sensors, 39, 'Temp'),
                            hum: getValue(sensors, 39, 'Humidity'),
                            volt: getValue(sensors, 42, 'Voltage', 2),
                            up: isUp(sensors, 39)
                        },
                        {
                            name: getValue(sensors, 59, 'Name'),
                            temp: getValue(sensors, 59, 'Temp'),
                            hum: getValue(sensors, 59, 'Humidity'),
                            volt: getValue(sensors, 60, 'Voltage', 2),
                            up: isUp(sensors, 59)
                        }]
                });
            }
        });
    });
}

module.exports.getSensors = getSensors;
