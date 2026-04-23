import React from "react";
import { CurrencyDollarIcon, MapPinIcon, ClockIcon } from "@heroicons/react/24/outline";

type TaskCardProps = {
  id: number;
  title: string;
  description: string;
  reward: bigint | string | number;
  priority: number;
  category: number;
  status: "Open" | "Assigned" | "PendingApproval" | "Completed" | "Cancelled";
  onApply?: () => void;
  onComplete?: () => void;
  onApprove?: () => void;
  isAssignee?: boolean;
  isOwner?: boolean;
};

export const TaskCard = ({
  title,
  description,
  reward,
  priority,
  status,
  onApply,
  onComplete,
  onApprove,
  isAssignee,
  isOwner
}: TaskCardProps) => {

  const getPriorityBadge = () => {
    switch (priority) {
      case 3: return <span className="badge badge-error gap-1">Kritik</span>;
      case 2: return <span className="badge badge-warning gap-1">Yüksek</span>;
      case 1: return <span className="badge badge-info gap-1">Orta</span>;
      default: return <span className="badge badge-ghost gap-1">Düşük</span>;
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case "Open": return <span className="badge badge-success badge-outline">Açık İlan</span>;
      case "Assigned": return <span className="badge badge-info badge-outline">Devam Ediyor</span>;
      case "PendingApproval": return <span className="badge badge-warning badge-outline">Onay Bekliyor</span>;
      case "Completed": return <span className="badge badge-neutral badge-outline">Tamamlandı</span>;
      default: return <span className="badge badge-ghost badge-outline">İptal</span>;
    }
  };


  return (
    <div className="card bg-base-100 shadow-xl border border-base-300 hover:shadow-2xl transition-all duration-300 relative overflow-hidden group">
      {/* priority accent line */}
      <div className={`absolute top-0 left-0 w-1 h-full ${priority === 3 ? 'bg-error' : priority === 2 ? 'bg-warning' : priority === 1 ? 'bg-info' : 'bg-base-300'}`}></div>

      <div className="card-body pl-8">
        <div className="flex justify-between items-start">
          <div>
            {getStatusBadge()}
            <h2 className="card-title mt-2 text-xl font-bold">{title}</h2>
          </div>
          {getPriorityBadge()}
        </div>

        <p className="text-base-content/70 mt-4 line-clamp-3 text-sm">{description}</p>

        <div className="flex items-center gap-4 mt-6">
          <div className="flex items-center gap-1 text-success font-semibold bg-success/10 px-3 py-1 rounded-full">
            <CurrencyDollarIcon className="h-5 w-5" />
            <span>{displayReward} MON</span>
          </div>
          <div className="flex items-center gap-1 text-base-content/60 text-sm">
            <MapPinIcon className="h-4 w-4" />
            <span>Otomatik Konum</span>
          </div>
        </div>

        <div className="card-actions justify-end mt-4">
          {status === "Open" && (
            <button className="btn btn-primary w-full sm:w-auto shadow-lg shadow-primary/30 group-hover:scale-105 transition-transform" onClick={onApply}>
              Görevi Al
            </button>
          )}
          {status === "Assigned" && isAssignee && (
            <button className="btn btn-success w-full sm:w-auto shadow-lg shadow-success/30" onClick={onComplete}>
              İşi Bitirdim (Kanıt Yükle)
            </button>
          )}
          {status === "PendingApproval" && isOwner && (
            <button className="btn btn-warning w-full sm:w-auto shadow-lg shadow-warning/30" onClick={onApprove}>
              Onayla ve Öde
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
