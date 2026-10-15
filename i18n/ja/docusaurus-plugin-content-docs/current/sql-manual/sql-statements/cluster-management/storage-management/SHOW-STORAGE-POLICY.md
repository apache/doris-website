---
{
    "title": "SHOW STORAGE POLICY",
    "language": "ja",
    "description": "すべてのストレージポリシー、または指定したストレージポリシーに関連付けられたテーブルとパーティションを表示します。"
}
---

## 説明

すべてのストレージポリシー、または指定したストレージポリシーに関連付けられたテーブルとパーティションを表示します。

## 構文

```sql
SHOW STORAGE POLICY [ USING [ FOR <storage_policy_name> ] ]
```

## 必須パラメータ

<storage_policy_name>

> 表示するストレージポリシーの名前。

この SQL コマンドを正常に実行するには、ADMIN_PRIV 権限が必要です。権限に関するドキュメントを参照してください。

| 権限       | オブジェクト                         | 備考                              |
|------------|--------------------------------------|-----------------------------------|
| ADMIN_PRIV | クラスター全体の管理権限             | NODE_PRIV を除くすべての権限      |

## 例

1. ストレージポリシーが有効になっているすべてのオブジェクトを表示します。

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

2. ストレージポリシー test_storage_policy を使用しているオブジェクトを表示します。

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

3. すべてのストレージポリシーのプロパティを表示します。

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
