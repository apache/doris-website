---
{
  "title": "ジョブ",
  "description": "table関数は、一時的なタスクtableを生成し、特定のタスクタイプにおけるジョブ情報を表示することができます。",
  "language": "ja"
}
---
## 説明

一時的なタスクtableを生成するtable関数で、特定のタスクタイプのジョブ情報を表示できます。

## 構文

```sql
JOBS(
    "type"="<type>"
)
```
## 必須パラメータ
| Field         | デスクリプション                                                                                   |
|---------------|-----------------------------------------------------------------------------------------------|
| **`<type>`**  | ジョブのタイプ: <br/> `insert`: Insert into タイプジョブ。 <br/> `mv`: Materialized view ジョブ。 |



## 戻り値

-  **`jobs("type"="insert")`** insert タイプのジョブ戻り値

   | Field              | デスクリプション                |
       |--------------------|----------------------------|
   | Id                 | ジョブ ID                     |
   | Name               | ジョブ名                   |
   | Definer            | ジョブ定義者                |
   | ExecuteType        | 実行タイプ             |
   | RecurringStrategy  | 繰り返し戦略         |
   | Status             | ジョブステータス                 |
   | ExecuteSql         | 実行 SQL              |
   | CreateTime         | ジョブ作成時刻          |
   | SucceedTaskCount   | 成功したタスク数 |
   | FailedTaskCount    | 失敗したタスク数     |
   | CanceledTaskCount  | キャンセルされたタスク数   |
   | Comment            | ジョブコメント                |


- **`jobs("type"="mv")`** MV タイプジョブの戻り値

  | Field                | デスクリプション                                                 |
      |----------------------|-------------------------------------------------------------|
  | Id                   | ジョブ ID                                                      |
  | Name                 | ジョブ名                                                    |
  | MvId                 | Materialized View ID                                        |
  | MvName               | Materialized View 名                                      |
  | MvDatabaseId         | materialized view の DB ID                              |
  | MvDatabaseName       | materialized view が属するデータベース名 |
  | ExecuteType          | 実行タイプ                                              |
  | RecurringStrategy    | ループ戦略                                               |
  | Status               | ジョブステータス                                                  |
  | CreateTime           | タスク作成時刻                                          |


## 例

すべての materialized view のジョブを表示

```sql
select * from jobs("type"="mv");
```
```text
+-------+------------------+-------+--------------------------+--------------+--------------------------------------------------------+-------------+-------------------+---------+---------------------+
| Id    | Name             | MvId  | MvName                   | MvDatabaseId | MvDatabaseName                                         | ExecuteType | RecurringStrategy | Status  | CreateTime          |
+-------+------------------+-------+--------------------------+--------------+--------------------------------------------------------+-------------+-------------------+---------+---------------------+
| 23369 | inner_mtmv_23363 | 23363 | range_date_up_union_mv1  | 21805        | regression_test_nereids_rules_p0_mv_create_part_and_up | MANUAL      | MANUAL TRIGGER    | RUNNING | 2025-01-08 18:19:10 |
| 23377 | inner_mtmv_23371 | 23371 | range_date_up_union_mv2  | 21805        | regression_test_nereids_rules_p0_mv_create_part_and_up | MANUAL      | MANUAL TRIGGER    | RUNNING | 2025-01-08 18:19:10 |
| 21794 | inner_mtmv_21788 | 21788 | test_tablet_type_mtmv_mv | 16016        | zd                                                     | MANUAL      | MANUAL TRIGGER    | RUNNING | 2025-01-08 12:26:06 |
| 19508 | inner_mtmv_19494 | 19494 | mv1                      | 16016        | zd                                                     | MANUAL      | MANUAL TRIGGER    | RUNNING | 2025-01-07 22:13:31 |
+-------+------------------+-------+--------------------------+--------------+--------------------------------------------------------+-------------+-------------------+---------+---------------------+
```
すべての挿入ジョブを表示

```sql
select * from jobs("type"="insert");
```
```text
+----------------+----------------+---------+-------------+--------------------------------------------+---------+--------------------------------------------------------------+---------------------+------------------+-----------------+-------------------+---------+
| Id             | Name           | Definer | ExecuteType | RecurringStrategy                          | Status  | ExecuteSql                                                   | CreateTime          | SucceedTaskCount | FailedTaskCount | CanceledTaskCount | Comment |
+----------------+----------------+---------+-------------+--------------------------------------------+---------+--------------------------------------------------------------+---------------------+------------------+-----------------+-------------------+---------+
| 78533940810334 | insert_tab_job | root    | RECURRING   | EVERY 10 MINUTE STARTS 2025-01-17 14:42:53 | RUNNING | INSERT INTO test.insert_tab SELECT * FROM test.example_table | 2025-01-17 14:32:53 | 0                | 0               | 0                 |         |
+----------------+----------------+---------+-------------+--------------------------------------------+---------+--------------------------------------------------------------+---------------------+------------------+-----------------+-------------------+---------+
```
