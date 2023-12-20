import React from 'react';
import { useState } from 'react';
import { ArrowDownIcon } from '../Icons/arrow-down-icon';

export function CollapseBoxHeader({
    title,
    defaultExpand = true,
    disabled = false,
}: {
    title: string;
    defaultExpand?: boolean;
    disabled?: boolean;
}) {
    const [expand, setExpand] = useState<boolean>(defaultExpand);
    return (
        <div
            onClick={() => {
                if (disabled) return;
                setExpand(!expand);
            }}
            className={`peer flex cursor-pointer items-center justify-between rounded-t-lg bg-[#F7F9FE] px-[3rem] py-[1.5rem] text-2xl font-medium leading-[2.5rem] font-misans ${
                disabled ? 'cursor-default' : 'cursor-pointer'
            } ${expand ? 'expand' : ' rounded-b-lg'}`}
        >
            {title}
            {!disabled && <ArrowDownIcon className={`text-[#0065FD] ${expand ? 'rotate-180' : ''}`} />}
        </div>
    );
}
