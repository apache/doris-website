---
{
  "title": "カラム統計 | 情報スキーマ",
  "language": "ja",
  "description": "このテーブルはMySQLの動作との互換性のためのみに使用され、常に空です。",
  "sidebar_label": "Column Statistics"
}
---
# Column Statistics

## 概要

このテーブルはMySQLの動作との互換性のためにのみ使用されており、常に空です。Doris内のデータの統計情報を真に反映するものではありません。Dorisによって収集された統計情報を表示するには、[Statistics](../../../query-acceleration/optimization-technology-principle/statistics#viewing-statistics)セクションを参照してください。

## Database

`information_schema`

## テーブル情報

| Column Name | タイプ        | 詳細 |
| ----------- | ----------- | ----------- |
| SCHEMA_NAME | varchar(64) |             |
| TABLE_NAME  | varchar(64) |             |
| COLUMN_NAME | varchar(64) |             |
| HISTOGRAM   | json        |             |
