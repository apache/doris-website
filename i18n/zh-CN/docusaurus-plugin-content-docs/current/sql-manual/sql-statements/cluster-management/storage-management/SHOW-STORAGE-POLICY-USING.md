---
{
    "title": "SHOW STORAGE POLICY USING",
    "language": "zh-CN",
    "description": "查看所有/指定存储策略关联的表和分区"
}
---

## 描述

查看所有/指定存储策略关联的表和分区

## 语法

```sql
SHOW STORAGE POLICY USING [FOR <some_policy>]
```
## 可选参数
| 参数名称          | 描述                                                         |
|-------------------|--------------------------------------------------------------|
| `<policy_name>` | 指定要查询的存储策略名称。如果提供了此参数，则只显示指定存储策略的详细信息；如果不提供此参数，则显示所有存储策略的信息。 |

## 示例

1. 查看所有启用了存储策略的对象
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
2. 查看使用存储策略 test_storage_policy 的对象

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

