---
{
    "title": "CANCEL EXPORT",
    "language": "ja",
    "description": "このステートメントは、指定したラベルのエクスポートジョブを取り消します。あいまい一致を使用して、複数のエクスポートジョブを一括で取り消すこともできます。"
}
---

## 説明

このステートメントは、指定したラベルのエクスポートジョブを取り消します。あいまい一致を使用して、複数のエクスポートジョブを一括で取り消すこともできます。

## 構文  

```sql
CANCEL EXPORT
[ FROM <db_name> ]
WHERE [ LABEL = "<export_label>" | LABEL like "<label_pattern>" | STATE = "<state>" ]
```

## 任意パラメータ

**1. `<db_name>`**

  エクスポートジョブが属するデータベースの名前です。省略した場合は、現在のデータベースが使用されます。

**2. `<export_label>`**

  各インポートには一意の Label を割り当てる必要があります。このジョブを停止するには、そのラベルを指定します。

**3. `<label_pattern>`**

  あいまい一致に使用するラベルの式です。複数の EXPORT ジョブを取り消す場合は、`LIKE` を使用してあいまい一致で指定できます。

**4. `<state>`**

  指定できる状態は `PENDING`、`IN_QUEUE`、`EXPORTING` です。

## アクセス制御要件

この SQL コマンドを実行するユーザーには、少なくとも次の権限が必要です。

| 権限          | オブジェクト   | 備考                                         |
|:--------------|:----------|:----------------------------------------------|
| ALTER_PRIV    | データベース   | データベースを変更する権限が必要です。       |


## 使用上の注意

1. 取り消せるのは、PENDING、IN_QUEUE、EXPORTING 状態の未完了のエクスポートジョブだけです。
2. 一括で取り消す場合、Doris は対象となるすべてのエクスポートジョブが原子的に取り消されることを保証しません。一部のジョブだけが正常に取り消される可能性があります。SHOW EXPORT ステートメントでジョブの状態を確認し、必要に応じて CANCEL EXPORT ステートメントを再実行してください。
3. `EXPORTING` 状態のジョブを取り消した場合、データの一部がストレージシステムにエクスポート済みである可能性があります。ユーザーは、そのエクスポート済みデータを処理（削除）する必要があります。

## 例

- データベース example_db で、ラベルが `example_db_test_export_label` のエクスポートジョブを取り消します。

   ```sql
   CANCEL EXPORT
   FROM example_db
   WHERE LABEL = "example_db_test_export_label" and STATE = "EXPORTING";
   ```

- データベース example*db で、example* を含むすべてのエクスポートジョブを取り消します。

   ```sql
   CANCEL EXPORT
   FROM example_db
   WHERE LABEL like "%example%";
   ```

- "PENDING" 状態のすべてのエクスポートジョブを取り消します。

   ```sql
   CANCEL EXPORT
   FROM example_db
   WHERE STATE = "PENDING";
   ```
