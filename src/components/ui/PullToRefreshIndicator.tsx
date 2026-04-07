import { RefreshCw } from "lucide-react";

interface Props {
  pullDistance: number;
  isRefreshing: boolean;
  threshold: number;
}

const PullToRefreshIndicator = ({ pullDistance, isRefreshing, threshold }: Props) => {
  if (pullDistance === 0 && !isRefreshing) return null;

  const progress = Math.min(pullDistance / threshold, 1);
  const rotation = progress * 360;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[60] flex justify-center transition-transform duration-200"
      style={{ transform: `translateY(${isRefreshing ? 40 : pullDistance}px)` }}
    >
      <div className="bg-card border shadow-lg rounded-full p-2.5">
        <RefreshCw
          className={`h-5 w-5 text-primary ${isRefreshing ? "animate-spin" : ""}`}
          style={{ transform: isRefreshing ? undefined : `rotate(${rotation}deg)` }}
        />
      </div>
    </div>
  );
};

export default PullToRefreshIndicator;
