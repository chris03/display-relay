const request = require('request');
const util = require('util');

const sensors = [
    //    { id: 48, name: 'flow', type: 'Percentage' },
    //    { id: 47, name: 'lux', type: 'counter' },
    { id: 45, name: 'tempOut', type: 'temp' },
    //    { id: 43, name: 'tempPool', type: 'temp' },
    //    { id: 46, name: 'tempHeater', type: 'temp' },
    //    { id: 52, name: 'energy', type: 'counter' },
    { id: 61, name: 'solarVolt', type: 'counter' },
    { id: 62, name: 'solarCurent', type: 'counter' },
    { id: 63, name: 'solarBat', type: 'counter' },
    //    { id: 64, name: 'waterLevel', type: 'counter' }
];

const get = function (url) {
    return new Promise((resolve, reject) => {
        request(url, (error, response, body) => {
            if (error) {
                reject(error);
            } else {
                try {
                    resolve(JSON.parse(body));
                }
                catch (e) {
                    console.error('Server response: ', body);
                    reject(e);
                }
            }
        });
    });
}

module.exports.getSensorsGraph = function (serverUrl, callback) {
    let obj = {};
    const start = new Date()

    // Get current sensor data
    get(serverUrl + '/json.htm?type=devices&filter=all&used=true&plan=0').then(data => {

        console.log(data);

        if (data && data.status === 'OK') {
            sensors.forEach(item => {
                var itemData = data.result.find(i => i.idx === item.id.toString());

                obj[item.name] = (itemData ? {
                    data: {
                        text: itemData.Data,
                        temp: itemData.Temp,
                        voltage: itemData.Voltage
                    }
                } : {});
            });
        } else {
            console.error("Failed to get sensor data.");
        }

        // Get garph data
        Promise.all(sensors.map(async (item) => {
            let url = util.format('%s/json.htm?type=graph&sensor=%s&idx=%s&range=day', serverUrl, item.type, item.id);
            let response = get(url);

            try {
                let parsedResponse = await response;
                if (parsedResponse.status === 'OK') {
                    obj[item.name].graph = parsedResponse.result;
                } else {
                    throw 'Status is NOT OK!';
                }
            }
            catch (e) {
                console.error(item.name + ' failed.', e);
            }

            return response;

        })).then(function () {
            obj.outputTime = new Date() - start;

            callback(obj);
        });
    });
};