using displayRelay.Jobs;
using displayRelay.Services;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using System.Net.Http;

namespace displayRelay
{
    public class Startup
    {
        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        public IConfiguration Configuration { get; }

        public void ConfigureServices(IServiceCollection services)
        {
            services.AddControllers();

            // Setup config object
            var config = new Config();
            Configuration.GetSection("Config").Bind(config, options =>
            {
                options.BindNonPublicProperties = true;
            });

            // IoC config
            services.AddSingleton(config);
            services.AddSingleton<HttpClient>();
            services.AddSingleton<SensorsService>();
            services.AddSingleton<WeatherService>();
            services.AddSingleton<WasteCollectionService>();

            // Job Scheduling
            services.AddScheduler(ctx =>
            {
                ctx.AddJob<UpdateSensorsJob>(configure: options =>
                {
                    options.RunImmediately = true;
                    options.CronSchedule = config.UpdateSensorsJobCron;
                });
                ctx.AddJob<UpdateWeatherJob>(configure: options =>
                {
                    options.RunImmediately = true;
                    options.CronSchedule = config.UpdateWeatherJobCron;
                });
            });
        }

        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }

            app.UseDefaultFiles();
            app.UseStaticFiles();

            app.UseRouting();

            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllers();
            });
        }
    }
}
