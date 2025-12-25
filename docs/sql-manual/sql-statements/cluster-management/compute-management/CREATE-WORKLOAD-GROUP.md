---
{
    "title": "CREATE WORKLOAD GROUP | Compute Management",
    "language": "en",
    "description": "This statement is used to create a workload group. Workload groups enable the isolation of cpu resources and memory resources on a single be."
}
---

## Description

This statement is used to create a workload group. Workload groups enable the isolation of cpu resources and memory resources on a single be.

## Syntax

```sql
CREATE WORKLOAD GROUP [IF NOT EXISTS] "rg_name"
PROPERTIES (
    `<property>`
    [ , ... ]
);
```

## Parameters

1.`<property>`

`<property>` format is `<key>` = `<value>`，`<key>`'s specific optional values can be referred to [workload group](../../../../admin-manual/workload-management/workload-group.md).


## Examples

1. Create a workload group named g1:

   ```sql
    create workload group if not exists g1
    properties (
        "max_cpu_percent"="10%",
        "max_memory_percent"="30%"
    );
   ```
