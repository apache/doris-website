import React, { ReactNode } from 'react';
import { useState } from 'react';
import Link from '@docusaurus/Link';
import { ArrowDownIcon } from '../Icons/arrow-down-icon';
import { InfoFilledIcon } from '../Icons/info-filled';
import { Popover } from 'antd';

export function CollapseBoxHeader({
    title,
    popTrue,
    defaultExpand = true,
    disabled = false,
}: {
    title: string;
    popTrue?: boolean;
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
            className={`peer flex cursor-pointer items-center justify-between rounded-t-lg bg-[#F7F9FE] px-[1rem] py-[0.75rem] lg:px-[3rem] lg:py-[1.5rem] text-2xl font-medium leading-[2.5rem] font-misans ${disabled ? 'cursor-default' : 'cursor-pointer'
                } ${expand ? 'expand' : ' rounded-b-lg'}`}
        >
            <div className="flex items-center">
                {title}
                {popTrue &&
                    (
                        <span className="ml-2">
                            <Popover
                                content={
                                    <div>
                                        <div className="text-xs leading-relaxed text-[#4C576c]">
                                            Resources and services are not maintained or endorsed by the Apache Doris, which is
                                            overseen by the Committers and the Doris PMC. Their use is entirely at your discretion, and
                                            the community is not responsible for verifying the licenses or validity of these tools. It is your
                                            obligation to ensure their authenticity.
                                        </div>
                                        <div className="text-xs mt-4 leading-relaxed text-[#4C576c]">
                                            If you wish to be featured on this page, please contact the <Link
                                                className="text-primary cursor-pointer hover:no-underline"
                                                to="mailto:dev@doris.apache.org">Apache Doris dev mailing list
                                            </Link> submit a Pull Request directly to this page.
                                        </div>
                                    </div>}
                                placement="right"
                                overlayStyle={{ width: 650, height: 180 }}
                                overlayInnerStyle={{ padding: 16 }}
                                trigger="hover">
                                <span><InfoFilledIcon /></span>
                            </Popover>
                        </span>
                    )}
            </div>
            {!disabled && (
                <ArrowDownIcon className={`text-[#0065FD] text-3xl lg:text-2xl ${expand ? 'rotate-180' : ''}`} />
            )}
        </div>
    );
}
