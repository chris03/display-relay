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
                    'temp': parseFloat(xmlDoc.get('currentConditions/temperature').text()).toFixed(0) + '°',
                    'desc': xmlDoc.get('currentConditions/condition').text()
                };

                var xmlWarnings = xmlDoc.get('warnings/event');
                var warnings = xmlWarnings && xmlWarnings.attr('description') ? xmlWarnings.attr('description').value() : '';
                warnings = warnings.replace(' EN VIGUEUR', '');

                var forecasts = xmlDoc.find('//forecast').splice(0, Config.forecastsCount).map(i => {
                    var when = i.get('period').text();
                    var temp = i.get('temperatures/temperature').text() + '°';
                    var what = i.get('abbreviatedForecast/textSummary').text();
                    var iconCode = i.get('abbreviatedForecast/iconCode').text();
                    var accumulationAmount = i.get('precipitation/accumulation/amount');

                    accumulationAmount = accumulationAmount ? accumulationAmount.text() + accumulationAmount.attr('units').value() : '';

                    when = when
                        .replace('ce soir et cette nuit', 'cette nuit')
                        .replace('soir et nuit', 'nuit')
                        .replace('dimanche', 'dim')
                        .replace('lundi', 'lun')
                        .replace('mardi', 'mar')
                        .replace('mercredi', 'mer')
                        .replace('jeudi', 'jeu')
                        .replace('vendredi', 'ven')
                        .replace('samedi', 'sam');

                    what = what.replace('moins ', '-')
                        .replace('de soleil et de nuages', 'soleil/nuages')
                        .replace('Minimum', 'Min.')
                        .replace('Maximum', 'Max.')
                        .replace('Possibilité', 'P.')
                        .replace('Partiellement', 'Part.')
                        .replace('d\'averses de', 'de')
                        .replace('Alternance ', '')
                        .replace(' près de', '')
                        .replace('pour atteindre', 'à')
                        .replace('zéro', '0')
                        .replace('à la baisse', "↓")
                        .replace('à la hausse', "↑")
                        .replace('Températures', 'Temp.')
                        .replace('au cours de', 'durant')
                        .replace('verglaçante', 'verg.') 
                        .replace('pluie ou de neige', 'pluie/neige')
                        .replace('soleil et de nuages', 'soleil/nuages')
                        .replace('intermittente', 'inter.')
                        .replace('Généralement ', '')
                        .replace('Quelques', '±')
                        .replace('averses de ', '')
                        .replace(' ou ', '/');

                    return {
                        'when': when.charAt(0).toUpperCase() + when.slice(1),
                        'what': what.charAt(0).toUpperCase() + what.slice(1),
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
