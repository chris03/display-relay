namespace displayRelay
{
    public sealed class Config
    {
        public string DomoticzServerUrl { get; private set; }

        public string WeatherXmlUrl { get; private set; }

        public string UpdateSensorsJobCron { get; private set; }

        public string UpdateWeatherJobCron { get; private set; }
    }
}
