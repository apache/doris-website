export const NEWSLETTER_DATA = [
    {
        tags: ['Release Notes'],
        title: "Apache Doris 2.0.9 is released now",
        content: `Thanks to our community users and developers, about 68 improvements and bug fixes have been made in Doris 2.0.9 version.`,
        to: '/blog/release-note-2.0.9',
        image: '2.0.9.png',
    },
    {
        tags: ['Tech Sharing'],
        title: "Arrow Flight SQL in Apache Doris for 10X faster data transfer",
        content: `Apache Doris 2.1 supports Arrow Flight SQL protocol for reading data from Doris. It delivers tens-fold speedups compared to PyMySQL and Pandas.`,
        to: '/blog/arrow-flight-sql-in-apache-doris-for-10x-faster-data-transfer',
        image: 'arrow-flight-sql-in-apache-doris-for-10x-faster-data-transfer.png',
    },
    {
        tags: ['Tech Sharing'],
        title: "Auto-increment columns in databases: a simple magic that makes a big difference",
        content: `Auto-increment columns in Apache Doris accelerates dictionary encoding and pagination without damaging data writing performance. This is an introduction to its usage, applicable scenarios, and implementation details.`,
        to: '/blog/auto-increment-columns-in-databases',
        image: 'auto-increment-columns-in-databases.png',
    },
    {
        tags: ['Tech Sharing'],
        title: "Variant in Apache Doris 2.1.0: a new data type 8 times faster than JSON for semi-structured data analysis",
        content: `Doris 2.1.0 provides a new data type: Variant, for semi-structured data analysis, which enables 8 times faster query performance than JSON with one-third storage space.`,
        to: '/blog/variant-in-apache-doris-2.1',
        image: 'variant-in-apache-doris-2.1.png',
    },
];
