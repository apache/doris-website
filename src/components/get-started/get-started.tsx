import React from 'react';
import ExternalLink from '../external-link/external-link';
import { ExternalLinkArrowIcon } from '../Icons/external-link-arrow-icon';
import { GET_STARTED_DATA } from './get-started.data';

export default function GetStarted() {
    const data = GET_STARTED_DATA;
    return (
        <div className="relative overflow-hidden py-[5.5rem] bg-center bg-cover bg-[url(@site/static/images/ecomsystem/download-bg.png)]">
            {/* <div className="border-[rgba(255, 255, 255, 0.63)] absolute top-0 h-[40rem] w-[40rem] -translate-x-2/3 -translate-y-2/3 transform rounded-full border-[20rem] bg-transparent opacity-10"></div>
            <div className="border-[rgba(255, 255, 255, 0.63)] absolute bottom-0 right-0 h-[40rem] w-[40rem] translate-x-1/2 translate-y-1/2 transform rounded-full border-[20rem] bg-transparent opacity-10"></div> */}
            <div className="container mx-auto">
                <h2 className="text-center text-[1.75rem] leading-normal lg:font-[540] text-white lg:text-title-md">
                    {data.title}
                </h2>
                {data?.description && <div className="mt-4 text-center text-white">{data.description}</div>}
                <div className="relative z-[1] mt-12 flex justify-center space-x-4 lg:space-x-10">
                    {data.buttons.map((item, index) => {
                        return (
                            <ExternalLink
                                label={item.text}
                                key={index}
                                {...item}
                                linkIcon={<ExternalLinkArrowIcon />}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
