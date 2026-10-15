---
{
    "title": "table_properties",
    "language": "ja",
    "description": "内部テーブルと外部テーブルを含む、テーブルの属性情報を表示するために使用します。"
}
---

## 概要

内部テーブルと外部テーブルを含む、テーブルの属性情報を表示するために使用します。

## データベース


`information_schema`


## テーブル情報

| カラム名       | 型          | 説明                             |
| -------------- | ----------- | --------------------------------------- |
| TABLE_CATALOG  | varchar(64) | テーブルが属するカタログ |
| TABLE_SCHEMA   | varchar(64) | テーブルが属するデータベース |
| TABLE_NAME     | varchar(64) | テーブル名 |
| PROPERTY_NAME  | string      | プロパティ名 |
| PROPERTY_VALUE | string      | プロパティの値 |
