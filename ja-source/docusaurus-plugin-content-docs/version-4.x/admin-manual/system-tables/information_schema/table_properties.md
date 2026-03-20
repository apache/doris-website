---
{
  "title": "table_properties",
  "language": "ja",
  "description": "テーブル（内部テーブルと外部テーブルを含む）の属性情報を表示するために使用されます。"
}
---
## 概要

テーブル（内部テーブルおよび外部テーブルを含む）の属性情報を表示するために使用されます。

## Database

`information_schema`

## テーブル情報

| Column Name    | タイプ        | 詳細                     |
| -------------- | ----------- | ------------------------------- |
| TABLE_CATALOG  | varchar(64) | テーブルが属するカタログ         |
| TABLE_SCHEMA   | varchar(64) | テーブルが属するDatabase        |
| TABLE_NAME     | varchar(64) | テーブルの名前                  |
| PROPERTY_NAME  | string      | プロパティの名前                |
| PROPERTY_VALUE | string      | プロパティの値                  |
