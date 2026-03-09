---
{
  "title": "backend_configuration",
  "language": "ja",
  "description": "Backendsで設定を確認してください。"
}
---
## 概要

Backendsの設定を表示します。

## Database

`information_schema`

## テーブル情報

| Column Name  | Type         | Description           |
| ------------ | ------------ | --------------------- |
| BE_ID        | bigint       | BackendのID           |
| CONFIG_NAME  | varchar(256) | 設定名                |
| CONFIG_TYPE  | varchar(256) | 設定データ型          |
| CONFIG_VALUE | bigint       | 設定値                |
| IS_MUTABLE   | bool         | 設定が変更可能        |
