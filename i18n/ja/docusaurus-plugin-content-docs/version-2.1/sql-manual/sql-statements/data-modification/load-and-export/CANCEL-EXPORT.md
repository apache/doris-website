---
{
  "title": "エクスポートをキャンセル",
  "language": "ja",
  "description": "このステートメントは、指定されたラベルのエクスポートジョブを取り消すために使用されます。または、あいまい一致によりエクスポートジョブを一括取り消しします。"
}
---
## 説明

このステートメントは、指定されたラベルのエクスポートジョブを取り消すために使用されます。または、あいまい一致によってエクスポートジョブを一括で取り消します。

## 構文

```sql
CANCEL EXPORT
[ FROM <db_name> ]
WHERE [ LABEL = "<export_label>" | LABEL like "<label_pattern>" | STATE = "<state>" ]
```
## オプションパラメータ

**1. `<db_name>`**

  エクスポートデータタスクが属するデータベースの名前。省略した場合、デフォルトは現在のデータベースです。

**2. `<export_label>`**

  各インポートには一意のLabelを割り当てる必要があります。このタスクを停止するにはlabelを指定する必要があります。

**3. `<label_pattern>`**

  あいまい一致のためのラベル式。複数のEXPORTジョブを取り消したい場合は、あいまい一致に`LIKE`を使用できます。

**4. `<state>`**

  stateオプション：`PENDING`、`IN_QUEUE`、`EXPORTING`。

## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持っている必要があります：

| 権限          | オブジェクト | 注記                                |
|:-------------|:-----------|:------------------------------------|
| ALTER_PRIV   | Database   | データベースへの変更アクセスが必要です。 |

## 使用上の注意

1. PENDING、IN_QUEUE、EXPORTINGステートの保留中のエクスポートジョブのみキャンセルできます。
2. バッチ取り消しを実行する際、Dorisは対応するすべてのエクスポートジョブの原子的な取り消しを保証しません。つまり、エクスポートジョブの一部のみが正常に取り消される可能性があります。ユーザーはSHOW EXPORTステートメントでジョブステータスを確認し、CANCEL EXPORTステートメントを繰り返し実行してみることができます。
3. `EXPORTING`ステートのジョブが取り消された場合、データの一部がストレージシステムにすでにエクスポートされている可能性があり、ユーザーはこのセクションを処理（削除）してデータをエクスポートする必要があります。

## 例

- データベースexample_db上でlabelが`example_db_test_export_label`のエクスポートジョブをキャンセルする。

   ```sql
   CANCEL EXPORT
   FROM example_db
   WHERE LABEL = "example_db_test_export_label" and STATE = "EXPORTING";
   ```
- データベースexample*db上のexample*を含むすべてのエクスポートジョブをキャンセルします。

   ```sql
   CANCEL EXPORT
   FROM example_db
   WHERE LABEL like "%example%";
   ```
- 状態が"PENDING"のすべてのエクスポートジョブをキャンセルする

   ```sql
   CANCEL EXPORT
   FROM example_db
   WHERE STATE = "PENDING";
   ```
