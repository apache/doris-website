---
{
  "title": "backend_configuration",
  "language": "ja",
  "description": "バックエンドの設定を表示します。（doris 3.0.7で追加）"
}
---
## 概要

Backends上の設定を表示します。（doris 3.0.7で追加）

## データベース

`information_schema`

## テーブル情報

| カラム名     | 型           | 説明                   |
| ------------ | ------------ | ---------------------- |
| BE_ID        | bigint       | BackendのID            |
| CONFIG_NAME  | varchar(256) | 設定名                 |
| CONFIG_TYPE  | varchar(256) | 設定データ型           |
| CONFIG_VALUE | bigint       | 設定値                 |
| IS_MUTABLE   | bool         | 設定が変更可能かどうか |
