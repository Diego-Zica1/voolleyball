
import { cn } from "@/lib/utils";

interface VolleyballIconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  size?: number;
}

export function VolleyballIcon({ className, size, ...props }: VolleyballIconProps) {
  return (
    <img 
      src="/lovable-uploads/ec03807f-e196-4bf9-a32a-d153209c8863.png"
      className={cn("h-6 w-6", className)} 
      width={size || 24} 
      height={size || 24} 
      alt="Volleyball Icon"
    />
  );
}
