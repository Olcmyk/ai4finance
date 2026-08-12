import React from 'react';

interface LuxuryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  children: React.ReactNode;
  loading?: boolean;
}

export const LuxuryButton: React.FC<LuxuryButtonProps> = ({
  variant = 'primary',
  children,
  className = '',
  loading = false,
  disabled,
  ...props
}) => {
  const baseStyles = 'px-6 py-3 rounded-md font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-luxury-gold focus:ring-offset-2';

  const variants = {
    primary: `
      bg-gradient-to-r from-luxury-gold to-luxury-lightGold
      text-white
      shadow-luxury
      hover:shadow-gold-glow
      hover:from-luxury-lightGold hover:to-luxury-gold
      disabled:opacity-50 disabled:cursor-not-allowed
    `,
    secondary: `
      bg-luxury-cream
      text-luxury-darkBrown
      border border-luxury-border
      hover:bg-luxury-lightBeige
      disabled:opacity-50 disabled:cursor-not-allowed
    `,
    outline: `
      bg-transparent
      text-luxury-gold
      border border-luxury-gold
      hover:bg-luxury-gold hover:text-white
      disabled:opacity-50 disabled:cursor-not-allowed
    `
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center justify-center">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          处理中...
        </span>
      ) : children}
    </button>
  );
};
