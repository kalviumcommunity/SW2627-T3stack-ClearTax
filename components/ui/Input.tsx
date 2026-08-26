import React from "react";

interface InputProps {
    type?: string;
    placeholder?: string;
    value?: string;
    onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
    disabled?: boolean;
    className?: string;
}

export default function Input({
    type = "text",
    placeholder = "",
    value,
    onChange,
    disabled = false,
    className = "",
}: InputProps) {
    return (
        <input
            type={type}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border px-3 py-2 outline-none ${className}`}
        />
    );
}