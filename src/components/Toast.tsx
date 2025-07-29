import React, { useEffect, useState } from 'react';
import { CheckCircleIcon } from './icons'; // Assuming an icon for success exists

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

const toastStyles = {
  success: {
    bg: 'bg-green-500',
    icon: <CheckCircleIcon className="w-6 h-6 text-white" />,
  },
  error: {
    bg: 'bg-red-500',
    icon: <CheckCircleIcon className="w-6 h-6 text-white" />, // Placeholder, ideally a different icon
  },
  info: {
    bg: 'bg-blue-500',
    icon: <CheckCircleIcon className="w-6 h-6 text-white" />, // Placeholder
  },
};

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animate in
    setIsVisible(true);

    const timer = setTimeout(() => {
      // Animate out
      setIsVisible(false);
      // Allow time for animation before calling onClose
      setTimeout(onClose, 300);
    }, 3000);

    return () => {
      clearTimeout(timer);
    };
  }, [message, type, onClose]);

  const styles = toastStyles[type];

  return (
    <div
      className={`fixed top-5 right-5 z-[100] flex items-center p-4 mb-4 text-white ${styles.bg} rounded-lg shadow-lg transition-transform duration-300 ease-in-out ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}
      role="alert"
    >
      <div className="flex-shrink-0">{styles.icon}</div>
      <div className="ml-3 text-sm font-medium">{message}</div>
      <button
        type="button"
        className="ml-auto -mx-1.5 -my-1.5 bg-white/20 text-white hover:bg-white/30 rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 inline-flex h-8 w-8"
        onClick={onClose}
        aria-label="Close"
      >
        <span className="sr-only">Close</span>
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path
            fillRule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clipRule="evenodd"
          ></path>
        </svg>
      </button>
    </div>
  );
};

export default Toast;
