using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using CronScheduler.Extensions.Scheduler;
using displayRelay.Services;
using Microsoft.Extensions.Logging;

namespace displayRelay.Jobs
{
    internal class UpdateWeatherJob : IScheduledJob
    {
        private readonly WeatherService weatherService;
        private readonly ILogger<UpdateWeatherJob> logger;

        public UpdateWeatherJob(WeatherService weatherService, ILogger<UpdateWeatherJob> logger)
        {
            this.weatherService = weatherService;
            this.logger = logger;
        }

        public string Name => nameof(UpdateWeatherJob);

        public async Task ExecuteAsync(CancellationToken cancellationToken)
        {
            try
            {
                await weatherService.UpdateAsync();
            }
            catch (Exception e)
            {
                this.logger.LogError(e, "Weather update failed: {Error}", e.Message);
            }
        }
    }
}
