/**
 * ClickableDonorName — opens donor scorecard from dashboard or chat.
 */

function ClickableDonorName({
    donorId,
    firstName,
    lastName,
    onDonorClick,
    className = '',
    primaryColor = '#0C2340',
}) {
    const name = [firstName, lastName].filter(Boolean).join(' ').trim() || donorId || 'Donor';

    if (!donorId || typeof onDonorClick !== 'function') {
        return <span className={className}>{name}</span>;
    }

    return (
        <button
            type="button"
            onClick={() => onDonorClick(donorId)}
            className={`font-semibold text-left underline-offset-2 hover:underline transition-opacity hover:opacity-80 ${className}`}
            style={{ color: primaryColor }}
        >
            {name}
        </button>
    );
}

export default ClickableDonorName;
