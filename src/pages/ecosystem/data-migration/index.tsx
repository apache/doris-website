import React,{useState} from 'react';
import EcomsystemLayout from '@site/src/components/ecomsystem/ecomsystem-layout/ecomsystem-layout';
import ExternalLink from '@site/src/components/external-link/external-link';
import CollapseBox from '@site/src/components/collapse-box/collapse-box';
import '../index.scss';
import { ExternalLinkArrowIcon } from '@site/src/components/Icons/external-link-arrow-icon';

export default function DistributionsAndPackaging() {
    const [flag,setFlag] = useState(true)
    return (
        <EcomsystemLayout>
            <div className="container mx-auto flex flex-col flex-wrap items-center justify-center mb-[5.5rem] lg:flex-row">
                <CollapseBox
                    title="SQL Convertor for Apache Doris"
                    popTrue={flag}
                    description="A SQL convertor that seamless switches multiple SQL dialects to Doris."
                    characteristic={[
                        'Support multi-data sources, including Presto, Trino, Hive, PostgreSQL, Spark, Oracle, ClickHouse and more.',
                        'Visualization and ease-to-use',
                        'Text or File convert',
                    ]}
                    rightContent={
                        <img src={require(`@site/static/images/ecomsystem/sql-convertor.png`).default} alt="" />
                    }
                    moreLink={
                        <>
                            <ExternalLink
                                href="https://www.selectdb.com/download/tools#sql-convertor"
                                label="Download"
                                linkIcon={<ExternalLinkArrowIcon />}
                            ></ExternalLink>

                            <ExternalLink
                                href="https://doris.apache.org/docs/lakehouse/sql-dialect"
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
