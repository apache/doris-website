import React,{useState} from 'react';
import EcomsystemLayout from '@site/src/components/ecomsystem/ecomsystem-layout/ecomsystem-layout';
import ExternalLink from '@site/src/components/external-link/external-link';
import CollapseBox from '@site/src/components/collapse-box/collapse-box';
import '../index.scss';
import { ExternalLinkArrowIcon } from '@site/src/components/Icons/external-link-arrow-icon';

export default function Connectors() {
    const [flag,setFlag] = useState(true)
    return (
        <EcomsystemLayout>
            <div className="container mx-auto flex flex-col flex-wrap items-center justify-center mb-[5.5rem] lg:flex-row">
                <CollapseBox
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
                                href="https://github.com/apache/doris-flink-connector/releases"
                                label="Download"
                                linkIcon={<ExternalLinkArrowIcon />}
                            ></ExternalLink>
                            <ExternalLink
                                href="https://doris.apache.org/docs/ecosystem/flink-doris-connector"
                                className="sub-btn"
                                label="Docs"
                                linkIcon={<ExternalLinkArrowIcon />}
                            ></ExternalLink>
                        </>
                    }
                />
                <CollapseBox
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
                                href="https://github.com/apache/doris-spark-connector/releases"
                                label="Download"
                                linkIcon={<ExternalLinkArrowIcon />}
                            ></ExternalLink>

                            <ExternalLink
                                href="https://doris.apache.org/docs/ecosystem/spark-doris-connector"
                                className="sub-btn"
                                label="Docs"
                                linkIcon={<ExternalLinkArrowIcon />}
                            ></ExternalLink>
                        </>
                    }
                />
                <CollapseBox
                    title="Kafka Doris Connector"
                    description="A scalable and reliable tool for data transmission between Kafka and other systems."
                    characteristic={[
                        'Support both standalone and distributed deployment',
                        'Support connecting to SSL-authenticated Kafka clusters',
                        'Support writing failed or erroneous messages to dead-letter queues',
                        'Support connector monitoring via JMX',
                    ]}
                    rightContent={<img src={require(`@site/static/images/ecomsystem/kafka.png`).default} alt="" />}
                    moreLink={
                        <>
                            <ExternalLink
                                href="http://localhost:3000/download#doris-ecosystem"
                                label="Download"
                                linkIcon={<ExternalLinkArrowIcon />}
                            ></ExternalLink>

                            <ExternalLink
                                href="https://doris.apache.org/docs/ecosystem/doris-kafka-connector"
                                className="sub-btn"
                                label="Docs"
                                linkIcon={<ExternalLinkArrowIcon />}
                            ></ExternalLink>
                        </>
                    }
                />
                <CollapseBox
                    title="dbt Doris Adapter"
                    popTrue={flag}
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
                                href="https://doris.apache.org/docs/ecosystem/dbt-doris-adapter"
                                className="sub-btn"
                                label="Docs"
                                linkIcon={<ExternalLinkArrowIcon />}
                            ></ExternalLink>
                        </>
                    }
                />
            </div>
        </EcomsystemLayout>
    );
}
