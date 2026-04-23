"use client";

import React, { useState } from "react";
import { useAccount } from "wagmi";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

export default function ForestsPage() {
  const { address } = useAccount();

  // State for registering new forest
  const [name, setName] = useState("");
  const [lat, setLat] = useState("38.730000");
  const [lon, setLon] = useState("35.480000");
  const [area, setArea] = useState("10000");

  const { data: myForests } = useScaffoldReadContract({
    contractName: "ForestRegistry",
    functionName: "getOwnerForests",
    args: [address],
  });

  const { writeContractAsync } = useScaffoldWriteContract({
    contractName: "ForestRegistry",
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Multiply coords by 1e6 for integer representation in contract
      const intLat = BigInt(Math.floor(parseFloat(lat) * 1e6));
      const intLon = BigInt(Math.floor(parseFloat(lon) * 1e6));
      
      await writeContractAsync({
        functionName: "registerForest",
        args: [name, intLat, intLon, BigInt(area)],
      });
      notification.success("Orman başarıyla kaydedildi!");
      setName("");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="py-8 px-4 sm:px-8 max-w-7xl mx-auto flex flex-col gap-8">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-success to-emerald-700 bg-clip-text text-transparent">Orman Yönetimi</h1>
        <p className="text-base-content/70 mt-2">Arazi kaydı yapın ve bütçe yönetimi sağlayın.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Registration Form */}
        <div className="card bg-base-100 shadow-xl border border-base-300">
          <div className="card-body">
            <h2 className="card-title">Yeni Arazi Kaydet</h2>
            <form onSubmit={handleRegister} className="flex flex-col gap-4 mt-4">
              <label className="form-control w-full">
                <div className="label"><span className="label-text">Arazi/Orman Adı</span></div>
                <input required type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Örn: AGU Kampüs Ormanı" className="input input-bordered w-full" />
              </label>

              <div className="flex gap-4">
                <label className="form-control w-full">
                  <div className="label"><span className="label-text">Enlem (Latitude)</span></div>
                  <input required type="number" step="0.000001" value={lat} onChange={e => setLat(e.target.value)} className="input input-bordered w-full" />
                </label>
                <label className="form-control w-full">
                  <div className="label"><span className="label-text">Boylam (Longitude)</span></div>
                  <input required type="number" step="0.000001" value={lon} onChange={e => setLon(e.target.value)} className="input input-bordered w-full" />
                </label>
              </div>

              <label className="form-control w-full">
                <div className="label"><span className="label-text">Alan (m²)</span></div>
                <input required type="number" value={area} onChange={e => setArea(e.target.value)} className="input input-bordered w-full" />
              </label>

              <button type="submit" className="btn btn-success mt-4">Kaydet</button>
            </form>
          </div>
        </div>

        {/* List of my forests */}
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold">Arazilerim</h2>
          {!myForests || myForests.length === 0 ? (
            <div className="alert">Henüz kaydedilmiş bir araziniz bulunmuyor.</div>
          ) : (
            <div className="flex flex-col gap-4">
              {myForests.map((forestId) => (
                <div key={forestId.toString()} className="card bg-base-200 border shadow-sm">
                  <div className="card-body">
                    <h3 className="card-title">Orman ID: {forestId.toString()}</h3>
                    <p className="text-sm opacity-70">Bu ormanın bütçesine MON yatırarak görevlerin otomatik yayınlanmasını sağlayabilirsiniz.</p>
                    <div className="card-actions justify-end mt-2">
                      <button className="btn btn-sm btn-outline">Detaylar & Bütçe</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
