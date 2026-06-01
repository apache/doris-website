---
{
    "title": "Statistics | Lakehouse",
    "language": "en",
    "description": "Doris supports automatic or manual statistics collection for tables from external data sources like Hive, Iceberg and Paimon.",
    "sidebar_label": "Statistics"
}
---

# Statistics

Doris supports automatic or manual statistics collection for tables from external data sources like Hive, Iceberg and Paimon. The accuracy of statistics directly determines the accuracy of cost estimation, which is crucial for selecting the optimal query plan. This can significantly improve query execution efficiency, especially in complex query scenarios.

For details, please refer to the [Statistics](../query-acceleration/optimization-technology-principle/statistics#external-table-collection) document in the "External Table Collection" section.

