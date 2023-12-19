import React from 'react';
import { useState } from 'react';
import { ArrowDownIcon } from '../Icons/arrow-down-icon';

export function CollapseBoxHeader({ title, defaultExpand = true }: { title: string; defaultExpand: boolean }) {
    const [expand, setExpand] = useState<boolean>(defaultExpand);
    return (
        <div
            onClick={() => setExpand(!expand)}
            className={`peer flex cursor-pointer items-center justify-between rounded-t-lg bg-[#F7F9FE] px-[3rem] py-[1.5rem] text-2xl font-semibold leading-[2.5rem] font-misans ${
                expand ? 'expand' : ' rounded-b-lg'
            }`}
        >
            {title}
            <ArrowDownIcon className={`text-[#0065FD] ${expand ? 'rotate-180' : ''}`} />
        </div>
    );
}
