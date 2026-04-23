"use client";

import React, { useState } from "react";
import { useSensorData } from "~~/hooks/forest-guard/useSensorData";
import { useTaskAnalysis } from "~~/hooks/forest-guard/useTaskAnalysis";
import { SensorCard } from "~~/components/forest-guard/SensorCard";

export default function SensorsPage() {
  const [lat, setLat] = useState("38.730000");
  const [lon, setLon] = useState("35.480000");

  const { data: sensorData, loading: sensorLoading, error: sensorError } = useSensorData(parseFloat(lat), parseFloat(lon));
  const { analyzeSensors, recommendedTasks, loading: analysisLoading } = useTaskAnalysis();

  const handleAnalyze = () => {
    if (sensorData) {
      analyzeSensors(sensorData);
    }
  };

  return (
    <div className="py-8 px-4 sm:px-8 max-w-7xl mx-auto flex flex-col gap-8">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-info to-cyan-700 bg-clip-text text-transparent">Sensör Paneli</h1>
        <p className="text-base-content/70 mt-2">Belirtilen koordinatlardaki IoT/API verilerini anlık izleyin ve otonom görev önerilerini görün.</p>
      </div>

      <div className="card bg-base-100 shadow-md border border-base-300 p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <label className="form-control w-full sm:w-1/3">
            <div className="label"><span className="label-text">Enlem (Latitude)</span></div>
            <input type="number" step="0.000001" value={lat} onChange={e => setLat(e.target.value)} className="input input-bordered w-full" />
          </label>
          <label className="form-control w-full sm:w-1/3">
            <div className="label"><span className="label-text">Boylam (Longitude)</span></div>
            <input type="number" step="0.000001" value={lon} onChange={e => setLon(e.target.value)} className="input input-bordered w-full" />
          </label>
        </div>
      </div>

      {sensorError ? (
        <div className="alert alert-error">{sensorError}</div>
      ) : sensorLoading ? (
        <div className="flex justify-center py-12"><span className="loading loading-dots loading-lg text-info"></span></div>
      ) : sensorData ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <SensorCard 
            title="Sıcaklık" 
            value={sensorData.temperature} 
            unit="°C" 
            status={sensorData.temperature > 35 ? "critical" : sensorData.temperature > 30 ? "warning" : "normal"}
          />
          <SensorCard 
            title="Nem" 
            value={sensorData.humidity} 
            unit="%" 
            status={sensorData.humidity < 30 ? "warning" : "normal"}
          />
          <SensorCard 
            title="Toprak Nemi" 
            value={sensorData.soilMoisture} 
            unit="m³/m³" 
            status={sensorData.soilMoisture < 0.15 ? "critical" : "normal"}
          />
          <SensorCard 
            title="Rüzgar Hızı" 
            value={sensorData.windSpeed} 
            unit="km/h" 
            status={sensorData.windSpeed > 40 ? "warning" : "normal"}
          />
        </div>
      ) : null}

      <div className="mt-8">
        <div className="flex justify-between items-center border-b border-base-300 pb-4 mb-6">
          <h2 className="text-2xl font-bold">Otonom Karar Motoru</h2>
          <button 
            className="btn btn-info shadow-md shadow-info/20" 
            onClick={handleAnalyze} 
            disabled={!sensorData || analysisLoading}
          >
            {analysisLoading ? <span className="loading loading-spinner"></span> : "Analiz Et ve Karar Ver"}
          </button>
        </div>

        {recommendedTasks.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendedTasks.map((task, i) => (
              <div key={i} className="card bg-base-200 shadow-sm border border-base-300 border-l-4 border-l-info">
                <div className="card-body">
                  <h3 className="card-title text-lg">{task.title}</h3>
                  <p className="text-sm opacity-80">{task.description}</p>
                  <div className="mt-4 flex justify-between items-center font-bold">
                    <span className="text-info">{task.suggestedReward} MON Önerildi</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
