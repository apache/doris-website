---
{
    "title": "processlist",
    "language": "ja",
    "description": "現在のすべての接続を表示します。"
}
---

## 概要

現在のすべての接続を表示します。

## データベース


`information_schema`


## テーブル情報

| カラム名          | 型             | 説明 |
| ----------------- | -------------- | ------------------------------------ |
| CURRENT_CONNECTED | varchar(16)    | 非推奨。常に No |
| ID                | largeint       | 接続 ID |
| USER              | varchar(32)    | 接続しているユーザー |
| HOST              | varchar(261)   | 接続アドレス |
| LOGIN_TIME        | datetime       | ログイン時刻 |
| CATALOG           | varchar(64)    | 現在のカタログ |
| DB                | varchar(64)    | 現在のデータベース |
| COMMAND           | varchar(16)    | 現在送信されている MySQL コマンドの種類 |
| TIME              | int            | 直近のクエリの実行時間 |
| STATE             | varchar(64)    | 直近のクエリの状態 |
| QUERY_ID          | varchar(256)   | 直近のクエリの ID |
| INFO              | varchar(65533) | 直近のクエリ文 |
| FE                | varchar(64)    | 接続先の Frontend (FE) |
| COMPUTE_GROUP     | varchar(64)    | 使用中の Compute Group 名 |
