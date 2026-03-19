---
{
  "title": "SHOW LOAD WARNINGS",
  "description": "インポートタスクが失敗し、エラーメッセージがETLQUALITYUNSATISFIEDの場合、インポート品質に問題があることを示しています。",
  "language": "ja"
}
---
## デスクリプション

インポートタスクが失敗し、エラーメッセージが `ETL_QUALITY_UNSATISFIED` の場合、インポート品質に問題があることを示しています。このステートメントは、品質に問題があるこれらのインポートタスクを表示するために使用されます。

## Syntax

```sql
SHOW LOAD WARNINGS
[FROM <db_name>]
[
   WHERE
   [LABEL  = [ "<your_label>" ]]
   [LOAD_JOB_ID = ["<job_id>"]]
]
```
## オプションパラメータ

**1. `<db_name>`**

> `db_name`が指定されていない場合、現在のデフォルトデータベースが使用されます。

**2. `<your_label>`**

> `LABEL = <your_label>`が使用された場合、指定されたラベルと正確に一致します。

**3. `<job_id>`**

> `LOAD_JOB_ID = <job_id>`が指定された場合、指定されたJOB_IDと正確に一致します。

## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持っている必要があります：

| 権限 | オブジェクト | 備考 |
| :---------------- | :------------- | :---------------------------- |
| LOAD_PRIV | Database | データベースTableのインポート権限が必要です。 |

## 戻り値

指定されたデータベースのインポートタスクで品質に問題があるデータを返します。

## 例

- ラベルが"load_demo_20210112"として指定された、指定データベースのインポートタスクで品質に問題があるデータを表示します。

```sql
SHOW LOAD WARNINGS FROM demo WHERE LABEL = "load_demo_20210112" 
```
