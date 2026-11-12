import {translate} from '@docusaurus/Translate';
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
        title: translate({id: "landing.courseModules.001", message: "Apache Doris Overview"}),
        shortTitle: translate({id: "landing.courseModules.002", message: "Meet the engine"}),
        description: translate({id: "landing.courseModules.003", message: "Architecture, data organization, storage models, query execution, and optimization."}),
        href: '/course/101/01-apache-doris-overview',
    },
    {
        number: '02',
        title: translate({id: "landing.courseModules.004", message: "Installation Guide"}),
        shortTitle: translate({id: "landing.courseModules.005", message: "Deploy Doris"}),
        description: translate({id: "landing.courseModules.006", message: "Choose an architecture and follow the deployment path that fits your environment."}),
        href: '/course/101/02-apache-doris-installation-guide',
    },
    {
        number: '03',
        title: translate({id: "landing.courseModules.007", message: "Table Guide"}),
        shortTitle: translate({id: "landing.courseModules.008", message: "Design tables"}),
        description: translate({id: "landing.courseModules.009", message: "Select data models, sort keys, partitioning, bucketing, indexes, and practical schemas."}),
        href: '/course/101/03-apache-doris-table-guide',
    },
    {
        number: '04',
        title: translate({id: "landing.courseModules.010", message: "Data Operations Guide"}),
        shortTitle: translate({id: "landing.courseModules.011", message: "Move and manage data"}),
        description: translate({id: "landing.courseModules.012", message: "Load, update, delete, and export data with methods matched to the workload."}),
        href: '/course/101/04-apache-doris-data-operations-guide',
    },
    {
        number: '05',
        title: translate({id: "landing.courseModules.013", message: "Query Data Guide"}),
        shortTitle: translate({id: "landing.courseModules.014", message: "Query and optimize"}),
        description: translate({id: "landing.courseModules.015", message: "Use joins, analytics, window functions, UDFs, complex types, and materialized views."}),
        href: '/course/101/05-apache-doris-query-data-guide',
    },
    {
        number: '06',
        title: translate({id: "landing.courseModules.016", message: "Lakehouse Guide"}),
        shortTitle: translate({id: "landing.courseModules.017", message: "Connect the lakehouse"}),
        description: translate({id: "landing.courseModules.018", message: "Connect catalogs, federate SQL queries, accelerate open tables, and write data back."}),
        href: '/course/101/06-apache-doris-lakehouse-guide',
    },
];
