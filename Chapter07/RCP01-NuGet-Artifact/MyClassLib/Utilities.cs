using System;
using Newtonsoft.Json;

namespace MyClassLib
{
    public static class Utilities
    {
        public static string SerializeObject<T>(T input)
        {
            string json = JsonConvert.SerializeObject((T)input, Formatting.Indented);
            return json;
        }
    }
}
