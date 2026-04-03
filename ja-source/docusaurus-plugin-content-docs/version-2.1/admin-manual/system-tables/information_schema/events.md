---
{
  "title": "イベント",
  "language": "ja",
  "description": "このテーブルはMySQLの動作との互換性のためのみに使用され、常に空です。"
}
---
## 概要

このテーブルはMySQLの動作との互換性のためにのみ使用され、常に空です。

## データベース


`information_schema`


## テーブル情報

| カラム名             | 型            | 説明        |
| -------------------- | ------------- | ----------- |
| EVENT_CATALOG        | varchar(64)   |             |
| EVENT_SCHEMA         | varchar(64)   |             |
| EVENT_NAME           | varchar(64)   |             |
| DEFINER              | varchar(77)   |             |
| TIME_ZONE            | varchar(64)   |             |
| EVENT_BODY           | varchar(8)    |             |
| EVENT_DEFINITION     | varchar(512)  |             |
| EVENT_TYPE           | varchar(9)    |             |
| EXECUTE_AT           | datetime      |             |
| INTERVAL_VALUE       | varchar(256)  |             |
| INTERVAL_FIELD       | varchar(18)   |             |
| SQL_MODE             | varchar(8192) |             |
| STARTS               | datetime      |             |
| ENDS                 | datetime      |             |
| STATUS               | varchar(18)   |             |
| ON_COMPLETION        | varchar(12)   |             |
| CREATED              | datetime      |             |
| LAST_ALTERED         | datetime      |             |
| LAST_EXECUTED        | datetime      |             |
| EVENT_COMMENT        | varchar(64)   |             |
| ORIGINATOR           | int           |             |
| CHARACTER_SET_CLIENT | varchar(32)   |             |
| COLLATION_CONNECTION | varchar(32)   |             |
| DATABASE_COLLATION   | varchar(32)   |             |
