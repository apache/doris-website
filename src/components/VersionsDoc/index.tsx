import React from 'react';
import clsx from 'clsx';
import './styles.scss';
import { useState } from 'react';

// type: paragraph (段落), inline（行内）
export default function VersionsDoc(props): JSX.Element {
    const { children, type="paragraph", since = '', deprecated = '', comment=''} = props;
    const [showTag, setShowTag] = useState<boolean>(false)
    
    return (
        <span className={clsx('version-mark', type)} onMouseEnter={() => setShowTag(true)} onMouseLeave={() => setShowTag(false)}>
            <span className={clsx('v-mark', showTag && 'show')}>
                {<span className={clsx("version-tags")}>
                    {since && <span className='version-tag'>
                        <span className='version-tag-t'>Since</span>
                        <span className='version-tag-n since'>Version {since}</span>
                    </span>}
                    {deprecated && <span className='version-tag'>
                        <span className='version-tag-t'>Deprecated</span>
                        <span className='version-tag-n deprecated'>Version {deprecated}</span>
                    </span>}
                </span>}
                {comment && <span className='version-comment'>{comment}</span>}
            </span>
            {children}
        </span>
    );
}
