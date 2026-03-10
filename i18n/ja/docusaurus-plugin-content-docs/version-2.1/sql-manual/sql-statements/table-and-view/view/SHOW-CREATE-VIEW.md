---
{
  "title": "SHOW CREATE VIEW",
  "language": "ja",
  "description": "指定されたビューを作成するために使用されたCREATE VIEW文を表示します。"
}
---
## 説明

指定されたビューの作成に使用されたCREATE VIEW文を表示します。

## 構文

```sql
SHOW CREATE VIEW <name>
```
## 必須パラメータ

`**<name>**`  表示するビューの名前。

## 結果の説明

- View: クエリしたビューの名前。
- Create View: データベース内に永続化されたSQL文。
- character_set_client: ビューが作成されたときのセッションにおけるcharacter_set_clientシステム変数の値。
- collation_connection: ビューが作成されたときのセッションにおけるcollation_connectionシステム変数の値。

## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持っている必要があります：

| 権限             | オブジェクト | 注意事項 |
| ---------------- | ------ | ----- |
| SHOW_VIEW_PRIV   | Table  |       |

ビュー情報はINFORMATION_SCHEMA.VIEWSテーブル経由でもクエリできます。

## 例

```sql
CREATE VIEW vtest AS SELECT 1, 'test';
SHOW CREATE VIEW vtest;
```
クエリ結果:

```sql
+-------+------------------------------------------+----------------------+----------------------+
| View  | Create View                              | character_set_client | collation_connection |
+-------+------------------------------------------+----------------------+----------------------+
| vtest | CREATE VIEW `vtest` AS SELECT 1, 'test'; | utf8mb4              | utf8mb4_0900_bin     |
+-------+------------------------------------------+----------------------+----------------------+
```
