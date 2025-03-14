using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.IO;
using System.Text.Json;
using System.Text.Json.Serialization;
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace displayRelay.Services
{
    public class WasteCollectionService
    {
        // Data from https://mascouche.ca/services/services-aux-citoyens/calendrier-des-collectes-dates
        const string FileName = "wasteCollection.json";
        private readonly ILogger<WasteCollectionService> logger;

        private readonly HashSet<DateTime> garbageDates;
        private readonly HashSet<DateTime> recyclingDates;
        private readonly HashSet<DateTime> compostDates;
        private readonly HashSet<DateTime> bulkyItemDates;

        public WasteCollectionService(ILogger<WasteCollectionService> logger)
        {
            this.logger = logger;

            try
            {
                var data = JsonSerializer.Deserialize<WasteCollection>(File.ReadAllText(FileName));

                // Convert lists to HashSet<DateTime> for fast lookup
                this.garbageDates = new HashSet<DateTime>(data.Garbage.ConvertAll(DateTime.Parse));
                this.recyclingDates = new HashSet<DateTime>(data.Recycling.ConvertAll(DateTime.Parse));
                this.compostDates = new HashSet<DateTime>(data.Compost.ConvertAll(DateTime.Parse));
                this.bulkyItemDates = new HashSet<DateTime>(data.BulkyItems.ConvertAll(DateTime.Parse));

            }
            catch (Exception ex)
            {
                this.logger.LogError($"Failed to pase {FileName}: {ex.Message}", ex);
            }
        }

        public string GetNextCollection()
        {
            const int ShowAfterHour = 17;
            const int HideAfterHour = 9;

            var now = DateTime.Now;
            var collectionType = string.Empty;
            var collectionDate = now.Hour >= ShowAfterHour ? now.AddDays(1).Date : now.Date;


            if (garbageDates.Contains(collectionDate))
            {
                collectionType = "Poubelles";
            }

            if (recyclingDates.Contains(collectionDate))
            {
                collectionType = "Recyclage";
            }

            if (compostDates.Contains(collectionDate))
            {
                collectionType = "Composte";
            }

            if (bulkyItemDates.Contains(collectionDate))
            {
                collectionType = "Encombrants";
            }

            // Hide collection between these hours
            if (now.Hour > HideAfterHour && now.Hour < ShowAfterHour)
            {
                collectionType = string.Empty;
            }

            return collectionType;
        }

        public class WasteCollection
        {
            [JsonPropertyName("garbage")]
            public List<string> Garbage { get; set; }

            [JsonPropertyName("recycling")]
            public List<string> Recycling { get; set; }

            [JsonPropertyName("compost")]
            public List<string> Compost { get; set; }

            [JsonPropertyName("bulky_items")]
            public List<string> BulkyItems { get; set; }
        }
    }
}

