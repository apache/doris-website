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
            to={`/ecosystem/${url}`}
            onClick={() => {
                setActive();
            }}
            className={`lg:h-[190px] w-full cursor-pointer rounded-lg bg-[#fff] px-4 lg:px-6 py-6 shadow-[0px_2px_8px_0px_rgba(49,77,136,0.16)] lg:flex-1 ${
                active ? 'border-b-4 border-[#0065FD]' : ''
            } hover:no-underline`}
        >
            <div className="flex flex-col items-center">
                <div className={`text-[3.375rem] `}>{icon}</div>
                {/* <div> */}
                    <div className="text-xl font-medium text-[#202124] py-[4px] font-misans sm:text-xl">{title}</div>
                    <div className="w-[160px] pt-[0.3125rem] text-center text-sm tracking-[-0.01rem] text-[#5F6368]">{content}</div>
                {/* </div> */}
            </div>
        </Link>
    );
}
