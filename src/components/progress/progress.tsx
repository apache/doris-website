import React from 'react';

export function Progress({ percent }: { percent: number }) {
    return (
        <div className="h-0.5 w-[calc(100%-1.5rem)] bg-neutral-200 dark:bg-neutral-600 progress">
            <div className="h-0.5  bg-[#C0C3F1]" style={{ width: `${percent}%` }}></div>
        </div>
    );
}
