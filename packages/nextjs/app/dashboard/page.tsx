"use client";

import React, { useState } from "react";
import { useAccount } from "wagmi";
import { useSensorData } from "~~/hooks/forest-guard/useSensorData";
import { useWorkerRank } from "~~/hooks/forest-guard/useWorkerRank";
import { SensorCard } from "~~/components/forest-guard/SensorCard";
import { TaskCard } from "~~/components/forest-guard/TaskCard";
import { RankBadge } from "~~/components/forest-guard/RankBadge";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { formatEther } from "viem";

export default function DashboardPage() {
  const { address: connectedAddress } = useAccount();
  const [activeForestId] = useState<bigint>(0n);

  // Get forest budget
  const { data: budget } = useScaffoldReadContract({
    contractName: "ForestRegistry",
    functionName: "getForestBudget",
    args: [activeForestId],
  });

  // Get worker rank
  const { rank, rankName, stats } = useWorkerRank(connectedAddress || "");

  // Default coordinate (Example: Kayseri, AGU area)
  const { data: sensorData, loading: sensorLoading } = useSensorData(38.73, 35.48);

  // Mock open tasks for the dashboard view
  const { data: rawTasks } = useScaffoldReadContract({
    contractName: "TaskManager",
    functionName: "getOpenTasks",
  });

  const displayTasks = rawTasks ? [...rawTasks].reverse().slice(0, 3) : [];

  return (
    <div className="flex flex-col gap-y-8 py-8 px-4 sm:px-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">ForestGuard Dashboard</h1>
          <p className="text-base-content/70 mt-1">Otonom orman yönetimi ve akıllı görev dağılımı merkezi.</p>
        </div>
        
        {connectedAddress && (
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-base-200 border border-base-300 shadow-sm">
            <div className="flex flex-col items-end">
              <span className="text-sm font-semibold">Aktif Rank</span>
              <span className="text-xs text-base-content/60">{stats ? stats.reputationPoints.toString() : 0} Puan</span>
            </div>
            <RankBadge rank={rank || 0} rankName={rankName} />
          </div>
        )}
      </div>

      {/* Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card bg-base-100 shadow-xl border border-base-300">
          <div className="card-body">
            <h2 className="card-title text-sm text-base-content/70">Orman Bütçesi</h2>
            <div className="text-3xl font-bold text-success">{budget ? formatEther(budget) : "0.0"} MON</div>
          </div>
        </div>
        
        <div className="card bg-base-100 shadow-xl border border-base-300">
          <div className="card-body">
            <h2 className="card-title text-sm text-base-content/70">Tamamlanan Görevler</h2>
            <div className="text-3xl font-bold text-primary">{stats ? stats.tasksCompleted.toString() : "0"}</div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-xl border border-base-300">
          <div className="card-body">
            <h2 className="card-title text-sm text-base-content/70">Toplam Kazanç</h2>
            <div className="text-3xl font-bold text-secondary">{stats ? formatEther(stats.totalEarned) : "0.0"} MON</div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-xl border border-base-300 bg-gradient-to-br from-primary/10 to-secondary/10">
          <div className="card-body">
            <h2 className="card-title text-sm text-base-content/70">Bekleyen İş İlanı</h2>
            <div className="text-3xl font-bold">{rawTasks ? rawTasks.length : "0"}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-4">
        {/* Left Column: Sensors */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <h3 className="text-2xl font-bold">Canlı Sensör Verileri</h3>
          
          {sensorLoading ? (
            <div className="flex justify-center p-8"><span className="loading loading-spinner text-primary loading-lg"></span></div>
          ) : sensorData ? (
            <div className="grid gap-4">
              <SensorCard 
                title="Hava Sıcaklığı" 
                value={sensorData.temperature} 
                unit="°C" 
                status={sensorData.temperature > 35 ? "critical" : sensorData.temperature > 30 ? "warning" : "normal"}
              />
              <SensorCard 
                title="Toprak Nemi" 
                value={sensorData.soilMoisture} 
                unit="m³/m³" 
                status={sensorData.soilMoisture < 0.15 ? "critical" : "normal"}
                description={sensorData.soilMoisture < 0.15 ? "Kritik kuraklık! Sulama gerekli." : ""}
              />
              <SensorCard 
                title="Rüzgar Hızı" 
                value={sensorData.windSpeed} 
                unit="km/h" 
                status={sensorData.windSpeed > 40 ? "warning" : "normal"}
              />
            </div>
          ) : (
            <div className="alert alert-warning">Sensör verisi alınamadı.</div>
          )}
        </div>

        {/* Right Column: Recent Tasks */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="flex justify-between items-end">
            <h3 className="text-2xl font-bold">Acil Görevler</h3>
            <a href="/tasks" className="btn btn-sm btn-ghost text-primary">Tümünü Gör</a>
          </div>
          
          <div className="grid gap-4">
            {displayTasks.length === 0 ? (
              <div className="card bg-base-100 shadow-sm border border-base-200">
                <div className="card-body items-center text-center py-12">
                  <p className="text-base-content/60">Şu anda açık bir görev bulunmuyor.</p>
                </div>
              </div>
            ) : (
              displayTasks.map((task) => (
                <TaskCard
                  key={task.id.toString()}
                  id={Number(task.id)}
                  title={task.title}
                  description={task.description}
                  reward={task.reward}
                  priority={task.priority}
                  category={task.category}
                  status="Open"
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
