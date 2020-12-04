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
    internal class UpdateSensorsJob : IScheduledJob
    {
        private readonly SensorsService sensorsService;

        public UpdateSensorsJob(SensorsService sensorsService)
        {
            this.sensorsService = sensorsService;
        }

        public string Name => nameof(UpdateSensorsJob);

        public async Task ExecuteAsync(CancellationToken cancellationToken)
        {
            await sensorsService.UpdateAsync();
        }
    }
}
