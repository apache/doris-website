import { useLocation } from '@docusaurus/router';
import React, { useState } from 'react';
import { EcomsystemCategoryEnum } from '../ecomsystem.data';
import { ClusterManagementIcon } from './components/icons/cluster-management-icon';
import { DataMigrationIcon } from './components/icons/data-migration-icon';
import { ConnectorsIcon } from './components/icons/connectors-icon';
import { DistributionsAndPackagingIcon } from './components/icons/distributions-packaging-icon';
import { DataLoadingIcon } from './components/icons/data-loading';

import { TabItem } from './components/tab-item';

export default function EcomsystemCategory() {
    const location = useLocation();
    const pathnames = location.pathname.split('/');
    let currentActive: EcomsystemCategoryEnum = EcomsystemCategoryEnum.ClusterManagement;

    if (pathnames.some(current => current === EcomsystemCategoryEnum.ClusterManagement)) {
        currentActive = EcomsystemCategoryEnum.ClusterManagement;
    } else if (pathnames.some(current => current === EcomsystemCategoryEnum.Connectors)) {
        currentActive = EcomsystemCategoryEnum.Connectors;
    } else if (pathnames.some(current => current === EcomsystemCategoryEnum.DataLoading)){
        currentActive = EcomsystemCategoryEnum.DataLoading;
        // currentActive = EcomsystemCategoryEnum.DistributionsAndPackaging;
    } else {
        currentActive = EcomsystemCategoryEnum.DataMigration;
    }

    const [active, setActive] = useState<EcomsystemCategoryEnum | string>(currentActive);

    return (
        <div className="container mx-auto flex flex-col flex-wrap items-center justify-center gap-6 lg:flex-row -mt-[1.5rem]">
            <TabItem
                url={EcomsystemCategoryEnum.ClusterManagement}
                setActive={() => setActive(EcomsystemCategoryEnum.ClusterManagement)}
                active={active === EcomsystemCategoryEnum.ClusterManagement}
                icon={<ClusterManagementIcon />}
                title="Cluster management"
                content="Easily deploy and maintain Doris clusters"
            />
            <TabItem
                url={EcomsystemCategoryEnum.Connectors}
                setActive={() => setActive(EcomsystemCategoryEnum.Connectors)}
                active={active === EcomsystemCategoryEnum.Connectors}
                icon={<ConnectorsIcon />}
                title="Connectors"
                content="Integrate with Flink, Spark, dbt and more"
            />
            <TabItem
                url={EcomsystemCategoryEnum.DataLoading}
                setActive={() => setActive(EcomsystemCategoryEnum.DataLoading)}
                active={active === EcomsystemCategoryEnum.DataLoading}
                icon={<DataLoadingIcon />}
                title={'Data loading'}
                content="Accelerate large-scale data loading"
            />
            <TabItem
                url={EcomsystemCategoryEnum.DataMigration}
                setActive={() => setActive(EcomsystemCategoryEnum.DataMigration)}
                active={active === EcomsystemCategoryEnum.DataMigration}
                icon={<DataMigrationIcon />}
                title={'Data migration'}
                content="The easiest way to migrate your data"
            />
            {/* <TabItem
                url={EcomsystemCategoryEnum.DistributionsAndPackaging}
                setActive={() => setActive(EcomsystemCategoryEnum.DistributionsAndPackaging)}
                active={active === EcomsystemCategoryEnum.DistributionsAndPackaging}
                icon={<DistributionsAndPackagingIcon />}
                title={'Distributions'}
                content="Complement Apache Doris"
            /> */}
        </div>
    );
}
