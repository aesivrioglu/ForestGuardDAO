"use client";

import React from "react";
import { useAccount } from "wagmi";
import { useWorkerRank } from "~~/hooks/forest-guard/useWorkerRank";
import { RankBadge } from "~~/components/forest-guard/RankBadge";
import { formatEther } from "viem";

export default function ProfilePage() {
  const { address } = useAccount();
  const { rank, rankName, stats, isLoading } = useWorkerRank(address || "");

  if (!address) {
    return <div className="flex justify-center p-12 text-lg">Lütfen cüzdanınızı bağlayın.</div>;
  }

  return (
    <div className="py-8 px-4 sm:px-8 max-w-4xl mx-auto flex flex-col gap-8">
      <div>
        <h1 className="text-4xl font-bold">Profil & İtibar</h1>
        <p className="text-base-content/70 mt-2">Cüzdanınıza bağlı itibar sistemi istatistikleriniz.</p>
      </div>

      <div className="card bg-base-100 shadow-xl border border-base-300">
        <div className="card-body">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-6 pb-6 border-b border-base-300">
            <div className="flex items-center gap-4">
              <div className="avatar placeholder">
                <div className="bg-neutral text-neutral-content rounded-full w-24">
                  <span className="text-3xl">{address.slice(2, 4).toUpperCase()}</span>
                </div>
              </div>
              <div>
                <h2 className="text-xl font-bold">{address.slice(0, 6)}...{address.slice(-4)}</h2>
                <p className="text-sm opacity-70">Kayıtlı Çalışan</p>
              </div>
            </div>
            
            <div className="flex flex-col items-center gap-2">
              <span className="text-sm font-semibold opacity-70">Mevcut Rank</span>
              <RankBadge rank={rank || 0} rankName={rankName} size="lg" />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-6 text-center">
            <div className="flex flex-col">
              <span className="text-sm opacity-70">İtibar Puanı</span>
              <span className="text-2xl font-bold">{stats ? stats.reputationPoints.toString() : "0"}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm opacity-70">Tamamlanan Görev</span>
              <span className="text-2xl font-bold text-success">{stats ? stats.tasksCompleted.toString() : "0"}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm opacity-70">Reddedilen Görev</span>
              <span className="text-2xl font-bold text-error">{stats ? stats.tasksRejected.toString() : "0"}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm opacity-70">Kazanılan MON</span>
              <span className="text-2xl font-bold text-primary">{stats ? formatEther(stats.totalEarned) : "0.0"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
