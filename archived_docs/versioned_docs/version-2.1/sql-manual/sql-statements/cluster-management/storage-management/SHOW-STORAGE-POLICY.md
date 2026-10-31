---
{
    "title": "SHOW STORAGE POLICY",
    "language": "en",
    "description": "View tables and partitions associated with all/specified storage policies."
}
---

## Description

View tables and partitions associated with all/specified storage policies.

## Syntax

```sql
SHOW STORAGE POLICY [ USING [ FOR <storage_policy_name> ] ]
```

## Required Parameters

<storage_policy_name>

> The name of the storage policy to view.

The prerequisite for successfully executing this SQL command is to have ADMIN_PRIV privileges. Please refer to the
privilege document.

| Privilege (Privilege) | Object (Object)                      | Notes (Notes)                   |
|-----------------------|--------------------------------------|---------------------------------|
| ADMIN_PRIV            | Entire cluster management privileges | All privileges except NODE_PRIV |

## Example

1. View all objects with enabled storage policies.

   ```sql
   show storage policy using;
   ```
   ```text
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

2. View objects using the storage policy test_storage_policy.

   ```sql
   show storage policy using for test_storage_policy;
   ```
   ```text
   +---------------------+-----------+---------------------------------+------------+
   | PolicyName          | Database  | Table                           | Partitions |
   +---------------------+-----------+---------------------------------+------------+
   | test_storage_policy | db_1      | partition_with_storage_policy_1 | p201701    |
   | test_storage_policy | db_1      | table_with_storage_policy_1     | ALL        |
   +---------------------+-----------+---------------------------------+------------+
   ```

3. View the properties of all storage policies.

   ```sql
   show storage policy;
   ```
   ```text
   +-------------+----------+---------+---------+-----------------+------------------+-------------+
   | PolicyName  | Id       | Version | Type    | StorageResource | CooldownDatetime | CooldownTtl |
   +-------------+----------+---------+---------+-----------------+------------------+-------------+
   | test_policy | 14589252 | 0       | STORAGE | remote_s3       | -1               | 300         |
   | dev_policy  | 14589521 | 0       | STORAGE | remote_s3       | -1               | 3000        |
   +-------------+----------+---------+---------+-----------------+------------------+-------------+
   ```