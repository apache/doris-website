import React from 'react';
import { useState } from 'react';
import { ArrowDownIcon } from './icons/arrow-right-icon';

export function EcomsystemItemHeader({ title }: { title: string }) {
    const [expand, setExpand] = useState<boolean>(true);
    return (
        <div
            onClick={() => setExpand(!expand)}
            className={`peer flex cursor-pointer items-center justify-between rounded-t-lg bg-[#F7F9FE] px-[3rem] py-[1.5rem] text-2xl font-semibold leading-[2.5rem] ${
                expand ? 'expand' : ' rounded-b-lg'
            }`}
        >
            {title}
            <ArrowDownIcon className={`${expand ? 'rotate-180' : ''}`} />
        </div>
    );
}
