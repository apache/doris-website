---
{
  "title": "session_variables",
  "language": "ja",
  "description": "セッション変数情報を表示する。"
}
---
## 概要

セッション変数情報を表示します。

## データベース


`information_schema`


## テーブル情報

| Column Name    | Type          | Description                                              |
| -------------- | ------------- | -------------------------------------------------------- |
| VARIABLE_NAME  | varchar(64)   | 変数名                                 |
| VARIABLE_VALUE | varchar(1024) | 現在の値                                        |
| DEFAULT_VALUE  | varchar(1024) | デフォルト値                                        |
| CHANGED        | varchar(4)    | 現在の値がデフォルト値と異なるかどうか |
