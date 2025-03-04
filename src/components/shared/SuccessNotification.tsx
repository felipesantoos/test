import React, { useEffect, useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';

interface SuccessNotificationProps {
  message: string;
  duration?: number;
  onClose: () => void;
}

export const SuccessNotification: React.FC<SuccessNotificationProps> = ({
  message,
  duration = 5000, // Default duration of 5 seconds
  onClose
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const handleClick = () => {
    setIsVisible(false);
    onClose();
  };

  if (!isVisible) return null;

  return (
    <div 
      className="fixed top-4 right-4 flex items-center bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg shadow-lg cursor-pointer z-50 animate-fade-in-down"
      onClick={handleClick}
      role="alert"
    >
      <CheckCircle2 size={20} className="text-green-500 mr-2" />
      <span className="text-sm font-medium">{message}</span>
      <X size={16} className="ml-3 text-green-600 hover:text-green-800" />
    </div>
  );
};