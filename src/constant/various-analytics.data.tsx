import React from 'react';

export const VariousAnalyticsData = [
    {
        title: 'Real-time analytics',
        content:
            'From traditional batch reporting to real-time reporting and dashboards. From internal-facing analytics like traditional BI to customer-facing analytics. From decision support analytics to algorithm-driven real-time decision-making.',
        links: [{ content: 'Read JD.com story ', to: '/blog/JD_OLAP' }],
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M14.1176 16C15.1572 16 16 15.1572 16 14.1176L16 1.88235C16 0.842756 15.1572 -3.8256e-08 14.1176 -8.54458e-08L1.88236 -6.40837e-07C0.842762 -6.88026e-07 1.59168e-06 0.842759 3.45527e-06 1.88235L1.8199e-05 14.1176C2.00626e-05 15.1572 0.842777 16 1.88237 16L14.1176 16Z" fill="#99F2CB" />
                <path d="M3.29419 3.29419H12.706" stroke="white" stroke-width="1.41176" stroke-linecap="round" />
                <path d="M3.29419 6.58813H12.706" stroke="white" stroke-width="1.41176" stroke-linecap="round" />
                <circle cx="11.2941" cy="11.294" r="4.70588" fill="#11A679" />
                <path d="M13.3078 10.3892L10.804 13.0447L9.21075 11.5425" stroke="white" stroke-width="1.41176" stroke-linecap="round" stroke-linejoin="round" />
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
                <path d="M14.1176 16C15.1572 16 16 15.1572 16 14.1176L16 1.88235C16 0.842756 15.1572 -3.8256e-08 14.1176 -8.54458e-08L1.88236 -6.40837e-07C0.842762 -6.88026e-07 1.59168e-06 0.842758 3.45527e-06 1.88235L1.91527e-05 14.1176C2.00626e-05 15.1572 0.842778 16 1.88237 16L14.1176 16Z" fill="#11A679" />
                <path d="M2.72937 8.00005H4.8719C4.94368 8.00005 5.00981 7.96114 5.04467 7.89839L6.65235 5.00457C6.73587 4.85424 6.95824 4.87491 7.01263 5.03806L8.98729 10.962C9.04167 11.1252 9.26405 11.1459 9.34757 10.9955L10.9552 8.10171C10.9901 8.03897 11.0562 8.00005 11.128 8.00005H13.2705" stroke="white" stroke-width="1.41176" stroke-linecap="round" />
            </svg>
        ),
        backgroundClassName: 'cases-bg-ad-hoc',
    },
    {
        title: 'Data lakehouse',
        content: `Doris as a high-performance federated query engine provides a powerful way to directly map external data lakes and databases to Doris' databases and tables. This combination of the openness of data lakes and the high performance of data warehouses offers enterprises a unified and efficient way to access, analyze, and manage their data.`,
        links: [
            {
                content: 'Deep dive',
                to: '/blog/Building-the-Next-Generation-Data-Lakehouse-10X-Performance',
            },
            {
                content: 'Read use case',
                to: '/blog/apache-doris-speeds-up-data-reporting-tagging-and-data-lake-analytics',
            },
        ],
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="0.470459" y="5.64697" width="15.0588" height="4.70588" rx="0.941176" fill="#11A679" />
                <path d="M0.470459 9.41175H1.09791C1.30155 9.41175 1.4997 9.4778 1.66262 9.59999L2.12738 9.94856C2.81414 10.4636 3.76237 10.4488 4.43269 9.91255L4.47103 9.88188C5.1585 9.3319 6.13593 9.33236 6.8234 9.88234C7.51087 10.4323 8.48887 10.4323 9.17634 9.88234C9.86381 9.33236 10.8412 9.3319 11.5287 9.88188L11.567 9.91255C12.2374 10.4488 13.1856 10.4636 13.8724 9.94856L14.3371 9.59999C14.5 9.4778 14.6982 9.41175 14.9018 9.41175H15.5293V15.0588C15.5293 15.5786 15.1079 16 14.5881 16H1.41163C0.891837 16 0.470459 15.5786 0.470459 15.0588V9.41175Z" fill="#99F2CB" />
                <rect x="2.35291" y="7.29395" width="2.82353" height="1.41176" rx="0.705882" fill="white" />
                <rect x="0.470581" width="15.0588" height="4.70588" rx="0.941176" fill="#11A679" />
                <rect x="2.35291" y="1.64697" width="2.82353" height="1.41176" rx="0.705882" fill="white" />
            </svg>
        ),
        backgroundClassName: 'cases-bg-datalake',
    },
    {
        title: 'ELT data processing',
        content: `As data warehouses become more powerful, there is indeed a shift from ETL (Extract, Transform, Load) processes that rely on external systems to ELT (Extract, Load, Transform) methods that are performed within the database itself. Doris, with its high-performance computing engine, supports complex large queries and incremental data reading, making it an excellent choice for ELT data processing.`,
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M14.1176 16C15.1572 16 16 15.1572 16 14.1176L16 1.88235C16 0.842756 15.1572 -3.8256e-08 14.1176 -8.54458e-08L1.88236 -6.40837e-07C0.842762 -6.88026e-07 1.59168e-06 0.842758 2.50159e-06 1.88235L1.91527e-05 14.1176C2.00626e-05 15.1572 0.842778 16 1.88237 16L14.1176 16Z" fill="#11A679" />
                <path d="M4.70593 6.9646L3.49382 8.17671C3.38356 8.28698 3.38356 8.46575 3.49382 8.57602L4.70593 9.78813" stroke="white" stroke-width="1.41176" stroke-linecap="round" />
                <path d="M11.2942 7.05884L12.5063 8.27095C12.6166 8.38121 12.6166 8.55999 12.5063 8.67026L11.2942 9.88237" stroke="white" stroke-width="1.41176" stroke-linecap="round" />
                <path d="M9.88243 4.23535L6.82361 11.2942" stroke="white" stroke-width="1.41176" stroke-linecap="round" />
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
                <path d="M0 4.70605H15.9999V13.6472C15.9999 14.6868 15.1571 15.5295 14.1175 15.5295H1.88234C0.842753 15.5295 0 14.6868 0 13.6472L0 4.70605Z" fill="#11A679" />
                <path d="M16 3.76489L0.000114441 3.76489L0.000114564 2.35314C0.000114655 1.31355 0.842867 0.470799 1.88245 0.470799L14.1177 0.4708C15.1572 0.4708 16 1.31355 16 2.35314L16 3.76489Z" fill="#99F2CB" />
                <path d="M4.70605 11.7647L6.52271 9.49387C6.55775 9.45006 6.62308 9.44644 6.66275 9.48611L8.86458 11.6879C8.90508 11.7284 8.97206 11.7237 9.00643 11.6779L11.7648 8" stroke="white" stroke-width="1.41175" stroke-linecap="round" />
            </svg>
        ),
        links: [
            { content: 'Deep dive', to: '/blog/log-analysis-elasticsearch-vs-apache-doris' },
            {
                content: 'Read NetEase story',
                to: '/blog/apache-doris-for-log-and-time-series-data-analysis-in-netease',
            },
        ],
        backgroundClassName: 'cases-bg-log',
    },
    {
        title: 'Customer data platform',
        content: `Gather user-specific attributes and behavioral data, construct a comprehensive user data platform, perform in-depth analysis of user behaviors including engagement, retention, and conversion rates, and conduct precise audience analysis covering insights and segmentation.`,
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M13.8552 12.2105V14.3952C13.8552 14.5919 13.7121 14.7595 13.5177 14.7903L6.33774 15.9268C6.09491 15.9652 5.87521 15.7776 5.87521 15.5317V15.1618C5.87521 14.7024 5.48917 14.3374 5.03048 14.3631L3.45341 14.4514C3.02 14.4757 2.6463 14.1508 2.60935 13.7183C2.51981 12.6702 2.36309 10.9268 2.30681 10.8713C1.93937 10.5089 0.0805092 10.5089 0.447816 9.78413C0.815122 9.05938 1.93938 6.94737 1.93938 6.94737C2.18433 6.34341 1.93938 5.94296 1.93938 5.07326C1.93938 3.98613 4.14398 0 8.55318 0C12.9624 0 14.9308 2.56896 15.5344 6.16038C15.9409 8.57882 14.3451 10.761 13.8552 12.2105Z" fill="#99F2CB" />
                <circle cx="8.80034" cy="6.39995" r="5.2" fill="#11A679" />
                <path d="M7.60034 4.3999V6.7999H8.80034V9.1999C8.80034 9.1999 9.47737 8.26219 9.80034 7.5999C10.0928 7.00009 10.4003 5.9999 10.4003 5.9999H9.20034L9.60034 4.3999H7.60034Z" fill="white" stroke="white" stroke-width="0.4" stroke-linejoin="round" />
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
