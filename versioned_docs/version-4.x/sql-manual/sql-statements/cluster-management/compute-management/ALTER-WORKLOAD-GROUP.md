---
{
    "title": "ALTER WORKLOAD GROUP",
    "language": "en",
    "description": "This statement is used to modify the workload group."
}
---

## Description

This statement is used to modify the workload group.

## Syntax

```sql
ALTER WORKLOAD GROUP  "<rg_name>"
PROPERTIES (
  `<property>`
  [ , ... ]
);
```

## Parameters

1.`<property>`

`<property>` format is `<key>` = `<value>`，`<key>`'s specific optional values can be referred to [workload group](../../../../admin-manual/workload-management/workload-group.md).

## Examples

1. Modify the workload group named g1:

    ```sql
    alter workload group g1
    properties (
        "max_cpu_percent"="20%",
        "max_memory_percent"="40%"
    );
    ```