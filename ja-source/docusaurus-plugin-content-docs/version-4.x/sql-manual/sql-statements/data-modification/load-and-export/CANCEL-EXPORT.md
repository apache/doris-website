---
{
  "title": "エクスポートのキャンセル",
  "description": "この文は、指定されたラベルのエクスポートジョブを取り消すために使用されます。または、あいまい一致によってエクスポートジョブを一括で取り消します。",
  "language": "ja"
}
---
## 説明

この文は、指定されたラベルのエクスポートジョブを取り消すために使用されます。または、あいまい一致を使用してエクスポートジョブを一括で取り消すために使用されます。

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

  各インポートには一意のLabelを割り当てる必要があります。このタスクを停止するには、ラベルを指定する必要があります。

**3. `<label_pattern>`**

  あいまい一致用のラベル式。複数のEXPORTジョブを取り消したい場合は、`LIKE`をあいまい一致に使用できます。

**4. `<state>`**

  stateオプション: `PENDING`,`IN_QUEUE`,`EXPORTING`。

## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持っている必要があります：

| 権限          | オブジェクト | 備考                               |
|:--------------|:-------------|:-----------------------------------|
| ALTER_PRIV    | Database     | データベースへの変更アクセスが必要。 |


## 使用上の注意

1. PENDING、IN_QUEUE、EXPORTING状態の保留中のエクスポートジョブのみキャンセルできます。
2. バッチ取り消しを実行する場合、Dorisは対応するすべてのエクスポートジョブのアトミックな取り消しを保証しません。つまり、一部のエクスポートジョブのみが正常に取り消される可能性があります。ユーザーはSHOW EXPORT文を通じてジョブステータスを確認し、CANCEL EXPORT文を繰り返し実行することができます。
3. `EXPORTING`状態のジョブが取り消された場合、データの一部がすでにストレージシステムにエクスポートされている可能性があり、ユーザーはこの部分を処理（削除）してデータをエクスポートする必要があります。

## 例

- データベースexample_dbで、ラベルが`example_db_test_export_label`のエクスポートジョブをキャンセルする。

   ```sql
   CANCEL EXPORT
   FROM example_db
   WHERE LABEL = "example_db_test_export_label" and STATE = "EXPORTING";
   ```
- example*dbデータベース上のexample*を含むすべてのエクスポートジョブをキャンセルします。

   ```sql
   CANCEL EXPORT
   FROM example_db
   WHERE LABEL like "%example%";
   ```
状態が"PENDING"であるすべてのexportジョブをキャンセルする

   ```sql
   CANCEL EXPORT
   FROM example_db
   WHERE STATE = "PENDING";
   ```
