import React from 'react';

interface CivicLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  textColor?: string;
}

export const CivicLogo: React.FC<CivicLogoProps> = ({
  className = '',
  size = 36,
  showText = true,
  textColor = 'text-[#1F2937]',
}) => {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
        aria-label="CivicFix AI Logo"
      >
        {/* Outer Shield / Civic Base */}
        <path
          d="M24 4L7 11V22C7 32.5 14.3 42.1 24 44C33.7 42.1 41 32.5 41 22V11L24 4Z"
          fill="#1565C0"
        />
        {/* Inner Soft Geometry */}
        <path
          d="M24 8L11 13.8V22C11 30.2 16.5 37.8 24 39.5C31.5 37.8 37 30.2 37 22V13.8L24 8Z"
          fill="#0D47A1"
          opacity="0.25"
        />
        {/* Civic Fix Gear / Location Pin Center */}
        <circle cx="24" cy="21" r="7" fill="#FFFFFF" />
        <circle cx="24" cy="21" r="3.5" fill="#2E7D32" />
        {/* Upward Check / Wrench Resolve Accent */}
        <path
          d="M17 31L24 25L31 31"
          stroke="#F9A825"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {showText && (
        <div className="flex flex-col leading-tight select-none">
          <div className="flex items-center gap-1.5">
            <span className={`text-xl font-bold tracking-tight ${textColor}`}>
              CivicFix<span className="text-[#1565C0]">AI</span>
            </span>
          </div>
          <span className="text-[10px] font-semibold text-[#6B7280] tracking-wider uppercase">
            Report • Track • Resolve
          </span>
        </div>
      )}
    </div>
  );
};
