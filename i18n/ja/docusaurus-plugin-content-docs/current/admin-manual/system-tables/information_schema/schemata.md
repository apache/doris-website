---
{
    "title": "schemata",
    "language": "ja",
    "description": "データベースに関する情報を表示します。"
}
---

## 概要

データベースに関する情報を表示します。

## データベース


`information_schema`


## テーブル情報

| カラム名                   | 型           | 説明                                                 |
| -------------------------- | ------------ | ---------------------------------------------------- |
| CATALOG_NAME               | varchar(512) | カタログ名                                           |
| SCHEMA_NAME                | varchar(32)  | データベース名                                       |
| DEFAULT_CHARACTER_SET_NAME | varchar(32)  | 実際の機能はなく、MySQL との互換性のために存在します |
| DEFAULT_COLLATION_NAME     | varchar(32)  | 実際の機能はなく、MySQL との互換性のために存在します |
| SQL_PATH                   | varchar(512) | 実際の機能はなく、MySQL との互換性のために存在します |
| DEFAULT_ENCRYPTION         | varchar(3)   | 実際の機能はなく、MySQL との互換性のために存在します |
