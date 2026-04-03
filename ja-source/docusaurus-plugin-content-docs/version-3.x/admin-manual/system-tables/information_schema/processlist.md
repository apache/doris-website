---
{
  "title": "プロセスリスト",
  "language": "ja",
  "description": "現在の接続をすべて表示"
}
---
## 概要

すべての現在の接続を表示

## データベース

`information_schema`

## テーブル情報

| Column Name       | タイプ           | 詳細                          |
| ----------------- | -------------- | ------------------------------------ |
| CURRENT_CONNECTED | varchar(16)    | 非推奨、常にNo                        |
| ID                | largeint       | 接続ID                               |
| USER              | varchar(32)    | 接続ユーザー                          |
| HOST              | varchar(261)   | 接続アドレス                          |
| LOGIN_TIME        | datetime       | ログイン時刻                          |
| CATALOG           | varchar(64)    | 現在のカタログ                        |
| DB                | varchar(64)    | 現在のDatabase                       |
| COMMAND           | varchar(16)    | 現在送信されているMySQLコマンドの種類    |
| TIME              | int            | 最後のクエリの実行時間                 |
| STATE             | varchar(64)    | 最後のクエリのステータス               |
| QUERY_ID          | varchar(256)   | 最後のクエリのID                      |
| INFO              | varchar(65533) | 最後のクエリのクエリステートメント      |
| FE                | varchar(64)    | 接続されたFront-End (FE)             |
| CLOUD_CLUSTER     | varchar(64)    | 使用されているCloud クラスターの名前     |
