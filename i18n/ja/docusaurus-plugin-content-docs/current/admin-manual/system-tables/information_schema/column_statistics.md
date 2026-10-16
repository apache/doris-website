---
{
    "title": "列の統計情報 | 情報スキーマ",
    "language": "ja",
    "description": "このテーブルは MySQL の動作との互換性を保つためだけに存在し、常に空です。",
    "sidebar_label": "列の統計情報"
}
---

# 列の統計情報

## 概要

このテーブルは MySQL の動作との互換性を保つためだけに存在し、常に空です。Doris 内のデータの統計情報を実際に反映するものではありません。Doris が収集した統計情報を確認するには、[統計情報](../../../query-acceleration/optimization-technology-principle/statistics#viewing-column-statistics)を参照してください。

## データベース


`information_schema`


## テーブル情報

| 列名        | 型          | 説明 |
| ----------- | ----------- | ---- |
| SCHEMA_NAME | varchar(64) |      |
| TABLE_NAME  | varchar(64) |      |
| COLUMN_NAME | varchar(64) |      |
| HISTOGRAM   | json        |      |
