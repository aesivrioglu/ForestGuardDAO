import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");

  if (!lat || !lon) {
    return NextResponse.json({ error: "Missing lat or lon parameters" }, { status: 400 });
  }

  try {
    // Open-Meteo API (Free, no API key required)
    // Fetching: temperature, humidity, precipitation, wind_speed, soil_moisture_0_to_7cm
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m&hourly=soil_moisture_0_to_7cm&forecast_days=1`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Open-Meteo API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Process the data to return a clean sensor object
    const current = data.current;
    const soilMoisture = data.hourly.soil_moisture_0_to_7cm[0] ?? 0.2; // fallback if missing

    return NextResponse.json({
      temperature: current.temperature_2m, // °C
      humidity: current.relative_humidity_2m, // %
      precipitation: current.precipitation, // mm
      windSpeed: current.wind_speed_10m, // km/h
      soilMoisture: soilMoisture, // m³/m³
      timestamp: current.time
    });

  } catch (error) {
    console.error("Sensor API Error:", error);
    return NextResponse.json({ error: "Failed to fetch sensor data" }, { status: 500 });
  }
}
