var request = require('request');

function getValue(sensors, id, property) {
    var sensor = sensors.find(s => s.idx == id);
    return sensor == undefined || sensor[property] == undefined ? undefined : sensor[property];
}

function getFloat(sensors, id, property, precision) {
    var sensor = sensors.find(s => s.idx == id);
    return sensor == undefined || sensor[property] == undefined ? '' : parseFloat(sensor[property]).toFixed(precision || 0);
}

function isUp(sensors, id, serverTime) {
    var result = false;
    var sensor = sensors.find(s => s.idx == id);

    if (sensor != undefined && sensor['LastUpdate'] != undefined) {
        var now = new Date(serverTime);
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
                var parsedBody = JSON.parse(body);
                var sensors = parsedBody.result;
                // Return data
                resolve({
                    pool: {
                        water: getValue(sensors, 43, 'Temp'),
                        ma: getValue(sensors, 62, 'Current') * 1000,
                        volt: getValue(sensors, 63, 'Voltage', 2),
                        //heat: getValue(sensors, 46, 'Temp'),
                        //flow: getValue(sensors, 48, 'Data'),
                        //lux: getValue(sensors, 47, 'Data'),
                        //energy: getValue(sensors, 52, 'Data'),
                        //pump: getValue(sensors, 49, 'Data'),
                        up: isUp(sensors, 43, parsedBody.ServerTime)
                    },
                    air: {
                        name: getValue(sensors, 71, 'Name'),
                        temp: getValue(sensors, 71, 'Temp'),
                        air: getValue(sensors, 69, 'Data'),
                        airQ: getValue(sensors, 69, 'Quality'),
                        up: isUp(sensors, 71, parsedBody.ServerTime)
                    },
                    sensors: [
                        // Exterieur
                        {
                            name: getValue(sensors, 45, 'Name'),
                            temp: getValue(sensors, 45, 'Temp'),
                            hum: getValue(sensors, 45, 'Humidity'),
                            up: isUp(sensors, 45, parsedBody.ServerTime)
                        },
                        // ESP-RFM-Relay
                        {
                            name: getValue(sensors, 51, 'Name'),
                            temp: getValue(sensors, 51, 'Temp'),
                            hum: getValue(sensors, 51, 'Humidity'),
                            up: isUp(sensors, 51, parsedBody.ServerTime)
                        },
                        // Arduino2
                        {
                            name: getValue(sensors, 38, 'Name'),
                            temp: getValue(sensors, 38, 'Temp'),
                            hum: getValue(sensors, 38, 'Humidity'),
                            volt: getValue(sensors, 44, 'Voltage', 2),
                            up: isUp(sensors, 38, parsedBody.ServerTime)
                        },
                        // Arduino1
                        {
                            name: getValue(sensors, 39, 'Name'),
                            temp: getValue(sensors, 39, 'Temp'),
                            hum: getValue(sensors, 39, 'Humidity'),
                            volt: getValue(sensors, 42, 'Voltage', 2),
                            up: isUp(sensors, 39, parsedBody.ServerTime)
                        },
                        // Arduino3 (Garage) id: 59 id volt: 60
                        // Arduino4 72,73
                        {
                            name: getValue(sensors, 72, 'Name'),
                            temp: getValue(sensors, 72, 'Temp'),
                            hum: getValue(sensors, 72, 'Humidity'),
                            volt: getValue(sensors, 73, 'Voltage', 2),
                            up: isUp(sensors, 72, parsedBody.ServerTime)
                        }]
                });
            }
        });
    });
}

module.exports.getSensors = getSensors;
