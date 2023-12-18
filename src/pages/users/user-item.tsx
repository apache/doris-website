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
        <div className="group flex flex-col items-center swipe-top-button h-[17.5rem] shadow-[0px_2px_8px_0px_rgba(49,77,136,0.16)] rounded-lg">
            <div className="group-hover:hidden px-[2.375rem] pt-[68px] pb-0 flex-col items-center h-full w-full gap-[2.375rem] ">
                {props.image}
                <span>{props?.name}</span>
                {props?.to && <ReadMore className="text-primary" to={props?.to} />}
            </div>

            <div
                className={`hidden group-hover:flex group-hover:${
                    props?.to ? 'flex-col' : 'flex'
                } z-40 group-hover:text-white items-center h-full justify-between px-4 py-6`}
            >
                <span>{props?.story}</span>
                {props?.to && <ReadMore className="hover:text-white" to={props?.to} />}
            </div>
        </div>
    );
}
