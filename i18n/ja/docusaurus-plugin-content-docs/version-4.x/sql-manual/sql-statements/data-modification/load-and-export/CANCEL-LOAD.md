---
{
    "title": "CANCEL LOAD",
    "language": "ja",
    "description": "このステートメントは、指定したラベルのロードジョブをキャンセルするか、あいまい一致によって複数のロードジョブを一括でキャンセルするために使用します。"
}
---

## 説明

このステートメントは、指定した `label` のロードジョブをキャンセルするか、あいまい一致によって複数のロードジョブを一括でキャンセルするために使用します。

## 構文

```sql
CANCEL LOAD
[FROM <db_name>]
WHERE [LABEL = "<load_label>" | LABEL like "<label_pattern>" | STATE = { "PENDING" | "ETL" | "LOADING" } ]
```

## 必須パラメータ

**1. `<db_name>`**

> キャンセルするロードジョブが属するデータベースの名前です。

## オプションパラメータ

**1. `<load_label>`**

> `LABEL = "<load_label>"` を使用すると、指定したラベルと完全一致するジョブが対象になります。

**2. `<label_pattern>`**

> `LABEL LIKE "<label_pattern>"` を使用すると、ラベルに `label_pattern` を含むロードジョブが対象になります。

**3. STATE = { " PENDING " | " ETL " | " LOADING " }**

> `PENDING` を指定すると、`STATE = "PENDING"` のジョブがキャンセル対象になります。他の状態についても同様です。

## 権限要件

この SQL コマンドを実行するユーザーには、少なくとも次の権限が必要です。

| 権限 | オブジェクト | 説明 |
| :---------------- | :------------- | :---------------------------- |
| LOAD_PRIV | データベース | データベースのテーブルに対するロード権限が必要です。 |

## 使用上の注意

- 状態（`State`）に基づくジョブのキャンセルは、バージョン 1.2.0 以降でサポートされています。
- キャンセルできるのは、`PENDING`、`ETL`、`LOADING` のいずれかの状態にある未完了のロードジョブだけです。
- 一括キャンセルでは、Doris は対象となるすべてのロードジョブがアトミックにキャンセルされることを保証しません。一部のロードジョブだけが正常にキャンセルされる場合があります。`SHOW LOAD` ステートメントでジョブの状態を確認し、必要に応じて `CANCEL LOAD` ステートメントを再実行してください。

## 例

1. データベース `example_db` で、ラベルが `example_db_test_load_label` のロードジョブをキャンセルします。

   ```sql
   CANCEL LOAD
   FROM example_db
   WHERE LABEL = "example_db_test_load_label";
   ```

2. データベース `example_db` で、`example_` を含むすべてのロードジョブをキャンセルします。

   ```sql
   CANCEL LOAD
   FROM example_db
   WHERE LABEL like "%example_%";
   ```

3. `LOADING` 状態のロードジョブをキャンセルします。

   ```sql
   CANCEL LOAD
   FROM example_db
   WHERE STATE = "loading";
   ```
