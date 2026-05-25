---
{
    "title": "CREATE WORKLOAD GROUP | Compute Management",
    "language": "en",
    "description": "This statement is used to create a workload group. Workload groups enable the isolation of cpu resources and memory resources on a single be.",
    "sidebar_label": "CREATE WORKLOAD GROUP"
}
---

# CREATE WORKLOAD GROUP

## Description

This statement is used to create a workload group. Workload groups enable the isolation of cpu resources and memory resources on a single be.

## Syntax

```sql
CREATE WORKLOAD GROUP [IF NOT EXISTS] "rg_name"
[FOR <compute_group>]
PROPERTIES (
    `<property>`
    [ , ... ]
);
```

## Parameters

1. `<compute_group>`

    Specifies the compute group that the workload group is bound to.

    - **Cloud (storage-compute decoupled) mode**: The `FOR <compute_group>` clause **must be explicitly specified**. Omitting it raises: `Must specify compute group via 'FOR <compute_group>' in cloud mode.`
    - **Non-cloud (storage-compute coupled) mode**: The `FOR <compute_group>` clause is optional. The value here actually refers to a resource group (Tag) rather than a real compute group — the grammar is shared with cloud mode purely for consistency. When omitted, it defaults to the default resource group (`default`).

2. `<property>`

    `<property>` format is `<key>` = `<value>`, and `<key>`'s specific optional values can be referred to [workload group](../../../../admin-manual/workload-management/workload-group.md).


## Examples

1. Create a workload group named g1 (non-cloud mode: bound to the default resource group):

   ```sql
    create workload group if not exists g1
    properties (
        "max_cpu_percent"="10%",
        "max_memory_percent"="30%"
    );
   ```

2. Create a workload group named g1 bound to `compute_group_a` (the clause is required in cloud mode):

   ```sql
    create workload group if not exists g1 for compute_group_a
    properties (
        "max_cpu_percent"="10%",
        "max_memory_percent"="30%"
    );
   ```
