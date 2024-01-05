import React from 'react';

export const VariousAnalyticsData = [
    {
        title: 'Real-time analytics',
        content:
            'From traditional batch reporting to real-time reporting and dashboards. From internal-facing analytics like traditional BI to customer-facing analytics. From decision support analytics to algorithm-driven real-time decision-making.',
        links: [{ content: 'Read JD.com story ', to: '/blog/JD_OLAP' }],
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                    d="M14.1176 16C15.1572 16 16 15.1572 16 14.1176L16 1.88235C16 0.842756 15.1572 -3.8256e-08 14.1176 -8.54458e-08L1.88236 -6.40837e-07C0.842762 -6.88026e-07 1.74312e-06 0.842759 3.06258e-06 1.88235L1.85917e-05 14.1176C1.99112e-05 15.1572 0.842778 16 1.88237 16L14.1176 16Z"
                    fill="#C0C3F1"
                />
                <path d="M3.29395 3.29419H12.7057" stroke="white" strokeWidth="1.41176" strokeLinecap="round" />
                <path d="M3.29395 6.58813H12.7057" stroke="white" strokeWidth="1.41176" strokeLinecap="round" />
                <circle cx="11.2943" cy="11.294" r="4.70588" fill="#444FD9" />
                <path
                    d="M13.3077 10.3892L10.8039 13.0447L9.21063 11.5425"
                    stroke="white"
                    strokeWidth="1.41176"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        ),
        backgroundClassName: 'cases-bg-real-time',
    },
    {
        title: 'Ad-hoc analysis',
        content: `According to Forbes, 78% of organizations consider ad-hoc analysis to be a critical or very important feature in business intelligence adoption. Interactive ad-hoc analysis is replacing predefined data reporting, allowing a wider range of people to perform self-service analysis. Doris' high performance can provide fast response to any query, making it an invaluable tool for organizations that need to quickly analyze data and make informed decisions.`,
        links: [{ content: 'Read Xiaomi story', to: '/blog/xiaomi_vector' }],
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                    d="M14.1176 16C15.1572 16 16 15.1572 16 14.1176L16 1.88235C16 0.842756 15.1572 -9.78606e-08 14.1176 -1.4505e-07L1.88236 -7.00441e-07C0.842761 -7.47631e-07 1.71306e-06 0.842759 3.06898e-06 1.88235L1.90271e-05 14.1176C2.0383e-05 15.1572 0.842778 16 1.88237 16L14.1176 16Z"
                    fill="#444FD9"
                />
                <path
                    d="M2.72949 8.00005H4.87202C4.9438 8.00005 5.00994 7.96114 5.04479 7.89839L6.65247 5.00457C6.73599 4.85424 6.95837 4.87491 7.01275 5.03806L8.98741 10.962C9.04179 11.1252 9.26417 11.1459 9.34769 10.9955L10.9554 8.10171C10.9902 8.03897 11.0564 8.00005 11.1281 8.00005H13.2707"
                    stroke="white"
                    strokeWidth="1.41176"
                    strokeLinecap="round"
                />
            </svg>
        ),
        backgroundClassName: 'cases-bg-ad-hoc',
    },
    {
        title: 'Data lake analytics',
        content: `Doris as a high-performance federated query engine provides a powerful way to directly map external data lakes and databases to Doris' databases and tables. This combination of the openness of data lakes and the high performance of data warehouses offers enterprises a unified and efficient way to access, analyze, and manage their data.`,
        links: [
            {
                content: 'Deep dive',
                to: '/blog/Building-the-Next-Generation-Data-Lakehouse-10X-Performance',
            },
        ],
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="0.470703" y="5.64697" width="15.0588" height="4.70588" rx="0.941176" fill="#444FD9" />
                <path
                    d="M0.470703 9.41175H1.09815C1.3018 9.41175 1.49995 9.4778 1.66286 9.59999L2.12763 9.94856C2.81438 10.4636 3.76261 10.4488 4.43294 9.91255L4.47128 9.88188C5.15875 9.3319 6.13617 9.33236 6.82364 9.88234V9.88234C7.51111 10.4323 8.48912 10.4323 9.17659 9.88234V9.88234C9.86406 9.33236 10.8415 9.3319 11.529 9.88188L11.5673 9.91255C12.2376 10.4488 13.1859 10.4636 13.8726 9.94856L14.3374 9.59999C14.5003 9.4778 14.6984 9.41175 14.9021 9.41175H15.5295V15.0588C15.5295 15.5786 15.1081 16 14.5884 16H1.41188C0.892081 16 0.470703 15.5786 0.470703 15.0588V9.41175Z"
                    fill="#C0C3F1"
                />
                <rect x="2.35303" y="7.29395" width="2.82353" height="1.41176" rx="0.705882" fill="white" />
                <rect x="0.470703" width="15.0588" height="4.70588" rx="0.941176" fill="#444FD9" />
                <rect x="2.35303" y="1.64697" width="2.82353" height="1.41176" rx="0.705882" fill="white" />
            </svg>
        ),
        backgroundClassName: 'cases-bg-datalake',
    },
    {
        title: 'ELT data processing',
        content: `As data warehouses become more powerful, there is indeed a shift from ETL (Extract, Transform, Load) processes that rely on external systems to ELT (Extract, Load, Transform) methods that are performed within the database itself. Doris, with its high-performance computing engine, supports complex large queries and incremental data reading, making it an excellent choice for ELT data processing.`,
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                    d="M14.1176 16C15.1572 16 16 15.1572 16 14.1176L16 1.88235C16 0.842756 15.1572 -2.76675e-07 14.1176 -3.23864e-07L1.88236 -8.79255e-07C0.842761 -9.26445e-07 1.62019e-06 0.842759 2.96444e-06 1.88235L1.87853e-05 14.1176C2.01295e-05 15.1572 0.842778 16 1.88237 16L14.1176 16Z"
                    fill="#444FD9"
                />
                <path
                    d="M4.70605 6.9646L3.49394 8.17671C3.38368 8.28698 3.38368 8.46575 3.49394 8.57602L4.70605 9.78813"
                    stroke="white"
                    strokeWidth="1.41176"
                    strokeLinecap="round"
                />
                <path
                    d="M11.2939 7.05884L12.5061 8.27095C12.6163 8.38121 12.6163 8.55999 12.5061 8.67026L11.2939 9.88237"
                    stroke="white"
                    strokeWidth="1.41176"
                    strokeLinecap="round"
                />
                <path d="M9.88255 4.23535L6.82373 11.2942" stroke="white" strokeWidth="1.41176" strokeLinecap="round" />
            </svg>
        ),
        links: [
            {
                content: 'Read use case',
                to: '/blog/For-Entry-Level-Data-Engineers-How-to-Build-a-Simple-but-Solid-Data-Architecture',
            },
        ],
        backgroundClassName: 'cases-bg-ELT',
    },
    {
        title: 'Log analytics',
        content: `Store business, system, or IoT-related log data as structured, semi-structured, or raw text to establish a unified log storage and analytics platform. Doris offers efficient handling of high-volume log data and provides high-performance log retrieval and analytics capabilities at a highly cost-effective rate.`,
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                    d="M0 4.70605H15.9999V13.6472C15.9999 14.6868 15.1571 15.5295 14.1175 15.5295H1.88234C0.842753 15.5295 0 14.6868 0 13.6472L0 4.70605Z"
                    fill="#444FD9"
                />
                <path
                    d="M16 3.76489L0.000114441 3.76489L0.000114564 2.35314C0.000114655 1.31355 0.842867 0.470799 1.88245 0.470799L14.1177 0.4708C15.1572 0.4708 16 1.31355 16 2.35314L16 3.76489Z"
                    fill="#C0C3F1"
                />
                <path
                    d="M4.70605 11.7647L6.52271 9.49387C6.55775 9.45006 6.62308 9.44644 6.66275 9.48611L8.86458 11.6879C8.90508 11.7284 8.97206 11.7237 9.00643 11.6779L11.7648 8"
                    stroke="white"
                    strokeWidth="1.41175"
                    strokeLinecap="round"
                />
            </svg>
        ),
        links: [
            { content: 'Deep dive', to: '/blog/log-analysis-elasticsearch-vs-apache-doris' },
            {
                content: 'Read China Unicom story',
                to: '/blog/Log-Analysis-How-to-Digest-15-Billion-Logs-Per-Day-and-Keep-Big-Queries-Within-1-Second',
            },
        ],
        backgroundClassName: 'cases-bg-log',
    },
    {
        title: 'Customer data platform',
        content: `Gather user-specific attributes and behavioral data, construct a comprehensive user data platform, perform in-depth analysis of user behaviors including engagement, retention, and conversion rates, and conduct precise audience analysis covering insights and segmentation.`,
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                    d="M13.8551 12.2105V14.3952C13.8551 14.5919 13.7119 14.7595 13.5176 14.7903L6.33762 15.9268C6.09479 15.9652 5.87508 15.7776 5.87508 15.5317V15.1618C5.87508 14.7024 5.48905 14.3374 5.03036 14.3631L3.45329 14.4514C3.01988 14.4757 2.64617 14.1508 2.60922 13.7183C2.51969 12.6702 2.36296 10.9268 2.30669 10.8713C1.93925 10.5089 0.0803872 10.5089 0.447694 9.78413C0.815 9.05938 1.93926 6.94737 1.93926 6.94737C2.18421 6.34341 1.93926 5.94296 1.93926 5.07326C1.93926 3.98613 4.14386 0 8.55306 0C12.9623 0 14.9306 2.56896 15.5343 6.16038C15.9408 8.57882 14.345 10.761 13.8551 12.2105Z"
                    fill="#C0C3F1"
                />
                <circle cx="8.8001" cy="6.39995" r="5.2" fill="#444FD9" />
                <path
                    d="M7.6001 4.3999V6.7999H8.8001V9.1999C8.8001 9.1999 9.47713 8.26219 9.8001 7.5999C10.0926 7.00009 10.4001 5.9999 10.4001 5.9999H9.2001L9.6001 4.3999H7.6001Z"
                    fill="white"
                    stroke="white"
                    strokeWidth="0.4"
                    strokeLinejoin="round"
                />
            </svg>
        ),
        links: [
            {
                content: 'Read use case',
                to: '/blog/Replacing-Apache-Hive-Elasticsearch-and-PostgreSQL-with-Apache-Doris/',
            },
        ],
        backgroundClassName: 'cases-bg-customer',
    },
];
