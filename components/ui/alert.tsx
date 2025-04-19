"use client";

import React from "react";

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "destructive";
  children: React.ReactNode;
}

export function Alert({ 
  children, 
  variant = "default", 
  className = "", 
  ...props 
}: AlertProps) {
  const variantClasses = variant === "destructive" 
    ? "border-red-100 bg-red-50 text-red-800" 
    : "border-blue-100 bg-blue-50 text-blue-800";

  return (
    <div
      className={`rounded-lg border p-4 ${variantClasses} ${className}`}
      role="alert"
      {...props}
    >
      {children}
    </div>
  );
}

export function AlertTitle({ 
  children, 
  className = "", 
  ...props 
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h5
      className={`mb-1 font-medium leading-none tracking-tight ${className}`}
      {...props}
    >
      {children}
    </h5>
  );
}

export function AlertDescription({ 
  children, 
  className = "", 
  ...props 
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <div
      className={`text-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  );
} 