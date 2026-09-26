import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
    course101: [
        {
            type: 'category',
            label: 'Doris 101',
            collapsible: false,
            items: [
                '101/apache-doris-overview',
                '101/apache-doris-installation-guide',
                '101/apache-doris-table-guide',
                '101/apache-doris-data-operations-guide',
                '101/apache-doris-query-data-guide',
                '101/apache-doris-lakehouse-guide',
            ],
        },
    ],
};

export default sidebars;
