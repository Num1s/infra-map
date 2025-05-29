import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const MobileAccordion = ({ 
  title, 
  children, 
  defaultOpen = false, 
  icon = null,
  className = "",
  headerClassName = "",
  contentClassName = ""
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const toggleOpen = () => setIsOpen(!isOpen);

  return (
    <div className={`accordion-section ${className}`}>
      <div 
        className={`accordion-header ${headerClassName}`}
        onClick={toggleOpen}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleOpen();
          }
        }}
        aria-expanded={isOpen}
        aria-controls={`accordion-content-${title.replace(/\s+/g, '-').toLowerCase()}`}
      >
        <div className="flex items-center gap-2">
          {icon && <span className="text-primary-500">{icon}</span>}
          <span className="font-medium text-gray-800">{title}</span>
        </div>
        <div className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
          <ChevronDown className="w-4 h-4 text-gray-500" />
        </div>
      </div>
      
      <div 
        className={`accordion-content ${isOpen ? 'open' : ''} ${contentClassName}`}
        id={`accordion-content-${title.replace(/\s+/g, '-').toLowerCase()}`}
        style={{ 
          maxHeight: isOpen ? 'none' : '0',
          overflow: 'hidden',
          transition: 'max-height 0.3s ease-in-out'
        }}
      >
        <div className="py-2">
          {children}
        </div>
      </div>
    </div>
  );
};

// Компонент группы аккордеонов (можно открыть только один)
export const MobileAccordionGroup = ({ children, allowMultiple = false }) => {
  const [openIndex, setOpenIndex] = useState(null);

  const handleToggle = (index) => {
    if (allowMultiple) return; // Если разрешено несколько, не управляем состоянием
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="space-y-1">
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement(child) && !allowMultiple) {
          return React.cloneElement(child, {
            isOpen: openIndex === index,
            onToggle: () => handleToggle(index),
            key: index
          });
        }
        return child;
      })}
    </div>
  );
};

// Модифицированный аккордеон для использования в группе
export const GroupedAccordionItem = ({ 
  title, 
  children, 
  icon = null,
  isOpen = false,
  onToggle,
  className = "",
  headerClassName = "",
  contentClassName = ""
}) => {
  return (
    <div className={`accordion-section ${className}`}>
      <div 
        className={`accordion-header ${headerClassName}`}
        onClick={onToggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle();
          }
        }}
        aria-expanded={isOpen}
        aria-controls={`accordion-content-${title.replace(/\s+/g, '-').toLowerCase()}`}
      >
        <div className="flex items-center gap-2">
          {icon && <span className="text-primary-500">{icon}</span>}
          <span className="font-medium text-gray-800">{title}</span>
        </div>
        <div className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
          <ChevronDown className="w-4 h-4 text-gray-500" />
        </div>
      </div>
      
      <div 
        className={`accordion-content ${isOpen ? 'open' : ''} ${contentClassName}`}
        id={`accordion-content-${title.replace(/\s+/g, '-').toLowerCase()}`}
        style={{ 
          maxHeight: isOpen ? '300px' : '0',
          overflow: 'hidden',
          transition: 'max-height 0.3s ease-in-out'
        }}
      >
        <div className="py-2">
          {children}
        </div>
      </div>
    </div>
  );
};

export default MobileAccordion; 