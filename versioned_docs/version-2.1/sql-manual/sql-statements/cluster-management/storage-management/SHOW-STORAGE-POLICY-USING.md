---
{
    "title": "SHOW STORAGE POLICY USING",
    "language": "en",
    "description": "View all tables and partitions associated with a specified storage policy."
}
---

## Description

View all tables and partitions associated with a specified storage policy.

## Syntax

```sql
SHOW STORAGE POLICY USING [FOR <some_policy>]
```
## Optional Parameters
| Parameter Name          | Description                                                         |
|-------------------|--------------------------------------------------------------|
| `<policy_name>` | Specifies the name of the storage policy to query. If provided, only the details of the specified storage policy will be displayed; if not provided, information for all storage policies will be shown. |

## Examples

1. View all objects with a storage policy enabled
   ```sql
   show storage policy using;
   ```
   ```sql
   +-----------------------+-----------------------------------------+----------------------------------------+------------+
   | PolicyName            | Database                                | Table                                  | Partitions |
   +-----------------------+-----------------------------------------+----------------------------------------+------------+
   | test_storage_policy   | regression_test_cold_heat_separation_p2 | table_with_storage_policy_1            | ALL        |
   | test_storage_policy   | regression_test_cold_heat_separation_p2 | partition_with_multiple_storage_policy | p201701    |
   | test_storage_policy_2 | regression_test_cold_heat_separation_p2 | partition_with_multiple_storage_policy | p201702    |
   | test_storage_policy_2 | regression_test_cold_heat_separation_p2 | table_with_storage_policy_2            | ALL        |
   | test_policy           | db2                                     | db2_test_1                             | ALL        |
   +-----------------------+-----------------------------------------+----------------------------------------+------------+
   ```
2. View objects that use the storage policy test_storage_policy

    ```sql
    show storage policy using for test_storage_policy;
    ```
    ```sql
    +---------------------+-----------+---------------------------------+------------+
    | PolicyName          | Database  | Table                           | Partitions |
    +---------------------+-----------+---------------------------------+------------+
    | test_storage_policy | db_1      | partition_with_storage_policy_1 | p201701    |
    | test_storage_policy | db_1      | table_with_storage_policy_1     | ALL        |
    +---------------------+-----------+---------------------------------+------------+
   ```

