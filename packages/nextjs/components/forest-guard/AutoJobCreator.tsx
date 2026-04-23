"use client";

import { useEffect, useRef } from "react";
import { useAccount } from "wagmi";
import { useScaffoldContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { parseEther } from "viem";
import { notification } from "~~/utils/scaffold-eth";

export const AutoJobCreator = () => {
  const { address } = useAccount();
  const { writeContractAsync } = useScaffoldWriteContract({
    contractName: "TaskManager",
  });

  const { data: forestRegistry } = useScaffoldContract({ contractName: "ForestRegistry" });
  const { data: taskManager } = useScaffoldContract({ contractName: "TaskManager" });

  const isProcessingRef = useRef<Record<string, boolean>>({});

  useEffect(() => {
    if (!address || !forestRegistry || !taskManager) return;

    const checkTemperatures = async () => {
      try {
        // Get forests owned by this user
        const forestIds = await forestRegistry.read.getOwnerForests([address]);
        if (!forestIds || forestIds.length === 0) return;

        for (let i = 0; i < forestIds.length; i++) {
          const forestId = forestIds[i];
          const lockKey = forestId.toString();

          if (isProcessingRef.current[lockKey]) continue;

          // Check if there is already an active Irrigation (1) task for this forest
          let hasActive = false;
          try {
            hasActive = await taskManager.read.hasActiveTask([forestId, 1]);
          } catch (e) {
            console.warn("hasActiveTask check failed, falling back to manual check. This usually means the contract needs redeployment.", e);
            // Fallback: Manually check all tasks if hasActiveTask mapping is not available yet
            try {
              const allTasks = await taskManager.read.getAllTasks();
              hasActive = allTasks.some(t => 
                t.forestId === forestId && 
                Number(t.category) === 1 && 
                (Number(t.status) === 0 || Number(t.status) === 1 || Number(t.status) === 2) // Open, Assigned, or PendingApproval
              );
            } catch (fallbackError) {
              console.error("Fallback manual check also failed:", fallbackError);
              // If both fail, we might want to skip to avoid spamming transactions if the contract is fundamentally different
              continue; 
            }
          }

          if (hasActive) continue;

          // Get forest details to get lat/lon
          const forest = await forestRegistry.read.getForest([forestId]);
          if (!forest.active) continue;

          // Use real coordinates but divided by 1e6 because contract stores ints
          const lat = Number(forest.latitude) / 1000000;
          const lon = Number(forest.longitude) / 1000000;

          // Fetch temp from API
          const response = await fetch(`/api/sensors?lat=${lat}&lon=${lon}`);
          if (!response.ok) continue;

          const data = await response.json();

          // Debug fallback: if user sets MOCK_TEMP in localStorage, use it for demo
          const mockTemp = typeof window !== 'undefined' ? window.localStorage.getItem('MOCK_TEMP') : null;
          const temp = mockTemp ? parseFloat(mockTemp) : data.temperature;

          if (temp > 40) {
            isProcessingRef.current[lockKey] = true;
            notification.warning(`Uyarı: Orman #${forestId.toString()} sıcaklığı ${temp}°C! Otomatik "Su Alma" görevi oluşturuluyor...`);

            try {
              await writeContractAsync({
                functionName: "createTask",
                args: [
                  forestId,
                  "Acil Su İhtiyacı (Otomatik)",
                  `Sıcaklık 40°C üzerine çıktı (${temp}°C). Acil sulama gerekiyor.`,
                  parseEther("5"), // 5 MON reward
                  1, // Irrigation category
                  3  // Critical priority
                ],
              });
              notification.success(`Orman #${forestId.toString()} için görev başarıyla açıldı.`);
            } catch (err) {
              console.error("Auto task creation failed:", err);
            } finally {
              isProcessingRef.current[lockKey] = false;
            }
          }
        }
      } catch (err) {
        console.error("Error checking temperatures:", err);
      }
    };

    // Run every 10 seconds
    const interval = setInterval(checkTemperatures, 10000);
    return () => clearInterval(interval);
  }, [address, forestRegistry, taskManager, writeContractAsync]);

  return null; // Headless component
};
