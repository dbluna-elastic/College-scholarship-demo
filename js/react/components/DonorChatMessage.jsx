/**
 * Renders chat text with clickable donor names ([donor:ID]Name[/donor] or **Name** (ALUM-###)).
 */

import ClickableDonorName from './ClickableDonorName.jsx';

/**
 * @param {string} text
 * @returns {Array<{ index: number, length: number, donorId: string, name: string }>}
 */
function findDonorMatches(text) {
    const matches = [];
    let match;

    const tagRe = /\[donor:(ALUM-\d+)\]([^\[]+)\[\/donor\]/g;
    while ((match = tagRe.exec(text)) !== null) {
        matches.push({
            index: match.index,
            length: match[0].length,
            donorId: match[1],
            name: match[2].trim(),
        });
    }

    const mdRe = /\*\*([^*]+)\*\* \((ALUM-\d+)\)/g;
    while ((match = mdRe.exec(text)) !== null) {
        matches.push({
            index: match.index,
            length: match[0].length,
            donorId: match[2],
            name: match[1].trim(),
        });
    }

    matches.sort((a, b) => a.index - b.index);

    return matches.filter((m, i) => {
        if (i === 0) return true;
        const prev = matches[i - 1];
        return m.index >= prev.index + prev.length;
    });
}

/**
 * @param {string} text
 * @param {(donorId: string) => void} [onDonorClick]
 * @param {string} [primaryColor]
 * @returns {Array<string|JSX.Element>}
 */
function parseDonorLinks(text, onDonorClick, primaryColor) {
    if (!text || typeof onDonorClick !== 'function') return [text];

    const matches = findDonorMatches(text);
    if (!matches.length) return [text];

    const parts = [];
    let lastIndex = 0;

    matches.forEach((m, i) => {
        if (m.index > lastIndex) {
            parts.push(text.slice(lastIndex, m.index));
        }
        const [firstName, ...rest] = m.name.split(' ');
        parts.push(
            <ClickableDonorName
                key={`${m.donorId}-${m.index}-${i}`}
                donorId={m.donorId}
                firstName={firstName}
                lastName={rest.join(' ')}
                onDonorClick={onDonorClick}
                primaryColor={primaryColor}
            />
        );
        lastIndex = m.index + m.length;
    });

    if (lastIndex < text.length) {
        parts.push(text.slice(lastIndex));
    }

    return parts;
}

function DonorChatMessage({ content, onDonorClick, primaryColor }) {
    const lines = String(content || '').split('\n');

    return (
        <>
            {lines.map((line, lineIdx) => (
                <span key={lineIdx}>
                    {lineIdx > 0 && <br />}
                    {parseDonorLinks(line, onDonorClick, primaryColor)}
                </span>
            ))}
        </>
    );
}

export default DonorChatMessage;
