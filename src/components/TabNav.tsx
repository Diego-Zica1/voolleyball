
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
              ? "border-b-2 border-volleyball-purple text-volleyball-purple"
              : "text-gray-600 hover:text-volleyball-purple dark:text-gray-400 dark:hover:text-volleyball-purple"
          )}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
