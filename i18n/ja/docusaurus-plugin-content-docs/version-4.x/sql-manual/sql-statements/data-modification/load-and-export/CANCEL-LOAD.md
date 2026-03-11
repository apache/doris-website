---
{
  "title": "CANCEL LOAD",
  "description": "この文は、指定されたラベルでインポートジョブをキャンセルするか、あいまい一致を通じてインポートジョブを一括でキャンセルするために使用されます。",
  "language": "ja"
}
---
## デスクリプション

この文は、指定された`label`を持つインポートジョブをキャンセルするため、またはファジーマッチングを通じてインポートジョブを一括でキャンセルするために使用されます。

## Syntax

```sql
CANCEL LOAD
[FROM <db_name>]
WHERE [LABEL = "<load_label>" | LABEL like "<label_pattern>" | STATE = { "PENDING" | "ETL" | "LOADING" } ]
```
## 必須パラメータ

**1. `<db_name>`**

> キャンセル対象のインポートジョブが存在するデータベースの名前。

## オプションパラメータ

**1. `<load_label>`**

> `LABEL = "<load_label>"`を使用した場合、指定されたラベルと正確に一致します。

**2. `<label_pattern>`**

> `LABEL LIKE "<label_pattern>"`を使用した場合、ラベルに`label_pattern`を含むインポートタスクと一致します。

**3. STATE = { " PENDING " | " ETL " | " LOADING " | " FINISHED " | " CANCELLED " }**

> `PENDING`を指定すると、`STATE = "PENDING"`ステータスのジョブをキャンセルします。他のステータスについても同様です。

## アクセス制御要件

このSQLコマンドを実行するユーザーには、最低限以下の権限が必要です：

| 権限 | オブジェクト | 備考 |
| :---------------- | :------------- | :---------------------------- |
| LOAD_PRIV | Database | データベースTableに対するインポート権限が必要です。 |

## 使用上の注意

- `State`に基づくジョブのキャンセルは、バージョン1.2.0以降でサポートされています。
- `PENDING`、`ETL`、または`LOADING`状態の未完了のインポートジョブのみキャンセル可能です。
- バッチキャンセルを実行する際、Dorisは対応するすべてのインポートジョブが原子的にキャンセルされることを保証しません。つまり、一部のインポートジョブのみが正常にキャンセルされる場合があります。ユーザーは`SHOW LOAD`文を使用してジョブステータスを確認し、`CANCEL LOAD`文を再実行することができます。

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
3. `LOADING` 状態のインポートジョブをキャンセルします。

   ```sql
   CANCEL LOAD
   FROM example_db
   WHERE STATE = "loading";
   ```
