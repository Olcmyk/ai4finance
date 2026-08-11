import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  fullWidth = false,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <div className={`${widthStyle}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-beige-800 mb-2"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`
          px-4 py-3 rounded-2xl border-2 border-beige-300
          bg-white text-beige-900 placeholder-beige-400
          focus:outline-none focus:border-beige-500 focus:ring-2 focus:ring-beige-200
          transition-all duration-200
          disabled:bg-beige-100 disabled:cursor-not-allowed
          ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-200' : ''}
          ${widthStyle}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};
