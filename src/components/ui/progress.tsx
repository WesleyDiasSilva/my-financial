export function Progress({ value, className = "h-2", indicatorClassName = "bg-blue-500" }: { value: number, className?: string, indicatorClassName?: string }) {
    return (
        <div className={`w-full bg-zinc-800 rounded-full overflow-hidden ${className}`}>
            <div
                className={`h-full transition-all duration-300 ${indicatorClassName}`}
                style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
            />
        </div>
    )
}
