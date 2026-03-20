---
{
  "title": "スキーマ",
  "language": "ja",
  "description": "データベースに関連する情報を表示します。"
}
---
## 概要

データベースに関連する情報を表示します。

## Database

`information_schema`

## テーブル情報

| Column Name                | タイプ         | 詳細                                           |
| -------------------------- | ------------ | ----------------------------------------------------- |
| CATALOG_NAME               | varchar(512) | カタログの名前                               |
| SCHEMA_NAME                | varchar(32)  | Databaseの名前                              |
| DEFAULT_CHARACTER_SET_NAME | varchar(32)  | MySQLとの互換性のためのみ、実際の機能はありません |
| DEFAULT_COLLATION_NAME     | varchar(32)  | MySQLとの互換性のためのみ、実際の機能はありません |
| SQL_PATH                   | varchar(512) | MySQLとの互換性のためのみ、実際の機能はありません |
| DEFAULT_ENCRYPTION         | varchar(3)   | MySQLとの互換性のためのみ、実際の機能はありません |
