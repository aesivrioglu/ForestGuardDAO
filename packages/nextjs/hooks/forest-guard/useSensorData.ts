import { useState, useEffect } from "react";

export type SensorData = {
  temperature: number;
  humidity: number;
  precipitation: number;
  windSpeed: number;
  soilMoisture: number;
  timestamp: string;
};

export const useSensorData = (lat?: number, lon?: number) => {
  const [data, setData] = useState<SensorData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (lat === undefined || lon === undefined) return;

    const fetchSensorData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/sensors?lat=${lat}&lon=${lon}`);
        if (!response.ok) throw new Error("Failed to fetch sensor data");

        const result = await response.json();
        setData(result);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSensorData();
    // Poll every 5 minutes
    const interval = setInterval(fetchSensorData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [lat, lon]);

  return { data, loading, error };
};
