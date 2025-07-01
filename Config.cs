namespace displayRelay
{
    public sealed class Config
    {
        public string DomoticzServerUrl { get; private set; }

        public string WeatherBaseUrl { get; private set; }

        public string WeatherCityCode { get; private set; }

        public string WeatherLang { get; private set; }

        public string UpdateSensorsJobCron { get; private set; }

        public string UpdateWeatherJobCron { get; private set; }

        public string TimeZone { get; private set; }
    }
}
