---
{
    "title": "CREATE WORKLOAD POLICY",
    "language": "en",
    "description": "Create a Workload Policy, which is used to execute the corresponding action on a query when it satisfies certain conditions."
}
---

## Description

Create a Workload Policy, which is used to execute the corresponding action on a query when it satisfies certain conditions.

## Syntax

```sql
CREATE WORKLOAD POLICY [ IF NOT EXISTS ] <workload_policy_name>
CONDITIONS(<conditions>) ACTIONS(<actions>)
[ PROPERTIES (<properties>) ]
```

## Required Parameters

1. `<workload_policy_name>`: The name of the Workload Policy.

2. `<conditions>`
    - be_scan_rows: The number of rows scanned by a SQL within a single BE process. If the SQL is executed with multiple concurrencies on the BE, this is the cumulative value of the concurrent executions.
    - be_scan_bytes: The number of bytes scanned by a SQL within a single BE process. If the SQL is executed with multiple concurrencies on the BE, this is the cumulative value of the concurrent executions, in bytes.
    - query_time: The execution time of a SQL on a single BE process, in milliseconds.
    - query_be_memory_bytes: Supported since version 2.1.5. The memory usage of a SQL within a single BE process. If the SQL is executed with multiple concurrencies on the BE, this is the cumulative value of the concurrent executions, in bytes.

3. `<actions>`
    - set_session_variable: This action executes a `set_session_variable` statement. A single Policy may contain multiple `set_session_variable` actions, allowing one Policy to execute multiple session-variable updates.
    - cancel_query: Cancel the query.

## Optional Parameters

1. `<properties>`
    - enabled: Can be true or false; default is true. true means the policy is enabled; false means it is disabled.
    - priority: A positive integer in the range 0 to 100; default is 0. Higher values mean higher priority. When multiple policies match a query, the one with the highest priority is selected.
    - workload_group: A policy can be bound to one workload group, meaning that the policy only takes effect for that workload group. Defaults to empty, which means it applies to all queries.

        Because a workload group itself belongs to a compute group, the value of this property must follow these rules:

        - **Cloud (storage-compute decoupled) mode**: The fully qualified form `<compute_group>.<workload_group>` is required, e.g. `'workload_group'='compute_group_a.wg1'`. The bare `<workload_group>` form, more than one `.`, or empty segments (such as `.wg1` or `wg1.`) are rejected with: `workload_group must be '<compute_group>.<workload_group>' in cloud mode`.
        - **Non-cloud (storage-compute coupled) mode**: Two forms are accepted:
            - `<workload_group>`: defaults the binding to the workload group with the same name under the default resource group (`default`).
            - `<resource_group>.<workload_group>`: explicitly specifies the resource group. The prefix here actually refers to a resource group (Tag); the grammar is shared with cloud mode purely for consistency.
            
            More than one `.` or empty segments are likewise rejected with: `workload_group must be '<workload_group>' or '<resource_group>.<workload_group>' in non-cloud mode`.

## Access Control Requirements

You must have at least ADMIN_PRIV permissions.

## Examples

1. Create a Workload Policy that cancels any query running longer than 3 seconds:

    ```sql
    create workload policy kill_big_query conditions(query_time > 3000) actions(cancel_query)
    ```

2. Create a Workload Policy that is disabled by default:

    ```sql
    create workload policy kill_big_query conditions(query_time > 3000) actions(cancel_query) properties('enabled'='false')
    ```

3. Create a policy that only takes effect on workload group `wg1` under compute group `compute_group_a` in cloud mode (note the fully qualified form):

    ```sql
    create workload policy kill_big_query conditions(query_time > 3000) actions(cancel_query) properties('workload_group'='compute_group_a.wg1')
    ```
