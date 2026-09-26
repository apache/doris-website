export interface CourseModule {
    number: string;
    title: string;
    shortTitle: string;
    description: string;
    href: string;
}

export const COURSE_101_MODULES: CourseModule[] = [
    {
        number: '01',
        title: 'Apache Doris Overview',
        shortTitle: 'Meet the engine',
        description: 'Architecture, data organization, storage models, query execution, and optimization.',
        href: '/course/101/01-apache-doris-overview',
    },
    {
        number: '02',
        title: 'Installation Guide',
        shortTitle: 'Deploy Doris',
        description: 'Choose an architecture and follow the deployment path that fits your environment.',
        href: '/course/101/02-apache-doris-installation-guide',
    },
    {
        number: '03',
        title: 'Table Guide',
        shortTitle: 'Design tables',
        description: 'Select data models, sort keys, partitioning, bucketing, indexes, and practical schemas.',
        href: '/course/101/03-apache-doris-table-guide',
    },
    {
        number: '04',
        title: 'Data Operations Guide',
        shortTitle: 'Move and manage data',
        description: 'Load, update, delete, and export data with methods matched to the workload.',
        href: '/course/101/04-apache-doris-data-operations-guide',
    },
    {
        number: '05',
        title: 'Query Data Guide',
        shortTitle: 'Query and optimize',
        description: 'Use joins, analytics, window functions, UDFs, complex types, and materialized views.',
        href: '/course/101/05-apache-doris-query-data-guide',
    },
    {
        number: '06',
        title: 'Lakehouse Guide',
        shortTitle: 'Connect the lakehouse',
        description: 'Connect catalogs, federate SQL queries, accelerate open tables, and write data back.',
        href: '/course/101/06-apache-doris-lakehouse-guide',
    },
];
