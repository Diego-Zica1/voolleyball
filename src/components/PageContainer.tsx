
import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  className?: string;
}

export function PageContainer({ 
  children, 
  title, 
  description,
  className 
}: PageContainerProps) {
  return (
    <div className={cn("container mx-auto px-4 py-6", className)}>
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">{title}</h1>
        {description && (
          <p className="text-gray-600 dark:text-gray-400">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}
