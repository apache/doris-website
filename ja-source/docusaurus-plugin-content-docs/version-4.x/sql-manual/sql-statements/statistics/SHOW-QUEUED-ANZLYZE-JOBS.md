---
{
  "title": "キューに登録されたANALYZE JOBSを表示",
  "description": "このステートメントは、実行待ちの統計収集ジョブのキューを表示するために使用されます。",
  "language": "ja"
}
---
## 説明

このステートメントは、実行待ちの統計収集ジョブのキューを表示するために使用されます。

## 構文

```SQL
SHOW QUEUED ANALYZE JOBS [ <table_name> ]
    [ WHERE PRIORITY = {"HIGH" | "MID" | "LOW" | "VERY_LOW"} ];
```
## オプションパラメータ

**1. `<table_name>`**

> Table名。指定した場合、そのTableに対応するジョブキュー情報を表示できます。指定しない場合、デフォルトですべてのTableのジョブキュー情報が返されます。

**2. `WHERE PRIORITY = {"HIGH" | "MID" | "LOW" | "VERY_LOW"}`**

> ジョブ優先度のフィルタ条件。指定しない場合、デフォルトですべての優先度のジョブに関する情報が表示されます。

## 戻り値

| Column | Note           |
| -- |--------------|
| catalog_name |   Catalog名         |
| db_name | データベース名           |
| tbl_name | Table名         |
| col_list | カラム名リスト           |
| priority | ジョブ優先度           |

## アクセス制御要件

このSQLを実行するユーザーは、少なくとも以下の権限を持つ必要があります：

| Privilege | Object | 注釈                                    |
|:--------------| :------------- |:------------------------------------------------|
| SELECT_PRIV   | Table    | SHOWを実行する際、クエリ対象のTableのSELECT_PRIV権限が必要です。 |

## 例

1. Table名でジョブを表示する。

```sql
SHOW QUEUED ANALYZE JOBS REGION;
```
```text
+--------------+---------+----------+---------------------------------------------------+----------+
| catalog_name | db_name | tbl_name | col_list                                          | priority |
+--------------+---------+----------+---------------------------------------------------+----------+
| internal     | test    | region   | region:r_regionkey                                | HIGH     |
| internal     | test    | region   | region:r_name                                     | MID      |
| internal     | test    | region   | region:r_comment,region:r_name,region:r_regionkey | LOW      |
+--------------+---------+----------+---------------------------------------------------+----------+
```
2. ジョブを優先度別に表示します。

```sql
SHOW QUEUED ANALYZE JOBS WHERE PRIORITY="HIGH";
```
```text
+--------------+---------+----------+--------------------+----------+
| catalog_name | db_name | tbl_name | col_list           | priority |
+--------------+---------+----------+--------------------+----------+
| internal     | test    | region   | region:r_regionkey | HIGH     |
+--------------+---------+----------+--------------------+----------+
```
