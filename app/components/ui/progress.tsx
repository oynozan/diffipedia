import * as React from "react";

import { cn } from "@/utils/helpers";

export interface ProgressProps extends React.ComponentProps<"div"> {
    value?: number;
    max?: number;
}

const clamp = (value: number, max: number) => Math.min(Math.max(value, 0), max);

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
    ({ className, value = 0, max = 100, ...props }, ref) => {
        const clamped = clamp(value, max);
        const percent = (clamped / max) * 100;

        return (
            <div
                ref={ref}
                role="progressbar"
                aria-valuenow={clamped}
                aria-valuemin={0}
                aria-valuemax={max}
                className={cn("relative h-2 w-full overflow-hidden rounded-full bg-gray20", className)}
                {...props}
            >
                <div className="h-full w-full bg-primary transition-all" style={{ width: `${percent}%` }} />
            </div>
        );
    },
);
Progress.displayName = "Progress";

interface CircleProgressProps extends React.ComponentProps<"div"> {
    value?: number;
    size?: number;
    strokeWidth?: number;
    label?: string;
}

export function CircleProgress({
    value = 0,
    size = 140,
    strokeWidth = 10,
    label,
    className,
    children,
    ...props
}: CircleProgressProps) {
    const clamped = clamp(value, 100);
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (clamped / 100) * circumference;

    return (
        <div
            className={cn(
                "relative inline-flex items-center justify-center text-white",
                className,
            )}
            style={{ width: size, height: size }}
            {...props}
        >
            <svg width={size} height={size} className="-rotate-90">
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    strokeWidth={strokeWidth}
                    className="text-gray20"
                    stroke="currentColor"
                    fill="transparent"
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    strokeWidth={strokeWidth}
                    className="text-primary"
                    stroke="currentColor"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    fill="transparent"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-semibold">{`${Math.round(clamped)}%`}</span>
                {(label || children) && (
                    <span className="text-xs text-gray mt-1">
                        {label}
                        {children}
                    </span>
                )}
            </div>
        </div>
    );
}


