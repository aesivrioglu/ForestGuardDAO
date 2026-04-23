import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

export const useForestBudget = (forestId: bigint) => {
  const { data: budget, isLoading } = useScaffoldReadContract({
    contractName: "ForestRegistry",
    functionName: "getForestBudget",
    args: [forestId],
  });

  const { writeContractAsync: depositAsync, isPending } = useScaffoldWriteContract({
    contractName: "ForestRegistry",
  });

  const depositBudget = async (amount: bigint) => {
    return depositAsync({
      functionName: "depositBudget",
      args: [forestId],
      value: amount,
    });
  };

  return { budget, depositBudget, isLoading, isPending };
};
