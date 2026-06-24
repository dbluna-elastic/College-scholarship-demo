/**
 * ChatHistoryModal — Virtual counselor chat history for appointment students.
 */

import { CHAT_HISTORY_DATABASE } from '../../modules/utils/counselorDashboardUtils.js';

function ChatHistoryModal({ studentName, onClose }) {
    if (!studentName) return null;

    const entry = CHAT_HISTORY_DATABASE[studentName];
    if (!entry) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">Chat History — {studentName}</h3>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <p className="text-xs text-gray-500 mb-4"><strong>Timestamp:</strong> {entry.timestamp}</p>
                <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-2">Student Question</h4>
                    <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4 text-sm text-gray-800">
                        {entry.question}
                    </div>
                </div>
                <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Virtual Counselor Response</h4>
                    <div className="bg-gray-50 border-l-4 border-gray-400 rounded-lg p-4 text-sm text-gray-800 leading-relaxed">
                        {entry.response}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ChatHistoryModal;
