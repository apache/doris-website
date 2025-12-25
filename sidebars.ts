import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
    docs: [
        {
            type: 'category',
            label: 'Getting Started',
            collapsed: false,
            items: [
                {
                    type: 'doc',
                    id: 'gettingStarted/what-is-apache-doris',
                    label: 'Introduction to Apache Doris',
                },
                {
                    type: 'doc',
                    id: 'gettingStarted/quick-start',
                    label: 'Quick Start',
                },
                {
                    type: 'category',
                    label: 'Tech Alternatives',
                    items: [
                        {
                            type: 'doc',
                            id: 'gettingStarted/alternatives/alternative-to-clickhouse',
                            label: 'Alternative to ClickHouse',
                        },
                        {
                            type: 'doc',
                            id: 'gettingStarted/alternatives/alternative-to-elasticsearch',
                            label: 'Alternative to Elasticsearch',
                        },
                        {
                            type: 'doc',
                            id: 'gettingStarted/alternatives/alternative-to-trino',
                            label: 'Apache Doris vs Trino / Presto',
                        },
                    ],
                },
            ],
        },
        {
            type: 'category',
            label: 'Guides',
            collapsed: false,
            items: [
                {
                    type: 'category',
                    label: 'Installation and Deployment',
                    items: [
                        {
                            type: 'category',
                            label: 'Installation Preparation',
                            items: [
                                {
                                    type: 'doc',
                                    id: 'install/preparation/env-checking',
                                    label: 'Environment Checking',
                                },
                                {
                                    type: 'doc',
                                    id: 'install/preparation/cluster-planning',
                                    label: 'Cluster Planning',
                                },
                                {
                                    type: 'doc',
                                    id: 'install/preparation/os-checking',
                                    label: 'OS Checking',
                                },
                            ],
                        },
                        {
                            type: 'category',
                            label: 'Cluster Deployment Manually',
                            items: [
                                {
                                    type: 'doc',
                                    id: 'install/deploy-manually/integrated-storage-compute-deploy-manually',
                                    label: 'Deploy Integrated Storage Compute Cluster Manually',
                                },
                                {
                                    type: 'doc',
                                    id: 'install/deploy-manually/separating-storage-compute-deploy-manually',
                                    label: 'Deploy Separating Storage Compute Cluster Manually',
                                },
                            ],
                        },
                        {
                            type: 'category',
                            label: 'Deploying on Kubernetes',
                            items: [
                                {
                                    type: 'category',
                                    label: 'Integrated Storage Compute',
                                    items: [
                                        {
                                            type: 'doc',
                                            id: 'install/deploy-on-kubernetes/integrated-storage-compute/install-doris-operator',
                                            label: 'Deploy Doris Operator',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'install/deploy-on-kubernetes/integrated-storage-compute/install-config-cluster',
                                            label: 'Config Doris to Deploy',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'install/deploy-on-kubernetes/integrated-storage-compute/install-doris-cluster',
                                            label: 'Deploy Doris Cluster',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'install/deploy-on-kubernetes/integrated-storage-compute/access-cluster',
                                            label: 'Access Cluster',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'install/deploy-on-kubernetes/integrated-storage-compute/cluster-operation',
                                            label: 'Cluster Operation',
                                        },
                                    ],
                                },
                                {
                                    type: 'category',
                                    label: 'Separating Storage Compute',
                                    items: [
                                        {
                                            type: 'doc',
                                            id: 'install/deploy-on-kubernetes/separating-storage-compute/install-fdb',
                                            label: 'Install FoundationDB',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'install/deploy-on-kubernetes/separating-storage-compute/config-cluster',
                                            label: 'Config Cluster',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'install/deploy-on-kubernetes/separating-storage-compute/config-ms',
                                            label: 'Config MetaService',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'install/deploy-on-kubernetes/separating-storage-compute/config-fe',
                                            label: 'Config FE',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'install/deploy-on-kubernetes/separating-storage-compute/config-cg',
                                            label: 'Config ComputeGroups',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'install/deploy-on-kubernetes/separating-storage-compute/install-doris-cluster',
                                            label: 'Deploy Doris Cluster',
                                        },
                                    ],
                                },
                            ],
                        },
                        {
                            type: 'category',
                            label: 'Deploying on Cloud',
                            items: [
                                {
                                    type: 'doc',
                                    id: 'install/deploy-on-cloud/doris-on-aws',
                                    label: 'Deploying on AWS',
                                },
                            ],
                        },
                    ],
                },
                {
                    type: 'category',
                    label: 'Database Connection',
                    items: [
                        {
                            type: 'doc',
                            id: 'db-connect/database-connect',
                            label: 'Connecting by MySQL Protocol',
                        },
                        {
                            type: 'doc',
                            id: 'db-connect/arrow-flight-sql-connect',
                            label: 'Connecting by Arrow Flight SQL Protocol',
                        },
                    ],
                },
                {
                    type: 'category',
                    label: 'Data Table Design',
                    items: [
                        {
                            type: 'doc',
                            id: 'table-design/overview',
                            label: 'Overview',
                        },
                        {
                            type: 'category',
                            label: 'Table Types',
                            items: [
                                {
                                    type: 'doc',
                                    id: 'table-design/data-model/overview',
                                    label: 'Table Type Overview',
                                },
                                {
                                    type: 'doc',
                                    id: 'table-design/data-model/duplicate',
                                    label: 'Duplicate Key Table',
                                },
                                {
                                    type: 'doc',
                                    id: 'table-design/data-model/unique',
                                    label: 'Unique Key Table',
                                },
                                {
                                    type: 'doc',
                                    id: 'table-design/data-model/aggregate',
                                    label: 'Aggregate Key Table',
                                },
                                {
                                    type: 'doc',
                                    id: 'table-design/data-model/tips',
                                    label: 'Usage Notes',
                                },
                            ],
                        },
                        {
                            type: 'category',
                            label: 'Data Partitioning',
                            items: [
                                {
                                    type: 'doc',
                                    id: 'table-design/data-partitioning/data-distribution',
                                    label: 'Data Distribution Concept',
                                },
                                {
                                    type: 'doc',
                                    id: 'table-design/data-partitioning/manual-partitioning',
                                    label: 'Manual partitioning',
                                },
                                {
                                    type: 'doc',
                                    id: 'table-design/data-partitioning/dynamic-partitioning',
                                    label: 'Dynamic Partitioning(Outdated)',
                                },
                                {
                                    type: 'doc',
                                    id: 'table-design/data-partitioning/auto-partitioning',
                                    label: 'Auto Partition',
                                },
                                {
                                    type: 'doc',
                                    id: 'table-design/data-partitioning/data-bucketing',
                                    label: 'Data Bucketing',
                                },
                                {
                                    type: 'doc',
                                    id: 'table-design/data-partitioning/common-issues',
                                    label: 'Common Issues',
                                },
                            ],
                        },
                        {
                            type: 'doc',
                            id: 'table-design/data-type',
                            label: 'Data Types',
                        },
                        {
                            type: 'doc',
                            id: 'table-design/column-compression',
                            label: 'Column Compression',
                        },
                        {
                            type: 'category',
                            label: 'Table Indexes',
                            items: [
                                {
                                    type: 'doc',
                                    id: 'table-design/index/index-overview',
                                    label: 'Index Overview',
                                },
                                {
                                    type: 'doc',
                                    id: 'table-design/index/prefix-index',
                                    label: 'Sort Key and Prefix Index',
                                },
                                {
                                    type: 'category',
                                    label: 'Inverted Index',
                                    items: [
                                        {
                                            type: 'doc',
                                            id: 'table-design/index/inverted-index/overview',
                                            label: 'Inverted Index',
                                        },
                                    ],
                                },
                                {
                                    type: 'doc',
                                    id: 'table-design/index/bloomfilter',
                                    label: 'BloomFilter Index',
                                },
                                {
                                    type: 'doc',
                                    id: 'table-design/index/ngram-bloomfilter-index',
                                    label: 'N-Gram BloomFilter Index',
                                },
                            ],
                        },
                        {
                            type: 'doc',
                            id: 'table-design/schema-change',
                            label: 'Schema Change',
                        },
                        {
                            type: 'doc',
                            id: 'table-design/auto-increment',
                            label: 'Auto-Increment Column',
                        },
                        {
                            type: 'category',
                            label: 'Tiered Storage',
                            items: [
                                {
                                    type: 'doc',
                                    id: 'table-design/tiered-storage/overview',
                                    label: 'Tiered Storage Overview',
                                },
                                {
                                    type: 'doc',
                                    id: 'table-design/tiered-storage/tiered-ssd-hdd',
                                    label: 'Tiered Storage of SSD and HDD',
                                },
                                {
                                    type: 'doc',
                                    id: 'table-design/tiered-storage/remote-storage',
                                    label: 'Remote Storage',
                                },
                            ],
                        },
                        {
                            type: 'doc',
                            id: 'table-design/row-store',
                            label: 'Hybrid Row-Columnar Storage',
                        },
                        {
                            type: 'doc',
                            id: 'table-design/temporary-table',
                            label: 'Temporary Table',
                        },
                        {
                            type: 'doc',
                            id: 'table-design/best-practice',
                            label: 'Best Practices',
                        },
                    ],
                },
                {
                    type: 'category',
                    label: 'Loading Data',
                    items: [
                        {
                            type: 'doc',
                            id: 'data-operate/import/load-manual',
                            label: 'Loading Overview',
                        },
                        {
                            type: 'category',
                            label: 'Data Source',
                            items: [
                                {
                                    type: 'doc',
                                    id: 'data-operate/import/data-source/local-file',
                                    label: 'local file',
                                },
                                {
                                    type: 'doc',
                                    id: 'data-operate/import/data-source/kafka',
                                    label: 'Kafka',
                                },
                                {
                                    type: 'doc',
                                    id: 'data-operate/import/data-source/flink',
                                    label: 'Flink',
                                },
                                {
                                    type: 'doc',
                                    id: 'data-operate/import/data-source/hdfs',
                                    label: 'HDFS',
                                },
                                {
                                    type: 'doc',
                                    id: 'data-operate/import/data-source/amazon-s3',
                                    label: 'Amazon S3',
                                },
                                {
                                    type: 'doc',
                                    id: 'data-operate/import/data-source/google-cloud-storage',
                                    label: 'Google Cloud Storage',
                                },
                                {
                                    type: 'doc',
                                    id: 'data-operate/import/data-source/azure-storage',
                                    label: 'Azure Storage',
                                },
                                {
                                    type: 'doc',
                                    id: 'data-operate/import/data-source/aliyun-oss',
                                    label: 'Alibaba Cloud OSS',
                                },
                                {
                                    type: 'doc',
                                    id: 'data-operate/import/data-source/huawei-obs',
                                    label: 'Huawei Cloud OBS',
                                },
                                {
                                    type: 'doc',
                                    id: 'data-operate/import/data-source/tencent-cos',
                                    label: 'Tencent Cloud COS',
                                },
                                {
                                    type: 'doc',
                                    id: 'data-operate/import/data-source/minio',
                                    label: 'MinIO',
                                },
                                {
                                    type: 'doc',
                                    id: 'data-operate/import/data-source/s3-compatible',
                                    label: 'S3 Compatible Storage',
                                },
                                {
                                    type: 'doc',
                                    id: 'data-operate/import/data-source/snowflake',
                                    label: 'Snowflake',
                                },
                                {
                                    type: 'doc',
                                    id: 'data-operate/import/data-source/bigquery',
                                    label: 'BigQuery',
                                },
                                {
                                    type: 'doc',
                                    id: 'data-operate/import/data-source/redshift',
                                    label: 'Redshift',
                                },
                                {
                                    type: 'doc',
                                    id: 'data-operate/import/data-source/migrate-data-from-other-olap',
                                    label: 'Migrating Data from Other OLAP',
                                },
                                {
                                    type: 'doc',
                                    id: 'data-operate/import/data-source/migrate-data-from-other-oltp',
                                    label: 'Migrating Data from Other OLTP',
                                },
                            ],
                        },
                        {
                            type: 'category',
                            label: 'Loading Methods',
                            items: [
                                {
                                    type: 'doc',
                                    id: 'data-operate/import/import-way/stream-load-manual',
                                    label: 'Stream Load',
                                },
                                {
                                    type: 'doc',
                                    id: 'data-operate/import/import-way/broker-load-manual',
                                    label: 'Broker Load',
                                },
                                {
                                    type: 'doc',
                                    id: 'data-operate/import/import-way/routine-load-manual',
                                    label: 'Routine Load',
                                },
                                {
                                    type: 'doc',
                                    id: 'data-operate/import/import-way/insert-into-manual',
                                    label: 'Insert Into Select',
                                },
                                {
                                    type: 'doc',
                                    id: 'data-operate/import/import-way/insert-into-values-manual',
                                    label: 'Insert Into Values',
                                },
                                {
                                    type: 'doc',
                                    id: 'data-operate/import/import-way/mysql-load-manual',
                                    label: 'MySQL Load',
                                },
                            ],
                        },
                        {
                            type: 'category',
                            label: 'File Formats',
                            items: [
                                {
                                    type: 'doc',
                                    id: 'data-operate/import/file-format/csv',
                                    label: 'CSV',
                                },
                                {
                                    type: 'doc',
                                    id: 'data-operate/import/file-format/json',
                                    label: 'JSON',
                                },
                                {
                                    type: 'doc',
                                    id: 'data-operate/import/file-format/parquet',
                                    label: 'Parquet',
                                },
                                {
                                    type: 'doc',
                                    id: 'data-operate/import/file-format/orc',
                                    label: 'ORC',
                                },
                            ],
                        },
                        {
                            type: 'category',
                            label: 'Complex Data Types',
                            items: [
                                {
                                    type: 'doc',
                                    id: 'data-operate/import/complex-types/array',
                                    label: 'ARRAY',
                                },
                                {
                                    type: 'doc',
                                    id: 'data-operate/import/complex-types/map',
                                    label: 'MAP',
                                },
                                {
                                    type: 'doc',
                                    id: 'data-operate/import/complex-types/struct',
                                    label: 'STRUCT',
                                },
                                {
                                    type: 'doc',
                                    id: 'data-operate/import/complex-types/json',
                                    label: 'JSON',
                                },
                                {
                                    type: 'doc',
                                    id: 'data-operate/import/complex-types/bitmap',
                                    label: 'Bitmap',
                                },
                                {
                                    type: 'doc',
                                    id: 'data-operate/import/complex-types/hll',
                                    label: 'HLL',
                                },
                                {
                                    type: 'doc',
                                    id: 'data-operate/import/complex-types/variant',
                                    label: 'Variant',
                                },
                            ],
                        },
                        {
                            type: 'doc',
                            id: 'data-operate/import/handling-messy-data',
                            label: 'Handling Data Issues',
                        },
                        {
                            type: 'doc',
                            id: 'data-operate/import/load-data-convert',
                            label: 'Transforming Data During Load',
                        },
                        {
                            type: 'doc',
                            id: 'data-operate/import/load-high-availability',
                            label: 'Load High Availability',
                        },
                        {
                            type: 'doc',
                            id: 'data-operate/import/group-commit-manual',
                            label: 'High Concurrency LOAD Optimization(Group Commit)',
                        },
                        {
                            type: 'doc',
                            id: 'data-operate/import/load-best-practices',
                            label: 'Load Best Practices',
                        },
                        {
                            type: 'category',
                            label: 'Load Internals',
                            items: [
                                {
                                    type: 'doc',
                                    id: 'data-operate/import/load-internals/load-internals',
                                    label: 'Load Internals and Performance Optimization',
                                },
                                {
                                    type: 'doc',
                                    id: 'data-operate/import/load-internals/routine-load-internals',
                                    label: 'Routine Load Internals and Best Practices',
                                },
                            ],
                        },
                        {
                            type: 'doc',
                            id: 'data-operate/import/streaming-job',
                            label: 'Continuous Load',
                        },
                    ],
                },
                {
                    type: 'category',
                    label: 'Data Update and Delete',
                    items: [
                        {
                            type: 'category',
                            label: 'Updating Data',
                            items: [
                                {
                                    type: 'doc',
                                    id: 'data-operate/update/update-overview',
                                    label: 'Data Update Overview',
                                },
                                {
                                    type: 'doc',
                                    id: 'data-operate/update/unique-update-sql',
                                    label: 'Updating Data with UPDATE Command',
                                },
                                {
                                    type: 'doc',
                                    id: 'data-operate/update/update-of-unique-model',
                                    label: 'Updating Data on Unique Key Model',
                                },
                                {
                                    type: 'doc',
                                    id: 'data-operate/update/update-of-aggregate-model',
                                    label: 'Updating Data on Aggregate Key Model',
                                },
                                {
                                    type: 'doc',
                                    id: 'data-operate/update/partial-column-update',
                                    label: 'Partial Column Update',
                                },
                                {
                                    type: 'doc',
                                    id: 'data-operate/update/unique-update-concurrent-control',
                                    label: 'Concurrency Control for Updates in the Primary Key Model',
                                },
                            ],
                        },
                        {
                            type: 'category',
                            label: 'Deleting Data',
                            items: [
                                {
                                    type: 'doc',
                                    id: 'data-operate/delete/delete-overview',
                                    label: 'Delete Overview',
                                },
                                {
                                    type: 'doc',
                                    id: 'data-operate/delete/delete-manual',
                                    label: 'Deleting Data with DELETE Command',
                                },
                                {
                                    type: 'doc',
                                    id: 'data-operate/delete/batch-delete-manual',
                                    label: 'Batch Deletion Based on Load',
                                },
                                {
                                    type: 'doc',
                                    id: 'data-operate/delete/truncate-manual',
                                    label: 'Deleting Data with TRUNCATE Command',
                                },
                                {
                                    type: 'doc',
                                    id: 'data-operate/delete/atomicity-replace',
                                    label: 'Replacing Atomic Table',
                                },
                                {
                                    type: 'doc',
                                    id: 'data-operate/delete/table-temp-partition',
                                    label: 'Temporary Partition',
                                },
                            ],
                        },
                        {
                            type: 'doc',
                            id: 'data-operate/transaction',
                            label: 'Transaction',
                        },
                    ],
                },
                {
                    type: 'category',
                    label: 'Exporting Data',
                    items: [
                        {
                            type: 'doc',
                            id: 'data-operate/export/export-overview',
                            label: 'Export Overview',
                        },
                        {
                            type: 'doc',
                            id: 'data-operate/export/export-manual',
                            label: 'EXPORT',
                        },
                        {
                            type: 'doc',
                            id: 'data-operate/export/outfile',
                            label: 'SELECT INTO OUTFILE',
                        },
                        {
                            type: 'doc',
                            id: 'data-operate/export/export-with-mysql-dump',
                            label: 'Using MySQL Dump',
                        },
                        {
                            type: 'doc',
                            id: 'data-operate/export/export-best-practice',
                            label: 'Best Practices',
                        },
                    ],
                },
                {
                    type: 'category',
                    label: 'Data Queries',
                    items: [
                        {
                            type: 'doc',
                            id: 'query-data/mysql-compatibility',
                            label: 'MySQL Compatibility',
                        },
                        {
                            type: 'doc',
                            id: 'query-data/join',
                            label: 'Join',
                        },
                        {
                            type: 'doc',
                            id: 'query-data/subquery',
                            label: 'Subquery',
                        },
                        {
                            type: 'doc',
                            id: 'query-data/multi-dimensional-analytics',
                            label: 'Multi-Dimensional Analytics',
                        },
                        {
                            type: 'doc',
                            id: 'query-data/window-function',
                            label: 'Window Function',
                        },
                        {
                            type: 'doc',
                            id: 'query-data/cte',
                            label: 'Common Table Expression',
                        },
                        {
                            type: 'category',
                            label: 'User Defined Functions',
                            items: [
                                {
                                    type: 'doc',
                                    id: 'query-data/udf/alias-function',
                                    label: 'Alias Function',
                                },
                                {
                                    type: 'doc',
                                    id: 'query-data/udf/java-user-defined-function',
                                    label: 'Java UDF, UDAF, UDWF, UDTF',
                                },
                            ],
                        },
                        {
                            type: 'doc',
                            id: 'query-data/complex-type',
                            label: 'Complex Type',
                        },
                        {
                            type: 'doc',
                            id: 'query-data/lateral-view',
                            label: 'Column to Row (Lateral View)',
                        },
                    ],
                },
                {
                    type: 'category',
                    label: 'Queries Acceleration',
                    items: [
                        {
                            type: 'category',
                            label: 'Performance Tuning Overview',
                            items: [
                                {
                                    type: 'doc',
                                    id: 'query-acceleration/performance-tuning-overview/tuning-overview',
                                    label: 'Tuning Overview',
                                },
                                {
                                    type: 'doc',
                                    id: 'query-acceleration/performance-tuning-overview/diagnostic-tools',
                                    label: 'Diagnostic Tools',
                                },
                                {
                                    type: 'doc',
                                    id: 'query-acceleration/performance-tuning-overview/analysis-tools',
                                    label: 'Analysis Tools',
                                },
                                {
                                    type: 'doc',
                                    id: 'query-acceleration/performance-tuning-overview/tuning-process',
                                    label: 'Tuning Process',
                                },
                            ],
                        },
                        {
                            type: 'category',
                            label: 'Materialize View',
                            items: [
                                {
                                    type: 'doc',
                                    id: 'query-acceleration/materialized-view/overview',
                                    label: 'Materialized View Overview',
                                },
                                {
                                    type: 'doc',
                                    id: 'query-acceleration/materialized-view/sync-materialized-view',
                                    label: 'Sync-Materialized View',
                                },
                                {
                                    type: 'category',
                                    label: 'Async-Materialized View',
                                    items: [
                                        {
                                            type: 'doc',
                                            id: 'query-acceleration/materialized-view/async-materialized-view/overview',
                                            label: 'Overview of Asynchronous Materialized Views',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'query-acceleration/materialized-view/async-materialized-view/functions-and-demands',
                                            label: 'Creating, Querying, and Maintaining Asynchronous Materialized Views',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'query-acceleration/materialized-view/async-materialized-view/use-guide',
                                            label: 'Best Practices',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'query-acceleration/materialized-view/async-materialized-view/use-advice',
                                            label: 'Use Advice',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'query-acceleration/materialized-view/async-materialized-view/faq',
                                            label: 'FAQ',
                                        },
                                    ],
                                },
                            ],
                        },
                        {
                            type: 'doc',
                            id: 'query-acceleration/sql-cache-manual',
                            label: 'SQL Cache',
                        },
                        {
                            type: 'doc',
                            id: 'query-acceleration/condition-cache',
                            label: 'Condition Cache',
                        },
                        {
                            type: 'doc',
                            id: 'query-acceleration/high-concurrent-point-query',
                            label: 'High-Concurrency Point Query Optimization',
                        },
                        {
                            type: 'doc',
                            id: 'query-acceleration/dictionary',
                            label: 'Dictionary Table(Experimental)',
                        },
                        {
                            type: 'doc',
                            id: 'query-acceleration/query-profile',
                            label: 'Query Profile Analysis Guide',
                        },
                        {
                            type: 'category',
                            label: 'Distincting Counts',
                            items: [
                                {
                                    type: 'doc',
                                    id: 'query-acceleration/distinct-counts/bitmap-precise-deduplication',
                                    label: 'BITMAP Precise Deduplication',
                                },
                                {
                                    type: 'doc',
                                    id: 'query-acceleration/distinct-counts/hll-approximate-deduplication',
                                    label: 'HLL Approximate Deduplication',
                                },
                            ],
                        },
                        {
                            type: 'doc',
                            id: 'query-acceleration/colocation-join',
                            label: 'Colocation Join',
                        },
                        {
                            type: 'category',
                            label: 'Hints',
                            items: [
                                {
                                    type: 'doc',
                                    id: 'query-acceleration/hints/hints-overview',
                                    label: 'Overview of Hints',
                                },
                                {
                                    type: 'doc',
                                    id: 'query-acceleration/hints/leading-hint',
                                    label: 'Leading Hint',
                                },
                                {
                                    type: 'doc',
                                    id: 'query-acceleration/hints/distribute-hint',
                                    label: 'Distribute Hint',
                                },
                            ],
                        },
                        {
                            type: 'category',
                            label: 'Tuning',
                            items: [
                                {
                                    type: 'category',
                                    label: 'Tuning Plan',
                                    items: [
                                        {
                                            type: 'doc',
                                            id: 'query-acceleration/tuning/tuning-plan/optimizing-table-schema',
                                            label: 'Optimizing Table Schema Design',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'query-acceleration/tuning/tuning-plan/optimizing-table-index',
                                            label: 'Optimizing Table Index Design',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'query-acceleration/tuning/tuning-plan/optimizing-table-scanning',
                                            label: 'Optimizing Table Scanning',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'query-acceleration/tuning/tuning-plan/transparent-rewriting-with-sync-mv',
                                            label: 'Transparent Rewriting with Sync-Materialized View',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'query-acceleration/tuning/tuning-plan/transparent-rewriting-with-async-mv',
                                            label: 'Transparent Rewriting by Async-Materialized View',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'query-acceleration/tuning/tuning-plan/optimizing-join-with-colocate-group',
                                            label: 'Optimizing Join with Colocate Group',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'query-acceleration/tuning/tuning-plan/adjusting-join-shuffle',
                                            label: 'Adjusting Join Shuffle Mode with Hint',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'query-acceleration/tuning/tuning-plan/controlling-hints-with-cbo-rule',
                                            label: 'Control CBO Rules With Hint',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'query-acceleration/tuning/tuning-plan/reordering-join-with-leading-hint',
                                            label: 'Reordering Join With Leading Hint',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'query-acceleration/tuning/tuning-plan/accelerating-queries-with-sql-cache',
                                            label: 'Accelerating Queries with SQL Cache',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'query-acceleration/tuning/tuning-plan/dml-tuning-plan',
                                            label: 'DML Tuning Plan',
                                        },
                                    ],
                                },
                                {
                                    type: 'category',
                                    label: 'Tuning Execution',
                                    items: [
                                        {
                                            type: 'doc',
                                            id: 'query-acceleration/tuning/tuning-execution/adjustment-of-runtimefilter-wait-time',
                                            label: 'Adjustment of RuntimeFilter Wait Time',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'query-acceleration/tuning/tuning-execution/data-skew-handling',
                                            label: 'Data Skew Handling',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'query-acceleration/tuning/tuning-execution/parallelism-tuning',
                                            label: 'Parallelism Tuning',
                                        },
                                    ],
                                },
                                {
                                    type: 'doc',
                                    id: 'query-acceleration/tuning/tuning-parameters',
                                    label: 'Common Tuning Parameters',
                                },
                            ],
                        },
                        {
                            type: 'category',
                            label: 'Optimization Technology Principle',
                            items: [
                                {
                                    type: 'doc',
                                    id: 'query-acceleration/optimization-technology-principle/query-optimizer',
                                    label: 'Query Optimizers',
                                },
                                {
                                    type: 'doc',
                                    id: 'query-acceleration/optimization-technology-principle/pipeline-execution-engine',
                                    label: 'Parallel Execution',
                                },
                                {
                                    type: 'doc',
                                    id: 'query-acceleration/optimization-technology-principle/runtime-filter',
                                    label: 'Runtime Filter',
                                },
                                {
                                    type: 'doc',
                                    id: 'query-acceleration/optimization-technology-principle/topn-optimization',
                                    label: 'TOPN Query Optimization',
                                },
                                {
                                    type: 'doc',
                                    id: 'query-acceleration/optimization-technology-principle/statistics',
                                    label: 'Statistics',
                                },
                            ],
                        },
                    ],
                },
                {
                    type: 'category',
                    label: 'AI',
                    items: [
                        {
                            type: 'doc',
                            id: 'ai/ai-overview',
                            label: 'AI Overview',
                        },
                        {
                            type: 'doc',
                            id: 'ai/ai-function-overview',
                            label: 'AI Function',
                        },
                        {
                            type: 'category',
                            label: 'Text Search',
                            items: [
                                {
                                    type: 'doc',
                                    id: 'ai/text-search/overview',
                                    label: 'Text Search',
                                },
                                {
                                    type: 'doc',
                                    id: 'ai/text-search/search-operators',
                                    label: 'Full-Text Search and Query Acceleration Support',
                                },
                                {
                                    type: 'doc',
                                    id: 'ai/text-search/search-function',
                                    label: 'SEARCH Function',
                                },
                                {
                                    type: 'doc',
                                    id: 'ai/text-search/custom-analyzer',
                                    label: 'Custom Analyzer',
                                },
                                {
                                    type: 'doc',
                                    id: 'ai/text-search/custom-normalizer',
                                    label: 'Custom Normalizer',
                                },
                                {
                                    type: 'doc',
                                    id: 'ai/text-search/scoring',
                                    label: 'Relevance Scoring',
                                },
                            ],
                        },
                        {
                            type: 'category',
                            label: 'Vector Search',
                            items: [
                                {
                                    type: 'doc',
                                    id: 'ai/vector-search/overview',
                                    label: 'Overview',
                                },
                                {
                                    type: 'doc',
                                    id: 'ai/vector-search/hnsw',
                                    label: 'HNSW',
                                },
                                {
                                    type: 'doc',
                                    id: 'ai/vector-search/ivf',
                                    label: 'IVF',
                                },
                                {
                                    type: 'doc',
                                    id: 'ai/vector-search/index-management',
                                    label: 'ANN Index Management',
                                },
                                {
                                    type: 'doc',
                                    id: 'ai/vector-search/performance',
                                    label: 'Performance Testing and Analysis',
                                },
                                {
                                    type: 'doc',
                                    id: 'ai/vector-search/behind-index',
                                    label: 'Optimizations Behind Performance',
                                },
                            ],
                        },
                    ],
                },
                {
                    type: 'category',
                    label: 'Data Lakehouse',
                    items: [
                        {
                            type: 'doc',
                            id: 'lakehouse/lakehouse-overview',
                            label: 'Lakehouse Overview',
                        },
                        {
                            type: 'doc',
                            id: 'lakehouse/catalog-overview',
                            label: 'Data Catalog Overview',
                        },
                        {
                            type: 'category',
                            label: 'Data Catalogs',
                            items: [
                                {
                                    type: 'doc',
                                    id: 'lakehouse/catalogs/hive-catalog',
                                    label: 'Hive Catalog',
                                },
                                {
                                    type: 'doc',
                                    id: 'lakehouse/catalogs/iceberg-catalog',
                                    label: 'Iceberg Catalog',
                                },
                                {
                                    type: 'doc',
                                    id: 'lakehouse/catalogs/hudi-catalog',
                                    label: 'Hudi Catalog',
                                },
                                {
                                    type: 'doc',
                                    id: 'lakehouse/catalogs/paimon-catalog',
                                    label: 'Paimon Catalog',
                                },
                                {
                                    type: 'doc',
                                    id: 'lakehouse/catalogs/maxcompute-catalog',
                                    label: 'MaxCompute Catalog',
                                },
                                {
                                    type: 'doc',
                                    id: 'lakehouse/catalogs/delta-lake-catalog',
                                    label: 'Delta Lake Catalog',
                                },
                                {
                                    type: 'doc',
                                    id: 'lakehouse/catalogs/bigquery-catalog',
                                    label: 'BigQuery Catalog',
                                },
                                {
                                    type: 'doc',
                                    id: 'lakehouse/catalogs/kudu-catalog',
                                    label: 'Kudu Catalog',
                                },
                                {
                                    type: 'doc',
                                    id: 'lakehouse/catalogs/es-catalog',
                                    label: 'Elasticsearch Catalog',
                                },
                                {
                                    type: 'doc',
                                    id: 'lakehouse/catalogs/doris-catalog',
                                    label: 'Doris Catalog',
                                },
                                {
                                    type: 'doc',
                                    id: 'lakehouse/catalogs/jdbc-catalog-overview',
                                    label: 'JDBC Catalog',
                                },
                                {
                                    type: 'doc',
                                    id: 'lakehouse/catalogs/jdbc-mysql-catalog',
                                    label: 'MySQL JDBC Catalog',
                                },
                                {
                                    type: 'doc',
                                    id: 'lakehouse/catalogs/jdbc-pg-catalog',
                                    label: 'PostgreSQL JDBC Catalog',
                                },
                                {
                                    type: 'doc',
                                    id: 'lakehouse/catalogs/jdbc-oracle-catalog',
                                    label: 'Oracle JDBC Catalog',
                                },
                                {
                                    type: 'doc',
                                    id: 'lakehouse/catalogs/jdbc-sqlserver-catalog',
                                    label: 'SQL Server JDBC Catalog',
                                },
                                {
                                    type: 'doc',
                                    id: 'lakehouse/catalogs/jdbc-ibmdb2-catalog',
                                    label: 'IBM Db2 JDBC Catalog',
                                },
                                {
                                    type: 'doc',
                                    id: 'lakehouse/catalogs/jdbc-clickhouse-catalog',
                                    label: 'Clickhouse JDBC Catalog',
                                },
                                {
                                    type: 'doc',
                                    id: 'lakehouse/catalogs/jdbc-saphana-catalog',
                                    label: 'SAP HANA JDBC Catalog',
                                },
                                {
                                    type: 'doc',
                                    id: 'lakehouse/catalogs/jdbc-oceanbase-catalog',
                                    label: 'Oceanbase JDBC Catalog',
                                },
                            ],
                        },
                        {
                            type: 'doc',
                            id: 'lakehouse/file-analysis',
                            label: 'Analyze Files on S3/HDFS',
                        },
                        {
                            type: 'doc',
                            id: 'lakehouse/huggingface',
                            label: 'Analyzing Hugging Face Data',
                        },
                        {
                            type: 'category',
                            label: 'Metastores',
                            items: [
                                {
                                    type: 'doc',
                                    id: 'lakehouse/metastores/hive-metastore',
                                    label: 'Hive Metastore',
                                },
                                {
                                    type: 'doc',
                                    id: 'lakehouse/metastores/aws-glue',
                                    label: 'AWS Glue',
                                },
                                {
                                    type: 'doc',
                                    id: 'lakehouse/metastores/google-dataproc-metastore',
                                    label: 'Google Dataproc',
                                },
                                {
                                    type: 'doc',
                                    id: 'lakehouse/metastores/aliyun-dlf',
                                    label: 'Aliyun DLF',
                                },
                                {
                                    type: 'doc',
                                    id: 'lakehouse/metastores/iceberg-rest',
                                    label: 'Iceberg Rest Catalog API',
                                },
                                {
                                    type: 'doc',
                                    id: 'lakehouse/metastores/filesystem',
                                    label: 'File System',
                                },
                            ],
                        },
                        {
                            type: 'category',
                            label: 'Storages',
                            items: [
                                {
                                    type: 'doc',
                                    id: 'lakehouse/storages/hdfs',
                                    label: 'HDFS',
                                },
                                {
                                    type: 'doc',
                                    id: 'lakehouse/storages/s3',
                                    label: 'S3',
                                },
                                {
                                    type: 'doc',
                                    id: 'lakehouse/storages/azure-blob',
                                    label: 'Azure Blob',
                                },
                                {
                                    type: 'doc',
                                    id: 'lakehouse/storages/gcs',
                                    label: 'Google Cloud Storage',
                                },
                                {
                                    type: 'doc',
                                    id: 'lakehouse/storages/aliyun-oss',
                                    label: 'Aliyun OSS',
                                },
                                {
                                    type: 'doc',
                                    id: 'lakehouse/storages/tencent-cos',
                                    label: 'Tencent COS',
                                },
                                {
                                    type: 'doc',
                                    id: 'lakehouse/storages/huawei-obs',
                                    label: 'Huawei OBS',
                                },
                                {
                                    type: 'doc',
                                    id: 'lakehouse/storages/baidu-bos',
                                    label: 'Baidu BOS',
                                },
                                {
                                    type: 'doc',
                                    id: 'lakehouse/storages/minio',
                                    label: 'MinIO',
                                },
                            ],
                        },
                        {
                            type: 'category',
                            label: 'File Format',
                            items: [
                                {
                                    type: 'doc',
                                    id: 'lakehouse/file-formats/parquet',
                                    label: 'Parquet',
                                },
                                {
                                    type: 'doc',
                                    id: 'lakehouse/file-formats/orc',
                                    label: 'ORC',
                                },
                                {
                                    type: 'doc',
                                    id: 'lakehouse/file-formats/text',
                                    label: 'Text/CSV/JSON',
                                },
                            ],
                        },
                        {
                            type: 'doc',
                            id: 'lakehouse/data-cache',
                            label: 'Data Cache',
                        },
                        {
                            type: 'doc',
                            id: 'lakehouse/meta-cache',
                            label: 'Metadata Cache',
                        },
                        {
                            type: 'doc',
                            id: 'lakehouse/compute-node',
                            label: 'Elastic Compute Node',
                        },
                        {
                            type: 'doc',
                            id: 'lakehouse/statistics',
                            label: 'Statistics',
                        },
                        {
                            type: 'category',
                            label: 'SQL Dialect Convertor',
                            items: [
                                {
                                    type: 'doc',
                                    id: 'lakehouse/sql-convertor/sql-convertor-overview',
                                    label: 'SQL Dialect Conversion',
                                },
                                {
                                    type: 'doc',
                                    id: 'lakehouse/sql-convertor/presto-trino-guide',
                                    label: 'Presto/Trino SQL Convertor Guide',
                                },
                                {
                                    type: 'doc',
                                    id: 'lakehouse/sql-convertor/clickhouse-guide',
                                    label: 'Clickhouse SQL Convertor Guide',
                                },
                                {
                                    type: 'doc',
                                    id: 'lakehouse/sql-convertor/hive-guide',
                                    label: 'Hive SQL Convertor Guide',
                                },
                                {
                                    type: 'doc',
                                    id: 'lakehouse/sql-convertor/pg-guide',
                                    label: 'PostgreSQL SQL Convertor Guide',
                                },
                            ],
                        },
                        {
                            type: 'category',
                            label: 'Lakehouse Best Practices',
                            items: [
                                {
                                    type: 'doc',
                                    id: 'lakehouse/best-practices/optimization',
                                    label: 'Data Lake Query Optimization',
                                },
                                {
                                    type: 'doc',
                                    id: 'lakehouse/best-practices/doris-hudi',
                                    label: 'Using Doris and Hudi',
                                },
                                {
                                    type: 'doc',
                                    id: 'lakehouse/best-practices/doris-paimon',
                                    label: 'Using Doris and Paimon',
                                },
                                {
                                    type: 'doc',
                                    id: 'lakehouse/best-practices/doris-iceberg',
                                    label: 'Using Doris and Iceberg',
                                },
                                {
                                    type: 'doc',
                                    id: 'lakehouse/best-practices/doris-aws-s3tables',
                                    label: 'Integration with Glue + AWS S3 Tables',
                                },
                                {
                                    type: 'doc',
                                    id: 'lakehouse/best-practices/doris-dlf-paimon',
                                    label: 'Integration with Aliyun DLF Rest Catalog',
                                },
                                {
                                    type: 'doc',
                                    id: 'lakehouse/best-practices/doris-maxcompute',
                                    label: 'From MaxCompute to Doris',
                                },
                                {
                                    type: 'doc',
                                    id: 'lakehouse/best-practices/doris-polaris',
                                    label: 'Integration with Apache Polaris',
                                },
                                {
                                    type: 'doc',
                                    id: 'lakehouse/best-practices/doris-gravitino',
                                    label: 'Integration with Apache Gravitino',
                                },
                                {
                                    type: 'doc',
                                    id: 'lakehouse/best-practices/doris-onelake',
                                    label: 'Integrate with Microsoft OneLake',
                                },
                                {
                                    type: 'doc',
                                    id: 'lakehouse/best-practices/doris-unity-catalog',
                                    label: 'Integrating with Databricks Unity Catalog',
                                },
                                {
                                    type: 'doc',
                                    id: 'lakehouse/best-practices/kerberos',
                                    label: 'Kerberos Best Practices',
                                },
                                {
                                    type: 'doc',
                                    id: 'lakehouse/best-practices/tpch',
                                    label: 'Generating TPC-H on Hive/Iceberg',
                                },
                                {
                                    type: 'doc',
                                    id: 'lakehouse/best-practices/tpcds',
                                    label: 'Generating TPC-DS on Hive/Iceberg',
                                },
                            ],
                        },
                    ],
                },
                {
                    type: 'category',
                    label: 'Observability',
                    items: [
                        {
                            type: 'doc',
                            id: 'observability/overview',
                            label: 'Overview',
                        },
                        {
                            type: 'doc',
                            id: 'observability/log',
                            label: 'Log',
                        },
                        {
                            type: 'doc',
                            id: 'observability/trace',
                            label: 'Trace',
                        },
                        {
                            type: 'category',
                            label: 'Integrations',
                            items: [
                                {
                                    type: 'doc',
                                    id: 'ecosystem/observability/logstash',
                                    label: 'Logstash',
                                },
                                {
                                    type: 'doc',
                                    id: 'ecosystem/observability/beats',
                                    label: 'Filebeat',
                                },
                                {
                                    type: 'doc',
                                    id: 'ecosystem/observability/opentelemetry',
                                    label: 'OpenTelemetry',
                                },
                                {
                                    type: 'doc',
                                    id: 'ecosystem/observability/fluentbit',
                                    label: 'FluentBit',
                                },
                                {
                                    type: 'doc',
                                    id: 'ecosystem/observability/loongcollector',
                                    label: 'LoongCollector (iLogtail) Doris Flusher',
                                },
                            ],
                        },
                    ],
                },
                {
                    type: 'category',
                    label: 'Compute-Storage Decoupled',
                    items: [
                        {
                            type: 'doc',
                            id: 'compute-storage-decoupled/overview',
                            label: 'Overview',
                        },
                        {
                            type: 'doc',
                            id: 'compute-storage-decoupled/before-deployment',
                            label: 'Doris Compute-Storage Decoupled Deployment Preparation',
                        },
                        {
                            type: 'doc',
                            id: 'compute-storage-decoupled/compilation-and-deployment',
                            label: 'Compilation and Deployment',
                        },
                        {
                            type: 'doc',
                            id: 'compute-storage-decoupled/managing-storage-vault',
                            label: 'Managing Storage Vault',
                        },
                        {
                            type: 'doc',
                            id: 'compute-storage-decoupled/managing-compute-cluster',
                            label: 'Managing Compute Groups',
                        },
                        {
                            type: 'category',
                            label: 'File Cache',
                            items: [
                                {
                                    type: 'doc',
                                    id: 'compute-storage-decoupled/file-cache/file-cache',
                                    label: 'File Cache',
                                },
                                {
                                    type: 'doc',
                                    id: 'compute-storage-decoupled/file-cache/file-cache-internals',
                                    label: 'File Cache Internals',
                                },
                            ],
                        },
                        {
                            type: 'category',
                            label: 'Read-Write Separation',
                            items: [
                                {
                                    type: 'doc',
                                    id: 'compute-storage-decoupled/rw/read-write-separation',
                                    label: 'Read Write Separation',
                                },
                                {
                                    type: 'doc',
                                    id: 'compute-storage-decoupled/rw/file-cache-rw-compute-group-best-practice',
                                    label: 'Best Practices for Cache Optimization in Read-Write Splitting Scenarios',
                                },
                            ],
                        },
                        {
                            type: 'doc',
                            id: 'compute-storage-decoupled/recycler',
                            label: 'Recycler',
                        },
                        {
                            type: 'doc',
                            id: 'compute-storage-decoupled/upgrade',
                            label: 'Upgrade',
                        },
                    ],
                },
                {
                    type: 'category',
                    label: 'Security',
                    items: [
                        {
                            type: 'doc',
                            id: 'admin-manual/auth/security-overview',
                            label: 'Security Overview',
                        },
                        {
                            type: 'category',
                            label: 'Authentication and Authorization',
                            items: [
                                {
                                    type: 'doc',
                                    id: 'admin-manual/auth/authentication-and-authorization',
                                    label: 'Authentication and Authorization',
                                },
                                {
                                    type: 'category',
                                    label: 'Authentication',
                                    items: [
                                        {
                                            type: 'doc',
                                            id: 'admin-manual/auth/authentication/internal',
                                            label: 'Built-in Authentication',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'admin-manual/auth/authentication/federation',
                                            label: 'Federated Authentication',
                                        },
                                    ],
                                },
                                {
                                    type: 'category',
                                    label: 'Authorization',
                                    items: [
                                        {
                                            type: 'doc',
                                            id: 'admin-manual/auth/authorization/internal',
                                            label: 'Built-in Authorization',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'admin-manual/auth/authorization/ranger',
                                            label: 'Ranger Authorization',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'admin-manual/auth/authorization/data',
                                            label: 'Data Access Control',
                                        },
                                    ],
                                },
                            ],
                        },
                        {
                            type: 'doc',
                            id: 'admin-manual/audit-plugin',
                            label: 'Audit Log',
                        },
                        {
                            type: 'category',
                            label: 'Data Encryption',
                            items: [
                                {
                                    type: 'category',
                                    label: 'Encryption in Transit',
                                    items: [
                                        {
                                            type: 'doc',
                                            id: 'admin-manual/auth/certificate',
                                            label: 'MySQL Client Certificate',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'admin-manual/auth/fe-certificate',
                                            label: 'FE SSL Certificate',
                                        },
                                    ],
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/auth/encryption-function',
                                    label: 'Encryption and Masking Function ',
                                },
                            ],
                        },
                        {
                            type: 'category',
                            label: 'Integrations',
                            items: [
                                {
                                    type: 'doc',
                                    id: 'admin-manual/auth/integrations/aws-authentication-and-authorization',
                                    label: 'AWS authentication and authorization',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/auth/integrations/aws-iam-role',
                                    label: 'How Apache Doris IAM Assume Role work',
                                },
                            ],
                        },
                    ],
                },
            ],
        },
        {
            type: 'category',
            label: 'Benchmark',
            collapsed: false,
            items: [
                {
                    type: 'doc',
                    id: 'benchmark/ssb',
                    label: 'Star Schema Benchmark',
                },
                {
                    type: 'doc',
                    id: 'benchmark/tpch',
                    label: 'TPC-H Benchmark',
                },
                {
                    type: 'doc',
                    id: 'benchmark/tpcds',
                    label: 'TPC-DS Benchmark',
                },
            ],
        },
        {
            type: 'category',
            label: 'Management',
            collapsed: false,
            items: [
                {
                    type: 'category',
                    label: 'Managing Cluster',
                    items: [
                        {
                            type: 'doc',
                            id: 'admin-manual/cluster-management/upgrade',
                            label: 'Upgrading Cluster',
                        },
                        {
                            type: 'doc',
                            id: 'admin-manual/cluster-management/elastic-expansion',
                            label: 'Elastic Scaling',
                        },
                        {
                            type: 'doc',
                            id: 'admin-manual/cluster-management/load-balancing',
                            label: 'Load Balancing',
                        },
                        {
                            type: 'doc',
                            id: 'admin-manual/cluster-management/time-zone',
                            label: 'Time Zone',
                        },
                        {
                            type: 'doc',
                            id: 'admin-manual/cluster-management/fqdn',
                            label: 'FQDN',
                        },
                    ],
                },
                {
                    type: 'category',
                    label: 'Managing Workload',
                    items: [
                        {
                            type: 'doc',
                            id: 'admin-manual/workload-management/workload-management-summary',
                            label: 'Overview',
                        },
                        {
                            type: 'category',
                            label: 'Resource Isolation',
                            items: [
                                {
                                    type: 'doc',
                                    id: 'admin-manual/workload-management/resource-group',
                                    label: 'Resource Group',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/workload-management/compute-group',
                                    label: 'Compute Group',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/workload-management/workload-group',
                                    label: 'Workload Group',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/workload-management/workload-group-bind-compute-group',
                                    label: 'Workload Group Bind Compute Group',
                                },
                            ],
                        },
                        {
                            type: 'doc',
                            id: 'admin-manual/workload-management/analysis-diagnosis',
                            label: 'Workload Analysis Diagnosis',
                        },
                        {
                            type: 'doc',
                            id: 'admin-manual/workload-management/concurrency-control-and-queuing',
                            label: 'Concurrency Control and Queuing',
                        },
                        {
                            type: 'doc',
                            id: 'admin-manual/workload-management/spill-disk',
                            label: 'Spill Disk',
                        },
                        {
                            type: 'doc',
                            id: 'admin-manual/workload-management/sql-blocking',
                            label: 'Query Circuit Breaker',
                        },
                        {
                            type: 'doc',
                            id: 'admin-manual/workload-management/kill-query',
                            label: 'Kill Query',
                        },
                        {
                            type: 'doc',
                            id: 'admin-manual/workload-management/job-scheduler',
                            label: 'Job Scheduler',
                        },
                    ],
                },
                {
                    type: 'category',
                    label: 'Managing Disaster Recovery',
                    items: [
                        {
                            type: 'doc',
                            id: 'admin-manual/data-admin/overview',
                            label: 'Disaster Recovery Management Overview',
                        },
                        {
                            type: 'category',
                            label: 'Backup & Restore',
                            items: [
                                {
                                    type: 'doc',
                                    id: 'admin-manual/data-admin/backup-restore/overview',
                                    label: 'Backup and Restore Overview',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/data-admin/backup-restore/backup',
                                    label: 'Backup',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/data-admin/backup-restore/restore',
                                    label: 'Restore',
                                },
                            ],
                        },
                        {
                            type: 'category',
                            label: 'Cross Cluster Replication',
                            items: [
                                {
                                    type: 'doc',
                                    id: 'admin-manual/data-admin/ccr/overview',
                                    label: 'Overview',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/data-admin/ccr/quickstart',
                                    label: 'Quick Start',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/data-admin/ccr/manual',
                                    label: 'Operation Manual',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/data-admin/ccr/feature',
                                    label: 'Feature Details',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/data-admin/ccr/config',
                                    label: 'Configuration Instructions',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/data-admin/ccr/performance',
                                    label: 'Performance',
                                },
                            ],
                        },
                        {
                            type: 'doc',
                            id: 'admin-manual/data-admin/recyclebin',
                            label: 'Recover from Recycle Bin',
                        },
                    ],
                },
                {
                    type: 'category',
                    label: 'Log Management',
                    items: [
                        {
                            type: 'doc',
                            id: 'admin-manual/log-management/fe-log',
                            label: 'FE Log Management',
                        },
                        {
                            type: 'doc',
                            id: 'admin-manual/log-management/be-log',
                            label: 'BE Log Management',
                        },
                    ],
                },
                {
                    type: 'category',
                    label: 'Maintenance',
                    items: [
                        {
                            type: 'doc',
                            id: 'admin-manual/maint-monitor/metrics',
                            label: 'Monitor Metrics',
                        },
                        {
                            type: 'doc',
                            id: 'admin-manual/maint-monitor/monitor-alert',
                            label: 'Monitoring and alarming',
                        },
                        {
                            type: 'doc',
                            id: 'admin-manual/maint-monitor/disk-capacity',
                            label: 'Disk Capacity Management',
                        },
                        {
                            type: 'doc',
                            id: 'admin-manual/maint-monitor/tablet-repair-and-balance',
                            label: 'Data Replica Management',
                        },
                        {
                            type: 'doc',
                            id: 'admin-manual/maint-monitor/automatic-service-start',
                            label: 'Automated Service Startup',
                        },
                    ],
                },
                {
                    type: 'category',
                    label: 'Managing Configuration',
                    items: [
                        {
                            type: 'doc',
                            id: 'admin-manual/config/config-dir',
                            label: 'Config Dir',
                        },
                        {
                            type: 'doc',
                            id: 'admin-manual/config/fe-config',
                            label: 'FE Configuration',
                        },
                        {
                            type: 'doc',
                            id: 'admin-manual/config/be-config',
                            label: 'BE Configuration',
                        },
                        {
                            type: 'doc',
                            id: 'admin-manual/config/user-property',
                            label: 'User Property',
                        },
                    ],
                },
                {
                    type: 'category',
                    label: 'System Tables',
                    items: [
                        {
                            type: 'doc',
                            id: 'admin-manual/system-tables/overview',
                            label: 'Overview',
                        },
                        {
                            type: 'category',
                            label: 'information_schema',
                            items: [
                                {
                                    type: 'doc',
                                    id: 'admin-manual/system-tables/information_schema/active_queries',
                                    label: 'active_queries',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/system-tables/information_schema/backend_active_tasks',
                                    label: 'backend_active_tasks',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/system-tables/information_schema/backend_configuration',
                                    label: 'backend_configuration',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/system-tables/information_schema/backend_tablets',
                                    label: 'backend_tablets',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/system-tables/information_schema/catalog_meta_cache_statistics',
                                    label: 'catalog_meta_cache_statistics',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/system-tables/information_schema/character_sets',
                                    label: 'character_sets',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/system-tables/information_schema/collations',
                                    label: 'collations',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/system-tables/information_schema/column_privileges',
                                    label: 'column_privileges',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/system-tables/information_schema/column_statistics',
                                    label: 'column_statistics',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/system-tables/information_schema/columns',
                                    label: 'columns',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/system-tables/information_schema/engines',
                                    label: 'engines',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/system-tables/information_schema/events',
                                    label: 'events',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/system-tables/information_schema/file_cache_statistics',
                                    label: 'file_cache_statistics',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/system-tables/information_schema/files',
                                    label: 'files',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/system-tables/information_schema/global_variables',
                                    label: 'global_variables',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/system-tables/information_schema/key_column_usage',
                                    label: 'key_column_usage',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/system-tables/information_schema/metadata_name_ids',
                                    label: 'metadata_name_ids',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/system-tables/information_schema/parameters',
                                    label: 'parameters',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/system-tables/information_schema/partitions',
                                    label: 'partitions',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/system-tables/information_schema/processlist',
                                    label: 'processlist',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/system-tables/information_schema/profiling',
                                    label: 'profiling',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/system-tables/information_schema/referential_constraints',
                                    label: 'referential_constraints',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/system-tables/information_schema/routines',
                                    label: 'routines',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/system-tables/information_schema/routine_load_job',
                                    label: 'routine_load_job',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/system-tables/information_schema/rowsets',
                                    label: 'rowsets',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/system-tables/information_schema/schema_privileges',
                                    label: 'schema_privileges',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/system-tables/information_schema/schemata',
                                    label: 'schemata',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/system-tables/information_schema/session_variables',
                                    label: 'session_variables',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/system-tables/information_schema/statistics',
                                    label: 'statistics',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/system-tables/information_schema/table_constraints',
                                    label: 'table_constraints',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/system-tables/information_schema/table_options',
                                    label: 'table_options',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/system-tables/information_schema/table_privileges',
                                    label: 'table_privileges',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/system-tables/information_schema/table_properties',
                                    label: 'table_properties',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/system-tables/information_schema/tables',
                                    label: 'tables',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/system-tables/information_schema/triggers',
                                    label: 'triggers',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/system-tables/information_schema/user_privileges',
                                    label: 'user_privileges',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/system-tables/information_schema/views',
                                    label: 'views',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/system-tables/information_schema/workload_group_privileges',
                                    label: 'workload_group_privileges',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/system-tables/information_schema/workload_group_resource_usage',
                                    label: 'workload_group_resource_usage',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/system-tables/information_schema/workload_groups',
                                    label: 'workload_groups',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/system-tables/information_schema/workload_policy',
                                    label: 'workload_policy',
                                },
                            ],
                        },
                        {
                            type: 'category',
                            label: 'mysql',
                            items: [
                                {
                                    type: 'doc',
                                    id: 'admin-manual/system-tables/mysql/props_priv',
                                    label: 'procs_priv',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/system-tables/mysql/user',
                                    label: 'user',
                                },
                            ],
                        },
                        {
                            type: 'category',
                            label: '__internal_schema',
                            items: [
                                {
                                    type: 'doc',
                                    id: 'admin-manual/system-tables/internal_schema/audit_log',
                                    label: 'audit_log',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/system-tables/internal_schema/column_statistics',
                                    label: 'column_statistics',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/system-tables/internal_schema/partition_statistics',
                                    label: 'partition_statistics',
                                },
                            ],
                        },
                    ],
                },
                {
                    type: 'category',
                    label: 'Trouble Shooting',
                    items: [
                        {
                            type: 'category',
                            label: 'Managing Memory',
                            items: [
                                {
                                    type: 'doc',
                                    id: 'admin-manual/trouble-shooting/memory-management/overview',
                                    label: 'Overview',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/trouble-shooting/memory-management/memory-issue-faq',
                                    label: 'Memory Issue FAQ',
                                },
                                {
                                    type: 'category',
                                    label: 'Managing Memory Analysis',
                                    items: [
                                        {
                                            type: 'doc',
                                            id: 'admin-manual/trouble-shooting/memory-management/memory-analysis/jemalloc-memory-analysis',
                                            label: 'Jemalloc Memory Analysis',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'admin-manual/trouble-shooting/memory-management/memory-analysis/global-memory-analysis',
                                            label: 'Global Memory Analysis',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'admin-manual/trouble-shooting/memory-management/memory-analysis/doris-cache-memory-analysis',
                                            label: 'Cache Memory Analysis',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'admin-manual/trouble-shooting/memory-management/memory-analysis/metadata-memory-analysis',
                                            label: 'Metadata Memory Analysis',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'admin-manual/trouble-shooting/memory-management/memory-analysis/query-memory-analysis',
                                            label: 'Query Memory Analysis',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'admin-manual/trouble-shooting/memory-management/memory-analysis/load-memory-analysis',
                                            label: 'Load Memory Analysis',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'admin-manual/trouble-shooting/memory-management/memory-analysis/query-cancelled-after-process-memory-exceeded',
                                            label: 'Query error Process Memory Not Enough',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'admin-manual/trouble-shooting/memory-management/memory-analysis/query-cancelled-after-query-memory-exceeded',
                                            label: 'Query error Memory Tracker Limit Exceeded',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'admin-manual/trouble-shooting/memory-management/memory-analysis/oom-crash-analysis',
                                            label: 'OOM Killer Crash Analysis',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'admin-manual/trouble-shooting/memory-management/memory-analysis/memory-log-analysis',
                                            label: 'Memory Log Analysis',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'admin-manual/trouble-shooting/memory-management/memory-analysis/heap-profile-memory-analysis',
                                            label: 'Heap Profile Memory Analysis',
                                        },
                                    ],
                                },
                                {
                                    type: 'category',
                                    label: 'Managing Memory Feature',
                                    items: [
                                        {
                                            type: 'doc',
                                            id: 'admin-manual/trouble-shooting/memory-management/memory-feature/memory-tracker',
                                            label: 'Memory Tracker',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'admin-manual/trouble-shooting/memory-management/memory-feature/memory-control-strategy',
                                            label: 'Memory Control Strategy',
                                        },
                                    ],
                                },
                            ],
                        },
                        {
                            type: 'doc',
                            id: 'admin-manual/trouble-shooting/compaction',
                            label: 'Compaction',
                        },
                        {
                            type: 'doc',
                            id: 'admin-manual/trouble-shooting/compaction-principles',
                            label: 'Compaction Principles',
                        },
                        {
                            type: 'doc',
                            id: 'admin-manual/trouble-shooting/metadata-operation',
                            label: 'Metadata Operations and Maintenance',
                        },
                        {
                            type: 'doc',
                            id: 'admin-manual/trouble-shooting/frontend-lock-manager',
                            label: 'FE Lock Management',
                        },
                        {
                            type: 'doc',
                            id: 'admin-manual/trouble-shooting/tablet-local-debug',
                            label: 'Tablet Local Debug',
                        },
                        {
                            type: 'doc',
                            id: 'admin-manual/trouble-shooting/tablet-meta-tool',
                            label: 'Tablet metadata management tool',
                        },
                        {
                            type: 'doc',
                            id: 'admin-manual/trouble-shooting/repairing-data',
                            label: 'Repairing Data',
                        },
                    ],
                },
                {
                    type: 'category',
                    label: 'OPEN API',
                    items: [
                        {
                            type: 'doc',
                            id: 'admin-manual/open-api/overview',
                            label: 'Overview',
                        },
                        {
                            type: 'category',
                            label: 'FE HTTP API',
                            items: [
                                {
                                    type: 'doc',
                                    id: 'admin-manual/open-api/fe-http/config-action',
                                    label: 'Config Action',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/open-api/fe-http/ha-action',
                                    label: 'HA Action',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/open-api/fe-http/hardware-info-action',
                                    label: 'Hardware Info Action',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/open-api/fe-http/help-action',
                                    label: 'Help Action',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/open-api/fe-http/log-action',
                                    label: 'Log Action',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/open-api/fe-http/login-action',
                                    label: 'Login Action',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/open-api/fe-http/logout-action',
                                    label: 'Logout Action',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/open-api/fe-http/query-profile-action-controller',
                                    label: 'Query Profile Action',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/open-api/fe-http/session-action',
                                    label: 'Session Action',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/open-api/fe-http/system-action',
                                    label: 'System Action',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/open-api/fe-http/colocate-meta-action',
                                    label: 'Colocate Meta Action',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/open-api/fe-http/meta-action',
                                    label: 'Meta Action',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/open-api/fe-http/cluster-action',
                                    label: 'Cluster Action',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/open-api/fe-http/node-action',
                                    label: 'Node Operations',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/open-api/fe-http/query-profile-action',
                                    label: 'Query Profile Action',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/open-api/fe-http/backends-action',
                                    label: 'Backends Action',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/open-api/fe-http/bootstrap-action',
                                    label: 'Bootstrap Action',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/open-api/fe-http/cancel-load-action',
                                    label: 'Cancel Load Action',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/open-api/fe-http/check-decommission-action',
                                    label: 'Check Decommission Action',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/open-api/fe-http/check-storage-type-action',
                                    label: 'Check Storage Type Action',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/open-api/fe-http/connection-action',
                                    label: 'Connection Action',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/open-api/fe-http/extra-basepath-action',
                                    label: 'Extra Basepath Action',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/open-api/fe-http/fe-version-info-action',
                                    label: 'Fe Version Info Action',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/open-api/fe-http/get-ddl-stmt-action',
                                    label: 'Get DDL Statement Action',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/open-api/fe-http/get-load-info-action',
                                    label: 'Get Load Info Action',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/open-api/fe-http/get-load-state',
                                    label: 'Get Load State',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/open-api/fe-http/get-log-file-action',
                                    label: 'Get FE log file',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/open-api/fe-http/get-small-file',
                                    label: 'Get Small File Action',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/open-api/fe-http/get-wal-size-action',
                                    label: 'Get WAL size',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/open-api/fe-http/health-action',
                                    label: 'Health Action',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/open-api/fe-http/meta-info-action',
                                    label: 'Meta Info Action',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/open-api/fe-http/meta-replay-state-action',
                                    label: 'Meta Replay State Action',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/open-api/fe-http/metrics-action',
                                    label: 'Metrics Action',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/open-api/fe-http/profile-action',
                                    label: 'Profile Action',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/open-api/fe-http/query-detail-action',
                                    label: 'Query Detail Action',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/open-api/fe-http/query-schema-action',
                                    label: 'Query Schema Action',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/open-api/fe-http/query-stats-action',
                                    label: 'Query Stats Action',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/open-api/fe-http/row-count-action',
                                    label: 'Row Count Action',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/open-api/fe-http/set-config-action',
                                    label: 'Set Config Action',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/open-api/fe-http/show-data-action',
                                    label: 'Show Data Action',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/open-api/fe-http/show-meta-info-action',
                                    label: 'Show Meta Info Action',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/open-api/fe-http/show-proc-action',
                                    label: 'Show Proc Action',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/open-api/fe-http/show-runtime-info-action',
                                    label: 'Show Runtime Info Action',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/open-api/fe-http/show-table-data-action',
                                    label: 'Show Table Data Action',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/open-api/fe-http/statement-execution-action',
                                    label: 'Statement Execution Action',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/open-api/fe-http/table-query-plan-action',
                                    label: 'Table Query Plan Action',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/open-api/fe-http/table-row-count-action',
                                    label: 'Table Row Count Action',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/open-api/fe-http/table-schema-action',
                                    label: 'Table Schema Action',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/open-api/fe-http/upload-action',
                                    label: 'Upload Action',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/open-api/fe-http/import-action',
                                    label: 'Import Action',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/open-api/fe-http/meta-info-action-V2',
                                    label: 'Meta Info Action',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/open-api/fe-http/debug-point-action',
                                    label: 'Debug Point',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/open-api/fe-http/statistic-action',
                                    label: 'Statistic Action',
                                },
                            ],
                        },
                        {
                            type: 'category',
                            label: 'BE HTTP API',
                            items: [
                                {
                                    type: 'doc',
                                    id: 'admin-manual/open-api/be-http/check-rpc-channel',
                                    label: 'Check Stub Cache',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/open-api/be-http/reset-rpc-channel',
                                    label: 'Reset Stub Cache',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/open-api/be-http/compaction-status',
                                    label: 'View Compaction Status',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/open-api/be-http/compaction-run',
                                    label: 'Disk Capacity Management',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/open-api/be-http/meta',
                                    label: 'View Meta',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/open-api/be-http/snapshot',
                                    label: 'Make Snapshot',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/open-api/be-http/check-tablet-segment',
                                    label: 'Check All Tablet Segment Lost',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/open-api/be-http/config',
                                    label: 'Config of BE',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/open-api/be-http/metrics',
                                    label: 'Metrics',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/open-api/be-http/tablet-distribution',
                                    label: 'View Tablet Distribution',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/open-api/be-http/tablet-migration',
                                    label: 'Migration Tablet',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/open-api/be-http/tablet-info',
                                    label: 'View Tablet Info',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/open-api/be-http/checksum',
                                    label: 'Checksum',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/open-api/be-http/download',
                                    label: 'Download Log about Load Error',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/open-api/be-http/pad-rowset',
                                    label: 'Pad Rowset',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/open-api/be-http/version-info',
                                    label: 'Be Version Info',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/open-api/be-http/health',
                                    label: 'Check Alive',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/open-api/be-http/tablet-reload',
                                    label: 'Reload Tablet',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/open-api/be-http/tablet-restore',
                                    label: 'Restore Tablet',
                                },
                                {
                                    type: 'doc',
                                    id: 'admin-manual/open-api/be-http/be-vlog',
                                    label: 'Modify BE VLOG',
                                },
                            ],
                        },
                    ],
                },
            ],
        },
        {
            type: 'category',
            label: 'Ecosystem',
            collapsed: false,
            items: [
                {
                    type: 'doc',
                    id: 'ecosystem/spark-doris-connector',
                    label: 'Spark Doris Connector',
                },
                {
                    type: 'doc',
                    id: 'ecosystem/flink-doris-connector',
                    label: 'Flink Doris Connector',
                },
                {
                    type: 'doc',
                    id: 'ecosystem/doris-kafka-connector',
                    label: 'Doris Kafka Connector',
                },
                {
                    type: 'category',
                    label: 'Doris Operator',
                    items: [
                        {
                            type: 'doc',
                            id: 'ecosystem/doris-operator/doris-operator-overview',
                            label: 'Doris Kubernetes Operator',
                        },
                        {
                            type: 'doc',
                            id: 'ecosystem/doris-operator/on-alibaba',
                            label: 'Recommendations on Alibaba Cloud',
                        },
                        {
                            type: 'doc',
                            id: 'ecosystem/doris-operator/on-aws',
                            label: 'Recommendations on AWS',
                        },
                    ],
                },
                {
                    type: 'doc',
                    id: 'ecosystem/doris-streamloader',
                    label: 'Doris Streamloader',
                },
                {
                    type: 'category',
                    label: 'BI',
                    items: [
                        {
                            type: 'doc',
                            id: 'ecosystem/bi/apache-superset',
                            label: 'Apache Superset',
                        },
                        {
                            type: 'doc',
                            id: 'ecosystem/bi/finebi',
                            label: 'FineBI',
                        },
                        {
                            type: 'doc',
                            id: 'ecosystem/bi/powerbi',
                            label: 'Power BI',
                        },
                        {
                            type: 'doc',
                            id: 'ecosystem/bi/tableau',
                            label: 'Tableau',
                        },
                        {
                            type: 'doc',
                            id: 'ecosystem/bi/quicksight',
                            label: 'QuickSight',
                        },
                        {
                            type: 'doc',
                            id: 'ecosystem/bi/quickbi',
                            label: 'Quick BI',
                        },
                        {
                            type: 'doc',
                            id: 'ecosystem/bi/smartbi',
                            label: 'Smartbi',
                        },
                    ],
                },
                {
                    type: 'category',
                    label: 'SQL Clients',
                    items: [
                        {
                            type: 'doc',
                            id: 'ecosystem/bi/clouddm',
                            label: 'CloudDM',
                        },
                        {
                            type: 'doc',
                            id: 'ecosystem/bi/dbeaver',
                            label: 'DBeaver',
                        },
                        {
                            type: 'doc',
                            id: 'ecosystem/bi/datagrip',
                            label: 'DataGrip',
                        },
                    ],
                },
                {
                    type: 'category',
                    label: 'Observability',
                    items: [
                        {
                            type: 'doc',
                            id: 'ecosystem/observability/logstash',
                            label: 'Logstash',
                        },
                        {
                            type: 'doc',
                            id: 'ecosystem/observability/beats',
                            label: 'Filebeat',
                        },
                        {
                            type: 'doc',
                            id: 'ecosystem/observability/opentelemetry',
                            label: 'OpenTelemetry',
                        },
                        {
                            type: 'doc',
                            id: 'ecosystem/observability/fluentbit',
                            label: 'FluentBit',
                        },
                        {
                            type: 'doc',
                            id: 'ecosystem/observability/loongcollector',
                            label: 'LoongCollector (iLogtail) Doris Flusher',
                        },
                    ],
                },
                {
                    type: 'category',
                    label: 'More',
                    items: [
                        {
                            type: 'doc',
                            id: 'ecosystem/cloudcanal',
                            label: 'BladePipe',
                        },
                        {
                            type: 'doc',
                            id: 'ecosystem/datax',
                            label: 'DataX Doriswriter',
                        },
                        {
                            type: 'doc',
                            id: 'ecosystem/dbt-doris-adapter',
                            label: 'DBT Doris Adapter',
                        },
                        {
                            type: 'doc',
                            id: 'ecosystem/seatunnel',
                            label: 'Seatunnel Doris Sink',
                        },
                        {
                            type: 'doc',
                            id: 'ecosystem/kettle',
                            label: 'Kettle Doris Plugin',
                        },
                        {
                            type: 'doc',
                            id: 'ecosystem/kyuubi',
                            label: 'Kyuubi',
                        },
                        {
                            type: 'doc',
                            id: 'ecosystem/automq-load',
                            label: 'AutoMQ Load',
                        },
                        {
                            type: 'doc',
                            id: 'ecosystem/hive-bitmap-udf',
                            label: 'Hive Bitmap UDF',
                        },
                        {
                            type: 'doc',
                            id: 'ecosystem/hive-hll-udf',
                            label: 'Hive HLL UDF',
                        },
                        {
                            type: 'doc',
                            id: 'ecosystem/spark-load',
                            label: 'Spark Load',
                        },
                    ],
                },
            ],
        },
        {
            type: 'category',
            label: 'FAQ',
            collapsed: false,
            items: [
                {
                    type: 'doc',
                    id: 'faq/install-faq',
                    label: 'Install Error',
                },
                {
                    type: 'doc',
                    id: 'faq/data-faq',
                    label: 'Data Operation Error',
                },
                {
                    type: 'doc',
                    id: 'faq/sql-faq',
                    label: 'SQL Error',
                },
                {
                    type: 'doc',
                    id: 'faq/lakehouse-faq',
                    label: 'Data Lakehouse FAQ',
                },
                {
                    type: 'doc',
                    id: 'faq/bi-faq',
                    label: 'BI FAQ',
                },
                {
                    type: 'doc',
                    id: 'faq/correctness-faq',
                    label: 'Data Integrity FAQ',
                },
                {
                    type: 'doc',
                    id: 'faq/load-faq',
                    label: 'Load FAQ',
                },
            ],
        },
        {
            type: 'category',
            label: 'Reference',
            collapsed: false,
            items: [
                {
                    type: 'category',
                    label: 'Basic Elements',
                    items: [
                        {
                            type: 'category',
                            label: 'SQL Data Types',
                            items: [
                                {
                                    type: 'doc',
                                    id: 'sql-manual/basic-element/sql-data-types/data-type-overview',
                                    label: 'Overview',
                                },
                                {
                                    type: 'category',
                                    label: 'Numeric Data Type',
                                    items: [
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/basic-element/sql-data-types/numeric/BOOLEAN',
                                            label: 'BOOLEAN',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/basic-element/sql-data-types/numeric/TINYINT',
                                            label: 'TINYINT',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/basic-element/sql-data-types/numeric/SMALLINT',
                                            label: 'SMALLINT',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/basic-element/sql-data-types/numeric/INT',
                                            label: 'INT',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/basic-element/sql-data-types/numeric/BIGINT',
                                            label: 'BIGINT',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/basic-element/sql-data-types/numeric/LARGEINT',
                                            label: 'LARGEINT',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/basic-element/sql-data-types/numeric/DECIMAL',
                                            label: 'DECIMAL',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/basic-element/sql-data-types/numeric/FLOATING-POINT',
                                            label: 'Floating-Point Types (FLOAT and DOUBLE)',
                                        },
                                    ],
                                },
                                {
                                    type: 'category',
                                    label: 'Datetime Data Type',
                                    items: [
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/basic-element/sql-data-types/date-time/DATE',
                                            label: 'DATE',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/basic-element/sql-data-types/date-time/TIME',
                                            label: 'TIME',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/basic-element/sql-data-types/date-time/DATETIME',
                                            label: 'DATETIME',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/basic-element/sql-data-types/date-time/TIMESTAMPTZ',
                                            label: 'TIMESTAMPTZ',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'admin-manual/cluster-management/time-zone',
                                            label: 'Time Zone',
                                        },
                                    ],
                                },
                                {
                                    type: 'category',
                                    label: 'String Data Type',
                                    items: [
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/basic-element/sql-data-types/string-type/CHAR',
                                            label: 'CHAR',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/basic-element/sql-data-types/string-type/VARCHAR',
                                            label: 'VARCHAR',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/basic-element/sql-data-types/string-type/STRING',
                                            label: 'STRING',
                                        },
                                    ],
                                },
                                {
                                    type: 'category',
                                    label: 'Binary Data Type',
                                    items: [
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/basic-element/sql-data-types/binary-type/VARBINARY',
                                            label: 'VARBINARY',
                                        },
                                    ],
                                },
                                {
                                    type: 'category',
                                    label: 'Semi-Structured Data Type',
                                    items: [
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/basic-element/sql-data-types/semi-structured/ARRAY',
                                            label: 'ARRAY',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/basic-element/sql-data-types/semi-structured/GEO',
                                            label: 'GEO',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/basic-element/sql-data-types/semi-structured/MAP',
                                            label: 'MAP',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/basic-element/sql-data-types/semi-structured/STRUCT',
                                            label: 'STRUCT',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/basic-element/sql-data-types/semi-structured/JSON',
                                            label: 'JSON',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/basic-element/sql-data-types/semi-structured/VARIANT',
                                            label: 'VARIANT',
                                        },
                                    ],
                                },
                                {
                                    type: 'category',
                                    label: 'Aggregation Data Type',
                                    items: [
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/basic-element/sql-data-types/aggregate/HLL',
                                            label: 'HLL (HyperLogLog)',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/basic-element/sql-data-types/aggregate/BITMAP',
                                            label: 'BITMAP',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/basic-element/sql-data-types/aggregate/QUANTILE-STATE',
                                            label: 'QUANTILE_STATE',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/basic-element/sql-data-types/aggregate/AGG-STATE',
                                            label: 'AGG_STATE',
                                        },
                                    ],
                                },
                                {
                                    type: 'category',
                                    label: 'IP Data Type',
                                    items: [
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/basic-element/sql-data-types/ip/IPV4',
                                            label: 'IPV4',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/basic-element/sql-data-types/ip/IPV6',
                                            label: 'IPV6',
                                        },
                                    ],
                                },
                                {
                                    type: 'category',
                                    label: 'Conversion',
                                    items: [
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/basic-element/sql-data-types/conversion/overview',
                                            label: 'Type Conversion',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/basic-element/sql-data-types/conversion/cast-expr',
                                            label: 'CAST expression',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/basic-element/sql-data-types/conversion/cast-to-string',
                                            label: 'Cast to String (Output)',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/basic-element/sql-data-types/conversion/array-conversion',
                                            label: 'Cast to ARRAY Types',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/basic-element/sql-data-types/conversion/boolean-conversion',
                                            label: 'Cast to BOOLEAN Type',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/basic-element/sql-data-types/conversion/date-conversion',
                                            label: 'Cast to DATE Type',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/basic-element/sql-data-types/conversion/datetime-conversion',
                                            label: 'Cast to DATETIME Type',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/basic-element/sql-data-types/conversion/timestamptz-conversion',
                                            label: 'Cast to TIMESTAMPTZ Type',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/basic-element/sql-data-types/conversion/decimal-conversion',
                                            label: 'Cast to DECIMAL Type',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/basic-element/sql-data-types/conversion/float-double-conversion',
                                            label: 'Convert to FLOAT/DOUBLE',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/basic-element/sql-data-types/conversion/int-conversion',
                                            label: 'Cast to INT Types',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/basic-element/sql-data-types/conversion/ip-conversion',
                                            label: 'Cast to IP Types',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/basic-element/sql-data-types/conversion/json-conversion',
                                            label: 'Cast to/from JSON',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/basic-element/sql-data-types/conversion/map-conversion',
                                            label: 'Cast to MAP Types',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/basic-element/sql-data-types/conversion/struct-conversion',
                                            label: 'Cast to STRUCT Types',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/basic-element/sql-data-types/conversion/time-conversion',
                                            label: 'Cast to TIME Type',
                                        },
                                    ],
                                },
                            ],
                        },
                        {
                            type: 'category',
                            label: 'Literal',
                            items: [
                                {
                                    type: 'doc',
                                    id: 'sql-manual/basic-element/literal/numeric-literal',
                                    label: 'Numeric Type Literal',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/basic-element/literal/string-literal',
                                    label: 'String Type Literal',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/basic-element/literal/date-literal',
                                    label: 'Date Type Literal',
                                },
                            ],
                        },
                        {
                            type: 'doc',
                            id: 'sql-manual/basic-element/nulls',
                            label: 'NULL',
                        },
                        {
                            type: 'doc',
                            id: 'sql-manual/basic-element/object-identifiers',
                            label: 'Object Identifier',
                        },
                        {
                            type: 'doc',
                            id: 'sql-manual/basic-element/reserved-keywords',
                            label: 'Reserved Keywords',
                        },
                        {
                            type: 'doc',
                            id: 'sql-manual/basic-element/variables',
                            label: 'Variables',
                        },
                        {
                            type: 'doc',
                            id: 'sql-manual/basic-element/comments',
                            label: 'Comments',
                        },
                        {
                            type: 'category',
                            label: 'Operators',
                            items: [
                                {
                                    type: 'doc',
                                    id: 'sql-manual/basic-element/operators/arithmetic-operators',
                                    label: 'Arithmetic Operators',
                                },
                                {
                                    type: 'category',
                                    label: 'Conditional Operators',
                                    items: [
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/basic-element/operators/conditional-operators/logical-operators',
                                            label: 'Logic Operators',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/basic-element/operators/conditional-operators/comparison-operators',
                                            label: 'Comparison Operators',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/basic-element/operators/conditional-operators/boolean-testing-operators',
                                            label: 'Boolean Testing Operators',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/basic-element/operators/conditional-operators/pattern-matching-operators',
                                            label: 'Pattern Matching Operators',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/basic-element/operators/conditional-operators/full-text-search-operators',
                                            label: 'Full Text Search Operators',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/basic-element/operators/conditional-operators/in-operators',
                                            label: 'In Operators',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/basic-element/operators/conditional-operators/exists-operators',
                                            label: 'Exists Operators',
                                        },
                                    ],
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/basic-element/operators/bitwise-operators',
                                    label: 'Bitwise Operators',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/basic-element/operators/assignment-operators',
                                    label: 'Assignment Operators',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/basic-element/operators/operator-precedence',
                                    label: 'Operator Precedence',
                                },
                            ],
                        },
                    ],
                },
                {
                    type: 'category',
                    label: 'SQL Functions',
                    items: [
                        {
                            type: 'category',
                            label: 'AI Functions',
                            items: [
                                {
                                    type: 'category',
                                    label: 'Vector Distance Functions',
                                    items: [
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/ai-functions/distance-functions/cosine-distance',
                                            label: 'COSINE_DISTANCE',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/ai-functions/distance-functions/inner-product',
                                            label: 'INNER_PRODUCT',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/ai-functions/distance-functions/l1-distance',
                                            label: 'L1_DISTANCE',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/ai-functions/distance-functions/l2-distance',
                                            label: 'L2_DISTANCE',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/ai-functions/distance-functions/embed',
                                            label: 'EMBED',
                                        },
                                    ],
                                },
                                {
                                    type: 'category',
                                    label: 'AI Functions',
                                    items: [
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/ai-functions/overview',
                                            label: 'Overview',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/ai-functions/ai-classify',
                                            label: 'AI_CLASSIFY',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/ai-functions/ai-extract',
                                            label: 'AI_EXTRACT',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/ai-functions/ai-filter',
                                            label: 'AI_FILTER',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/ai-functions/ai-fixgrammar',
                                            label: 'AI_FIXGRAMMAR',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/ai-functions/ai-generate',
                                            label: 'AI_GENERATE',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/ai-functions/ai-mask',
                                            label: 'AI_MASK',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/ai-functions/ai-sentiment',
                                            label: 'AI_SENTIMENT',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/ai-functions/ai-similarity',
                                            label: 'AI_SIMILARITY',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/ai-functions/ai-summarize',
                                            label: 'AI_SUMMARIZE',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/ai-functions/ai-translate',
                                            label: 'AI_TRANSLATE',
                                        },
                                    ],
                                },
                            ],
                        },
                        {
                            type: 'category',
                            label: 'Scalar Functions',
                            items: [
                                {
                                    type: 'category',
                                    label: 'Numeric Functions',
                                    items: [
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/numeric-functions/abs',
                                            label: 'ABS',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/numeric-functions/acos',
                                            label: 'ACOS',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/numeric-functions/acosh',
                                            label: 'ACOSH',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/numeric-functions/asin',
                                            label: 'ASIN',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/numeric-functions/asinh',
                                            label: 'ASINH',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/numeric-functions/atan',
                                            label: 'ATAN',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/numeric-functions/atan2',
                                            label: 'ATAN2',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/numeric-functions/atanh',
                                            label: 'ATANH',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/numeric-functions/bin',
                                            label: 'BIN',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/numeric-functions/cbrt',
                                            label: 'CBRT',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/numeric-functions/ceil',
                                            label: 'CEIL',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/numeric-functions/conv',
                                            label: 'CONV',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/numeric-functions/cos',
                                            label: 'COS',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/numeric-functions/cosh',
                                            label: 'COSH',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/numeric-functions/cot',
                                            label: 'COT',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/numeric-functions/csc',
                                            label: 'CSC',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/numeric-functions/degrees',
                                            label: 'DEGREES',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/numeric-functions/e',
                                            label: 'E',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/numeric-functions/exp',
                                            label: 'EXP',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/numeric-functions/factorial',
                                            label: 'FACTORIAL',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/numeric-functions/floor',
                                            label: 'FLOOR',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/numeric-functions/fmod',
                                            label: 'FMOD',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/numeric-functions/format-round',
                                            label: 'FORMAT_ROUND',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/numeric-functions/isinf',
                                            label: 'ISINF',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/numeric-functions/isnan',
                                            label: 'ISNAN',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/numeric-functions/ln',
                                            label: 'LN',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/numeric-functions/log',
                                            label: 'LOG',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/numeric-functions/log10',
                                            label: 'LOG10',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/numeric-functions/log2',
                                            label: 'LOG2',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/numeric-functions/mod',
                                            label: 'MOD',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/numeric-functions/money-format',
                                            label: 'MONEY_FORMAT',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/numeric-functions/negative',
                                            label: 'NEGATIVE',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/numeric-functions/normal-cdf',
                                            label: 'NORMAL_CDF',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/numeric-functions/pi',
                                            label: 'PI',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/numeric-functions/pmod',
                                            label: 'PMOD',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/numeric-functions/positive',
                                            label: 'POSITIVE',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/numeric-functions/pow',
                                            label: 'POW',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/numeric-functions/radians',
                                            label: 'RADIANS',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/numeric-functions/random',
                                            label: 'RANDOM',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/numeric-functions/round',
                                            label: 'ROUND',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/numeric-functions/round-bankers',
                                            label: 'ROUND_BANKERS',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/numeric-functions/sec',
                                            label: 'SEC',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/numeric-functions/sign',
                                            label: 'SIGN',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/numeric-functions/sin',
                                            label: 'SIN',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/numeric-functions/sinh',
                                            label: 'SINH',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/numeric-functions/sqrt',
                                            label: 'SQRT',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/numeric-functions/tan',
                                            label: 'TAN',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/numeric-functions/tanh',
                                            label: 'TANH',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/numeric-functions/truncate',
                                            label: 'TRUNCATE',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/numeric-functions/uniform',
                                            label: 'UNIFORM',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/numeric-functions/uuid_numeric',
                                            label: 'UUID_NUMERIC',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/numeric-functions/width-bucket',
                                            label: 'WIDTH_BUCKET',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/numeric-functions/even',
                                            label: 'EVEN',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/numeric-functions/signbit',
                                            label: 'SIGNBIT',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/numeric-functions/gcd',
                                            label: 'GCD',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/numeric-functions/lcm',
                                            label: 'LCM',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/numeric-functions/xor',
                                            label: 'XOR',
                                        },
                                    ],
                                },
                                {
                                    type: 'category',
                                    label: 'String Functions',
                                    items: [
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/string-functions/overview',
                                            label: 'String Functions Overview',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/string-functions/append-trailing-char-if-absent',
                                            label: 'APPEND_TRAILING_CHAR_IF_ABSENT',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/string-functions/ascii',
                                            label: 'ASCII',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/string-functions/auto-partition-name',
                                            label: 'AUTO_PARTITION_NAME',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/string-functions/char',
                                            label: 'CHAR',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/string-functions/char-length',
                                            label: 'CHAR_LENGTH',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/string-functions/concat',
                                            label: 'CONCAT',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/string-functions/concat-ws',
                                            label: 'CONCAT_WS',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/string-functions/compress',
                                            label: 'COMPRESS',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/string-functions/count_substrings',
                                            label: 'COUNT_SUBSTRINGS',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/string-functions/cut-to-first-significant-subdomain',
                                            label: 'CUT_TO_FIRST_SIGNIFICANT_SUBDOMAIN',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/string-functions/digital-masking',
                                            label: 'DIGITAL_MASKING',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/string-functions/domain',
                                            label: 'DOMAIN',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/string-functions/domain-without-www',
                                            label: 'DOMAIN_WITHOUT_WWW',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/string-functions/ends-with',
                                            label: 'ENDS_WITH',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/string-functions/export-set',
                                            label: 'EXPORT-SET',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/string-functions/elt',
                                            label: 'ELT',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/string-functions/extract-url-parameter',
                                            label: 'EXTRACT_URL_PARAMETER',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/string-functions/from-base64',
                                            label: 'FROM_BASE64',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/string-functions/find-in-set',
                                            label: 'FIND_IN_SET',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/string-functions/first-significant-subdomain',
                                            label: 'FIRST_SIGNIFICANT_SUBDOMAIN',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/string-functions/format',
                                            label: 'FORMAT',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/string-functions/format-number',
                                            label: 'FORMAT_NUMBER',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/string-functions/hex',
                                            label: 'HEX',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/string-functions/initcap',
                                            label: 'INITCAP',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/string-functions/instr',
                                            label: 'INSTR',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/string-functions/int-to-uuid',
                                            label: 'INT_TO_UUID',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/string-functions/is-uuid',
                                            label: 'IS_UUID',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/string-functions/lcase',
                                            label: 'LCASE/LOWER',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/string-functions/length',
                                            label: 'LENGTH',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/string-functions/locate',
                                            label: 'LOCATE',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/string-functions/lpad',
                                            label: 'LPAD',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/string-functions/ltrim',
                                            label: 'LTRIM',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/string-functions/ltrim-in',
                                            label: 'LTRIM_IN',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/string-functions/make-set',
                                            label: 'MAKE_SET',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/string-functions/mask',
                                            label: 'MASK',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/string-functions/mask-first-n',
                                            label: 'MASK_FIRST_N',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/string-functions/mask-last-n',
                                            label: 'MASK_LAST_N',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/string-functions/multi-match-any',
                                            label: 'MULTI_MATCH_ANY',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/string-functions/multi-search-all-positions',
                                            label: 'MULTI_SEARCH_ALL_POSITIONS',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/string-functions/ngram-search',
                                            label: 'NGRAM_SEARCH',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/string-functions/overlay',
                                            label: 'OVERLAY',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/string-functions/parse-data-size',
                                            label: 'PARSE_DATA_SIZE',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/string-functions/parse-url',
                                            label: 'PARSE_URL',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/string-functions/position',
                                            label: 'POSITION',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/string-functions/printf',
                                            label: 'PRINTF',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/string-functions/protocol',
                                            label: 'PROTOCOL',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/string-functions/quote',
                                            label: 'QUOTE',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/string-functions/random_bytes',
                                            label: 'RANDOM_BYTES',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/string-functions/regexp',
                                            label: 'REGEXP',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/string-functions/regexp-count',
                                            label: 'REGEXP_COUNT',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/string-functions/regexp-extract',
                                            label: 'REGEXP_EXTRACT',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/string-functions/regexp-extract-all',
                                            label: 'REGEXP_EXTRACT_ALL',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/string-functions/regexp-extract-or-null',
                                            label: 'REGEXP_EXTRACT_OR_NULL',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/string-functions/regexp-replace',
                                            label: 'REGEXP_REPLACE',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/string-functions/regexp-replace-one',
                                            label: 'REGEXP_REPLACE_ONE',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/string-functions/replace',
                                            label: 'REPLACE',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/string-functions/replace-empty',
                                            label: 'REPLACE_EMPTY',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/string-functions/repeat',
                                            label: 'REPEAT',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/string-functions/reverse',
                                            label: 'REVERSE',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/string-functions/rpad',
                                            label: 'RPAD',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/string-functions/rtrim',
                                            label: 'RTRIM',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/string-functions/rtrim-in',
                                            label: 'RTRIM_IN',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/string-functions/soundex',
                                            label: 'SOUNDEX',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/string-functions/strleft',
                                            label: 'STRLEFT',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/string-functions/strright',
                                            label: 'STRRIGHT',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/string-functions/split-by-regexp',
                                            label: 'SPLIT_BY_REGEXP/REGEXP_SPLIT_TO_ARRAY',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/string-functions/split-by-string',
                                            label: 'SPLIT/SPLIT_BY_STRING',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/string-functions/split-part',
                                            label: 'SPLIT_PART',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/string-functions/space',
                                            label: 'SPACE',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/string-functions/strcmp',
                                            label: 'STRCMP',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/string-functions/starts-with',
                                            label: 'STARTS_WITH',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/string-functions/sub-replace',
                                            label: 'SUB_REPLACE',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/string-functions/substring',
                                            label: 'SUBSTRING',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/string-functions/substring-index',
                                            label: 'SUBSTRING_INDEX',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/string-functions/tokenize',
                                            label: 'TOKENIZE',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/string-functions/trim',
                                            label: 'TRIM',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/string-functions/trim-in',
                                            label: 'TRIM_IN',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/string-functions/top-level-domain',
                                            label: 'TOP_LEVEL_DOMAIN',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/string-functions/to-base64',
                                            label: 'TO_BASE64',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/string-functions/translate',
                                            label: 'TRANSLATE',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/string-functions/uncompress',
                                            label: 'UNCOMPRESS',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/string-functions/unhex',
                                            label: 'UNHEX',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/string-functions/ucase',
                                            label: 'UCASE/UPPER',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/string-functions/unicode_normalize',
                                            label: 'UNICODE_NORMALIZE',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/string-functions/url-decode',
                                            label: 'URL_DECODE',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/string-functions/url-encode',
                                            label: 'URL_ENCODE',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/string-functions/uuid',
                                            label: 'UUID',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/string-functions/xpath-string',
                                            label: 'XPATH_STRING',
                                        },
                                    ],
                                },
                                {
                                    type: 'category',
                                    label: 'Date Functions',
                                    items: [
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/add-time',
                                            label: 'ADD_TIME',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/century',
                                            label: 'CENTURY',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/convert-tz',
                                            label: 'CONVERT_TZ',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/curdate',
                                            label: 'CURDATE,CURRENT_DATE',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/curtime',
                                            label: 'CURTIME,CURRENT_TIME',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/date',
                                            label: 'DATE',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/date-add',
                                            label: 'DATE_ADD',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/date-ceil',
                                            label: 'DATE_CEIL',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/date-floor',
                                            label: 'DATE_FLOOR',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/date-format',
                                            label: 'DATE_FORMAT',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/date-sub',
                                            label: 'DATE_SUB',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/date-trunc',
                                            label: 'DATE_TRUNC',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/datediff',
                                            label: 'DATEDIFF',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/day',
                                            label: 'DAY',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/day-ceil',
                                            label: 'DAY_CEIL',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/day-floor',
                                            label: 'DAY_FLOOR',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/dayname',
                                            label: 'DAYNAME',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/dayofweek',
                                            label: 'DAYOFWEEK',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/dayofyear',
                                            label: 'DAYOFYEAR',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/extract',
                                            label: 'EXTRACT',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/from-days',
                                            label: 'FROM_DAYS',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/from-iso8601-date',
                                            label: 'FROM_ISO8601_DATE',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/from-microsecond',
                                            label: 'FROM_MICROSECOND',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/from-millisecond',
                                            label: 'FROM_MILLISECOND',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/from-second',
                                            label: 'FROM_SECOND',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/from-unixtime',
                                            label: 'FROM_UNIXTIME',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/get-format',
                                            label: 'GET_FORMAT',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/hour',
                                            label: 'HOUR',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/hour-ceil',
                                            label: 'HOUR_CEIL',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/hour-floor',
                                            label: 'HOUR_FLOOR',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/hours-add',
                                            label: 'HOURS_ADD',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/hours-diff',
                                            label: 'HOURS_DIFF',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/hours-sub',
                                            label: 'HOURS_SUB',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/last-day',
                                            label: 'LAST_DAY',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/makedate',
                                            label: 'MAKEDATE',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/maketime',
                                            label: 'MAKETIME',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/microsecond',
                                            label: 'MICROSECOND',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/microsecond-timestamp',
                                            label: 'MICROSECOND_TIMESTAMP',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/microseconds-add',
                                            label: 'MICROSECONDS_ADD',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/microseconds-diff',
                                            label: 'MICROSECONDS_DIFF',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/microseconds-sub',
                                            label: 'MICROSECONDS_SUB',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/millisecond-timestamp',
                                            label: 'MILLISECOND_TIMESTAMP',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/milliseconds-add',
                                            label: 'MILLISECONDS_ADD',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/milliseconds-diff',
                                            label: 'MILLISECONDS_DIFF',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/milliseconds-sub',
                                            label: 'MILLISECONDS_SUB',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/minute',
                                            label: 'MINUTE',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/minute-ceil',
                                            label: 'MINUTE_CEIL',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/minute-floor',
                                            label: 'MINUTE_FLOOR',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/minutes-add',
                                            label: 'MINUTES_ADD',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/minutes-diff',
                                            label: 'MINUTES_DIFF',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/minutes-sub',
                                            label: 'MINUTES_SUB',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/month',
                                            label: 'MONTH',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/month-ceil',
                                            label: 'MONTH_CEIL',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/month-floor',
                                            label: 'MONTH_FLOOR',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/monthname',
                                            label: 'MONTHNAME',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/months-add',
                                            label: 'MONTHS_ADD',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/months-between',
                                            label: 'MONTHS_BETWEEN',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/months-diff',
                                            label: 'MONTHS_DIFF',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/months-sub',
                                            label: 'MONTHS_SUB',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/now',
                                            label: 'NOW',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/next-day',
                                            label: 'NEXT_DAY',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/period-add',
                                            label: 'PERIOD_ADD',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/period-diff',
                                            label: 'PERIOD_DIFF',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/quarter',
                                            label: 'QUARTER',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/quarters-add',
                                            label: 'QUARTERS_ADD',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/quarters-sub',
                                            label: 'QUARTERS_SUB',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/sec-to-time',
                                            label: 'SEC_TO_TIME',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/second',
                                            label: 'SECOND',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/second-ceil',
                                            label: 'SECOND_CEIL',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/second-floor',
                                            label: 'SECOND_FLOOR',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/seconds-add',
                                            label: 'SECONDS_ADD',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/seconds-diff',
                                            label: 'SECONDS_DIFF',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/seconds-sub',
                                            label: 'SECONDS_SUB',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/str-to-date',
                                            label: 'STR_TO_DATE',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/sub-time',
                                            label: 'SUB_TIME',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/timestamp',
                                            label: 'TIMESTAMP',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/timestampadd',
                                            label: 'TIMESTAMPADD',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/timestampdiff',
                                            label: 'TIMESTAMPDIFF',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/time',
                                            label: 'TIME',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/timediff',
                                            label: 'TIMEDIFF',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/time-to-sec',
                                            label: 'TIME_TO_SEC',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/to-date',
                                            label: 'TO_DATE',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/to-days',
                                            label: 'TO_DAYS',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/to-iso8601',
                                            label: 'TO_ISO8601',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/to-monday',
                                            label: 'TO_MONDAY',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/to-seconds',
                                            label: 'TO_SECONDS',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/utc-date',
                                            label: 'UTC_DATE',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/utc-time',
                                            label: 'UTC_TIME',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/utc-timestamp',
                                            label: 'UTC_TIMESTAMP',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/unix-timestamp',
                                            label: 'UNIX_TIMESTAMP',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/week',
                                            label: 'WEEK',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/week-ceil',
                                            label: 'WEEK_CEIL',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/week-floor',
                                            label: 'WEEK_FLOOR',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/weekday',
                                            label: 'WEEKDAY',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/weekofyear',
                                            label: 'WEEKOFYEAR',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/weeks-add',
                                            label: 'WEEKS_ADD',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/weeks-diff',
                                            label: 'WEEKS_DIFF',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/weeks-sub',
                                            label: 'WEEKS_SUB',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/year',
                                            label: 'YEAR',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/year-ceil',
                                            label: 'YEAR_CEIL',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/year-floor',
                                            label: 'YEAR_FLOOR',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/year-of-week',
                                            label: 'YEAR_OF_WEEK',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/yearweek',
                                            label: 'YEARWEEK',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/years-add',
                                            label: 'YEARS_ADD',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/years-diff',
                                            label: 'YEARS_DIFF',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/date-time-functions/years-sub',
                                            label: 'YEARS_SUB',
                                        },
                                    ],
                                },
                                {
                                    type: 'category',
                                    label: 'GIS Functions',
                                    items: [
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/spatial-functions/st-angle',
                                            label: 'ST_ANGLE',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/spatial-functions/st-angle-sphere',
                                            label: 'ST_ANGLE_SPHERE',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/spatial-functions/st-area-square-km',
                                            label: 'ST_AREA_SQUARE_KM',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/spatial-functions/st-area-square-meters',
                                            label: 'ST_AREA_SQUARE_METERS',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/spatial-functions/st-asbinary',
                                            label: 'ST_ASBINARY',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/spatial-functions/st-astext',
                                            label: 'ST_ASTEXT',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/spatial-functions/st-azimuth',
                                            label: 'ST_AZIMUTH',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/spatial-functions/st-circle',
                                            label: 'ST_CIRCLE',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/spatial-functions/st-contains',
                                            label: 'ST_CONTAINS',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/spatial-functions/st-disjoint',
                                            label: 'ST_DISJOINT',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/spatial-functions/st-distance-sphere',
                                            label: 'ST_DISTANCE_SPHERE',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/spatial-functions/st-geometryfromtext',
                                            label: 'ST_GEOMETRYFROMTEXT',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/spatial-functions/st-geometryfromwkb',
                                            label: 'ST_GEOMETRYFROMWKB',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/spatial-functions/st-intersects',
                                            label: 'ST_INTERSECTS',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/spatial-functions/st-linefromtext',
                                            label: 'ST_LINEFROMTEXT',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/spatial-functions/st-point',
                                            label: 'ST_POINT',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/spatial-functions/st-polygon',
                                            label: 'ST_POLYGON',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/spatial-functions/st-touches',
                                            label: 'ST_TOUCHES',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/spatial-functions/st-x',
                                            label: 'ST_X',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/spatial-functions/st-y',
                                            label: 'ST_Y',
                                        },
                                    ],
                                },
                                {
                                    type: 'category',
                                    label: 'Encryption Functions',
                                    items: [
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/aes-decrypt',
                                            label: 'AES_DECRYPT',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/aes-encrypt',
                                            label: 'AES_ENCRYPT',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/crc32',
                                            label: 'CRC32',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/md5',
                                            label: 'MD5',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/md5sum',
                                            label: 'MD5SUM',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/murmur-hash3-32',
                                            label: 'MURMUR_HASH3_32',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/murmur-hash3-64',
                                            label: 'MURMUR_HASH3_64',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/murmur-hash3-64-v2',
                                            label: 'MURMUR_HASH3_64_V2',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/sha',
                                            label: 'SHA1',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/sha2',
                                            label: 'SHA2',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/sm3',
                                            label: 'SM3',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/sm3sum',
                                            label: 'SM3SUM',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/sm4-decrypt',
                                            label: 'SM4_DECRYPT',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/sm4-encrypt',
                                            label: 'SM4_ENCRYPT',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/xxhash-32',
                                            label: 'XXHASH_32',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/encrypt-digest-functions/xxhash-64',
                                            label: 'XXHASH_64',
                                        },
                                    ],
                                },
                                {
                                    type: 'category',
                                    label: 'Bitwise Functions',
                                    items: [
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/bitwise-functions/bit-length',
                                            label: 'BIT_LENGTH',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/bitwise-functions/bit-test',
                                            label: 'BIT_TEST',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/bitwise-functions/bitand',
                                            label: 'BITAND',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/bitwise-functions/bitcount',
                                            label: 'BIT_COUNT',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/bitwise-functions/bitnot',
                                            label: 'BITNOT',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/bitwise-functions/bitor',
                                            label: 'BITOR',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/bitwise-functions/bitshiftleft',
                                            label: 'BIT_SHIFT_LEFT',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/bitwise-functions/bitshiftright',
                                            label: 'BIT_SHIFT_RIGHT',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/bitwise-functions/xor',
                                            label: 'XOR',
                                        },
                                    ],
                                },
                                {
                                    type: 'category',
                                    label: 'Array Functions',
                                    items: [
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/array-functions/array',
                                            label: 'ARRAY',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/array-functions/array-apply',
                                            label: 'ARRAY_APPLY',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/array-functions/array-avg',
                                            label: 'ARRAY_AVG',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/array-functions/array-compact',
                                            label: 'ARRAY_COMPACT',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/array-functions/array-concat',
                                            label: 'ARRAY_CONCAT',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/array-functions/array-contains',
                                            label: 'ARRAY_CONTAINS',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/array-functions/array-contains_all',
                                            label: 'ARRAY_CONTAINS_ALL',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/array-functions/array-count',
                                            label: 'ARRAY_COUNT',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/array-functions/array-cum-sum',
                                            label: 'ARRAY_CUM_SUM',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/array-functions/array-difference',
                                            label: 'ARRAY_DIFFERENCE',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/array-functions/array-distinct',
                                            label: 'ARRAY_DISTINCT',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/array-functions/array-enumerate',
                                            label: 'ARRAY_ENUMERATE',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/array-functions/array-enumerate-uniq',
                                            label: 'ARRAY_ENUMERATE_UNIQ',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/array-functions/array-except',
                                            label: 'ARRAY_EXCEPT',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/array-functions/array-exists',
                                            label: 'ARRAY_EXISTS',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/array-functions/array-filter',
                                            label: 'ARRAY_FILTER',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/array-functions/array-first',
                                            label: 'ARRAY_FIRST',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/array-functions/array-first-index',
                                            label: 'ARRAY_FIRST_INDEX',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/array-functions/array-flatten',
                                            label: 'ARRAY_FLATTEN',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/array-functions/array-intersect',
                                            label: 'ARRAY_INTERSECT',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/array-functions/array-join',
                                            label: 'ARRAY_JOIN',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/array-functions/array-last',
                                            label: 'ARRAY_LAST',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/array-functions/array-last-index',
                                            label: 'ARRAY_LAST_INDEX',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/array-functions/array-map',
                                            label: 'ARRAY_MAP',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/array-functions/array-match-all',
                                            label: 'ARRAY_MATCH_ALL',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/array-functions/array-match-any',
                                            label: 'array_match_any',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/array-functions/array-max',
                                            label: 'ARRAY_MAX',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/array-functions/array-min',
                                            label: 'ARRAY_MIN',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/array-functions/array-popback',
                                            label: 'ARRAY_POPBACK',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/array-functions/array-popfront',
                                            label: 'ARRAY_POPFRONT',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/array-functions/array-position',
                                            label: 'ARRAY_POSITION',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/array-functions/array-product',
                                            label: 'ARRAY_PRODUCT',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/array-functions/array-pushback',
                                            label: 'ARRAY_PUSHBACK',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/array-functions/array-pushfront',
                                            label: 'ARRAY_PUSHFRONT',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/array-functions/array-range',
                                            label: 'ARRAY_RANGE',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/array-functions/array-remove',
                                            label: 'ARRAY_REMOVE',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/array-functions/array-repeat',
                                            label: 'ARRAY_REPEAT',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/array-functions/array-reverse-sort',
                                            label: 'ARRAY_REVERSE_SORT',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/array-functions/array-reverse-split',
                                            label: 'ARRAY_REVERSE_SPLIT',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/array-functions/array-shuffle',
                                            label: 'ARRAY_SHUFFLE',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/array-functions/array-size',
                                            label: 'ARRAY_SIZE',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/array-functions/array-slice',
                                            label: 'ARRAY_SLICE',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/array-functions/array-sort',
                                            label: 'ARRAY_SORT',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/array-functions/array-sortby',
                                            label: 'ARRAY_SORTBY',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/array-functions/array-split',
                                            label: 'ARRAY_SPLIT',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/array-functions/array-sum',
                                            label: 'ARRAY_SUM',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/array-functions/array-union',
                                            label: 'ARRAY_UNION',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/array-functions/array-with-constant',
                                            label: 'ARRAY_WITH_CONSTANT',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/array-functions/array-zip',
                                            label: 'ARRAY_ZIP',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/array-functions/arrays-overlap',
                                            label: 'ARRAYS_OVERLAP',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/array-functions/countequal',
                                            label: 'COUNTEQUAL',
                                        },
                                    ],
                                },
                                {
                                    type: 'category',
                                    label: 'MAP Functions',
                                    items: [
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/map-functions/deduplicate-map',
                                            label: 'DEDUPLICATE_MAP',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/map-functions/map',
                                            label: 'MAP',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/map-functions/map-contains-entry',
                                            label: 'MAP_CONTAINS_ENTRY',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/map-functions/map-contains-key',
                                            label: 'MAP_CONTAINS_KEY',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/map-functions/map-contains-value',
                                            label: 'MAP_CONTAINS_VALUE',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/map-functions/map-entries',
                                            label: 'MAP_ENTRIES',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/map-functions/map-keys',
                                            label: 'MAP_KEYS',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/map-functions/map-size',
                                            label: 'MAP_SIZE',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/map-functions/map-values',
                                            label: 'MAP_VALUES',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/map-functions/str-to-map',
                                            label: 'STR_TO_MAP',
                                        },
                                    ],
                                },
                                {
                                    type: 'category',
                                    label: 'Struct Functions',
                                    items: [
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/struct-functions/named-struct',
                                            label: 'NAMED_STRUCT',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/struct-functions/struct',
                                            label: 'STRUCT',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/struct-functions/struct-element',
                                            label: 'STRUCT_ELEMENT',
                                        },
                                    ],
                                },
                                {
                                    type: 'category',
                                    label: 'JSON Functions',
                                    items: [
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/json-functions/get-json-bigint',
                                            label: 'GET_JSON_BIGINT',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/json-functions/get-json-double',
                                            label: 'GET_JSON_DOUBLE',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/json-functions/get-json-int',
                                            label: 'GET_JSON_INT',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/json-functions/get-json-string',
                                            label: 'GET_JSON_STRING',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/json-functions/json-array',
                                            label: 'JSON_ARRAY',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/json-functions/json-array-ignore-null',
                                            label: 'JSON_ARRAY_IGNORE_NULL',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/json-functions/json-contains',
                                            label: 'JSON_CONTAINS',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/json-functions/json-exists-path',
                                            label: 'JSON_EXISTS_PATH',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/json-functions/json-extract',
                                            label: 'JSON_EXTRACT',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/json-functions/json-extract-bigint',
                                            label: 'JSON_EXTRACT_BIGINT',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/json-functions/json-extract-bool',
                                            label: 'JSON_EXTRACT_BOOL',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/json-functions/json-extract-double',
                                            label: 'JSON_EXTRACT_DOUBLE',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/json-functions/json-extract-int',
                                            label: 'JSON_EXTRACT_INT',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/json-functions/json-extract-isnull',
                                            label: 'JSON_EXTRACT_ISNULL',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/json-functions/json-extract-largeint',
                                            label: 'JSON_EXTRACT_LARGEINT',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/json-functions/json-extract-string',
                                            label: 'JSON_EXTRACT_STRING',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/json-functions/json-hash',
                                            label: 'JSON_HASH',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/json-functions/json-insert',
                                            label: 'JSON_INSERT',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/json-functions/json-keys',
                                            label: 'JSON_KEYS',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/json-functions/json-length',
                                            label: 'JSON_LENGTH',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/json-functions/json-object',
                                            label: 'JSON_OBJECT',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/json-functions/json-parse',
                                            label: 'JSON_PARSE',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/json-functions/json-parse-error-to-null',
                                            label: 'JSON_PARSE_ERROR_TO_NULL',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/json-functions/json-parse-error-to-value',
                                            label: 'JSON_PARSE_ERROR_TO_VALUE',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/json-functions/json-quote',
                                            label: 'JSON_QUOTE',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/json-functions/json-replace',
                                            label: 'JSON_REPLACE',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/json-functions/json-remove',
                                            label: 'JSON_REMOVE',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/json-functions/json-search',
                                            label: 'JSON_SEARCH',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/json-functions/json-set',
                                            label: 'JSON_SET',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/json-functions/json-type',
                                            label: 'JSON_TYPE',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/json-functions/json-unquote',
                                            label: 'JSON_UNQUOTE',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/json-functions/json-valid',
                                            label: 'JSON_VALID',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/json-functions/normalize-json-numbers-to-double',
                                            label: 'NORMALIZE_JSON_NUMBERS_TO_DOUBLE',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/json-functions/sort-json-object-keys',
                                            label: 'SORT_JSON_OBJECT_KEYS',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/json-functions/strip-null-value',
                                            label: 'STRIP_NULL_VALUE',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/json-functions/to-json',
                                            label: 'TO_JSON',
                                        },
                                    ],
                                },
                                {
                                    type: 'category',
                                    label: 'Variant Functions',
                                    items: [
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/variant-functions/element-at',
                                            label: 'ELEMENT_AT',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/variant-functions/variant-type',
                                            label: 'VARIANT_TYPE',
                                        },
                                    ],
                                },
                                {
                                    type: 'category',
                                    label: 'IP Functions',
                                    items: [
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/ip-functions/cut-ipv6',
                                            label: 'CUT_IPV6',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/ip-functions/ipv4-cidr-to-range',
                                            label: 'IPV4_CIDR_TO_RANGE',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/ip-functions/ipv4-num-to-string',
                                            label: 'IPV4_NUM_TO_STRING',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/ip-functions/ipv4-string-to-num',
                                            label: 'IPV4_STRING_TO_NUM',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/ip-functions/ipv4-string-to-num-or-default',
                                            label: 'IPV4_STRING_TO_NUM_OR_DEFAULT',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/ip-functions/ipv4-string-to-num-or-null',
                                            label: 'IPV4_STRING_TO_NUM_OR_NULL',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/ip-functions/ipv4-to-ipv6',
                                            label: 'IPV4_TO_IPV6',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/ip-functions/ipv6-cidr-to-range',
                                            label: 'IPV6_CIDR_TO_RANGE',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/ip-functions/ipv6-num-to-string',
                                            label: 'IPV6_NUM_TO_STRING',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/ip-functions/ipv6-string-to-num',
                                            label: 'IPV6_STRING_TO_NUM',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/ip-functions/ipv6-string-to-num-or-default',
                                            label: 'IPV6_STRING_TO_NUM_OR_DEFAULT',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/ip-functions/ipv6-string-to-num-or-null',
                                            label: 'IPV6_STRING_TO_NUM_OR_NULL',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/ip-functions/is-ip-address-in-range',
                                            label: 'IS_IP_ADDRESS_IN_RANGE',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/ip-functions/is-ipv4-compat',
                                            label: 'IS_IPV4_COMPAT',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/ip-functions/is-ipv4-mapped',
                                            label: 'IS_IPV4_MAPPED',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/ip-functions/is-ipv4-string',
                                            label: 'IS_IPV4_STRING',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/ip-functions/is-ipv6-string',
                                            label: 'IS_IPV6_STRING',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/ip-functions/to-ipv4',
                                            label: 'TO_IPV4',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/ip-functions/to-ipv4-or-default',
                                            label: 'TO_IPV4_OR_DEFAULT',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/ip-functions/to-ipv4-or-null',
                                            label: 'TO_IPV4_OR_NULL',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/ip-functions/to-ipv6',
                                            label: 'TO_IPV6',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/ip-functions/to-ipv6-or-default',
                                            label: 'TO_IPV6_OR_DEFAULT',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/ip-functions/to-ipv6-or-null',
                                            label: 'TO_IPV6_OR_NULL',
                                        },
                                    ],
                                },
                                {
                                    type: 'category',
                                    label: 'Bitmap Functions',
                                    items: [
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-and',
                                            label: 'BITMAP_AND',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-and-count',
                                            label: 'BITMAP_AND_COUNT',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-and-not',
                                            label: 'BITMAP_AND_NOT,BITMAP_ANDNOT',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-and-not-count',
                                            label: 'BITMAP_AND_NOT_COUNT,BITMAP_ANDNOT_COUNT',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-contains',
                                            label: 'BITMAP_CONTAINS',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-count',
                                            label: 'BITMAP_COUNT',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-empty',
                                            label: 'BITMAP_EMPTY',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-from-array',
                                            label: 'BITMAP_FROM_ARRAY',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-from-base64',
                                            label: 'BITMAP_FROM_BASE64',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-from-string',
                                            label: 'BITMAP_FROM_STRING',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-has-all',
                                            label: 'BITMAP_HAS_ALL',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-has-any',
                                            label: 'BITMAP_HAS_ANY',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-hash',
                                            label: 'BITMAP_HASH',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-hash64',
                                            label: 'BITMAP_HASH64',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-max',
                                            label: 'BITMAP_MAX',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-min',
                                            label: 'BITMAP_MIN',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-not',
                                            label: 'BITMAP_NOT',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-or',
                                            label: 'BITMAP_OR',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-or-count',
                                            label: 'BITMAP_OR_COUNT',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-remove',
                                            label: 'BITMAP_REMOVE',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-subset-in-range',
                                            label: 'BITMAP_SUBSET_IN_RANGE',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-subset-limit',
                                            label: 'BITMAP_SUBSET_LIMIT',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-to-array',
                                            label: 'BITMAP_TO_ARRAY',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-to-base64',
                                            label: 'BITMAP_TO_BASE64',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-to-string',
                                            label: 'BITMAP_TO_STRING',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-xor',
                                            label: 'BITMAP_XOR',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-xor-count',
                                            label: 'BITMAP_XOR_COUNT',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/bitmap-functions/sub-bitmap',
                                            label: 'SUB_BITMAP',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/bitmap-functions/to-bitmap',
                                            label: 'TO_BITMAP',
                                        },
                                    ],
                                },
                                {
                                    type: 'category',
                                    label: 'HLL Functions',
                                    items: [
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/hll-functions/hll-cardinality',
                                            label: 'HLL_CARDINALITY',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/hll-functions/hll-empty',
                                            label: 'HLL_EMPTY',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/hll-functions/hll-from-base64',
                                            label: 'HLL_FROM_BASE64',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/hll-functions/hll-hash',
                                            label: 'HLL_HASH',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/hll-functions/hll-to-base64',
                                            label: 'HLL_TO_BASE64',
                                        },
                                    ],
                                },
                                {
                                    type: 'category',
                                    label: 'Binary Functions',
                                    items: [
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/binary-functions/from-base64-binary',
                                            label: 'FROM_BASE64_BINARY',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/binary-functions/from_hex',
                                            label: 'FROM_HEX',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/binary-functions/sub-binary',
                                            label: 'SUB_BINARY',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/binary-functions/to-base64-binary',
                                            label: 'TO_BASE64_BINARY',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/binary-functions/to_hex',
                                            label: 'TO_HEX',
                                        },
                                    ],
                                },
                                {
                                    type: 'category',
                                    label: 'System Functions',
                                    items: [
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/system-functions/connection-id',
                                            label: 'CONNECTION_ID',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/system-functions/current-catalog',
                                            label: 'CURRENT_CATALOG',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/system-functions/current-user',
                                            label: 'CURRENT_USER',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/system-functions/database',
                                            label: 'DATABASE',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/system-functions/session-user',
                                            label: 'SESSION_USER',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/system-functions/user',
                                            label: 'USER',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/system-functions/version-function',
                                            label: 'VERSION',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/system-functions/last-query-id',
                                            label: 'LAST_QUERY_ID',
                                        },
                                    ],
                                },
                                {
                                    type: 'category',
                                    label: 'Other Functions',
                                    items: [
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/other-functions/convert-to',
                                            label: 'CONVERT_TO',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/other-functions/esquery',
                                            label: 'ESQUERY',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/other-functions/field',
                                            label: 'FIELD',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/other-functions/g',
                                            label: 'G',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/other-functions/grouping',
                                            label: 'GROUPING',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/other-functions/grouping-id',
                                            label: 'GROUPING_ID',
                                        },
                                    ],
                                },
                                {
                                    type: 'category',
                                    label: 'Quantile Functions',
                                    items: [
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/quantile-functions/quantile-percent',
                                            label: 'QUANTILE_PERCENT',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/quantile-functions/quantile-state-empty',
                                            label: 'QUANTILE_STATE_EMPTY',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/quantile-functions/to-quantile-state',
                                            label: 'TO_QUANTILE_STATE',
                                        },
                                    ],
                                },
                                {
                                    type: 'category',
                                    label: 'Conditional Functions',
                                    items: [
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/conditional-functions/coalesce',
                                            label: 'COALESCE',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/conditional-functions/greatest',
                                            label: 'GREATEST',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/conditional-functions/if',
                                            label: 'IF',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/conditional-functions/ifnull',
                                            label: 'IFNULL',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/conditional-functions/least',
                                            label: 'LEAST',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/conditional-functions/not-null-or-empty',
                                            label: 'NOT_NULL_OR_EMPTY',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/conditional-functions/null-or-empty',
                                            label: 'NULL_OR_EMPTY',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-functions/scalar-functions/conditional-functions/nullif',
                                            label: 'NULLIF',
                                        },
                                    ],
                                },
                            ],
                        },
                        {
                            type: 'category',
                            label: 'Aggregate Functions',
                            items: [
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/ai-agg',
                                    label: 'AI_AGG',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/any-value',
                                    label: 'ANY_VALUE',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/approx-count-distinct',
                                    label: 'APPROX_COUNT_DISTINCT',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/array-agg',
                                    label: 'ARRAY_AGG',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/avg',
                                    label: 'AVG',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/avg-weighted',
                                    label: 'AVG_WEIGHTED',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/bitmap-agg',
                                    label: 'BITMAP_AGG',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/bitmap-intersect',
                                    label: 'BITMAP_INTERSECT',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/bitmap-union',
                                    label: 'BITMAP_UNION',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/bitmap-union-count',
                                    label: 'BITMAP_UNION_COUNT',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/bitmap-union-int',
                                    label: 'BITMAP-UNION-INT',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/bool-and',
                                    label: 'BOOL_AND',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/bool-or',
                                    label: 'BOOL_OR',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/bool-xor',
                                    label: 'BOOL_XOR',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/collect-list',
                                    label: 'COLLECT_LIST',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/collect-set',
                                    label: 'COLLECT_SET',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/corr-welford',
                                    label: 'CORR_WELFORD',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/corr',
                                    label: 'CORR',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/count',
                                    label: 'COUNT',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/count-by-enum',
                                    label: 'COUNT_BY_ENUM',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/covar',
                                    label: 'COVAR',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/covar-samp',
                                    label: 'COVAR_SAMP',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/group-array-intersect',
                                    label: 'GROUP_ARRAY_INTERSECT',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/group-array-union',
                                    label: 'GROUP_ARRAY_UNION',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/group-bit-and',
                                    label: 'GROUP_BIT_AND',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/group-bit-or',
                                    label: 'GROUP_BIT_OR',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/group-bit-xor',
                                    label: 'GROUP_BIT_XOR',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/group-bitmap-xor',
                                    label: 'GROUP_BITMAP_XOR',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/group-concat',
                                    label: 'GROUP_CONCAT',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/histogram',
                                    label: 'HISTOGRAM',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/hll-raw-agg',
                                    label: 'HLL_RAW_AGG',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/hll-union-agg',
                                    label: 'HLL_UNION_AGG',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/intersect-count',
                                    label: 'INTERSECT_COUNT',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/kurt',
                                    label: 'KURT,KURT_POP,KURTOSIS',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/linear-histogram',
                                    label: 'LINEAR_HISTOGRAM',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/map-agg',
                                    label: 'MAP_AGG',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/max',
                                    label: 'MAX',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/max-by',
                                    label: 'MAX_BY',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/median',
                                    label: 'MEDIAN',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/min',
                                    label: 'MIN',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/min-by',
                                    label: 'MIN_BY',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/percentile',
                                    label: 'PERCENTILE',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/percentile-approx',
                                    label: 'PERCENTILE_APPROX',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/percentile-array',
                                    label: 'PERCENTILE_ARRAY',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/percentile-approx-weighted',
                                    label: 'PERCENTILE_APPROX_WEIGHTED',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/percentile_reservoir',
                                    label: 'PERCENTILE_RESERVOIR',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/quantile-union',
                                    label: 'QUANTILE_UNION',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/regr-intercept',
                                    label: 'REGR_INTERCEPT',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/regr-slope',
                                    label: 'REGR_SLOPE',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/retention',
                                    label: 'RETENTION',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/sem',
                                    label: 'SEM',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/sequence-count',
                                    label: 'SEQUENCE_COUNT',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/sequence-match',
                                    label: 'SEQUENCE_MATCH',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/skew',
                                    label: 'SKEW,SKEW_POP,SKEWNESS',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/stddev',
                                    label: 'STD,STDDEV,STDDEV_POP',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/stddev-samp',
                                    label: 'STDDEV_SAMP',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/sum',
                                    label: 'SUM',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/sum0',
                                    label: 'SUM0',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/topn',
                                    label: 'TOPN',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/topn-array',
                                    label: 'TOPN_ARRAY',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/topn-weighted',
                                    label: 'TOPN_WEIGHTED',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/var-samp',
                                    label: 'VAR_SAMP,VARIANCE_SAMP',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/variance',
                                    label: 'VARIANCE,VAR_POP,VARIANCE_POP',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/window-funnel',
                                    label: 'WINDOW_FUNNEL',
                                },
                            ],
                        },
                        {
                            type: 'category',
                            label: 'Combinators',
                            items: [
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/combinators/foreach',
                                    label: 'FOREACH',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/combinators/merge',
                                    label: 'MERGE',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/combinators/state',
                                    label: 'STATE',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/combinators/union',
                                    label: 'UNION',
                                },
                            ],
                        },
                        {
                            type: 'category',
                            label: 'Analytic (Window) Functions',
                            items: [
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/window-functions/overview',
                                    label: 'OVERVIEW',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/window-functions/cume-dist',
                                    label: 'CUME_DIST',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/window-functions/dense-rank',
                                    label: 'DENSE_RANK',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/window-functions/first-value',
                                    label: 'FIRST_VALUE',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/window-functions/lag',
                                    label: 'LAG',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/window-functions/last-value',
                                    label: 'LAST_VALUE',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/window-functions/lead',
                                    label: 'LEAD',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/window-functions/ntile',
                                    label: 'NTILE',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/window-functions/percent-rank',
                                    label: 'PERCENT_RANK',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/window-functions/rank',
                                    label: 'RANK',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/window-functions/row-number',
                                    label: 'ROW_NUMBER',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/any-value',
                                    label: 'ANY_VALUE',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/approx-count-distinct',
                                    label: 'APPROX_COUNT_DISTINCT',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/array-agg',
                                    label: 'ARRAY_AGG',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/avg',
                                    label: 'AVG',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/avg-weighted',
                                    label: 'AVG_WEIGHTED',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/bitmap-agg',
                                    label: 'BITMAP_AGG',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/bitmap-intersect',
                                    label: 'BITMAP_INTERSECT',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/bitmap-union',
                                    label: 'BITMAP_UNION',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/bitmap-union-count',
                                    label: 'BITMAP_UNION_COUNT',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/bitmap-union-int',
                                    label: 'BITMAP-UNION-INT',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/bool-and',
                                    label: 'BOOL_AND',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/bool-or',
                                    label: 'BOOL_OR',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/bool-xor',
                                    label: 'BOOL_XOR',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/collect-list',
                                    label: 'COLLECT_LIST',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/collect-set',
                                    label: 'COLLECT_SET',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/corr-welford',
                                    label: 'CORR_WELFORD',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/corr',
                                    label: 'CORR',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/count',
                                    label: 'COUNT',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/count-by-enum',
                                    label: 'COUNT_BY_ENUM',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/covar',
                                    label: 'COVAR',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/covar-samp',
                                    label: 'COVAR_SAMP',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/group-array-intersect',
                                    label: 'GROUP_ARRAY_INTERSECT',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/group-bit-and',
                                    label: 'GROUP_BIT_AND',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/group-bit-or',
                                    label: 'GROUP_BIT_OR',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/group-bit-xor',
                                    label: 'GROUP_BIT_XOR',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/group-bitmap-xor',
                                    label: 'GROUP_BITMAP_XOR',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/group-concat',
                                    label: 'GROUP_CONCAT',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/histogram',
                                    label: 'HISTOGRAM',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/hll-raw-agg',
                                    label: 'HLL_RAW_AGG',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/hll-union-agg',
                                    label: 'HLL_UNION_AGG',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/intersect-count',
                                    label: 'INTERSECT_COUNT',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/kurt',
                                    label: 'KURT,KURT_POP,KURTOSIS',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/linear-histogram',
                                    label: 'LINEAR_HISTOGRAM',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/map-agg',
                                    label: 'MAP_AGG',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/max',
                                    label: 'MAX',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/max-by',
                                    label: 'MAX_BY',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/median',
                                    label: 'MEDIAN',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/min',
                                    label: 'MIN',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/min-by',
                                    label: 'MIN_BY',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/percentile',
                                    label: 'PERCENTILE',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/percentile-approx',
                                    label: 'PERCENTILE_APPROX',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/percentile-array',
                                    label: 'PERCENTILE_ARRAY',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/percentile-approx-weighted',
                                    label: 'PERCENTILE_APPROX_WEIGHTED',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/quantile-union',
                                    label: 'QUANTILE_UNION',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/regr-intercept',
                                    label: 'REGR_INTERCEPT',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/regr-slope',
                                    label: 'REGR_SLOPE',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/retention',
                                    label: 'RETENTION',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/sequence-count',
                                    label: 'SEQUENCE_COUNT',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/sequence-match',
                                    label: 'SEQUENCE_MATCH',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/skew',
                                    label: 'SKEW,SKEW_POP,SKEWNESS',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/stddev',
                                    label: 'STD,STDDEV,STDDEV_POP',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/stddev-samp',
                                    label: 'STDDEV_SAMP',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/sum',
                                    label: 'SUM',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/sum0',
                                    label: 'SUM0',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/topn',
                                    label: 'TOPN',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/topn-array',
                                    label: 'TOPN_ARRAY',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/topn-weighted',
                                    label: 'TOPN_WEIGHTED',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/var-samp',
                                    label: 'VAR_SAMP,VARIANCE_SAMP',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/variance',
                                    label: 'VARIANCE,VAR_POP,VARIANCE_POP',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/aggregate-functions/window-funnel',
                                    label: 'WINDOW_FUNNEL',
                                },
                            ],
                        },
                        {
                            type: 'category',
                            label: 'Table Functions',
                            items: [
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/table-functions/explode',
                                    label: 'EXPLODE',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/table-functions/explode-outer',
                                    label: 'EXPLODE-OUTER',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/table-functions/explode-bitmap',
                                    label: 'EXPLODE_BITMAP',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/table-functions/explode-bitmap-outer',
                                    label: 'EXPLODE_BITMAP_OUTER',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/table-functions/explode-json-array-double',
                                    label: 'EXPLODE_JSON_ARRAY_DOUBLE',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/table-functions/explode-json-array-double-outer',
                                    label: 'EXPLODE_JSON_ARRAY_DOUBLE_OUTER',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/table-functions/explode-json-array-int',
                                    label: 'EXPLODE_JSON_ARRAY_INT',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/table-functions/explode-json-array-int-outer',
                                    label: 'EXPLODE_JSON_ARRAY_INT_OUTER',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/table-functions/explode-json-array-json',
                                    label: 'EXPLODE_JSON_ARRAY_JSON',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/table-functions/explode-json-array-json-outer',
                                    label: 'EXPLODE_JSON_ARRAY_JSON_OUTER',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/table-functions/explode-json-array-string',
                                    label: 'EXPLODE_JSON_ARRAY_STRING',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/table-functions/explode-json-array-string-outer',
                                    label: 'EXPLODE_JSON_ARRAY_STRING_OUTER',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/table-functions/explode-json-object',
                                    label: 'EXPLODE_JSON_OBJECT',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/table-functions/explode-map',
                                    label: 'EXPLODE_MAP',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/table-functions/explode-map-outer',
                                    label: 'EXPLODE_MAP_OUTER',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/table-functions/explode-numbers',
                                    label: 'EXPLODE_NUMBERS',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/table-functions/explode-numbers-outer',
                                    label: 'EXPLODE_NUMBERS_OUTER',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/table-functions/explode-split',
                                    label: 'EXPLODE_SPLIT',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/table-functions/explode-split-outer',
                                    label: 'EXPLODE_SPLIT_OUTER',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/table-functions/posexplode',
                                    label: 'POSEXPLODE',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/table-functions/posexplode-outer',
                                    label: 'POSEXPLODE_OUTER',
                                },
                            ],
                        },
                        {
                            type: 'category',
                            label: 'Table Valued Functions',
                            items: [
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/table-valued-functions/backends',
                                    label: 'BACKENDS',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/table-valued-functions/catalogs',
                                    label: 'CATALOGS',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/table-valued-functions/file',
                                    label: 'FILE',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/table-valued-functions/frontends',
                                    label: 'FRONTENDS',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/table-valued-functions/frontends_disks',
                                    label: 'FRONTENDS_DISKS',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/table-valued-functions/hdfs',
                                    label: 'LOCAL',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/table-valued-functions/http',
                                    label: 'HTTP',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/table-valued-functions/hudi-meta',
                                    label: 'HUDI_META',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/table-valued-functions/iceberg-meta',
                                    label: 'ICEBERG_META',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/table-valued-functions/jobs',
                                    label: 'JOBS',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/table-valued-functions/local',
                                    label: 'LOCAL',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/table-valued-functions/mv_infos',
                                    label: 'MV_INFOS',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/table-valued-functions/numbers',
                                    label: 'NUMBERS',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/table-valued-functions/partition-values',
                                    label: 'PARTITION_VALUES',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/table-valued-functions/partitions',
                                    label: 'PARTITIONS',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/table-valued-functions/query',
                                    label: 'QUERY',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/table-valued-functions/s3',
                                    label: 'S3',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-functions/table-valued-functions/tasks',
                                    label: 'TASKS',
                                },
                            ],
                        },
                    ],
                },
                {
                    type: 'category',
                    label: 'SQL Statements',
                    items: [
                        {
                            type: 'category',
                            label: 'Data Queries',
                            items: [
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-statements/data-query/SELECT',
                                    label: 'SELECT',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-statements/data-query/EXPLAIN',
                                    label: 'EXPLAIN',
                                },
                            ],
                        },
                        {
                            type: 'category',
                            label: 'Data Modification',
                            items: [
                                {
                                    type: 'category',
                                    label: 'DML',
                                    items: [
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/data-modification/DML/INSERT',
                                            label: 'INSERT',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/data-modification/DML/INSERT-OVERWRITE',
                                            label: 'INSERT OVERWRITE',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/data-modification/DML/SHOW-LAST-INSERT',
                                            label: 'SHOW LAST INSERT',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/data-modification/DML/UPDATE',
                                            label: 'UPDATE',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/data-modification/DML/MERGE-INTO',
                                            label: 'MERGE-INTO',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/data-modification/DML/DELETE',
                                            label: 'DELETE',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/data-modification/DML/SHOW-DELETE',
                                            label: 'SHOW DELETE',
                                        },
                                    ],
                                },
                                {
                                    type: 'category',
                                    label: 'Load and Export',
                                    items: [
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/data-modification/load-and-export/BROKER-LOAD',
                                            label: 'BROKER LOAD',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/data-modification/load-and-export/MYSQL-LOAD',
                                            label: 'MYSQL LOAD',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/data-modification/load-and-export/SHOW-LOAD',
                                            label: 'SHOW LOAD',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/data-modification/load-and-export/SHOW-STREAM-LOAD',
                                            label: 'SHOW STREAM LOAD',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/data-modification/load-and-export/SHOW-CREATE-LOAD',
                                            label: 'SHOW CREATE LOAD',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/data-modification/load-and-export/CANCEL-LOAD',
                                            label: 'CANCEL LOAD',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/data-modification/load-and-export/SHOW-LOAD-WARNINGS',
                                            label: 'SHOW LOAD WARNINGS',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/data-modification/load-and-export/CREATE-ROUTINE-LOAD',
                                            label: 'CREATE ROUTINE LOAD',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/data-modification/load-and-export/ALTER-ROUTINE-LOAD',
                                            label: 'ALTER ROUTINE LOAD',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/data-modification/load-and-export/PAUSE-ROUTINE-LOAD',
                                            label: 'PAUSE ROUTINE LOAD',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/data-modification/load-and-export/RESUME-ROUTINE-LOAD',
                                            label: 'RESUME ROUTINE LOAD',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/data-modification/load-and-export/STOP-ROUTINE-LOAD',
                                            label: 'STOP ROUTINE LOAD',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/data-modification/load-and-export/SHOW-ROUTINE-LOAD',
                                            label: 'SHOW ROUTINE LOAD',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/data-modification/load-and-export/SHOW-ROUTINE-LOAD-TASK',
                                            label: 'SHOW ROUTINE LOAD TASK',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/data-modification/load-and-export/SHOW-CREATE-ROUTINE-LOAD',
                                            label: 'SHOW CREATE ROUTINE LOAD',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/data-modification/load-and-export/CREATE-SYNC-JOB',
                                            label: 'CREATE SYNC JOB',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/data-modification/load-and-export/PAUSE-SYNC-JOB',
                                            label: 'PAUSE SYNC JOB',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/data-modification/load-and-export/RESUME-SYNC-JOB',
                                            label: 'RESUME SYNC JOB',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/data-modification/load-and-export/STOP-SYNC-JOB',
                                            label: 'STOP SYNC JOB',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/data-modification/load-and-export/SHOW-SYNC-JOB',
                                            label: 'SHOW SYNC JOB',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/data-modification/load-and-export/SYNC',
                                            label: 'SYNC',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/data-modification/load-and-export/EXPORT',
                                            label: 'EXPORT',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/data-modification/load-and-export/CANCEL-EXPORT',
                                            label: 'CANCEL EXPORT',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/data-modification/load-and-export/SHOW-EXPORT',
                                            label: 'SHOW EXPORT',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/data-modification/load-and-export/OUTFILE',
                                            label: 'OUTFILE',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/data-modification/load-and-export/CLEAN-LABEL',
                                            label: 'CLEAN LABEL',
                                        },
                                    ],
                                },
                                {
                                    type: 'category',
                                    label: 'Backup and Restore',
                                    items: [
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/data-modification/backup-and-restore/CREATE-REPOSITORY',
                                            label: 'CREATE REPOSITORY',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/data-modification/backup-and-restore/DROP-REPOSITORY',
                                            label: 'DROP REPOSITORY',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/data-modification/backup-and-restore/SHOW-CREATE-REPOSITORY',
                                            label: 'SHOW CREATE REPOSITORY',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/data-modification/backup-and-restore/SHOW-REPOSITORIES',
                                            label: 'SHOW REPOSITORIES',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/data-modification/backup-and-restore/BACKUP',
                                            label: 'BACKUP',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/data-modification/backup-and-restore/CANCEL-BACKUP',
                                            label: 'CANCEL BACKUP',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/data-modification/backup-and-restore/RESTORE',
                                            label: 'RESTORE',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/data-modification/backup-and-restore/SHOW-RESTORE',
                                            label: 'SHOW RESTORE',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/data-modification/backup-and-restore/CANCEL-RESTORE',
                                            label: 'CANCEL RESTORE',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/data-modification/backup-and-restore/SHOW-SNAPSHOT',
                                            label: 'SHOW SNAPSHOT',
                                        },
                                    ],
                                },
                            ],
                        },
                        {
                            type: 'category',
                            label: 'Account Management',
                            items: [
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-statements/account-management/CREATE-USER',
                                    label: 'CREATE USER',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-statements/account-management/ALTER-USER',
                                    label: 'ALTER USER',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-statements/account-management/DROP-USER',
                                    label: 'DROP USER',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-statements/account-management/SET-PASSWORD',
                                    label: 'SET PASSWORD',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-statements/account-management/CREATE-ROLE',
                                    label: 'CREATE ROLE',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-statements/account-management/ALTER-ROLE',
                                    label: 'ALTER ROLE',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-statements/account-management/DROP-ROLE',
                                    label: 'DROP ROLE',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-statements/account-management/SHOW-ROLES',
                                    label: 'SHOW ROLES',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-statements/account-management/GRANT-TO',
                                    label: 'GRANT TO',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-statements/account-management/REVOKE-FROM',
                                    label: 'REVOKE FROM',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-statements/account-management/SHOW-CREATE-USER',
                                    label: 'SHOW CREATE USER',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-statements/account-management/SHOW-PRIVILEGES',
                                    label: 'SHOW PRIVILEGES',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-statements/account-management/SHOW-GRANTS',
                                    label: 'SHOW GRANTS',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-statements/account-management/REFRESH-LDAP',
                                    label: 'REFRESH LDAP',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-statements/account-management/SET-LDAP_ADMIN_PASSWORD',
                                    label: 'SET LDAP_ADMIN_PASSWORD',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-statements/account-management/SET-PROPERTY',
                                    label: 'SET PROPERTY',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-statements/account-management/SHOW-PROPERTY',
                                    label: 'SHOW PROPERTY',
                                },
                            ],
                        },
                        {
                            type: 'category',
                            label: 'Session',
                            items: [
                                {
                                    type: 'category',
                                    label: 'Context',
                                    items: [
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/session/context/USE-COMPUTE-GROUP',
                                            label: 'USE COMPUTE GROUP',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/session/context/SWITCH-CATALOG',
                                            label: 'SWITCH CATALOG',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/session/context/USE-DATABASE',
                                            label: 'USE DATABASE',
                                        },
                                    ],
                                },
                                {
                                    type: 'category',
                                    label: 'Variable',
                                    items: [
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/session/variable/SET-VARIABLE',
                                            label: 'SET VARIABLE',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/session/variable/UNSET-VARIABLE',
                                            label: 'UNSET VARIABLE',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/session/variable/SHOW-VARIABLES',
                                            label: 'SHOW VARIABLES',
                                        },
                                    ],
                                },
                                {
                                    type: 'category',
                                    label: 'Query',
                                    items: [
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/session/queries/SHOW-PROCESSLIST',
                                            label: 'SHOW PROCESSLIST',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/session/queries/KILL-QUERY',
                                            label: 'KILL QUERY',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/session/queries/CLEAN-ALL-PROFILE',
                                            label: 'CLEAN ALL PROFILE',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/session/queries/SHOW-QUERY-STATS',
                                            label: 'SHOW QUERY STATS',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/session/queries/CLEAN-ALL-QUERY-STATS',
                                            label: 'CLEAN ALL QUERY STATS',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/session/queries/PLAN-REPLAYER-DUMP',
                                            label: 'PLAN REPLAYER DUMP',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/session/queries/PLAN-REPLAYER-PLAY',
                                            label: 'PLAN REPLAYER PLAY',
                                        },
                                    ],
                                },
                                {
                                    type: 'category',
                                    label: 'Connection',
                                    items: [
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/session/connection/KILL-CONNECTION',
                                            label: 'KILL CONNECTION',
                                        },
                                    ],
                                },
                            ],
                        },
                        {
                            type: 'category',
                            label: 'Transaction',
                            items: [
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-statements/transaction/BEGIN',
                                    label: 'BEGIN',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-statements/transaction/COMMIT',
                                    label: 'COMMIT',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-statements/transaction/ROLLBACK',
                                    label: 'ROLLBACK',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-statements/transaction/SHOW-TRANSACTION',
                                    label: 'SHOW TRANSACTION',
                                },
                            ],
                        },
                        {
                            type: 'category',
                            label: 'Data Catalog',
                            items: [
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-statements/catalog/CREATE-CATALOG',
                                    label: 'CREATE CATALOG',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-statements/catalog/ALTER-CATALOG',
                                    label: 'ALTER CATALOG',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-statements/catalog/DROP-CATALOG',
                                    label: 'DROP CATALOG',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-statements/catalog/SHOW-CREATE-CATALOG',
                                    label: 'SHOW CREATE CATALOG',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-statements/catalog/SHOW-CATALOG',
                                    label: 'SHOW CATALOG',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-statements/catalog/SHOW-CATALOGS',
                                    label: 'SHOW CATALOGS',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-statements/catalog/REFRESH',
                                    label: 'REFRESH',
                                },
                            ],
                        },
                        {
                            type: 'category',
                            label: 'Database',
                            items: [
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-statements/database/CREATE-DATABASE',
                                    label: 'CREATE DATABASE',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-statements/database/ALTER-DATABASE',
                                    label: 'ALTER DATABASE',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-statements/database/DROP-DATABASE',
                                    label: 'DROP DATABASE',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-statements/database/SHOW-CREATE-DATABASE',
                                    label: 'SHOW CREATE DATABASE',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-statements/database/SHOW-DATABASES',
                                    label: 'SHOW DATABASES',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-statements/database/SHOW-DATABASE-ID',
                                    label: 'SHOW DATABASE ID',
                                },
                            ],
                        },
                        {
                            type: 'category',
                            label: 'Table and Views',
                            items: [
                                {
                                    type: 'category',
                                    label: 'Table',
                                    items: [
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/table-and-view/table/CREATE-TABLE',
                                            label: 'CREATE TABLE',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/table-and-view/table/DESC-TABLE',
                                            label: 'DESCRIBE',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/table-and-view/table/ALTER-TABLE-COLUMN',
                                            label: 'ALTER TABLE COLUMN',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/table-and-view/table/ALTER-TABLE-PARTITION',
                                            label: 'ALTER TABLE PARTITION',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/table-and-view/table/ALTER-TABLE-ROLLUP',
                                            label: 'ALTER TABLE ROLLUP',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/table-and-view/table/ALTER-TABLE-RENAME',
                                            label: 'ALTER TABLE RENAME',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/table-and-view/table/ALTER-TABLE-REPLACE',
                                            label: 'ALTER TABLE REPLACE',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/table-and-view/table/ALTER-TABLE-PROPERTY',
                                            label: 'ALTER TABLE PROPERTY',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/table-and-view/table/ALTER-TABLE-COMMENT',
                                            label: 'ALTER TABLE COMMENT',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/table-and-view/table/ALTER-TABLE-ADD-GENERATED-COLUMN',
                                            label: 'ALTER TABLE ADD GENERATED COLUMN',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/table-and-view/table/CANCEL-ALTER-TABLE',
                                            label: 'CANCEL-ALTER-TABLE',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/table-and-view/table/SHOW-ALTER-TABLE',
                                            label: 'SHOW ALTER',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/table-and-view/table/TRUNCATE-TABLE',
                                            label: 'TRUNCATE-TABLE',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/table-and-view/table/DROP-TABLE',
                                            label: 'DROP-TABLE',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/table-and-view/table/SHOW-CREATE-TABLE',
                                            label: 'SHOW-CREATE-TABLE',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/table-and-view/table/SHOW-TABLES',
                                            label: 'SHOW TABLES',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/table-and-view/table/SHOW-TABLE-ID',
                                            label: 'SHOW TABLE ID',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/table-and-view/table/SHOW-TABLE-STATUS',
                                            label: 'SHOW TABLE STATUS',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/table-and-view/table/SHOW-CONVERT-LIGHT-SCHEMA-CHANGE-PROCESS',
                                            label: 'SHOW CONVERT LIGHT SCHEMA CHANGE PROCESS',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/table-and-view/table/SHOW-PARTITION',
                                            label: 'SHOW PARTITION',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/table-and-view/table/SHOW-PARTITION-ID',
                                            label: 'SHOW PARTITION ID',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/table-and-view/table/SHOW-PARTITIONS',
                                            label: 'SHOW PARTITIONS',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/table-and-view/table/SHOW-DYNAMIC-PARTITION-TABLES',
                                            label: 'SHOW DYNAMIC PARTITION TABLES',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/table-and-view/table/SHOW-COLUMNS',
                                            label: 'SHOW COLUMNS',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/table-and-view/table/ALTER-COLOCATE-GROUP',
                                            label: 'ALTER COLOCATE GROUP',
                                        },
                                    ],
                                },
                                {
                                    type: 'category',
                                    label: 'Index',
                                    items: [
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/table-and-view/index/CREATE-INDEX',
                                            label: 'CREATE INDEX',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/table-and-view/index/DROP-INDEX',
                                            label: 'DROP INDEX',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/table-and-view/index/SHOW-INDEX',
                                            label: 'SHOW INDEX',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/table-and-view/index/BUILD-INDEX',
                                            label: 'BUILD INDEX',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/table-and-view/index/CANCEL-BUILD-INDEX',
                                            label: 'CANCEL BUILD INDEX',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/table-and-view/index/SHOW-BUILD-INDEX',
                                            label: 'SHOW BUILD INDEX',
                                        },
                                    ],
                                },
                                {
                                    type: 'category',
                                    label: 'View',
                                    items: [
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/table-and-view/view/CREATE-VIEW',
                                            label: 'CREATE VIEW',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/table-and-view/view/ALTER-VIEW',
                                            label: 'ALTER VIEW',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/table-and-view/view/DROP-VIEW',
                                            label: 'DROP VIEW',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/table-and-view/view/SHOW-CREATE-VIEW',
                                            label: 'SHOW CREATE VIEW',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/table-and-view/view/SHOW-VIEW',
                                            label: 'SHOW VIEW',
                                        },
                                    ],
                                },
                                {
                                    type: 'category',
                                    label: 'Synchronous Materialized View',
                                    items: [
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/table-and-view/sync-materialized-view/CREATE-MATERIALIZED-VIEW',
                                            label: 'CREATE SYNC MATERIALIZED VIEW',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/table-and-view/sync-materialized-view/DROP-MATERIALIZED-VIEW',
                                            label: 'DROP MATERIALIZED VIEW',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/table-and-view/sync-materialized-view/SHOW-ALTER-TABLE-MATERIALIZED-VIEW',
                                            label: 'SHOW ALTER TABLE MATERIALIZED VIEW',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/table-and-view/sync-materialized-view/SHOW-CREATE-MATERIALIZED-VIEW',
                                            label: 'SHOW CREATE SYNC MATERIALIZED VIEW',
                                        },
                                    ],
                                },
                                {
                                    type: 'category',
                                    label: 'Asynchronous Materialized View',
                                    items: [
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/table-and-view/async-materialized-view/ALTER-ASYNC-MATERIALIZED-VIEW',
                                            label: 'ALTER ASYNC MATERIALIZED VIEW',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/table-and-view/async-materialized-view/CANCEL-MATERIALIZED-VIEW-TASK',
                                            label: 'CANCEL MATERIALIZED VIEW TASK',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/table-and-view/async-materialized-view/CREATE-ASYNC-MATERIALIZED-VIEW',
                                            label: 'CREATE ASYNC MATERIALIZED VIEW',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/table-and-view/async-materialized-view/PAUSE-MATERIALIZED-VIEW-JOB',
                                            label: 'PAUSE MATERIALIZED VIEW JOB',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/table-and-view/async-materialized-view/DROP-ASYNC-MATERIALIZED-VIEW',
                                            label: 'DROP ASYNC MATERIALIZED VIEW',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/table-and-view/async-materialized-view/REFRESH-MATERIALIZED-VIEW',
                                            label: 'REFRESH MATERIALIZED VIEW',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/table-and-view/async-materialized-view/RESUME-MATERIALIZED-VIEW-JOB',
                                            label: 'RESUME MATERIALIZED VIEW',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/table-and-view/async-materialized-view/SHOW-CREATE-ASYNC-MATERIALIZED-VIEW',
                                            label: 'SHOW CREATE ASYNC MATERIALIZED VIEW',
                                        },
                                    ],
                                },
                                {
                                    type: 'category',
                                    label: 'Data and Status Management',
                                    items: [
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/table-and-view/data-and-status-management/REBALANCE-DISK',
                                            label: 'REBALANCE DISK',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/table-and-view/data-and-status-management/CANCEL-REBALANCE-DISK',
                                            label: 'CANCEL REBALANCE DISK',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/table-and-view/data-and-status-management/SHOW-DATA',
                                            label: 'SHOW DATA',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/table-and-view/data-and-status-management/SHOW-DATA-SKEW',
                                            label: 'SHOW DATA SKEW',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/table-and-view/data-and-status-management/COMPACT-TABLE',
                                            label: 'COMPACT TABLE',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/table-and-view/data-and-status-management/REPAIR-TABLE',
                                            label: 'REPAIR TABLE',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/table-and-view/data-and-status-management/CANCEL-REPAIR-TABLE',
                                            label: 'CANCEL REPAIR TABLE',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/table-and-view/data-and-status-management/SET-TABLE-STATUS',
                                            label: 'SET TABLE STATUS',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/table-and-view/data-and-status-management/SET-TABLE-PARTITION-VERSION',
                                            label: 'SET TABLE PARTITION VERSION',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/table-and-view/data-and-status-management/DIAGNOSE-TABLET',
                                            label: 'DIAGNOSE TABLET',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/table-and-view/data-and-status-management/ADMIN-COPY-TABLET',
                                            label: 'ADMIN COPY TABLET',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/table-and-view/data-and-status-management/ADMIN-CHECK-TABLET',
                                            label: 'ADMIN CHECK TABLET',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/table-and-view/data-and-status-management/SHOW-TABLET',
                                            label: 'SHOW TABLET',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/table-and-view/data-and-status-management/SHOW-TABLETS-BELONG',
                                            label: 'SHOW TABLETS BELONG',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/table-and-view/data-and-status-management/SHOW-TABLET-STORAGE-FORMAT',
                                            label: 'SHOW TABLET STORAGE FORMAT',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/table-and-view/data-and-status-management/SHOW-TABLET-DIAGNOSIS',
                                            label: 'SHOW TABLET DIAGNOSIS',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/table-and-view/data-and-status-management/ADMIN-SET-REPLICA-STATUS',
                                            label: 'ADMIN SET REPLICA STATUS',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/table-and-view/data-and-status-management/ADMIN-SET-REPLICA-VERSION',
                                            label: 'ADMIN SET REPLICA VERSION',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/table-and-view/data-and-status-management/SHOW-REPLICA-STATUS',
                                            label: 'SHOW REPLICA STATUS',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/table-and-view/data-and-status-management/SHOW-REPLICA-DISTRIBUTION',
                                            label: 'SHOW REPLICA DISTRIBUTION',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/table-and-view/data-and-status-management/CLEAN-TRASH',
                                            label: 'ADMIN CLEAN TRASH',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/table-and-view/data-and-status-management/SHOW-TRASH',
                                            label: 'SHOW TRASH',
                                        },
                                    ],
                                },
                            ],
                        },
                        {
                            type: 'category',
                            label: 'Recycle',
                            items: [
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-statements/recycle/SHOW-CATALOG-RECYCLE-BIN',
                                    label: 'SHOW CATALOG RECYCLE BIN',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-statements/recycle/DROP-CATALOG-RECYCLE-BIN',
                                    label: 'DROP CATALOG RECYCLE BIN',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-statements/recycle/RECOVER',
                                    label: 'RECOVER',
                                },
                            ],
                        },
                        {
                            type: 'category',
                            label: 'Function',
                            items: [
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-statements/function/CREATE-FUNCTION',
                                    label: 'CREATE FUNCTION',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-statements/function/DROP-FUNCTION',
                                    label: 'DROP FUNCTION',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-statements/function/SHOW-CREATE-FUNCTION',
                                    label: 'SHOW CREATE FUNCTION',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-statements/function/DESC-FUNCTION',
                                    label: 'DESC FUNCTION',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-statements/function/SHOW-FUNCTIONS',
                                    label: 'SHOW FUNCTIONS',
                                },
                            ],
                        },
                        {
                            type: 'category',
                            label: 'Statistics',
                            items: [
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-statements/statistics/ANALYZE',
                                    label: 'ANALYZE',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-statements/statistics/ALTER-STATS',
                                    label: 'ALTER STATS',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-statements/statistics/DROP-STATS',
                                    label: 'DROP STATS',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-statements/statistics/SHOW-TABLE-STATS',
                                    label: 'SHOW TABLE STATS',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-statements/statistics/SHOW-STATS',
                                    label: 'SHOW COLUMN STATS',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-statements/statistics/DROP-ANALYZE-JOB',
                                    label: 'DROP ANALYZE JOB',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-statements/statistics/KILL-ANALYZE-JOB',
                                    label: 'KILL ANALYZE JOB',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-statements/statistics/SHOW-ANALYZE',
                                    label: 'SHOW ANALYZE',
                                },
                            ],
                        },
                        {
                            type: 'category',
                            label: 'Cluster Management',
                            items: [
                                {
                                    type: 'category',
                                    label: 'Instance Management',
                                    items: [
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/cluster-management/instance-management/ADD-FOLLOWER',
                                            label: 'ADD FOLLOWER',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/cluster-management/instance-management/DROP-FOLLOWER',
                                            label: 'DROP FOLLOWER',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/cluster-management/instance-management/ADD-OBSERVER',
                                            label: 'ADD OBSERVER',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/cluster-management/instance-management/DROP-OBSERVER',
                                            label: 'DROP OBSERVER',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/cluster-management/instance-management/SET-FRONTEND-CONFIG',
                                            label: 'SET FRONTEND CONFIG',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/cluster-management/instance-management/SHOW-FRONTEND-CONFIG',
                                            label: 'SHOW FRONTEND CONFIG',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/cluster-management/instance-management/MODIFY-FRONTEND-HOSTNAME',
                                            label: 'MODIFY FRONTEND HOSTNAME',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/cluster-management/instance-management/SHOW-FRONTENDS',
                                            label: 'SHOW FRONTENDS',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/cluster-management/instance-management/SHOW-FRONTENDS-DISKS',
                                            label: 'SHOW FRONTENDS DISKS',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/cluster-management/instance-management/ADD-BACKEND',
                                            label: 'ADD BACKEND',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/cluster-management/instance-management/DROP-BACKEND',
                                            label: 'DROP BACKEND',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/cluster-management/instance-management/MODIFY-BACKEND',
                                            label: 'MODIFY BACKEND',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/cluster-management/instance-management/SHOW-BACKENDS',
                                            label: 'SHOW BACKENDS',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/cluster-management/instance-management/SHOW-BACKEND-CONFIG',
                                            label: 'SHOW BACKEND CONFIG',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/cluster-management/instance-management/DECOMMISSION-BACKEND',
                                            label: 'DECOMMISSION BACKEND',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/cluster-management/instance-management/CANCEL-DECOMMISSION-BACKEND',
                                            label: 'CANCEL DECOMMISSION BACKEND',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/cluster-management/instance-management/ADD-BROKER',
                                            label: 'ADD BROKER',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/cluster-management/instance-management/DROP-BROKER',
                                            label: 'DROP BROKER',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/cluster-management/instance-management/SHOW-BROKER',
                                            label: 'SHOW BROKER',
                                        },
                                    ],
                                },
                                {
                                    type: 'category',
                                    label: 'Compute Management',
                                    items: [
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/cluster-management/compute-management/CREATE-RESOURCE',
                                            label: 'CREATE RESOURCE',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/cluster-management/compute-management/ALTER-RESOURCE',
                                            label: 'ALTER RESOURCE',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/cluster-management/compute-management/DROP-RESOURCE',
                                            label: 'DROP RESOURCE',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/cluster-management/compute-management/SHOW-RESOURCES',
                                            label: 'SHOW RESOURCES',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/cluster-management/compute-management/CREATE-WORKLOAD-GROUP',
                                            label: 'CREATE WORKLOAD GROUP',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/cluster-management/compute-management/ALTER-WORKLOAD-GROUP',
                                            label: 'ALTER WORKLOAD GROUP',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/cluster-management/compute-management/DROP-WORKLOAD-GROUP',
                                            label: 'DROP WORKLOAD GROUP',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/cluster-management/compute-management/SHOW-WORKLOAD-GROUPS',
                                            label: 'SHOW WORKLOAD GROUPS',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/cluster-management/compute-management/CREATE-WORKLOAD-POLICY',
                                            label: 'CREATE WORKLOAD GROUP',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/cluster-management/compute-management/ALTER-WORKLOAD-POLICY',
                                            label: 'ALTER WORKLOAD POLICY',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/cluster-management/compute-management/DROP-WORKLOAD-POLICY',
                                            label: 'DROP WORKLOAD POLICY',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/cluster-management/compute-management/SHOW-COMPUTE-GROUPS',
                                            label: 'SHOW COMPUTE GROUPS',
                                        },
                                    ],
                                },
                                {
                                    type: 'category',
                                    label: 'Storage Management',
                                    items: [
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/cluster-management/storage-management/CREATE-STORAGE-VAULT',
                                            label: 'CREATE-STORAGE-VAULT',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/cluster-management/storage-management/ALTER-STORAGE-VAULT',
                                            label: 'ALTER STORAGE VAULT',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/cluster-management/storage-management/SET-DEFAULT-STORAGE-VAULT',
                                            label: 'SET DEFAULT STORAGE VAULT',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/cluster-management/storage-management/UNSET-DEFAULT-STORAGE-VAULT',
                                            label: 'UNSET DEFAULT STORAGE VAULT',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/cluster-management/storage-management/SHOW-STORAGE-VAULTS',
                                            label: 'SHOW STORAGE VAULTS',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/cluster-management/storage-management/CREATE-STORAGE-POLICY',
                                            label: 'CREATE STORAGE POLICY',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/cluster-management/storage-management/ALTER-STORAGE-POLICY',
                                            label: 'ALTER STORAGE POLICY',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/cluster-management/storage-management/DROP-STORAGE-POLICY',
                                            label: 'DROP STORAGE POLICY',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/cluster-management/storage-management/SHOW-STORAGE-POLICY',
                                            label: 'SHOW STORAGE POLICY',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/cluster-management/storage-management/WARM-UP',
                                            label: 'WARM UP',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/cluster-management/storage-management/CANCEL-WARM-UP',
                                            label: 'CANCEL WARM UP',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/cluster-management/storage-management/SHOW-WARM-UP-JOB',
                                            label: 'SHOW WARM UP JOB',
                                        },
                                        {
                                            type: 'doc',
                                            id: 'sql-manual/sql-statements/cluster-management/storage-management/SHOW-CACHE-HOTSPOT',
                                            label: 'SHOW CACHE HOTSPOT',
                                        },
                                    ],
                                },
                            ],
                        },
                        {
                            type: 'category',
                            label: 'Security',
                            items: [
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-statements/security/CREATE-FILE',
                                    label: 'CREATE FILE',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-statements/security/DROP-FILE',
                                    label: 'DROP FILE',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-statements/security/SHOW-FILE',
                                    label: 'SHOW FILE',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-statements/security/CREATE-ENCRYPTKEY',
                                    label: 'CREATE ENCRYPTKEY',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-statements/security/DROP-ENCRYPTKEY',
                                    label: 'DROP ENCRYPTKEY',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-statements/security/SHOW-ENCRYPTKEY',
                                    label: 'SHOW ENCRYPTKEY',
                                },
                            ],
                        },
                        {
                            type: 'category',
                            label: 'Data Governance',
                            items: [
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-statements/data-governance/CREATE-SQL_BLOCK_RULE',
                                    label: 'CREATE SQL_BLOCK_RULE',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-statements/data-governance/ALTER-SQL_BLOCK_RULE',
                                    label: 'ALTER SQL_BLOCK_RULE',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-statements/data-governance/DROP-SQL_BLOCK_RULE',
                                    label: 'DROP SQL_BLOCK_RULE',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-statements/data-governance/SHOW-SQL_BLOCK_RULE',
                                    label: 'SHOW SQL_BLOCK_RULE',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-statements/data-governance/CREATE-ROW-POLICY',
                                    label: 'CREATE ROW POLICY',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-statements/data-governance/DROP-ROW-POLICY',
                                    label: 'DROP ROW POLICY',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-statements/data-governance/SHOW-ROW-POLICY',
                                    label: 'SHOW ROW POLICY',
                                },
                            ],
                        },
                        {
                            type: 'category',
                            label: 'Job',
                            items: [
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-statements/job/CREATE-JOB',
                                    label: 'CREATE JOB',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-statements/job/CREATE-STREAMING-JOB',
                                    label: 'CREATE STREAMING JOB',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-statements/job/ALTER-JOB',
                                    label: 'ALTER JOB',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-statements/job/PAUSE-JOB',
                                    label: 'PAUSE JOB',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-statements/job/DROP-JOB',
                                    label: 'DROP JOB',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-statements/job/RESUME-JOB',
                                    label: 'RESUME JOB',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-statements/job/CANCEL-TASK',
                                    label: 'CANCEL TASK',
                                },
                            ],
                        },
                        {
                            type: 'category',
                            label: 'Plugin',
                            items: [
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-statements/plugin/INSTALL-PLUGIN',
                                    label: 'INSTALL PLUGIN',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-statements/plugin/UNINSTALL-PLUGIN',
                                    label: 'UNINSTALL PLUGIN',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-statements/plugin/SHOW-PLUGINS',
                                    label: 'SHOW PLUGINS',
                                },
                            ],
                        },
                        {
                            type: 'category',
                            label: 'Character Set',
                            items: [
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-statements/character-set/SHOW-COLLATION',
                                    label: 'SHOW COLLATION',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-statements/character-set/SHOW-CHARSET',
                                    label: 'SHOW CHARSET',
                                },
                            ],
                        },
                        {
                            type: 'category',
                            label: 'Types',
                            items: [
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-statements/types/SHOW-DATA-TYPES',
                                    label: 'SHOW DATA TYPES',
                                },
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-statements/types/SHOW-TYPECAST',
                                    label: 'SHOW TYPECAST',
                                },
                            ],
                        },
                        {
                            type: 'category',
                            label: 'Info System and Help',
                            items: [
                                {
                                    type: 'doc',
                                    id: 'sql-manual/sql-statements/system-info-and-help/SHOW-PROC',
                                    label: 'SHOW PROC',
                                },
                            ],
                        },
                    ],
                },
            ],
        },
        {
            type: 'category',
            label: 'Releases',
            collapsed: false,
            items: [
                {
                    type: 'doc',
                    id: 'releasenotes/all-release',
                    label: 'All Releases',
                },
                {
                    type: 'category',
                    label: 'v4.0',
                    items: [
                        {
                            type: 'doc',
                            id: 'releasenotes/v4.0/release-4.0.2',
                            label: 'Release 4.0.2',
                        },
                        {
                            type: 'doc',
                            id: 'releasenotes/v4.0/release-4.0.1',
                            label: 'Release 4.0.1',
                        },
                        {
                            type: 'doc',
                            id: 'releasenotes/v4.0/release-4.0.0',
                            label: 'Release 4.0.0',
                        },
                    ],
                },
                {
                    type: 'category',
                    label: 'v3.1',
                    items: [
                        {
                            type: 'doc',
                            id: 'releasenotes/v3.1/release-3.1.3',
                            label: 'Release 3.1.3',
                        },
                        {
                            type: 'doc',
                            id: 'releasenotes/v3.1/release-3.1.2',
                            label: 'Release 3.1.2',
                        },
                        {
                            type: 'doc',
                            id: 'releasenotes/v3.1/release-3.1.1',
                            label: 'Release 3.1.1',
                        },
                        {
                            type: 'doc',
                            id: 'releasenotes/v3.1/release-3.1.0',
                            label: 'Release 3.1.0',
                        },
                    ],
                },
                {
                    type: 'category',
                    label: 'v3.0',
                    items: [
                        {
                            type: 'doc',
                            id: 'releasenotes/v3.0/release-3.0.8',
                            label: 'Release 3.0.8',
                        },
                        {
                            type: 'doc',
                            id: 'releasenotes/v3.0/release-3.0.7',
                            label: 'Release 3.0.7',
                        },
                        {
                            type: 'doc',
                            id: 'releasenotes/v3.0/release-3.0.6',
                            label: 'Release 3.0.6',
                        },
                        {
                            type: 'doc',
                            id: 'releasenotes/v3.0/release-3.0.5',
                            label: 'Release 3.0.5',
                        },
                        {
                            type: 'doc',
                            id: 'releasenotes/v3.0/release-3.0.4',
                            label: 'Release 3.0.4',
                        },
                        {
                            type: 'doc',
                            id: 'releasenotes/v3.0/release-3.0.3',
                            label: 'Release 3.0.3',
                        },
                        {
                            type: 'doc',
                            id: 'releasenotes/v3.0/release-3.0.2',
                            label: 'Release 3.0.2',
                        },
                        {
                            type: 'doc',
                            id: 'releasenotes/v3.0/release-3.0.1',
                            label: 'Release 3.0.1',
                        },
                        {
                            type: 'doc',
                            id: 'releasenotes/v3.0/release-3.0.0',
                            label: 'Release 3.0.0',
                        },
                    ],
                },
                {
                    type: 'category',
                    label: 'v2.1',
                    items: [
                        {
                            type: 'doc',
                            id: 'releasenotes/v2.1/release-2.1.11',
                            label: 'Release 2.1.11',
                        },
                        {
                            type: 'doc',
                            id: 'releasenotes/v2.1/release-2.1.10',
                            label: 'Release 2.1.10',
                        },
                        {
                            type: 'doc',
                            id: 'releasenotes/v2.1/release-2.1.9',
                            label: 'Release 2.1.9',
                        },
                        {
                            type: 'doc',
                            id: 'releasenotes/v2.1/release-2.1.8',
                            label: 'Release 2.1.8',
                        },
                        {
                            type: 'doc',
                            id: 'releasenotes/v2.1/release-2.1.7',
                            label: 'Release 2.1.7',
                        },
                        {
                            type: 'doc',
                            id: 'releasenotes/v2.1/release-2.1.6',
                            label: 'Release 2.1.6',
                        },
                        {
                            type: 'doc',
                            id: 'releasenotes/v2.1/release-2.1.5',
                            label: 'Release 2.1.5',
                        },
                        {
                            type: 'doc',
                            id: 'releasenotes/v2.1/release-2.1.4',
                            label: 'Release 2.1.4',
                        },
                        {
                            type: 'doc',
                            id: 'releasenotes/v2.1/release-2.1.3',
                            label: 'Release 2.1.3',
                        },
                        {
                            type: 'doc',
                            id: 'releasenotes/v2.1/release-2.1.2',
                            label: 'Release 2.1.2',
                        },
                        {
                            type: 'doc',
                            id: 'releasenotes/v2.1/release-2.1.1',
                            label: 'Release 2.1.1',
                        },
                        {
                            type: 'doc',
                            id: 'releasenotes/v2.1/release-2.1.0',
                            label: 'Release 2.1.0',
                        },
                    ],
                },
                {
                    type: 'category',
                    label: 'v2.0',
                    items: [
                        {
                            type: 'doc',
                            id: 'releasenotes/v2.0/release-2.0.15',
                            label: 'Release 2.0.15',
                        },
                        {
                            type: 'doc',
                            id: 'releasenotes/v2.0/release-2.0.14',
                            label: 'Release 2.0.14',
                        },
                        {
                            type: 'doc',
                            id: 'releasenotes/v2.0/release-2.0.13',
                            label: 'Release 2.0.13',
                        },
                        {
                            type: 'doc',
                            id: 'releasenotes/v2.0/release-2.0.12',
                            label: 'Release 2.0.12',
                        },
                        {
                            type: 'doc',
                            id: 'releasenotes/v2.0/release-2.0.11',
                            label: 'Release 2.0.11',
                        },
                        {
                            type: 'doc',
                            id: 'releasenotes/v2.0/release-2.0.10',
                            label: 'Release 2.0.10',
                        },
                        {
                            type: 'doc',
                            id: 'releasenotes/v2.0/release-2.0.9',
                            label: 'Release 2.0.9',
                        },
                        {
                            type: 'doc',
                            id: 'releasenotes/v2.0/release-2.0.8',
                            label: 'Release 2.0.8',
                        },
                        {
                            type: 'doc',
                            id: 'releasenotes/v2.0/release-2.0.7',
                            label: 'Release 2.0.7',
                        },
                        {
                            type: 'doc',
                            id: 'releasenotes/v2.0/release-2.0.6',
                            label: 'Release 2.0.6',
                        },
                        {
                            type: 'doc',
                            id: 'releasenotes/v2.0/release-2.0.5',
                            label: 'Release 2.0.5',
                        },
                        {
                            type: 'doc',
                            id: 'releasenotes/v2.0/release-2.0.4',
                            label: 'Release 2.0.4',
                        },
                        {
                            type: 'doc',
                            id: 'releasenotes/v2.0/release-2.0.3',
                            label: 'Release 2.0.3',
                        },
                        {
                            type: 'doc',
                            id: 'releasenotes/v2.0/release-2.0.2',
                            label: 'Release 2.0.2',
                        },
                        {
                            type: 'doc',
                            id: 'releasenotes/v2.0/release-2.0.1',
                            label: 'Release 2.0.1',
                        },
                        {
                            type: 'doc',
                            id: 'releasenotes/v2.0/release-2.0.0',
                            label: 'Release 2.0.0',
                        },
                    ],
                },
                {
                    type: 'category',
                    label: 'v1.2',
                    items: [
                        {
                            type: 'doc',
                            id: 'releasenotes/v1.2/release-1.2.8',
                            label: 'Release 1.2.8',
                        },
                        {
                            type: 'doc',
                            id: 'releasenotes/v1.2/release-1.2.7',
                            label: 'Release 1.2.7',
                        },
                        {
                            type: 'doc',
                            id: 'releasenotes/v1.2/release-1.2.6',
                            label: 'Release 1.2.6',
                        },
                        {
                            type: 'doc',
                            id: 'releasenotes/v1.2/release-1.2.5',
                            label: 'Release 1.2.5',
                        },
                        {
                            type: 'doc',
                            id: 'releasenotes/v1.2/release-1.2.4',
                            label: 'Release 1.2.4',
                        },
                        {
                            type: 'doc',
                            id: 'releasenotes/v1.2/release-1.2.3',
                            label: 'Release 1.2.3',
                        },
                        {
                            type: 'doc',
                            id: 'releasenotes/v1.2/release-1.2.2',
                            label: 'Release 1.2.2',
                        },
                        {
                            type: 'doc',
                            id: 'releasenotes/v1.2/release-1.2.1',
                            label: 'Release 1.2.1',
                        },
                        {
                            type: 'doc',
                            id: 'releasenotes/v1.2/release-1.2.0',
                            label: 'Release 1.2.0',
                        },
                    ],
                },
                {
                    type: 'category',
                    label: 'v1.1',
                    items: [
                        {
                            type: 'doc',
                            id: 'releasenotes/v1.1/release-1.1.5',
                            label: 'Release 1.1.5',
                        },
                        {
                            type: 'doc',
                            id: 'releasenotes/v1.1/release-1.1.4',
                            label: 'Release 1.1.4',
                        },
                        {
                            type: 'doc',
                            id: 'releasenotes/v1.1/release-1.1.3',
                            label: 'Release 1.1.3',
                        },
                        {
                            type: 'doc',
                            id: 'releasenotes/v1.1/release-1.1.2',
                            label: 'Release 1.1.2',
                        },
                        {
                            type: 'doc',
                            id: 'releasenotes/v1.1/release-1.1.1',
                            label: 'Release 1.1.1',
                        },
                        {
                            type: 'doc',
                            id: 'releasenotes/v1.1/release-1.1.0',
                            label: 'Release 1.1.0',
                        },
                    ],
                },
            ],
        },
    ],
};

export default sidebars;
