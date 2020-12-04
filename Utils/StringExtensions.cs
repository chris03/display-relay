using System;
using System.Linq;

namespace displayRelay.Utils
{
    public static class StringExtensions
    {
        public static string Capitalize(this string input) =>
            input switch
            {
                null => null,
                "" => string.Empty,
                _ => input.First().ToString().ToUpper() + input.Substring(1)
            };
    }
}
