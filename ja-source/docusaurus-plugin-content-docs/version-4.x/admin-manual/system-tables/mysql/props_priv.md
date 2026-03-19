---
{
  "title": "procs_priv",
  "language": "ja",
  "description": "このテーブルはMySQLの動作との互換性のみを目的としています。常に空です。"
}
---
## 概要

このテーブルはMySQLの動作との互換性を目的としたもので、常に空の状態です。

## データベース


`mysql`


## テーブル情報

| カラム名     | 型       | 説明        |
| ------------ | -------- | ----------- |
| host         | char(60) |             |
| db           | char(64) |             |
| user         | char(32) |             |
| routine_name | char(64) |             |
| routine_type | char(9)  |             |
| grantor      | char(93) |             |
| proc_priv    | char(16) |             |
| timestamp    | char(1)  |             |
