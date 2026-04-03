---
{
  "title": "ビュー",
  "language": "ja",
  "description": "すべてのビュー情報を格納します。"
}
---
## 概要

すべてのビュー情報を格納します。

## データベース

`information_schema`

## テーブル情報

| Column Name          | タイプ          | 詳細                                       |
| -------------------- | ------------- | ------------------------------------------------- |
| TABLE_CATALOG        | varchar(512)  | カタログ名                                          |
| TABLE_SCHEMA         | varchar(64)   | データベース名                                        |
| TABLE_NAME           | varchar(64)   | ビュー名                                           |
| VIEW_DEFINITION      | varchar(8096) | ビュー定義文                                        |
| CHECK_OPTION         | varchar(8)    | 実用的な効果なし、MySQL互換性のためのみ                    |
| IS_UPDATABLE         | varchar(3)    | 実用的な効果なし、MySQL互換性のためのみ                    |
| DEFINER              | varchar(77)   | 実用的な効果なし、MySQL互換性のためのみ                    |
| SECURITY_TYPE        | varchar(7)    | 実用的な効果なし、MySQL互換性のためのみ                    |
| CHARACTER_SET_CLIENT | varchar(32)   | 実用的な効果なし、MySQL互換性のためのみ                    |
| COLLATION_CONNECTION | varchar(32)   | 実用的な効果なし、MySQL互換性のためのみ                    |
