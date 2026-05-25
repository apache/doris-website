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
[FOR <compute_group>]
PROPERTIES (
  `<property>`
  [ , ... ]
);
```

:::note
The `ALTER` statement only modifies the workload group's properties; it **cannot change the binding between a workload group and a compute group**. The `FOR <compute_group>` clause is used to locate which compute group's workload group is being modified.
:::

## Parameters

1. `<compute_group>`

    Specifies the compute group that contains the workload group to modify.

    - **Cloud (storage-compute decoupled) mode**: The `FOR <compute_group>` clause **must be explicitly specified**. Omitting it raises: `Must specify compute group via 'FOR <compute_group>' in cloud mode.`
    - **Non-cloud (storage-compute coupled) mode**: The `FOR <compute_group>` clause is optional. The value here actually refers to a resource group (Tag); the grammar is shared with cloud mode purely for consistency. When omitted, it defaults to the workload group with the same name under the default resource group (`default`).

2. `<property>`

    `<property>` format is `<key>` = `<value>`, and `<key>`'s specific optional values can be referred to [workload group](../../../../admin-manual/workload-management/workload-group.md).

## Examples

1. Modify the workload group named g1 (non-cloud mode: acts on g1 under the default resource group):

    ```sql
    alter workload group g1
    properties (
        "max_cpu_percent"="20%",
        "max_memory_percent"="40%"
    );
    ```

2. Modify the workload group named g1 under `compute_group_a` (the clause is required in cloud mode):

    ```sql
    alter workload group g1 for compute_group_a
    properties (
        "max_cpu_percent"="20%",
        "max_memory_percent"="40%"
    );
    ```