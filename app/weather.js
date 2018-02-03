const Config = {
    url: 'http://dd.weather.gc.ca/citypage_weather/xml/QC/s0000712_f.xml',
    // url: 'http://dd.weather.gc.ca/citypage_weather/xml/ON/s0000418_e.xml',
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

                var xmlDoc = libxmljs.parseXml(body);

                var actual = {
                    'temp': parseFloat(xmlDoc.get('currentConditions/temperature').text()).toFixed(0),
                    'desc': xmlDoc.get('currentConditions/condition').text()
                };

                var xmlWarnings = xmlDoc.get('warnings/event');
                var warnings = xmlWarnings && xmlWarnings.attr('description') ? xmlWarnings.attr('description').value() : '';

                var forecasts = xmlDoc.find('//forecast').splice(0, Config.forecastsCount).map(i => {
                    var when = i.get('period').text();
                    var temp = i.get('temperatures/temperature').text();
                    var what = i.get('abbreviatedForecast/textSummary').text();
                    var iconCode = i.get('abbreviatedForecast/iconCode').text();
                    var accumulationAmount = i.get('precipitation/accumulation/amount');

                    accumulationAmount = accumulationAmount ? accumulationAmount.text() + accumulationAmount.attr('units').value() : '';

                    when = when.replace(' et cette ', '/')
                        .replace('r et n', 'r/n')
                        .replace('Dimanche','Dim')
                        .replace('Lundi','Lun')
                        .replace('Mardi','Mar')
                        .replace('Mercredi','Mer')
                        .replace('Jeudi','Jeu')
                        .replace('Vendredi','Ven')
                        .replace('Samedi','Sam');

                    what = what.replace('moins ', '-')
                        .replace('soleil et de nuages', 'soleil/nuages')
                        .replace('Minimum', 'Min.')
                        .replace('Maximum', 'Max.')
                        .replace('Possibilité', 'Possib.')
                        .replace('d\'averses de', 'de')
                        .replace('lternance', 'lt.')
                        .replace(' près de', '')
                        .replace('pour atteindre', 'à')
                        .replace('zéro', '0')
                        .replace('à la baisse', "↓")
                        .replace('à la hausse', "↑")
                        .replace('Températures', 'Temp.')
                        .replace('au cours de', 'durant')
                        .replace('pluie ou de neige', 'pluie/neige')
                        .replace('soleil et de nuages', 'soleil/nuages')
                        .replace('intermittente', 'inter.')
                        .replace(' ou ', '/');

                    return {
                        'when': when.charAt(0).toUpperCase() + when.slice(1),
                        'what': what,
                        'temp': temp,
                        'icon': iconCode,
                        'accu': accumulationAmount
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
