import React from 'react';

interface HomeIconProps extends React.SVGProps<SVGSVGElement> {}

const HomeIcon: React.FC<HomeIconProps> = props => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="21"
            height="20"
            fill="currentColor"
            viewBox="0 0 21 20"
            {...props}
        >
            <path
                fill-rule="evenodd"
                d="M3.835 6.44a1 1 0 0 0-.445.832v8.939c0 .436.354.79.79.79H16.81a.79.79 0 0 0 .79-.79V7.272a1 1 0 0 0-.446-.832L11.05 2.37a1 1 0 0 0-1.11 0zm7.26 4.16a.6.6 0 1 0-1.2 0v3.3a.6.6 0 0 0 1.2 0z"
                clip-rule="evenodd"
            ></path>
        </svg>
    );
};

export { HomeIcon };
