import React from 'react';

interface LuxuryInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const LuxuryInput: React.FC<LuxuryInputProps> = ({
  label,
  error,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-luxury-darkBrown mb-2 tracking-wide">
          {label}
        </label>
      )}
      <input
        className={`
          w-full
          px-4 py-3
          bg-luxury-cream
          border border-luxury-border
          rounded-md
          text-luxury-charcoal
          placeholder-luxury-brown
          transition-all
          duration-300
          focus:outline-none
          focus:border-luxury-gold
          focus:ring-1
          focus:ring-luxury-gold
          ${error ? 'border-expense' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-expense">{error}</p>
      )}
    </div>
  );
};

interface LuxuryTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const LuxuryTextarea: React.FC<LuxuryTextareaProps> = ({
  label,
  error,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-luxury-darkBrown mb-2 tracking-wide">
          {label}
        </label>
      )}
      <textarea
        className={`
          w-full
          px-4 py-3
          bg-luxury-cream
          border border-luxury-border
          rounded-md
          text-luxury-charcoal
          placeholder-luxury-brown
          transition-all
          duration-300
          focus:outline-none
          focus:border-luxury-gold
          focus:ring-1
          focus:ring-luxury-gold
          ${error ? 'border-expense' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-expense">{error}</p>
      )}
    </div>
  );
};

interface LuxurySelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const LuxurySelect: React.FC<LuxurySelectProps> = ({
  label,
  error,
  className = '',
  children,
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-luxury-darkBrown mb-2 tracking-wide">
          {label}
        </label>
      )}
      <select
        className={`
          w-full
          px-4 py-3
          bg-luxury-cream
          border border-luxury-border
          rounded-md
          text-luxury-charcoal
          transition-all
          duration-300
          focus:outline-none
          focus:border-luxury-gold
          focus:ring-1
          focus:ring-luxury-gold
          ${error ? 'border-expense' : ''}
          ${className}
        `}
        {...props}
      >
        {children}
      </select>
      {error && (
        <p className="mt-1 text-sm text-expense">{error}</p>
      )}
    </div>
  );
};
