using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using CronScheduler.Extensions.Scheduler;
using displayRelay.Services;

namespace displayRelay.Jobs
{
    internal class UpdateWeatherJob : IScheduledJob
    {
        private readonly WeatherService weatherService;

        public UpdateWeatherJob(WeatherService weatherService)
        {
            this.weatherService = weatherService;
        }

        public string Name => nameof(UpdateWeatherJob);

        public async Task ExecuteAsync(CancellationToken cancellationToken)
        {
            await weatherService.UpdateAsync();
        }
    }
}
