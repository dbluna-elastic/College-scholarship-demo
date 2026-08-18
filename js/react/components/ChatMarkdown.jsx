/**
 * Lightweight Markdown renderer for assistant chat bubbles.
 * Supports headings, lists, bold/italic, inline and fenced code.
 * Does not interpret raw HTML. Donor and youth tags become React nodes.
 */

import ClickableDonorName from './ClickableDonorName.jsx';

/**
 * @param {string} text
 * @param {(donorId: string) => void} [onDonorClick]
 * @param {string} [primaryColor]
 * @returns {{ text: string, entities: Array<JSX.Element> }}
 */
function extractEntities(text, onDonorClick, primaryColor) {
    const entities = [];
    let out = String(text || '');

    const pushEntity = (node) => {
        const index = entities.length;
        entities.push(node);
        return `%%E${index}%%`;
    };

    out = out.replace(/\[donor:(ALUM-\d+)\]([^\[]+)\[\/donor\]/g, (_match, donorId, rawName) => {
        const name = String(rawName).trim();
        const [firstName, ...rest] = name.split(' ');
        return pushEntity(
            <ClickableDonorName
                key={`donor-tag-${donorId}-${entities.length}`}
                donorId={donorId}
                firstName={firstName}
                lastName={rest.join(' ')}
                onDonorClick={onDonorClick}
                primaryColor={primaryColor}
            />
        );
    });

    out = out.replace(/\*\*([^*]+)\*\* \((ALUM-\d+)\)/g, (_match, rawName, donorId) => {
        const name = String(rawName).trim();
        const [firstName, ...rest] = name.split(' ');
        return pushEntity(
            <ClickableDonorName
                key={`donor-md-${donorId}-${entities.length}`}
                donorId={donorId}
                firstName={firstName}
                lastName={rest.join(' ')}
                onDonorClick={onDonorClick}
                primaryColor={primaryColor}
            />
        );
    });

    out = out.replace(/\[youth:([A-Za-z0-9._-]+)\]([^\[]+)\[\/youth\]/g, (_match, _youthId, rawName) => {
        const name = String(rawName).trim();
        return pushEntity(
            <span key={`youth-${entities.length}`} className="font-semibold">
                {name}
            </span>
        );
    });

    return { text: out, entities };
}

/**
 * @param {string} text
 * @param {Array<JSX.Element>} entities
 * @param {string} keyPrefix
 * @returns {Array<string|JSX.Element>}
 */
function renderInline(text, entities, keyPrefix) {
    if (!text) return [];

    const parts = [];
    const re = /%%E(\d+)%%|`([^`]+)`|\*\*([^*]+)\*\*|\*([^*\n]+)\*/g;
    let lastIndex = 0;
    let match;
    let part = 0;

    while ((match = re.exec(text)) !== null) {
        if (match.index > lastIndex) {
            parts.push(text.slice(lastIndex, match.index));
        }

        if (match[1] != null) {
            const entity = entities[Number(match[1])];
            parts.push(entity ?? match[0]);
        } else if (match[2] != null) {
            parts.push(
                <code
                    key={`${keyPrefix}-code-${part}`}
                    className="px-1.5 py-0.5 rounded-md bg-black/5 text-[0.95em] font-medium"
                >
                    {match[2]}
                </code>
            );
        } else if (match[3] != null) {
            parts.push(
                <strong key={`${keyPrefix}-b-${part}`} className="font-semibold">
                    {renderInline(match[3], entities, `${keyPrefix}-b-${part}`)}
                </strong>
            );
        } else if (match[4] != null) {
            parts.push(
                <em key={`${keyPrefix}-i-${part}`} className="italic">
                    {renderInline(match[4], entities, `${keyPrefix}-i-${part}`)}
                </em>
            );
        }

        lastIndex = match.index + match[0].length;
        part += 1;
    }

    if (lastIndex < text.length) {
        parts.push(text.slice(lastIndex));
    }

    return parts;
}

function isHeadingLine(line) {
    return /^(#{1,3})\s+\S/.test(line);
}

function isUlLine(line) {
    return /^\s*[-*]\s+\S/.test(line);
}

function isOlLine(line) {
    return /^\s*\d+\.\s+\S/.test(line);
}

function isFence(line) {
    return /^```/.test(line);
}

function isTableLine(line) {
    return /\|/.test(line) && line.trim().startsWith('|');
}

/**
 * @param {string} text
 * @returns {Array<{ type: string, level?: number, content?: string, items?: string[], lang?: string }>}
 */
function parseBlocks(text) {
    const lines = String(text || '').replace(/\r\n/g, '\n').split('\n');
    const blocks = [];
    let i = 0;

    while (i < lines.length) {
        const line = lines[i];

        if (isFence(line)) {
            const lang = line.slice(3).trim();
            const code = [];
            i += 1;
            while (i < lines.length && !isFence(lines[i])) {
                code.push(lines[i]);
                i += 1;
            }
            if (i < lines.length) i += 1;
            blocks.push({ type: 'code', lang, content: code.join('\n') });
            continue;
        }

        if (!line.trim()) {
            i += 1;
            continue;
        }

        const heading = /^(#{1,3})\s+(.+)$/.exec(line);
        if (heading) {
            blocks.push({ type: 'heading', level: heading[1].length, content: heading[2] });
            i += 1;
            continue;
        }

        if (isUlLine(line)) {
            const items = [];
            while (i < lines.length && isUlLine(lines[i])) {
                items.push(lines[i].replace(/^\s*[-*]\s+/, ''));
                i += 1;
            }
            blocks.push({ type: 'ul', items });
            continue;
        }

        if (isOlLine(line)) {
            const items = [];
            while (i < lines.length && isOlLine(lines[i])) {
                items.push(lines[i].replace(/^\s*\d+\.\s+/, ''));
                i += 1;
            }
            blocks.push({ type: 'ol', items });
            continue;
        }

        if (isTableLine(line)) {
            const rows = [];
            while (i < lines.length && (isTableLine(lines[i]) || /^\s*\|?\s*-{2,}/.test(lines[i]))) {
                rows.push(lines[i]);
                i += 1;
            }
            blocks.push({ type: 'pre', content: rows.join('\n') });
            continue;
        }

        const para = [];
        while (
            i < lines.length
            && lines[i].trim()
            && !isHeadingLine(lines[i])
            && !isUlLine(lines[i])
            && !isOlLine(lines[i])
            && !isFence(lines[i])
            && !isTableLine(lines[i])
        ) {
            para.push(lines[i]);
            i += 1;
        }
        blocks.push({ type: 'p', content: para.join('\n') });
    }

    return blocks;
}

function headingClass(level) {
    if (level === 1) return 'text-xl font-black tracking-tighter';
    if (level === 2) return 'text-[1.15rem] font-extrabold tracking-tighter';
    return 'text-lg font-bold tracking-tight';
}

function ChatMarkdown({ content, onDonorClick, primaryColor = '#5D5FEF' }) {
    const { text, entities } = extractEntities(content, onDonorClick, primaryColor);
    const blocks = parseBlocks(text);

    if (!blocks.length) {
        return <p className="text-lg leading-relaxed">&nbsp;</p>;
    }

    return (
        <div className="text-lg leading-relaxed space-y-2">
            {blocks.map((block, blockIdx) => {
                const key = `b-${blockIdx}`;

                if (block.type === 'heading') {
                    return (
                        <p key={key} className={headingClass(block.level)}>
                            {renderInline(block.content, entities, key)}
                        </p>
                    );
                }

                if (block.type === 'ul') {
                    return (
                        <ul key={key} className="list-disc pl-5 space-y-1">
                            {block.items.map((item, itemIdx) => (
                                <li key={`${key}-${itemIdx}`}>
                                    {renderInline(item, entities, `${key}-${itemIdx}`)}
                                </li>
                            ))}
                        </ul>
                    );
                }

                if (block.type === 'ol') {
                    return (
                        <ol key={key} className="list-decimal pl-5 space-y-1">
                            {block.items.map((item, itemIdx) => (
                                <li key={`${key}-${itemIdx}`}>
                                    {renderInline(item, entities, `${key}-${itemIdx}`)}
                                </li>
                            ))}
                        </ol>
                    );
                }

                if (block.type === 'code' || block.type === 'pre') {
                    return (
                        <pre
                            key={key}
                            className="text-sm leading-relaxed whitespace-pre-wrap bg-black/[0.04] border border-black/[0.05] rounded-2xl px-4 py-3 overflow-x-auto"
                        >
                            {block.content}
                        </pre>
                    );
                }

                const isBoldTitle = /^\*\*[^*]+\*\*$/.test(String(block.content || '').trim());
                return (
                    <p
                        key={key}
                        className={isBoldTitle ? 'font-bold tracking-tight' : 'whitespace-pre-wrap'}
                    >
                        {renderInline(block.content, entities, key)}
                    </p>
                );
            })}
        </div>
    );
}

export default ChatMarkdown;
