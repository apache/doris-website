import React, { ReactNode } from 'react';
import { CheckedIcon } from '../Icons/checked-icon';
import { CollapseBoxHeader } from './collapse-box-header';

interface CollapseBoxProps {
    title: string;
    popTrue?: boolean;
    description: string | React.ReactNode;
    characteristic?: string[];
    rightContent?: ReactNode;
    newLink?: ReactNode;
    moreLink?: ReactNode;
    showListIcon?: boolean;
    notes?: string | ReactNode;
    expand?: boolean;
    className?: string;
    disabledExpand?: boolean;
}

export default function CollapseBox({
    title,
    popTrue,
    description,
    characteristic = [],
    rightContent,
    newLink,
    moreLink,
    showListIcon = true,
    notes,
    expand,
    className,
    disabledExpand = false,
}: CollapseBoxProps) {
    return (
        <div className={`mt-[5.5rem] w-full rounded-lg border border-[#DFE5F0]  ${className}`}>
            <CollapseBoxHeader title={title} defaultExpand={expand} disabled={disabledExpand} popTrue={popTrue}/>
            <div className="grid grid-rows-[0fr] overflow-hidden transition-all peer-[.expand]:grid-rows-[1fr]">
                <div className="min-h-0 ">
                    <div className="flex flex-col flex-wrap items-center justify-between p-4 sm:p-[3rem] lg:flex-row lg:items-start">
                        <div className="w-full lg:mr-32 lg:flex-1">
                            {newLink}
                            {description && (
                                <div className={`text-base leading-[1.625rem] text-[#1D1D1D]`}>{description}</div>
                            )}
                            {characteristic?.length > 0 && (
                                <div className="flex">
                                    <ul>
                                        {characteristic?.map(e => (
                                            <li key={e} className="mt-4 flex items-center space-x-2">
                                                {showListIcon && <CheckedIcon />}
                                                <div className="text-[#5F6368]">{e}</div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {moreLink && <div className="flex mt-6 items-center">{moreLink}</div>}
                            {notes && <div className="mt-8 text-[#8592A6] text-xs leading-5">{notes}</div>}
                        </div>
                        <div className="w-full pt-8 lg:w-[27.25rem] lg:pt-0">{rightContent}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
