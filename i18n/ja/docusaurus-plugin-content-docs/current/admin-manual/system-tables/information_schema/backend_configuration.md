---
{
    "title": "backend_configuration",
    "language": "ja",
    "description": "Backend の設定を確認できます。"
}
---

## 概要

Backend の設定を確認できます。

## データベース


`information_schema`


## テーブル情報

| カラム名     | 型           | 説明                         |
| ------------ | ------------ | ---------------------------- |
| BE_ID        | bigint       | Backend の ID                |
| CONFIG_NAME  | varchar(256) | 設定名                       |
| CONFIG_TYPE  | varchar(256) | 設定値のデータ型             |
| CONFIG_VALUE | bigint       | 設定値                       |
| IS_MUTABLE   | bool         | 設定を変更できるかどうか     |
