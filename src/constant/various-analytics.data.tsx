import React from 'react';

export const VariousAnalyticsData = [
    {
        title: 'Real-time analytics',
        content:
            'From traditional batch reporting to real-time reporting and dashboards. From internal-facing analytics like traditional BI to customer-facing analytics. From decision support analytics to algorithm-driven real-time decision-making.',
        links: [{ content: 'Read JD.com story ', to: '/blog/JD_OLAP' }],
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80" fill="none">
                <path
                    d="M53 57C55.2091 57 57 55.2091 57 53L57 27C57 24.7909 55.2091 23 53 23L27 23C24.7909 23 23 24.7909 23 27L23 53C23 55.2091 24.7909 57 27 57L53 57Z"
                    fill="#C0C3F1"
                />
                <path d="M30.0001 30H50.0001" stroke="white" stroke-width="3" stroke-linecap="round" />
                <path d="M30.0001 37H50.0001" stroke="white" stroke-width="3" stroke-linecap="round" />
                <circle cx="47" cy="47" r="10" fill="#444FD9" />
                <path
                    d="M51.279 45.0771L45.9586 50.7201L42.5728 47.5279"
                    stroke="white"
                    stroke-width="3"
                    stroke-linecap="round"
                    stroke-linejoin="round"
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
            <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80" fill="none">
                <path
                    d="M53 55C55.2091 55 57 53.2091 57 51L57 25C57 22.7909 55.2091 21 53 21L27 21C24.7909 21 23 22.7909 23 25L23 51C23 53.2091 24.7909 55 27 55L53 55Z"
                    fill="#444FD9"
                />
                <path
                    d="M28.7998 38H33.3527C33.5052 38 33.6457 37.9174 33.7198 37.784L37.1361 31.6347C37.3136 31.3152 37.7862 31.3591 37.9017 31.7058L42.0979 44.2943C42.2134 44.641 42.686 44.6849 42.8635 44.3654L46.2798 38.2161C46.3539 38.0827 46.4944 38 46.6469 38H51.1998"
                    stroke="white"
                    stroke-width="3"
                    stroke-linecap="round"
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
            <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80" fill="none">
                <rect x="23.9999" y="34" width="32" height="10" rx="2" fill="#444FD9" />
                <path
                    d="M23.9999 42H25.3333C25.766 42 26.1871 42.1404 26.5333 42.4L27.5209 43.1407C28.9803 44.2352 30.9952 44.2038 32.4197 43.0642L32.5012 42.999C33.962 41.8303 36.0391 41.8313 37.4999 43C38.9608 44.1687 41.0391 44.1687 42.4999 43C43.9608 41.8313 46.0378 41.8303 47.4987 42.999L47.5802 43.0642C49.0046 44.2038 51.0196 44.2352 52.479 43.1407L53.4666 42.4C53.8128 42.1404 54.2339 42 54.6666 42H55.9999V54C55.9999 55.1046 55.1045 56 53.9999 56H25.9999C24.8954 56 23.9999 55.1046 23.9999 54V42Z"
                    fill="#C0C3F1"
                />
                <rect x="27.9999" y="37.5" width="6" height="3" rx="1.5" fill="white" />
                <rect x="23.9999" y="22" width="32" height="10" rx="2" fill="#444FD9" />
                <rect x="27.9999" y="25.5" width="6" height="3" rx="1.5" fill="white" />
            </svg>
        ),
        backgroundClassName: 'cases-bg-datalake',
    },
    {
        title: 'ELT data processing',
        content: `As data warehouses become more powerful, there is indeed a shift from ETL (Extract, Transform, Load) processes that rely on external systems to ELT (Extract, Load, Transform) methods that are performed within the database itself. Doris, with its high-performance computing engine, supports complex large queries and incremental data reading, making it an excellent choice for ELT data processing.`,
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80" fill="none">
                <path
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M56.9999 53C56.9999 55.2091 55.2091 57 52.9999 57H27C24.7908 57 23 55.2091 23 53L22.9999 27C22.9999 24.7909 24.7908 23 26.9999 23L52.9999 23C55.209 23 56.9999 24.7909 56.9999 27L56.9999 53ZM44.5964 30.6236C45.3565 30.953 45.7057 31.8362 45.3763 32.5963L38.8763 47.5963C38.5469 48.3564 37.6637 48.7056 36.9035 48.3762C36.1434 48.0468 35.7942 47.1636 36.1236 46.4035L42.6236 31.4035C42.953 30.6434 43.8362 30.2942 44.5964 30.6236ZM34.0606 38.8607C34.6464 38.2749 34.6464 37.3252 34.0606 36.7394C33.4748 36.1536 32.5251 36.1536 31.9393 36.7394L29.3635 39.3151C28.5434 40.1352 28.5434 41.4649 29.3635 42.285L31.9393 44.8607C32.5251 45.4465 33.4748 45.4465 34.0606 44.8607C34.6464 44.2749 34.6464 43.3252 34.0606 42.7394L32.1213 40.8001L34.0606 38.8607ZM45.9393 39.0607C45.3535 38.4749 45.3535 37.5251 45.9393 36.9393C46.5251 36.3536 47.4748 36.3536 48.0606 36.9393L50.6363 39.5151C51.4564 40.3352 51.4564 41.6648 50.6363 42.4849L48.0606 45.0607C47.4748 45.6464 46.5251 45.6464 45.9393 45.0607C45.3535 44.4749 45.3535 43.5251 45.9393 42.9393L47.8786 41L45.9393 39.0607Z"
                    fill="#444FD9"
                />
            </svg>
        ),
        links: [
            {
                content: 'Read the use case of leading theaters',
                to: '/blog/For-Entry-Level-Data-Engineers-How-to-Build-a-Simple-but-Solid-Data-Architecture',
            },
        ],
        backgroundClassName: 'cases-bg-ELT',
    },
    {
        title: 'Log analytics',
        content: `Store business, system, or IoT-related log data as structured, semi-structured, or raw text to establish a unified log storage and analytics platform. Doris offers efficient handling of high-volume log data and provides high-performance log retrieval and analytics capabilities at a highly cost-effective rate.`,
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80" fill="none">
                <path
                    d="M56.9999 30L22.9999 30L22.9999 27C22.9999 24.7909 24.7908 23 26.9999 23L52.9999 23C55.2091 23 56.9999 24.7909 56.9999 27L56.9999 30Z"
                    fill="#C0C3F1"
                />
                <path
                    d="M57.0002 32H23.0002V51C23.0002 53.2091 24.791 55 27.0002 55H53.0002C55.2093 55 57.0002 53.2091 57.0002 51V32ZM49.1999 39.9001L43.3383 47.7156C42.7176 48.5432 41.5077 48.6292 40.7762 47.8977L37.1243 44.2458L34.1712 47.9371C33.6537 48.584 32.7098 48.6889 32.0629 48.1714C31.416 47.6539 31.3111 46.7099 31.8286 46.063L35.689 41.2375C36.322 40.4463 37.5021 40.381 38.2186 41.0974L41.8376 44.7165L46.7999 38.1001C47.297 37.4373 48.2372 37.303 48.8999 37.8001C49.5627 38.2971 49.697 39.2373 49.1999 39.9001Z"
                    fill="#444FD9"
                />
            </svg>
        ),
        links: [
            { content: 'Deep dive', to: '/blog/log-analysis-elasticsearch-vs-apache-doris' },
            {
                content: 'China Unicom',
                to: '/blog/Log-Analysis-How-to-Digest-15-Billion-Logs-Per-Day-and-Keep-Big-Queries-Within-1-Second',
            },
        ],
        backgroundClassName: 'cases-bg-log',
    },
    {
        title: 'Customer data platform',
        content: `Gather user-specific attributes and behavioral data, construct a comprehensive user data platform, perform in-depth analysis of user behaviors including engagement, retention, and conversion rates, and conduct precise audience analysis covering insights and segmentation.`,
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80" fill="none">
                <path
                    d="M54.6379 50.5263V55.9879C54.6379 56.4799 54.2801 56.8987 53.7942 56.9757L35.8443 59.817C35.2372 59.9131 34.688 59.4439 34.688 58.8293V57.9046C34.688 56.7561 33.7229 55.8435 32.5761 55.9077L28.6335 56.1285C27.5499 56.1891 26.6157 55.377 26.5233 54.2957C26.2995 51.6756 25.9077 47.3169 25.767 47.1782C24.8484 46.2722 20.2012 46.2722 21.1195 44.4603C22.0377 42.6485 24.8484 37.3684 24.8484 37.3684C25.4608 35.8585 24.8484 34.8574 24.8484 32.6831C24.8484 29.9653 30.3599 20 41.3829 20C52.4059 20 57.3268 26.4224 58.836 35.401C59.8522 41.4471 55.8627 46.9026 54.6379 50.5263Z"
                    fill="#C0C3F1"
                />
                <circle cx="42" cy="36" r="13" fill="#444FD9" />
                <path
                    d="M39 31V37H42V43C42 43 43.6926 40.6557 44.5 39C45.2312 37.5005 46 35 46 35H43L44 31H39Z"
                    fill="white"
                    stroke="white"
                    stroke-linejoin="round"
                />
            </svg>
        ),
        links: [
            {
                content: 'Read the use case of data service company',
                to: '/blog/Replacing-Apache-Hive-Elasticsearch-and-PostgreSQL-with-Apache-Doris/',
            },
        ],
        backgroundClassName: 'cases-bg-customer',
    },
];
