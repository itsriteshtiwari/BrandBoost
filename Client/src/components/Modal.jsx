import React from 'react';
import { SparklesIcon, XIcon } from './Icons';

function Modal({ isOpen, onClose, title, children }) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-[#0d0b2b] rounded-2xl shadow-xl text-white w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-gray-700">
                    <h2 className="text-xl font-bold flex items-center"><SparklesIcon className="h-6 w-6 mr-2 text-yellow-400" />{title}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors"><XIcon className="h-6 w-6" /></button>
                </div>
                <div className="p-6 overflow-y-auto">{children}</div>
            </div>
        </div>
    );
}

export default Modal;