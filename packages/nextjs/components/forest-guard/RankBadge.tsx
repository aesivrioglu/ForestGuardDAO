import React from "react";
import { SparklesIcon, FireIcon, CheckBadgeIcon, StarIcon, TrophyIcon } from "@heroicons/react/24/solid";

type RankBadgeProps = {
  rank: number;
  rankName?: string;
  size?: "sm" | "md" | "lg";
};

export const RankBadge = ({ rank, rankName, size = "md" }: RankBadgeProps) => {
  const getRankConfig = () => {
    switch (rank) {
      case 4: // Diamond
        return {
          icon: <SparklesIcon className="w-full h-full text-indigo-400" />,
          bgColor: "bg-indigo-900/40",
          borderColor: "border-indigo-400/50",
          textColor: "text-indigo-200",
          glowColor: "shadow-indigo-500/50a",
          name: rankName || "Diamond",
        };
      case 3: // Platinum
        return {
          icon: <CheckBadgeIcon className="w-full h-full text-cyan-300" />,
          bgColor: "bg-cyan-900/40",
          borderColor: "border-cyan-300/50",
          textColor: "text-cyan-100",
          glowColor: "shadow-cyan-400/40",
          name: rankName || "Platinum",
        };
      case 2: // Gold
        return {
          icon: <TrophyIcon className="w-full h-full text-yellow-400" />,
          bgColor: "bg-yellow-900/40",
          borderColor: "border-yellow-400/50",
          textColor: "text-yellow-100",
          glowColor: "shadow-yellow-500/40",
          name: rankName || "Gold",
        };
      case 1: // Silver
        return {
          icon: <StarIcon className="w-full h-full text-gray-300" />,
          bgColor: "bg-gray-800/40",
          borderColor: "border-gray-400/50",
          textColor: "text-gray-200",
          glowColor: "shadow-gray-400/20",
          name: rankName || "Silver",
        };
      case 0: // Bronze
      default:
        return {
          icon: <FireIcon className="w-full h-full text-amber-700" />,
          bgColor: "bg-amber-900/20",
          borderColor: "border-amber-700/50",
          textColor: "text-amber-600",
          glowColor: "shadow-amber-900/20",
          name: rankName || "Bronze",
        };
    }
  };

  const config = getRankConfig();

  const sizeClasses = {
    sm: "w-6 h-6 p-1 text-xs",
    md: "w-8 h-8 p-1.5 text-sm",
    lg: "w-12 h-12 p-2 text-base",
  };

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-sm shadow-lg ${config.bgColor} ${config.borderColor} ${config.glowColor}`}
    >
      <div className={`${sizeClasses[size]}`}>{config.icon}</div>
      <span className={`font-bold ${config.textColor}`}>{config.name}</span>
    </div>
  );
};
