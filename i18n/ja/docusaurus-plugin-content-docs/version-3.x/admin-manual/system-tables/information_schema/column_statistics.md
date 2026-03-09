---
{
  "title": "column_statistics | 情報スキーマ",
  "language": "ja",
  "description": "このテーブルはMySQLの動作との互換性のためにのみ使用され、常に空です。",
  "sidebar_label": "column_statistics"
}
---
# column_statistics

## 概要

このテーブルは MySQL の動作との互換性のためにのみ使用され、常に空です。Doris 内のデータの統計情報を真に反映するものではありません。Doris によって収集された統計情報を表示するには、[Statistics](../../../query-acceleration/optimization-technology-principle/statistics#viewing-statistics) セクションを参照してください。

## Database

`information_schema`

## テーブル情報

| Column Name | Type        | Description |
| ----------- | ----------- | ----------- |
| SCHEMA_NAME | varchar(64) |             |
| TABLE_NAME  | varchar(64) |             |
| COLUMN_NAME | varchar(64) |             |
| HISTOGRAM   | json        |             |
