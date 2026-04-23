"use client";

import Link from "next/link";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { BugAntIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { TreePineIcon, ActivityIcon, CoinsIcon } from "lucide-react";

const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();

  return (
    <div className="flex items-center flex-col flex-grow pt-10">
      <div className="px-5">
        <h1 className="text-center">
          <span className="block text-2xl mb-2">Welcome to</span>
          <span className="block text-5xl font-bold bg-gradient-to-r from-green-500 to-emerald-700 bg-clip-text text-transparent">ForestGuard DAO</span>
        </h1>
        <p className="text-center text-lg mt-4 max-w-2xl mx-auto">
          Sensör verileriyle desteklenen, otonom orman ve tarım arazisi yönetim platformu.
          Doğayı korumak için görevleri tamamla, Monad Testnet üzerinde kripto kazan.
        </p>
      </div>

      <div className="flex-grow bg-base-300 w-full mt-16 px-8 py-12">
        <div className="flex justify-center items-center gap-12 flex-col sm:flex-row">
          <div className="flex flex-col bg-base-100 px-10 py-10 text-center items-center max-w-xs rounded-3xl border shadow-xl shadow-success/10 hover:shadow-success/30 transition-all">
            <TreePineIcon className="h-12 w-12 text-success" />
            <p className="mt-4 text-lg">
              Ormanını <Link href="/forests" className="link font-bold text-success">Kaydet</Link> ve akıllı kontratlar ile bütçesini yönet.
            </p>
          </div>
          
          <div className="flex flex-col bg-base-100 px-10 py-10 text-center items-center max-w-xs rounded-3xl border shadow-xl shadow-info/10 hover:shadow-info/30 transition-all">
            <ActivityIcon className="h-12 w-12 text-info" />
            <p className="mt-4 text-lg">
              Gerçek zamanlı <Link href="/sensors" className="link font-bold text-info">Sensörleri</Link> takip et ve otonom görevleri incele.
            </p>
          </div>

          <div className="flex flex-col bg-base-100 px-10 py-10 text-center items-center max-w-xs rounded-3xl border shadow-xl shadow-primary/10 hover:shadow-primary/30 transition-all">
            <CoinsIcon className="h-12 w-12 text-primary" />
            <p className="mt-4 text-lg">
              Açık <Link href="/tasks" className="link font-bold text-primary">İlanlara</Link> başvur, görevleri tamamla ve itibar kazan.
            </p>
          </div>
        </div>
      </div>
      
      <div className="my-10 flex justify-center">
        <Link href="/dashboard" className="btn btn-primary btn-lg shadow-lg shadow-primary/40 rounded-full px-12">
          Dashboard'a Git
        </Link>
      </div>
    </div>
  );
};

export default Home;
