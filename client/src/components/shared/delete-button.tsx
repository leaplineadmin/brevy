import React from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface DeleteButtonProps {
  onClick: () => void;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const DeleteButton: React.FC<DeleteButtonProps> = ({ 
  onClick, 
  className = "",
  size = "sm"
}) => {
  const sizeClasses = {
    sm: "h-6 w-6 p-1",
    md: "h-8 w-8 p-1.5", 
    lg: "h-10 w-10 p-2"
  };

  const appliedSize = className?.includes("h-") ? "sm" : size;

  const iconSizes = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6"
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className={`${className?.includes("h-") ? className : sizeClasses[appliedSize]} rounded-sm bg-lightGrey text-tertiaryDark hover:bg-tertiaryLightHover hover:text-tertiaryDarkHover ${!className?.includes("h-") ? className : ""}`}
      onClick={onClick}
    >
      <Trash2 className={`${iconSizes[appliedSize]} text-tertiaryDark`} />
    </Button>
  );
};