---
{
    "title": "ALTER WORKLOAD POLICY",
    "language": "en",
    "description": "Modify the properties of a Workload Policy. Currently, only property modifications are supported;"
}
---

## Description

Modify the properties of a Workload Policy. Currently, only property modifications are supported; modifications to actions and conditions are not supported.


## Syntax

```sql
ALTER WORKLOAD POLICY <workload_policy_name> PROPERTIES( <properties> )
```

## Required Parameters

`<workload_policy_name>` 

Workload Policy's Name


`<properties>`

1. enabled: Can be true or false, with a default value of true, indicating that the current policy is enabled. false indicates that the current policy is disabled.
2. priority: A positive integer ranging from 0 to 100, with a default value of 0. This represents the priority of the policy. The higher the value, the higher the priority. The main role of this property is to select the policy with the highest priority when multiple policies match.
3. workload_group: Currently, a policy can be bound to one workload group, which means that this policy is only effective for a specific workload group. The default is empty, which means it is effective for all queries.

    Because a workload group itself belongs to a compute group, the value of this property must follow these rules:

    - **Cloud (storage-compute decoupled) mode**: The fully qualified form `<compute_group>.<workload_group>` is required, e.g. `'workload_group'='compute_group_a.wg1'`. The bare `<workload_group>` form, more than one `.`, or empty segments (such as `.wg1` or `wg1.`) are rejected with: `workload_group must be '<compute_group>.<workload_group>' in cloud mode`.
    - **Non-cloud (storage-compute coupled) mode**: Two forms are accepted:
        - `<workload_group>`: defaults the binding to the workload group with the same name under the default resource group (`default`).
        - `<resource_group>.<workload_group>`: explicitly specifies the resource group. The prefix here actually refers to a resource group (Tag); the grammar is shared with cloud mode purely for consistency.
        
        More than one `.` or empty segments are likewise rejected with: `workload_group must be '<workload_group>' or '<resource_group>.<workload_group>' in non-cloud mode`.

## Access Control Requirements

You must have at least ADMIN_PRIV permissions.

## Examples

1. Disable a Workload Policy

  ```sql
  alter workload policy cancel_big_query properties('enabled'='false')
  ```