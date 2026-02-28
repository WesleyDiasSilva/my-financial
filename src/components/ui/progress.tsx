export function Progress({ value, className = "h-2" }: { value: number, className?: string }) {
    return (
        <div className={`w-full bg-zinc-800 rounded-full overflow-hidden ${className}`}>
            <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
            />
        </div>
    )
}
