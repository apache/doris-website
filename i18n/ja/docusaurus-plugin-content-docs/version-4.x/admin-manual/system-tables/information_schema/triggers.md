---
{
    "title": "triggers",
    "language": "ja",
    "description": "トリガーに関する情報を示します。Doris は MySQL との互換性のためにこのテーブルを用意していますが、常に空です。"
}
---

## 概要

`triggers` テーブルはトリガーに関する情報を示します。
現在、Apache Doris は MySQL との互換性のためにこのテーブルを用意していますが、ユーザー定義のトリガーはサポートしていません。このテーブルは常に空です。

## データベース

`information_schema`

## テーブル情報

| カラム名 | 型 | 説明 |
|---|---|---|
| TRIGGER_CATALOG | varchar(512) | トリガーが属するカタログの名前。常に 'def' です。 |
| TRIGGER_SCHEMA | varchar(64) | トリガーが属するスキーマ（データベース）の名前。 |
| TRIGGER_NAME | varchar(64) | トリガーの名前。 |
| EVENT_MANIPULATION | varchar(6) | トリガーイベント（INSERT、UPDATE、DELETE）。 |
| EVENT_OBJECT_CATALOG | varchar(512) | トリガーに関連付けられたテーブルのカタログ名。常に 'def' です。 |
| EVENT_OBJECT_SCHEMA | varchar(64) | トリガーに関連付けられたテーブルのスキーマ（データベース）名。 |
| EVENT_OBJECT_TABLE | varchar(64) | トリガーに関連付けられたテーブルの名前。 |
| ACTION_ORDER | bigint | トリガーの定義順序。 |
| ACTION_CONDITION | varchar(512) | null |
| ACTION_STATEMENT | varchar(512) | トリガーの本体。 |
| ACTION_ORIENTATION | varchar(9) | 常に 'ROW' です。 |
| ACTION_TIMING | varchar(6) | トリガーが実行されるタイミング（BEFORE、AFTER）。 |
| ACTION_REFERENCE_OLD_TABLE | varchar(64) | null |
| ACTION_REFERENCE_NEW_TABLE | varchar(64) | null |
| ACTION_REFERENCE_OLD_ROW | varchar(3) | 常に 'OLD' です。 |
| ACTION_REFERENCE_NEW_ROW | varchar(3) | 常に 'NEW' です。 |
| CREATED | datetime | トリガーが作成された時刻。 |
| SQL_MODE | varchar(8192) | トリガー作成時に有効だった SQL モード。 |
| DEFINER | varchar(77) | トリガーを作成したアカウント。 |
| CHARACTER_SET_CLIENT | varchar(32) | トリガー作成時の character_set_client システム変数のセッション値。 |
| COLLATION_CONNECTION | varchar(32) | トリガー作成時の collation_connection システム変数のセッション値。 |
| DATABASE_COLLATION | varchar(32) | トリガーに関連付けられたデータベースの照合順序。 |
