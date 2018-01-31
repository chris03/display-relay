const Config = {
    url: 'http://dd.weather.gc.ca/citypage_weather/xml/QC/s0000712_f.xml',
    forecastsCount: 4
};

var request = require('request');
var libxmljs = require("libxmljs");

function getWeather() {

    return new Promise(function (resolve, reject) {

        request(Config.url, { encoding: 'binary' }, function (error, response, body) {
            if (error) {
                reject(error);
            } else {

                // var xmlString = iconv.decode(new Buffer(body, 'latin1'), 'utf8');

                var xmlDoc = libxmljs.parseXml(body);

                var actual = {
                    'temp': parseFloat(xmlDoc.get('currentConditions/temperature').text()).toFixed(0),
                    'desc': xmlDoc.get('currentConditions/condition').text()
                };

                var warnings = '';//filterEntryByCategory(entries, 'avertissements').map(i => i.title)[0];

                var forecasts = xmlDoc.find('//forecast').splice(0, Config.forecastsCount).map(i => {
                    var when = i.get('period').text();
                    var what = i.get('abbreviatedForecast/textSummary').text();
                    var temp = i.get('temperatures/temperature').text();

                    when = when.replace(' et cette ', '/')
                        .replace('r et n', 'r/n');
                    what = what.replace('moins ', '-')
                        .replace('soleil et de nuages', 'soleil/nuages')
                        .replace('Minimum', 'Min.')
                        .replace('Maximum', 'Max.')
                        .replace('Possibilité', 'Possib.')
                        .replace('d\'averses de', 'de')
                        .replace('alternance', 'alt.')
                        .replace(' près de', '')
                        .replace('pour atteindre', 'à')
                        .replace('zéro', '0')
                        .replace('à la baisse', "↓")
                        .replace('à la hausse', "↑")
                        .replace('Températures', 'Temp.')
                        .replace(' ou ', '/')
                        .replace('au cours de', 'durant')
                        .replace('pluie ou de neige', 'pluie/neige')
                        .replace(' intermittente', '');

                    return {
                        'when': when.charAt(0).toUpperCase() + when.slice(1),
                        'what': what,
                        'temp': temp
                    };
                });

                // Return data
                resolve({
                    'actual': actual,
                    'forecasts': forecasts,
                    'warnings': warnings
                });
            }
        });
    });
}

module.exports.getWeather = getWeather
