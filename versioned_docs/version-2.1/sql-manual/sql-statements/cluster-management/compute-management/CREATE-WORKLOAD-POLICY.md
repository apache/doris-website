---
{
    "title": "CREATE WORKLOAD POLICY",
    "language": "en"
}
---

## Description

Create a Workload Policy to execute corresponding actions on a query when it meets certain conditions.


## Syntax


```sql
CREATE WORKLOAD POLICY [ IF NOT EXISTS ] <workload_policy_name>
CONDITIONS(<conditions>) ACTIONS(<actions>)
[ PROPERTIES (<properties>) ]
```
### Required Parameters

`<workload_policy_name>`

The name of the Workload Policy.



1. **be_scan_rows**: The number of rows scanned by an SQL query within a single BE process. If the SQL query is executed concurrently on multiple BEs, it is the cumulative value of these concurrent executions.
2. **be_scan_bytes**: The number of bytes scanned by an SQL query within a single BE process. If the SQL query is executed concurrently on multiple BEs, it is the cumulative value of these concurrent executions (in bytes).
3. **query_time**: The execution time of an SQL query on a single BE process, in milliseconds.
4. **query_be_memory_bytes** (supported from version 2.1.5): The amount of memory used by an SQL query within a single BE process. If the SQL query is executed concurrently on multiple BEs, it is the cumulative value of these concurrent executions (in bytes).


`<actions>`

1. **set_session_variable**: This action executes a set session variable statement. Multiple **set_session_variable** actions can be specified in the same policy, allowing multiple session variable modification statements to be executed within one policy.
2. **cancel_query**: Cancels the query.

### Optional Parameters



1. **enabled**: Takes a value of true or false, with a default value of true. When set to true, the policy is enabled; when set to false, the policy is disabled.
2. **priority**: An integer value ranging from 0 to 100, with a default value of 0. This represents the priority of the policy. The higher the value, the higher the priority. When multiple policies match, the policy with the highest priority is selected.
3. **workload_group**: Currently, a policy can be bound to one workload group, indicating that this policy only applies to a specific workload group. The default is empty, meaning it applies to all queries.

### Access Control Requirements

Requires at least `ADMIN_PRIV` permissions.

## Examples

1. Create a new Workload Policy to kill all queries that exceed 3 seconds in query time.

  ```Java
  create workload policy kill_big_query conditions(query_time > 3000) actions(cancel_query)
  ```

1. Create a new Workload Policy that is not enabled by default.

  ```Java
  create workload policy kill_big_query conditions(query_time > 3000) actions(cancel_query) properties('enabled'='false')
  ```