import ReadMore from '@site/src/components/ReadMore';
import React from 'react';
import './user-item.css';

interface UserItemProps {
    image: any;
    name: string;
    to?: string;
    story?: string;
    order: number;
}

export default function UserItem(props: UserItemProps) {
    const hasDetails = Boolean(props.story || props.to);
    return (
        <li
            tabIndex={hasDetails ? 0 : undefined}
            aria-label={props.name}
            onClick={event => {
                if (!(event.target as Element).closest('a')) event.currentTarget.focus();
            }}
            className="user-story-card group cursor-pointer flex flex-col items-center swipe-top-button  shadow-[0px_2px_8px_0px_rgba(0,89,68,0.16)] rounded-lg"
        >
            <div
                className={`${hasDetails ? 'group-hover:hidden group-focus-within:hidden' : ''} flex justify-between py-2 px-2 lg:px-[2.375rem] lg:pt-[4.25rem] lg:pb-[2.375rem] flex-col items-center h-full w-full gap-[2.375rem]`}
            >
                <img src={props?.image} alt={props?.name} />
                <span className="text-xs lg:text-base">{props?.name}</span>
                {/* {props?.to && <ReadMore className="text-primary" to={props?.to} />} */}
            </div>

            <div
                className={`user-story-card__details hidden group-hover:flex group-focus-within:flex ${
                    props?.to && 'group-hover:flex-col group-focus-within:flex-col'
                } z-40 group-hover:text-white h-full justify-between px-4 py-6`}
            >
                <span className="text-xs lg:text-sm">{props?.story}</span>
                {props?.to && <ReadMore className="hover:text-white justify-center text-white" to={props?.to} />}
            </div>
        </li>
    );
}
