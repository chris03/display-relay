const Config = {
    url: 'https://meteo.gc.ca/rss/city/qc-76_f.xml',
    forecastsCount: 3
};

var request = require('request');
var parseString = require('xml2js').parseString;

function filterEntryByCategory(entry) {
    var searchTerms = Array.prototype.slice.call(arguments, 1);
    return entry.filter(i => {
        return searchTerms.some(t => i.category.indexOf(t) >= 0);
    });
}

function parseEntry(entry) {
    return entry.map(i => {
        return {
            'title': i.title[0],
            'category': i.category[0].$.term,
            // 'summary': i.summary[0]['_']
        };
    });
}

function getWeather() {

    return new Promise(function (resolve, reject) {

        request(Config.url, function (error, response, body) {
            if (error) {
                reject(error);
            } else {
                parseString(body, function (err, result) {
                    var entries = parseEntry(result.feed.entry);

                    var actual = filterEntryByCategory(entries, 'actuelles').map(i => {
                        var pos1 = i.title.indexOf(':');
                        var pos2 = i.title.indexOf(',')
                        return {
                            'temp': i.title.substring(pos2 + 1).trim(),
                            'desc': i.title.substring(pos1, pos2).trim()
                        };
                    })[0];

                    var warnings = filterEntryByCategory(entries, 'avertissements').map(i => i.title)[0];

                    var forecasts = filterEntryByCategory(entries, 'Prévisions').splice(0, Config.forecastsCount).map(i => {
                        var pos1 = i.title.indexOf(':');
                        return {
                            'when': i.title.substring(0, pos1).trim(),
                            'what': i.title.substring(pos1 + 1).trim()
                        };
                    });

                    // Return data
                    resolve({
                        'actual': actual,
                        'forecasts': forecasts,
                        'warnings': warnings
                    });

                });
            }
        });
    });
}

module.exports.getWeather = getWeather