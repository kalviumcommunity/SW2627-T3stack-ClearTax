import React from "react";

interface LoadingProps {
    text?: string;
}

export default function Loading({
    text = "Loading...",
}: LoadingProps) {
    return (
        <div className="flex items-center justify-center gap-2 p-4">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-800" />
            <span>{text}</span>
        </div>
    );
}