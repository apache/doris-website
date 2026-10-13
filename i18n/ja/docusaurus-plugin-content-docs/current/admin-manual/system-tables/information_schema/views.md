---
{
    "title": "views",
    "language": "ja",
    "description": "すべてのビューの情報を格納します。"
}
---

## 概要

すべてのビューの情報を格納します。

## データベース


`information_schema`


## テーブル情報

| カラム名          | 型          | 説明                                       |
| -------------------- | ------------- | ------------------------------------------------- |
| TABLE_CATALOG        | varchar(512)  | カタログ名 |
| TABLE_SCHEMA         | varchar(64)   | データベース名 |
| TABLE_NAME           | varchar(64)   | ビュー名 |
| VIEW_DEFINITION      | varchar(8096) | ビューの定義文 |
| CHECK_OPTION         | varchar(8)    | 実際の機能はなく、MySQL との互換性のために存在します |
| IS_UPDATABLE         | varchar(3)    | 実際の機能はなく、MySQL との互換性のために存在します |
| DEFINER              | varchar(77)   | 実際の機能はなく、MySQL との互換性のために存在します |
| SECURITY_TYPE        | varchar(7)    | 実際の機能はなく、MySQL との互換性のために存在します |
| CHARACTER_SET_CLIENT | varchar(32)   | 実際の機能はなく、MySQL との互換性のために存在します |
| COLLATION_CONNECTION | varchar(32)   | 実際の機能はなく、MySQL との互換性のために存在します |
