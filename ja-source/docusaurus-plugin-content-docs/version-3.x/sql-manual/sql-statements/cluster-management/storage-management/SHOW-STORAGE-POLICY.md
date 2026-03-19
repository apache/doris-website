---
{
  "title": "SHOW STORAGE POLICY",
  "description": "全て/指定されたストレージポリシーに関連付けられたtableとパーティションを表示します。",
  "language": "ja"
}
---
## デスクリプション

すべての/指定されたストレージポリシーに関連付けられたtableとパーティションを表示します。

## Syntax

```sql
SHOW STORAGE POLICY [ USING [ FOR <storage_policy_name> ] ]
```
## 必須パラメータ

<storage_policy_name>

> 表示するストレージポリシーの名前。

このSQLコマンドを正常に実行するための前提条件は、ADMIN_PRIV権限を持つことです。権限ドキュメントを参照してください。

| Privilege (Privilege) | Object (Object)                      | 注釈 (注釈)                   |
|-----------------------|--------------------------------------|---------------------------------|
| ADMIN_PRIV            | クラスタ全体の管理権限 | NODE_PRIVを除くすべての権限 |

## 例

1. 有効化されたストレージポリシーを持つすべてのオブジェクトを表示する。

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
2. ストレージポリシー test_storage_policy を使用してオブジェクトを表示します。

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
   | PolicyName  | Id       | Version | タイプ    | StorageResource | CooldownDatetime | CooldownTtl |
   +-------------+----------+---------+---------+-----------------+------------------+-------------+
   | test_policy | 14589252 | 0       | STORAGE | remote_s3       | -1               | 300         |
   | dev_policy  | 14589521 | 0       | STORAGE | remote_s3       | -1               | 3000        |
   +-------------+----------+---------+---------+-----------------+------------------+-------------+
   ```
