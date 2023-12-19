import Link from '@docusaurus/Link';
import ReadMore from '@site/src/components/ReadMore';
import React from 'react';
import './user-item.css';

interface UserItemProps {
    image: any;
    name: string;
    to?: string;
    story?: string;
}

export default function UserItem(props: UserItemProps) {
    return (
        <div className="group cursor-pointer flex flex-col items-center swipe-top-button h-[17.5rem] shadow-[0px_2px_8px_0px_rgba(49,77,136,0.16)] rounded-lg">
            <div className="group-hover:hidden flex justify-between px-[2.375rem] lg:pt-[4.25rem] lg:pb-[2.375rem] pb-0 flex-col items-center h-full w-full gap-[2.375rem] ">
                {props.image}
                <span>{props?.name}</span>
                {/* {props?.to && <ReadMore className="text-primary" to={props?.to} />} */}
            </div>

            <div
                className={`hidden group-hover:flex ${
                    props?.to && 'group-hover:flex-col'
                } z-40 group-hover:text-white items-center h-full justify-between px-4 py-6`}
            >
                <span>{props?.story}</span>
                {props?.to && <ReadMore className="hover:text-white" to={props?.to} />}
            </div>
        </div>
    );
}
