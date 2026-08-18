/**
 * Renders chat text with clickable donor names. Thin wrapper around ChatMarkdown.
 */

import ChatMarkdown from './ChatMarkdown.jsx';

function DonorChatMessage({ content, onDonorClick, primaryColor }) {
    return (
        <ChatMarkdown
            content={content}
            onDonorClick={onDonorClick}
            primaryColor={primaryColor}
        />
    );
}

export default DonorChatMessage;
