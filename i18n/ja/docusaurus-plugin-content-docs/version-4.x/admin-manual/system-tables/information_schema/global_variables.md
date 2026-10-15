---
{
    "title": "global_variables",
    "language": "ja",
    "description": "グローバル変数を表示します。"
}
---

## 概要

グローバル変数を表示します。

## データベース


`information_schema`


## テーブル情報

| カラム名       | 型            | 説明                                   |
| -------------- | ------------- | -------------------------------------- |
| VARIABLE_NAME  | varchar(64)   | 変数の名前                             |
| VARIABLE_VALUE | varchar(1024) | 変数の現在の値                         |
| DEFAULT_VALUE  | varchar(1024) | 変数のデフォルト値                     |
| CHANGED        | varchar(4)    | 現在の値がデフォルト値と異なるかを示します |
