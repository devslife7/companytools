import React from 'react';

interface IconProps {
    className?: string;
}

export const CoupeIcon: React.FC<IconProps> = ({ className }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M21 6H3" />
        <path d="M21 6c0 5-4 9-9 9s-9-4-9-9" />
        <path d="M12 15v6" />
        <path d="M8 21h8" />
    </svg>
);

export const FluteIcon: React.FC<IconProps> = ({ className }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M8 2h8v12a4 4 0 0 1-8 0Z" />
        <path d="M12 14v7" />
        <path d="M8 21h8" />
    </svg>
);

export const HighballIcon: React.FC<IconProps> = ({ className }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M6 3h12l-1 18H7L6 3Z" />
        <path d="M6 8h12" />
    </svg>
);

export const MartiniIcon: React.FC<IconProps> = ({ className }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M7 22h10" />
        <path d="M12 22v-11" />
        <path d="M2 5l10 10 10-10" />
        <path d="M2 5h20" />
    </svg>
);

export const RocksIcon: React.FC<IconProps> = ({ className }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M5 6h14l-1.5 13a2 2 0 0 1-2 1.5h-7a2 2 0 0 1-2-1.5L5 6Z" />
        <path d="M5 10h14" />
    </svg>
);

export const ServedUpIcon: React.FC<IconProps> = ({ className }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M18 6H6" />
        <path d="M6 6c0 4 2.5 7 6 7s6-3 6-7" />
        <path d="M12 13v8" />
        <path d="M8 21h8" />
        <path d="M9 16l-3-3" />
        <path d="M15 16l3-3" />
    </svg>
);
