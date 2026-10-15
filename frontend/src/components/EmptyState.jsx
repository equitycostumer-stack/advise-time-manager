export default function EmptyState({ icon = "📭", title, description, compact = false }) {
    return (
        <div
            className={`empty-state${compact ? " is-compact" : ""}`}
            role="status"
            aria-live="polite"
        >
            <span className="empty-state-icon" aria-hidden="true">{icon}</span>
            <div className="empty-state-copy">
                <strong>{title}</strong>
                <p>{description}</p>
            </div>
        </div>
    );
}
