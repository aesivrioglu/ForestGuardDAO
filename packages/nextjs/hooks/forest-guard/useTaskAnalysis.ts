import { useState } from "react";
import { SensorData } from "./useSensorData";

export type RecommendedTask = {
  title: string;
  description: string;
  category: number;
  priority: number;
  suggestedReward: number; // In MON
};

export const useTaskAnalysis = () => {
  const [tasks, setTasks] = useState<RecommendedTask[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeSensors = async (sensorData: SensorData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/sensors/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sensorData),
      });
      
      if (!response.ok) throw new Error("Analysis failed");
      
      const result = await response.json();
      setTasks(result.tasks);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { analyzeSensors, recommendedTasks: tasks, loading, error };
};
