
import { cn } from "@/lib/utils";

interface VolleyballIconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  size?: number;  // Add size prop to the interface
}

export function VolleyballIcon({ className, size, ...props }: VolleyballIconProps) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      className={cn("h-6 w-6", className)} 
      width={size}  // Use size for width if provided
      height={size}  // Use size for height if provided
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 12c-3.5 0-6.5-2.5-6.5-6 0 3.5 2.5 6 6 6s6-2.5 6-6c0 3.5-3 6-6 6z" />
      <path d="M12 12c0 3.5 2.5 6 6 6-3.5 0-6-2.5-6-6s2.5-6 6-6c-3.5 0-6 2.5-6 6z" />
      <path d="M12 12c0-3.5-2.5-6-6-6 3.5 0 6 2.5 6 6s-2.5 6-6 6c3.5 0 6-2.5 6-6z" />
    </svg>
  );
}
