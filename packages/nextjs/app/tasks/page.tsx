"use client";

import React from "react";
import { useAccount } from "wagmi";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { TaskCard } from "~~/components/forest-guard/TaskCard";
import { notification } from "~~/utils/scaffold-eth";

export default function TasksPage() {
  const { address } = useAccount();

  // Get all open tasks
  const { data: openTasks } = useScaffoldReadContract({
    contractName: "TaskManager",
    functionName: "getOpenTasks",
  });

  // Get worker's assigned tasks
  const { data: workerTaskIds } = useScaffoldReadContract({
    contractName: "TaskManager",
    functionName: "getWorkerTasks",
    args: [address],
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

  const handleComplete = async (taskId: bigint) => {
    try {
      // In MVP: completing the task skips photo upload validation and processes payment
      await writeContractAsync({
        functionName: "submitProofAndComplete",
        args: [taskId],
      });
      notification.success("Görev tamamlandı! Ödemeniz ve rank puanınız hesabınıza aktarıldı.");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="py-8 px-4 sm:px-8 max-w-7xl mx-auto flex flex-col gap-8">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">İş İlanları</h1>
        <p className="text-base-content/70 mt-2">Ormanların otomatik olarak oluşturduğu ihtiyaç listesi. Görevleri tamamla, MON ve Puan kazan.</p>
      </div>

      {/* Tabs */}
      <div role="tablist" className="tabs tabs-boxed max-w-sm">
        <a role="tab" className="tab tab-active">Açık İlanlar</a>
        <a role="tab" className="tab">Üzerimdeki Görevler</a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {!openTasks || openTasks.length === 0 ? (
           <div className="col-span-full py-12 text-center text-base-content/50">Şu anda açık görev bulunmuyor. Sensörler yeni veriler ürettikçe iş ilanları açılacaktır.</div>
        ) : (
          openTasks.map((task) => (
            <TaskCard
              key={task.id.toString()}
              id={Number(task.id)}
              title={task.title}
              description={task.description}
              reward={task.reward}
              priority={task.priority}
              category={task.category}
              status="Open"
              onApply={() => handleApply(task.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
