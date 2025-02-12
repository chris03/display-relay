using System;
using System.Diagnostics;
using System.Linq;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using System.Xml;
using System.Xml.Linq;
using System.Xml.XPath;
using displayRelay.Utils;
using Microsoft.Extensions.Logging;

namespace displayRelay.Services
{
    public class WeatherService
    {
        private const int ForecastCount = 4;

        private readonly HttpClient httpClient;
        private readonly Config config;
        private readonly ILogger<WeatherService> logger;

        public WeatherService(HttpClient httpClient, Config config, ILogger<WeatherService> logger)
        {
            this.httpClient = httpClient;
            this.config = config;
            this.logger = logger;
        }

        public object Data { get; private set; } = new { };

        public async Task UpdateAsync()
        {
            var stopwatch = Stopwatch.StartNew();

            // Get XML document
            await using var stream = await httpClient.GetStreamAsync(config.WeatherXmlUrl);
            var xmlDoc = XElement.Load(stream);

            var actual = new
            {
                temp = Math.Round(decimal.Parse(xmlDoc.XPathSelectElement("currentConditions/temperature").Value)),
                desc = xmlDoc.XPathSelectElement("currentConditions/condition").Value
            };

            var xmlWarnings = xmlDoc.XPathSelectElement("warnings/event");
            var warnings = xmlWarnings?.Attribute("description")?.Value.Replace(" EN VIGUEUR", string.Empty) ?? string.Empty;

            var forecasts = xmlDoc.XPathSelectElements("//forecast")
                .Take(ForecastCount)
                .Select(i =>
                {
                    var when = i.XPathSelectElement("period")?.Value ?? string.Empty;
                    var temp = int.Parse(i.XPathSelectElement("temperatures/temperature")?.Value ?? string.Empty);
                    var what = i.XPathSelectElement("abbreviatedForecast/textSummary").Value;
                    var iconCode = int.Parse(i.XPathSelectElement("abbreviatedForecast/iconCode").Value);

                    var accumulationAmountElement = i.XPathSelectElement("precipitation/accumulation/amount");
                    var accumulationAmount = accumulationAmountElement == null
                        ? string.Empty
                        : accumulationAmountElement.Value + accumulationAmountElement.Attribute("units").Value;

                    when = when
                        .Replace("ce soir et cette nuit", "cette nuit")
                        .Replace("soir et nuit", "nuit")
                        .Replace("dimanche", "dim")
                        .Replace("lundi", "lun")
                        .Replace("mardi", "mar")
                        .Replace("mercredi", "mer")
                        .Replace("jeudi", "jeu")
                        .Replace("vendredi", "ven")
                        .Replace("samedi", "sam");

                    what = what.Replace("moins ", "-")
                        .Replace("de soleil et de nuages", "soleil/nuages")
                        .Replace("Minimum", "Min.")
                        .Replace("Maximum", "Max.")
                        .Replace("Possibilité", "Pos.")
                        .Replace("Partiellement", "Part.")
                        .Replace("d'averses de", "de")
                        .Replace("Alternance ", "")
                        .Replace(" près de", "")
                        .Replace("pour atteindre", "à")
                        .Replace("zéro", "0")
                        .Replace("à la baisse", "↓")
                        .Replace("à la hausse", "↑")
                        .Replace("Températures", "Temp.")
                        .Replace("au cours de", "durant")
                        .Replace("verglaçante", "verg.")
                        .Replace("pluie ou de neige", "pluie/neige")
                        .Replace("soleil et de nuages", "soleil/nuages")
                        .Replace("intermittente", "inter.")
                        .Replace("Généralement ", "")
                        .Replace("Quelques", "±")
                        .Replace("parfois", "~")
                        .Replace("averses de ", "")
                        .Replace(" ou ", "/")
                        .Replace("de neige/de pluie", "neige/pluie");

                    return new
                    {
                        when = when.Capitalize(),
                        what = what.Capitalize(),
                        temp = temp,
                        icon = iconCode,
                        accu = accumulationAmount
                    };
                })
                .ToList();

            this.Data = new
            {
                actual,
                forecasts,
                warnings
            };

            stopwatch.Stop();
            logger.LogInformation("Updated weather data in {0}ms", stopwatch.ElapsedMilliseconds);

            await Task.CompletedTask;
        }
    }
}
