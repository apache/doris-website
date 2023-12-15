import { useLocation } from '@docusaurus/router';
import React, { useState } from 'react';
import { EcomsystemCategoryEnum } from '../ecomsystem.data';
import { ClusterManagementIcon } from './components/icons/cluster-management-icon';
import { ConnectorsIcon } from './components/icons/connectors-icon';
import { DistributionsAndPackagingIcon } from './components/icons/distributions-packaging-icon';
import { TabItem } from './components/tab-item';

export default function EcomsystemCategory() {
    const location = useLocation();
    const pathnames = location.pathname.split('/');

    const current = pathnames.length > 0 ? pathnames[pathnames.length - 1] : '';
    let currentActive: EcomsystemCategoryEnum = EcomsystemCategoryEnum.ClusterManagement;
    console.log(current);

    if (current === EcomsystemCategoryEnum.ClusterManagement) {
        currentActive = EcomsystemCategoryEnum.ClusterManagement;
    } else if (current === EcomsystemCategoryEnum.Connectors) {
        currentActive = EcomsystemCategoryEnum.Connectors;
    } else {
        currentActive = EcomsystemCategoryEnum.DistributionsAndPackaging;
    }

    const [active, setActive] = useState<EcomsystemCategoryEnum | string>(currentActive);

    return (
        <div className="container mx-auto flex flex-col flex-wrap items-center justify-center gap-6 lg:flex-row -mt-[3.875rem]">
            <TabItem
                url={EcomsystemCategoryEnum.ClusterManagement}
                setActive={() => setActive(EcomsystemCategoryEnum.ClusterManagement)}
                active={active === EcomsystemCategoryEnum.ClusterManagement}
                icon={<ClusterManagementIcon />}
                title="Cluster Management"
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
                url={EcomsystemCategoryEnum.DistributionsAndPackaging}
                setActive={() => setActive(EcomsystemCategoryEnum.DistributionsAndPackaging)}
                active={active === EcomsystemCategoryEnum.DistributionsAndPackaging}
                icon={<DistributionsAndPackagingIcon />}
                title={'Distributions & Packaging'}
                content="Complement Apache Doris"
            />
        </div>
    );
}
