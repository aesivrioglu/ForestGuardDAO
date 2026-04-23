import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

export const useWorkerRank = (workerAddress: string) => {
  const { data: rank, isLoading: isLoadingRank } = useScaffoldReadContract({
    contractName: "ReputationSystem",
    functionName: "getRank",
    args: [workerAddress],
  });

  const { data: stats, isLoading: isLoadingStats } = useScaffoldReadContract({
    contractName: "ReputationSystem",
    functionName: "getWorkerStats",
    args: [workerAddress],
  });

  // Convert rank enum to string representation
  const getRankName = (rankEnum?: number) => {
    switch (rankEnum) {
      case 0: return "Bronze";
      case 1: return "Silver";
      case 2: return "Gold";
      case 3: return "Platinum";
      case 4: return "Diamond";
      default: return "Unranked";
    }
  };

  return {
    rank: rank !== undefined ? Number(rank) : undefined,
    rankName: getRankName(rank !== undefined ? Number(rank) : undefined),
    stats,
    isLoading: isLoadingRank || isLoadingStats,
  };
};
