using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using displayRelay.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace displayRelay.Controllers
{
    [ApiController]
    //[Route("[controller]")]
    public class DataController : ControllerBase
    {
        private readonly SensorsService sensorsService;
        private readonly WeatherService weatherService;

        public DataController(SensorsService sensorsService, WeatherService weatherService)
        {
            this.sensorsService = sensorsService;
            this.weatherService = weatherService;
        }

        [HttpGet]
        [Route("graph")]
        public async Task<IActionResult> GetGraphData()
        {
            var data = await sensorsService.FetchGraphDataAsync();

            var json = JsonConvert.SerializeObject(data, Formatting.None);

            return this.Content(json, "application/json", Encoding.UTF8);
        }

        [HttpGet]
        [Route("json")]
        public IActionResult GetSensorsData(decimal voltage = -1, int wifiTime = -1, int drawTime = -1, int httpTime = -1)
        {
            Task.Run(async () =>
            {
                // Voltage
                await SendSensorValue(54, voltage, "Volts");

                // Wifi Time
                await SendSensorValue(56, wifiTime, "Wifi Time");

                // Draw Time
                await SendSensorValue(57, drawTime, "Draw Time");

                // Http Time
                await SendSensorValue(58, httpTime, "Http Time");
            });

            var data = JObject.FromObject(weatherService.Data);
            var sensorData = JObject.FromObject(sensorsService.Data);

            data.Merge(sensorData, new JsonMergeSettings
            {
                MergeArrayHandling = MergeArrayHandling.Merge
            });

            data.Add("sleepFor", sensorsService.CalculateSleepTime());

            var json = data.ToString(Formatting.None);

            return this.Content(json, "application/json", Encoding.UTF8);
        }

        private async Task SendSensorValue(int sensorId, decimal value, string title = "")
        {
            if (value > 0)
            {
                await sensorsService.SendValueAsync(sensorId, value);
            }
        }
    }
}
