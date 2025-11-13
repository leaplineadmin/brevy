import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AddButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}

export function AddButton({ onClick, children, className = "" }: AddButtonProps) {
  return (
    <Button
      variant="link"
      className={`p-0 h-auto text-brand-primary hover:text-brand-primaryHover hover:bg-transparent text-sm ${className}`}
      onClick={onClick}
    >
      <Plus className="h-4 w-4 mr-1" />
      {children}
    </Button>
  );
}