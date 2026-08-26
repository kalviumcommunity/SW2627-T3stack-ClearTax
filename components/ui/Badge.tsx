import React from "react";

interface BadgeProps {
    children: React.ReactNode;
    className?: string;
}

export default function Badge({
    children,
    className = "",
}: BadgeProps) {
    return (
        <span
            className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${className}`}
        >
            {children}
        </span>
    );
}