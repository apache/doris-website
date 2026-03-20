---
{
  "title": "session_variables",
  "language": "ja",
  "description": "セッション変数情報を表示します。"
}
---
## 概要

セッション変数情報を表示します。

## データベース

`information_schema`

## テーブル情報

| 列名           | 型            | 説明                                     |
| -------------- | ------------- | ---------------------------------------- |
| VARIABLE_NAME  | varchar(64)   | 変数の名前                               |
| VARIABLE_VALUE | varchar(1024) | 現在の値                                 |
| DEFAULT_VALUE  | varchar(1024) | デフォルト値                             |
| CHANGED        | varchar(4)    | 現在の値がデフォルト値と異なるかどうか   |
