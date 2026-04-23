import React from "react";
import { SignalIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";

type SensorCardProps = {
  title: string;
  value: string | number;
  unit: string;
  icon?: React.ReactNode;
  status?: "normal" | "warning" | "critical";
  description?: string;
};

export const SensorCard = ({ title, value, unit, icon, status = "normal", description }: SensorCardProps) => {
  const getStatusColor = () => {
    switch (status) {
      case "critical": return "text-error border-error shadow-error/20";
      case "warning": return "text-warning border-warning shadow-warning/20";
      default: return "text-primary border-primary/20 shadow-primary/10";
    }
  };

  return (
    <div className={`card bg-base-100 shadow-lg border backdrop-blur-sm bg-opacity-80 transition-all hover:-translate-y-1 ${getStatusColor()}`}>
      <div className="card-body p-6">
        <div className="flex justify-between items-start mb-2">
          <h2 className="card-title text-base-content/80 text-sm font-medium">{title}</h2>
          <div className={`p-2 rounded-full bg-base-200 ${getStatusColor()}`}>
            {icon || <SignalIcon className="h-5 w-5" />}
          </div>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold">{value}</span>
          <span className="text-sm font-semibold opacity-70">{unit}</span>
        </div>

        {description && (
          <div className="mt-4 flex items-center gap-2 text-xs">
            {status !== "normal" && <ExclamationTriangleIcon className="h-4 w-4" />}
            <span className="opacity-80">{description}</span>
          </div>
        )}
      </div>
    </div>
  );
};
