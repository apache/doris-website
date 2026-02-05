---
{
    "title": "DML Tuning Plan",
    "language": "en",
    "description": "For DML plan tuning, it is first necessary to identify whether the performance bottleneck is caused by the import process or the query section."
}
---

For DML plan tuning, it is first necessary to identify whether the performance bottleneck is caused by the import process or the query section. For the troubleshooting and tuning of performance bottlenecks in the query section, please refer to other subsections in [Plan Tuning](optimizing-table-schema.md) for details.

Doris supports importing data from multiple data sources. By flexibly utilizing the various import functions provided by Doris, data from various sources can be efficiently imported into Doris for analysis. For details of best practices, please refer to [Import Overview](../../../data-operate/import/load-manual.md). 