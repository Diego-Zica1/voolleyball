
import { cn } from "@/lib/utils";

interface TabNavProps {
  tabs: { id: string; label: string }[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export function TabNav({ tabs, activeTab, onChange, className }: TabNavProps) {
  return (
    <div className={cn("flex border-b", className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={cn(
            "px-4 py-2 font-medium text-sm transition-colors",
            activeTab === tab.id
              ? "border-b-2 border-volleyball-cyan text-volleyball-cyan"
              : "text-gray-600 hover:text-volleyball-cyan dark:text-gray-400 dark:hover:text-volleyball-cyan"
          )}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
