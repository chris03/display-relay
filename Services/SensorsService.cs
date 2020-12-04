using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace displayRelay.Services
{
    public class SensorsService
    {
        private static readonly TimeSpan MaxIdleTime = TimeSpan.FromMinutes(10);

        private static readonly Sensor[] SensorsForGraph = {
            //    { id: 48, name: 'flow', type: 'Percentage' },
            //    { id: 47, name: 'lux', type: 'counter' },
            new Sensor{ Id= 45, Name= "tempOut", Type= "temp" },
            new Sensor{ Id= 43, Name= "tempPool", Type= "temp" },
            //    { id: 46, name: 'tempHeater', type: 'temp' },
            //    { id: 52, name: 'energy', type: 'counter' },
            new Sensor{ Id= 61, Name= "solarVolt", Type= "counter" },
            new Sensor{ Id= 62, Name= "solarCurent", Type= "counter" },
            new Sensor{ Id= 63, Name= "solarBat", Type= "counter" },
            //    { id: 64, name: 'waterLevel', type: 'counter' }
            //new Sensor{Id = 25, Name="Forecast", Type = "temp"}
        };

        class Sensor
        {
            public int Id { get; set; }

            public string Name { get; set; }

            public string Type { get; set; }
        }

        private readonly HttpClient httpClient;
        private readonly Config config;
        private readonly ILogger<SensorsService> logger;

        public SensorsService(HttpClient httpClient, Config config, ILogger<SensorsService> logger)
        {
            this.httpClient = httpClient;
            this.config = config;
            this.logger = logger;
        }

        public object Data { get; private set; } = new { };

        public async Task<bool> SendValueAsync(int sensorId, decimal value)
        {
            var url = $"{config.DomoticzServerUrl}/json.htm?type=command&param=udevice&idx={sensorId}&nvalue=0&svalue={value}";

            var result = await httpClient.GetAsync(url);

            return result.IsSuccessStatusCode;
        }

        public async Task<object> FetchGraphDataAsync()
        {
            var stopwatch = Stopwatch.StartNew();
            var data = new ConcurrentDictionary<string, object>();

            var sensorsData = await GetJsonAsync($"{config.DomoticzServerUrl}/json.htm?type=devices&filter=all&used=true&plan=0");

            if (sensorsData.Value<string>("status") == "OK")
            {
                var tasks = SensorsForGraph.Select(async sensor =>
                {
                    var itemData = sensorsData["result"].FirstOrDefault(x => x["idx"].Value<int>() == sensor.Id);

                    // Graph data
                    var sensorGraphData = await GetJsonAsync($"{config.DomoticzServerUrl}/json.htm?type=graph&sensor={sensor.Type}&idx={sensor.Id}&range=day");

                    if (itemData != null)
                    {
                        data.TryAdd(sensor.Name, new
                        {
                            data = new
                            {
                                text = itemData["Data"],
                                temp = itemData["Temp"],
                                voltage = itemData["Voltage"],
                                current = itemData["Current"],
                                lastUpdate = itemData["LastUpdate"]
                            },
                            graph = sensorGraphData["result"]
                        });
                    }
                });
                await Task.WhenAll(tasks);
            }

            stopwatch.Stop();

            data["outputTime"] = stopwatch.ElapsedMilliseconds;

            return data;
        }

        public async Task UpdateAsync()
        {
            var stopwatch = Stopwatch.StartNew();

            var jObject = await GetJsonAsync($"{config.DomoticzServerUrl}/json.htm?type=devices&filter=all&used=true");

            var sensors = jObject["result"].ToDictionary(x => x["idx"]);
            var serverTime = jObject["ServerTime"].Value<DateTime>();

            // Helper functions
            T GetValue<T>(int id, string name) => sensors.ContainsKey(id.ToString()) ? sensors[id.ToString()][name].Value<T>() : default;
            decimal GetDecimal(int id, string name, int digits = 2) => Math.Round(GetValue<decimal>(id, name), digits);
            bool IsUp(int id) => serverTime - GetValue<DateTime>(id, "LastUpdate") < MaxIdleTime;

            // Update data
            this.Data = new
            {
                pool = new
                {
                    water = GetDecimal(43, "Temp"),
                    ma = GetDecimal(62, "Current") * 1000,
                    volt = GetDecimal(63, "Voltage"),
                    //heat= getValue(sensors, 46, "Temp"),
                    //flow= getValue(sensors, 48, "Data"),
                    //lux= getValue(sensors, 47, "Data"),
                    //energy= getValue(sensors, 52, "Data"),
                    //pump= getValue(sensors, 49, "Data"),
                    up = IsUp(43)
                },
                air = new
                {
                    name = GetValue<string>(71, "Name"),
                    temp = GetDecimal(71, "Temp"),
                    air = GetValue<string>(69, "Data"),
                    airQ = GetValue<string>(69, "Quality"),
                    up = IsUp(71)
                },
                sensors = new object[]
                {
                        // Exterieur
                        new  {
                            name = GetValue<string>( 45, "Name"),
                            temp = GetDecimal(45, "Temp"),
                            hum = GetDecimal(45, "Humidity"),
                            up = IsUp( 45)
                        },
                        // ESP-RFM-Relay
                        new {
                            name = GetValue<string>( 51, "Name"),
                            temp = GetDecimal(51, "Temp"),
                            hum = GetDecimal(51, "Humidity"),
                            up = IsUp( 51)
                        },
                        // Arduino2
                        new  {
                            name = GetValue<string>( 38, "Name"),
                            temp = GetDecimal(38, "Temp"),
                            hum = GetDecimal(38, "Humidity"),
                            volt = GetDecimal(44, "Voltage"),
                            up = IsUp( 38)
                        },
                        // Arduino1
                        new  {
                            name = GetValue<string>( 39, "Name"),
                            temp = GetValue<string>( 39, "Temp"),
                            hum = GetDecimal(39, "Humidity"),
                            volt = GetDecimal(42, "Voltage"),
                            up = IsUp( 39)
                        },
                        // Arduino3 (Garage) id= 59 id volt= 60
                        // Arduino4 72,73
                        new   {
                            name = GetValue<string>( 72, "Name"),
                            temp = GetDecimal(72, "Temp"),
                            hum = GetDecimal(72, "Humidity"),
                            volt = GetDecimal(73, "Voltage"),
                            up = IsUp( 72)
                        }
                }
            };


            stopwatch.Stop();
            logger.LogInformation("Updated weather data in {0}ms", stopwatch.ElapsedMilliseconds);
        }

        private async Task<JToken> GetJsonAsync(string url)
        {
            await using var stream = await httpClient.GetStreamAsync(url);

            return await JToken.ReadFromAsync(new JsonTextReader(new StreamReader(stream)));
        }
    }
}