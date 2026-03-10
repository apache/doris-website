---
{
  "title": "table_properties",
  "language": "ja",
  "description": "テーブル（内部テーブルおよび外部テーブルを含む）の属性情報を表示するために使用されます。"
}
---
## 概要

テーブルの属性情報を表示するために使用されます（内部テーブルと外部テーブルを含む）。

## データベース

`information_schema`

## テーブル情報

| カラム名       | 型          | 説明                           |
| -------------- | ----------- | ------------------------------ |
| TABLE_CATALOG  | varchar(64) | テーブルが属するCatalog        |
| TABLE_SCHEMA   | varchar(64) | テーブルが属するDatabase       |
| TABLE_NAME     | varchar(64) | テーブルの名前                 |
| PROPERTY_NAME  | string      | プロパティの名前               |
| PROPERTY_VALUE | string      | プロパティの値                 |
