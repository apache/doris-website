---
{
  "title": "トリガー",
  "language": "ja",
  "description": "すべてのテーブル情報を格納します。"
}
---
## 概要

`triggers`テーブルはトリガーに関する情報を提供します。
現在、Apache DorisはMySQLとの互換性のためにこのテーブルをサポートしていますが、ユーザー定義トリガーはサポートしていません。このテーブルは常に空です。

## データベース

`information_schema`

## テーブル情報

| カラム名 | 型 | 説明 |
|---|---|---|
| TRIGGER_CATALOG | varchar(512) | トリガーが属するカタログの名前。常に'def'。 |
| TRIGGER_SCHEMA | varchar(64) | トリガーが属するスキーマ（データベース）の名前。 |
| TRIGGER_NAME | varchar(64) | トリガーの名前。 |
| EVENT_MANIPULATION | varchar(6) | トリガーイベント（INSERT、UPDATE、DELETE）。 |
| EVENT_OBJECT_CATALOG | varchar(512) | トリガーが関連付けられているテーブルのカタログ名。常に'def'。 |
| EVENT_OBJECT_SCHEMA | varchar(64) | トリガーが関連付けられているテーブルのスキーマ（データベース）名。 |
| EVENT_OBJECT_TABLE | varchar(64) | トリガーが関連付けられているテーブルの名前。 |
| ACTION_ORDER | bigint | トリガーの定義順序の序数。 |
| ACTION_CONDITION | varchar(512) | null |
| ACTION_STATEMENT | varchar(512) | トリガー本体。 |
| ACTION_ORIENTATION | varchar(9) | 常に'ROW'。 |
| ACTION_TIMING | varchar(6) | トリガータイミング（BEFORE、AFTER）。 |
| ACTION_REFERENCE_OLD_TABLE | varchar(64) | null |
| ACTION_REFERENCE_NEW_TABLE | varchar(64) | null |
| ACTION_REFERENCE_OLD_ROW | varchar(3) | 常に'OLD'。 |
| ACTION_REFERENCE_NEW_ROW | varchar(3) | 常に'NEW'。 |
| CREATED | datetime | トリガーが作成された時刻。 |
| SQL_MODE | varchar(8192) | トリガーが作成された時に有効だったSQLモード。 |
| DEFINER | varchar(77) | トリガーを作成したアカウント。 |
| CHARACTER_SET_CLIENT | varchar(32) | トリガーが作成された時のcharacter_set_clientシステム変数のセッション値。 |
| COLLATION_CONNECTION | varchar(32) | トリガーが作成された時のcollation_connectionシステム変数のセッション値。 |
| DATABASE_COLLATION | varchar(32) | トリガーが関連付けられているデータベースの照合順序。 |
