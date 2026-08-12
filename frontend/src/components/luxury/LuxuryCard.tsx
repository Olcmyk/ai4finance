import React from 'react';

interface LuxuryCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export const LuxuryCard: React.FC<LuxuryCardProps> = ({
  children,
  className = '',
  hover = false
}) => {
  return (
    <div
      className={`
        bg-white
        border border-luxury-border
        rounded-lg
        shadow-luxury
        transition-all
        duration-300
        ${hover ? 'hover:shadow-luxury-md hover:-translate-y-0.5' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};
