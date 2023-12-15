import React from 'react';
import EcomsystemLayout from '@site/src/components/ecomsystem/ecomsystem-layout/ecomsystem-layout';
import EcomsystemItem from '@site/src/components/ecomsystem/ecomsystem-item/ecomsystem-item';
import ExternalLink from '@site/src/components/external-link/external-link';
import '../index.scss';

export default function Connectors() {
    return (
        <EcomsystemLayout>
            <div className="container mx-auto flex flex-col flex-wrap items-center justify-center mb-[5.5rem] lg:flex-row">
                <EcomsystemItem
                    title="Flink Doris Connector"
                    description="Read, insert, modify and delete data stored in Doris through Flink."
                    characteristic={[
                        'Support reading and writing via DataStream and SQL',
                        'Ensure exactly-once semantics in data ingestion',
                        'Support data updates and deletions for Doris Unique table',
                        'Implements multi-table and entire database data synchronization for MySQL, PostgreSQL, Oracle and other databases through Flink CDC',
                    ]}
                    rightContent={<img src={require(`@site/static/images/ecomsystem/flink.png`).default} alt="" />}
                    moreLink={
                        <>
                            <ExternalLink
                                href="https://github.com/apache/doris-flink-connector"
                                label="Download"
                            ></ExternalLink>
                            <ExternalLink
                                href="https://doris.apache.org/docs/ecosystem/flink-doris-connector"
                                className="sub-btn"
                                label="Docs"
                            ></ExternalLink>
                        </>
                    }
                />
                <EcomsystemItem
                    title="Spark Doris Connector"
                    description="Read data stored in Doris and write data to Doris through Spark."
                    characteristic={[
                        'Access Doris by SparkSQL, DataFrame, RDD, PySpark',
                        'Support distributed reading data from Doris at scale',
                    ]}
                    rightContent={<img src={require(`@site/static/images/ecomsystem/spark.png`).default} alt="" />}
                    moreLink={
                        <>
                            <ExternalLink
                                href="https://github.com/apache/doris-spark-connector"
                                label="Download"
                            ></ExternalLink>
                            <ExternalLink
                                href="https://doris.apache.org/docs/ecosystem/spark-doris-connector"
                                className="sub-btn"
                                label="Docs"
                            ></ExternalLink>
                        </>
                    }
                />
                <EcomsystemItem
                    title="dbt Doris Adapter"
                    description="An Extract, Load, Transform (ELT) component."
                    characteristic={[
                        'Dedicated to data transforming in ELT. ',
                        'Support three materialization methods: View, Table and Incremental',
                    ]}
                    rightContent={<img src={require(`@site/static/images/ecomsystem/dbt.png`).default} alt="" />}
                    moreLink={
                        <>
                            <ExternalLink href="https://github.com/selectdb/dbt-doris" label="Download"></ExternalLink>
                            <ExternalLink
                                href="https://doris.apache.org/docs/ecosystem/spark-doris-connector"
                                className="sub-btn"
                                label="Docs"
                            ></ExternalLink>
                        </>
                    }
                />
            </div>
        </EcomsystemLayout>
    );
}
