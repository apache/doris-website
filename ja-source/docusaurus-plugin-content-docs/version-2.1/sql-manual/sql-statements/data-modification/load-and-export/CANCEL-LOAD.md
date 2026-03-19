---
{
  "title": "キャンセル読み込み",
  "language": "ja",
  "description": "このステートメントは、指定されたラベルでimportジョブをキャンセルするか、またはファジーマッチングによってimportジョブを一括でキャンセルするために使用されます。"
}
---
## 説明

このステートメントは、指定された`label`でインポートジョブをキャンセルするか、あいまい一致を通じてインポートジョブを一括でキャンセルするために使用されます。

## 構文

```sql
CANCEL LOAD
[FROM <db_name>]
WHERE [LABEL = "<load_label>" | LABEL like "<label_pattern>" | STATE = { "PENDING" | "ETL" | "LOADING" } ]
```
## 必須パラメータ

**1. `<db_name>`**

> キャンセルするインポートジョブが存在するデータベースの名前。

## オプションパラメータ

**1. `<load_label>`**

> `LABEL = "<load_label>"`を使用した場合、指定されたラベルと完全に一致します。

**2. `<label_pattern>`**

> `LABEL LIKE "<label_pattern>"`を使用した場合、ラベルに`label_pattern`を含むインポートタスクと一致します。

**3. STATE = { " PENDING " | " ETL " | " LOADING " | " FINISHED " | " CANCELLED " }**

> `PENDING`を指定すると、`STATE = "PENDING"`ステータスのジョブをキャンセルすることを意味します。他のステータスも同様です。

## アクセス制御要件

このSQLコマンドを実行するユーザーは、最低限以下の権限が必要です：

| 権限 | オブジェクト | 注記 |
| :---------------- | :------------- | :---------------------------- |
| LOAD_PRIV | Database | データベーステーブルのインポート権限が必要です。 |

## 使用上の注意

- `State`に基づくジョブのキャンセルは、バージョン1.2.0以降でサポートされています。
- `PENDING`、`ETL`、または`LOADING`状態の未完了のインポートジョブのみキャンセルできます。
- バッチキャンセルを実行する場合、Dorisは対応するすべてのインポートジョブが原子的にキャンセルされることを保証しません。つまり、一部のインポートジョブのみが正常にキャンセルされる場合があります。ユーザーは`SHOW LOAD`文を使用してジョブステータスを確認し、`CANCEL LOAD`文を再度実行してみることができます。

## 例

1. データベース`example_db`内のラベル`example_db_test_load_label`を持つインポートジョブをキャンセルします。

   ```sql
   CANCEL LOAD
   FROM example_db
   WHERE LABEL = "example_db_test_load_label";
   ```
2. データベース `example_db` 内で `example_` を含むすべてのインポートジョブをキャンセルします。

   ```sql
   CANCEL LOAD
   FROM example_db
   WHERE LABEL like "example_";
   ```
3. `LOADING`状態のインポートジョブをキャンセルします。

   ```sql
   CANCEL LOAD
   FROM example_db
   WHERE STATE = "loading";
   ```
