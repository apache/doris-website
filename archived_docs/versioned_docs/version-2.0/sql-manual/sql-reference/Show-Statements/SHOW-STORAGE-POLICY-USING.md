---
{
    "title": "SHOW-STORAGE-POLICY-USING",
    "language": "en"
}
---

## SHOW-STORAGE-POLICY-USING

### Name

SHOW STORAGE POLICY USING

### Description

This command is used to show tables and partitions which is using storage policy

```sql
SHOW STORAGE POLICY USING [FOR some_policy]
```

### Example

1. get all objects which are using storage policy

   ```sql
   mysql> show storage policy using;
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

2. get objects which are using the storage policy named test_storage_policy

    ```sql
    mysql> show storage policy using for test_storage_policy;
    +---------------------+-----------+---------------------------------+------------+
    | PolicyName          | Database  | Table                           | Partitions |
    +---------------------+-----------+---------------------------------+------------+
    | test_storage_policy | db_1      | partition_with_storage_policy_1 | p201701    |
    | test_storage_policy | db_1      | table_with_storage_policy_1     | ALL        |
    +---------------------+-----------+---------------------------------+------------+
   ```

### Keywords

    SHOW, STORAGE, POLICY, USING

### Best Practice
