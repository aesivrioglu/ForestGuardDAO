"use client";

import React, { useState } from "react";
import { useAccount } from "wagmi";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { TaskCard } from "~~/components/forest-guard/TaskCard";
import { notification } from "~~/utils/scaffold-eth";

export default function TasksPage() {
  const { address } = useAccount();
  const [activeTab, setActiveTab] = useState<"open" | "worker" | "owner">("open");

  // Get all tasks
  const { data: allTasks } = useScaffoldReadContract({
    contractName: "TaskManager",
    functionName: "getAllTasks",
  });

  const { writeContractAsync } = useScaffoldWriteContract({
    contractName: "TaskManager",
  });

  const handleApply = async (taskId: bigint) => {
    try {
      await writeContractAsync({
        functionName: "applyForTask",
        args: [taskId],
      });
      notification.success("Göreve başarıyla başvurdunuz!");
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmitProof = async (taskId: bigint) => {
    try {
      await writeContractAsync({
        functionName: "submitProof",
        args: [taskId],
      });
      notification.success("Kanıt yüklendi! Orman sahibinin onayı bekleniyor.");
    } catch (error) {
      console.error(error);
    }
  };

  const handleApproveTask = async (taskId: bigint) => {
    try {
      await writeContractAsync({
        functionName: "approveTask",
        args: [taskId],
      });
      notification.success("Görev onaylandı! Ödeme gerçekleştirildi.");
    } catch (error) {
      console.error(error);
    }
  };

  const getStatusString = (status: number) => {
    switch(status) {
      case 0: return "Open";
      case 1: return "Assigned";
      case 2: return "PendingApproval";
      case 3: return "Completed";
      default: return "Cancelled";
    }
  };

  const displayedTasks = React.useMemo(() => {
    if (!allTasks) return [];
    
    return allTasks.filter((task) => {
      const isCreator = task.creator === address;
      const isWorker = task.assignee === address;
      
      if (activeTab === "open") return task.status === 0;
      if (activeTab === "worker") return isWorker;
      if (activeTab === "owner") return isCreator;
      
      return false;
    }).sort((a, b) => Number(b.id - a.id)); // Newest first
  }, [allTasks, activeTab, address]);

  return (
    <div className="py-8 px-4 sm:px-8 max-w-7xl mx-auto flex flex-col gap-8">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">İş İlanları</h1>
        <p className="text-base-content/70 mt-2">Ormanların otomatik olarak oluşturduğu ihtiyaç listesi. Görevleri tamamla, MON ve Puan kazan.</p>
      </div>

      {/* Tabs */}
      <div role="tablist" className="tabs tabs-boxed w-full max-w-md">
        <a role="tab" className={`tab ${activeTab === "open" ? "tab-active" : ""}`} onClick={() => setActiveTab("open")}>Açık İlanlar</a>
        <a role="tab" className={`tab ${activeTab === "worker" ? "tab-active" : ""}`} onClick={() => setActiveTab("worker")}>Üzerimdeki Görevler</a>
        <a role="tab" className={`tab ${activeTab === "owner" ? "tab-active" : ""}`} onClick={() => setActiveTab("owner")}>Açtığım İlanlar (Onay)</a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {displayedTasks.length === 0 ? (
           <div className="col-span-full py-12 text-center text-base-content/50">Şu anda bu kategoride görev bulunmuyor.</div>
        ) : (
          displayedTasks.map((task) => (
            <TaskCard
              key={task.id.toString()}
              id={Number(task.id)}
              title={task.title}
              description={task.description}
              reward={task.reward}
              priority={task.priority}
              category={task.category}
              status={getStatusString(task.status) as any}
              isAssignee={task.assignee === address}
              isOwner={task.creator === address}
              onApply={() => handleApply(task.id)}
              onComplete={() => handleSubmitProof(task.id)}
              onApprove={() => handleApproveTask(task.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
