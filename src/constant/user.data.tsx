import React from 'react';

export const USER_STORIES_CATEGORIES = [
    'All',
    'Finance',
    'Technology',
    'Media & Entertainment',
    'Telecom & Manufacturing',
    'FMCG & Logistics',
    'Commercial Distribution',
];

export const USER_STORIES = [
    {
        title: '“Processing 10 billions rows of data every day with 10,000 QPS and achieve a query latency of just 150ms”',
        author: {
            name: 'Li Zhe',
            title: 'Senior Software Engineer, JD.com',
        },
        to: 'blog/how-big-data-is-saving-lives-in-real-time-iov-data-analytics-helps-prevent-accidents',
        image: 'user-jd.png',
    },
    {
        title: '“Reducing costs and increasing service availability, large language models empower Doris-based OLAP service”',
        author: {
            name: 'Jun Zhang, Lei Luo',
            title: 'Senior software engineer, Tencent ',
        },
        to: 'blog/Tencent-LLM',
        image: 'tme.png',
    },
    {
        title: '“Digest 15 billion logs per day and keep big queries within 1 second. We use Doris to deploy multiple petabyte scale clusters on dozens of machines”',
        author: {
            name: 'Yuqi Liu',
            title: 'Senior software engineer, China Unicom',
        },
        to: 'blog/Log-Analysis-How-to-Digest-15-Billion-Logs-Per-Day-and-Keep-Big-Queries-Within-1-Second',
        image: 'china-unicom.png',
    },
];
