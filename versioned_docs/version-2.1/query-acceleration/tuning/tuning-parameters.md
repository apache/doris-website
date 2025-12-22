---
{
    "title": "Common Tuning Parameters",
    "language": "en",
    "description": "Learn essential database tuning parameters including enable_nereids_planner, parallel_pipeline_task_num, and runtime_filter_mode for optimizing query performance, version upgrades, and adaptive parallelism in SQL execution."
}
---

| Parameter                  | Description                                         | Default Value | Usage Scenario                                               |
| -------------------------- | --------------------------------------------------- | ------------- | ------------------------------------------------------------ |
| enable_nereids_planner     | Whether to enable the new optimizer                 | TRUE          | For scenarios such as low-version upgrades, initially set to false; after upgrading, it can be set to true |
| enable_nereids_dml         | Whether to enable DML support for the new optimizer | TRUE          | For scenarios such as low-version upgrades, initially set to false; after upgrading, it can be set to true |
| parallel_pipeline_task_num | Pipeline parallelism                                | 0             | For scenarios such as low-version upgrades, this value was previously set to a fixed value; after upgrading, it can be set to 0, indicating that the system's adaptive strategy determines the parallelism |
| runtime_filter_mode        | Runtime Filter type                                 | GLOBAL        | For scenarios such as low-version upgrades, this value was NONE, indicating that Runtime Filter was not enabled; after upgrading, it can be set to GLOBAL, indicating that Runtime Filter is enabled by default |