import Link from '@docusaurus/Link';
import ReadMore from '@site/src/components/ReadMore';
import React from 'react';

interface UserItemProps {
    image: any;
    name: string;
    to?: string;
}

export default function UserItem(props: UserItemProps) {
    return (
        <div className="flex h-[17.5rem] flex-col items-center gap-[2.375rem] shadow-[0px_2px_8px_0px_rgba(49,77,136,0.16)] pt-[68px] pb-0 px-[2.375rem] rounded-lg">
            {props.image}
            <span>{props?.name}</span>
            {props?.to && <ReadMore to={props?.to} />}
        </div>
    );
}
