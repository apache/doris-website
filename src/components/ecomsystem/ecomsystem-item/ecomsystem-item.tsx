import { CheckedIcon } from './icons/checked-icon';
import React, { ReactNode } from 'react';
import { EcomsystemItemHeader } from './ecomsystem-item-header';

interface EcomsystemItemProps {
    title: string;
    description: string;
    characteristic: string[];
    rightContent?: ReactNode;
    newLink?: ReactNode;
    moreLink?: ReactNode;
    showListIcon?: boolean;
}

export default function EcomsystemItem({
    title,
    description,
    characteristic,
    rightContent,
    newLink,
    moreLink,
    showListIcon = true,
}: EcomsystemItemProps) {
    return (
        <div className="mt-[5.5rem] w-full rounded-lg border border-[#DFE5F0]">
            <EcomsystemItemHeader title={title} />
            <div className="grid grid-rows-[0fr] overflow-hidden transition-all peer-[.expand]:grid-rows-[1fr]">
                <div className="min-h-0 ">
                    <div className="flex flex-col flex-wrap items-center justify-between p-4 sm:p-[3rem] lg:flex-row lg:items-start">
                        <div className="w-full lg:mr-32 lg:flex-1">
                            {newLink}
                            {description && (
                                <div
                                    className={`${
                                        newLink ? 'pb-4' : 'pb-8'
                                    } text-base font-medium leading-[1.8] text-[#1D1D1D]`}
                                >
                                    {description}
                                </div>
                            )}
                            <div className="">
                                <div className="flex">
                                    <div>
                                        <ul>
                                            {characteristic?.map(e => (
                                                <li key={e} className="mt-2 flex items-center space-x-2">
                                                    {showListIcon && <CheckedIcon />}
                                                    <div className="text-[#5F6368]">{e}</div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                            <div className="flex mt-6 items-center">{moreLink}</div>
                        </div>
                        <div className="w-full pt-8 lg:w-[27.25rem] lg:pt-0">{rightContent}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
