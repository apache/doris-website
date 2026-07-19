---
{
    "title": "DROP WORKLOAD GROUP",
    "language": "en",
    "description": "This statement is used to delete a workload group."
}
---

## Description

This statement is used to delete a workload group.

## Syntax

```sql
DROP WORKLOAD GROUP [IF EXISTS] '<rg_name>' [FOR <compute_group>]
```

## Parameters

1. `<compute_group>`

    Specifies the compute group that contains the workload group to delete.

    - **Cloud (storage-compute decoupled) mode**: The `FOR <compute_group>` clause **must be explicitly specified**. Omitting it raises: `Must specify compute group via 'FOR <compute_group>' in cloud mode.`
    - **Non-cloud (storage-compute coupled) mode**: The `FOR <compute_group>` clause is optional. The value here actually refers to a resource group (Tag); the grammar is shared with cloud mode purely for consistency. When omitted, the workload group with the same name under the default resource group (`default`) is deleted.

## Examples

1. Delete the workload group named g1 (non-cloud mode: deletes g1 from the default resource group):
    
    ```sql
    drop workload group if exists g1;
    ```

2. Delete the workload group named g1 from `compute_group_a` (the clause is required in cloud mode):

    ```sql
    drop workload group if exists g1 for compute_group_a;
    ```