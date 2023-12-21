import Link from '@docusaurus/Link';
import React from 'react';
import { ReactNode } from 'react';

interface PriceTabProps {
    title: string;
    content: string;
    icon: ReactNode;
    active: boolean;
    url: string;
    setActive: () => void;
}

export function TabItem({ title, content, icon, active, setActive, url }: PriceTabProps) {
    return (
        <Link
            to={url}
            onClick={() => {
                setActive();
            }}
            className={`h-[7.75rem] w-full cursor-pointer rounded-lg bg-[#fff] px-6 py-8 shadow-[0px_2px_8px_0px_rgba(49,77,136,0.16)] lg:flex-1 ${
                active ? 'border-b-4 border-[#0065FD]' : ''
            } hover:no-underline`}
        >
            <div className="flex items-center">
                <div className={`pr-[0.75rem] text-[3.375rem] `}>{icon}</div>
                <div>
                    <div className="text-base text-[#202124] font-misans sm:text-xl">{title}</div>
                    <div className=" pt-[0.3125rem] text-sm tracking-[-0.01rem] text-[#5F6368]">{content}</div>
                </div>
            </div>
        </Link>
    );
}
