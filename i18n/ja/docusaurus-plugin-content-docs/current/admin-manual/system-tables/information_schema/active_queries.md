---
{
    "title": "active_queries",
    "language": "ja",
    "description": "現在実行中のクエリを確認するために使用します。"
}
---

## 概要

現在実行中のクエリを確認するために使用します。

## データベース


`information_schema`


## テーブル情報

| カラム名          | 型           | 説明 |
| ----------------- | ------------ | ---- |
| QUERY_ID          | varchar(256) | クエリの ID |
| QUERY_START_TIME  | varchar(256) | クエリの開始時刻 |
| QUERY_TIME_MS     | bigint       | クエリの実行時間 |
| WORKLOAD_GROUP_ID | bigint       | クエリが属する Workload Group の ID |
| DATABASE          | varchar(256) | クエリが実行されたデータベース |
| FRONTEND_INSTANCE | varchar(256) | クエリのリクエストを受け取った Frontend インスタンスの IP アドレス |
| QUEUE_START_TIME  | varchar(256) | キュー待機の開始時刻。キューに入っていない場合は空 |
| QUEUE_END_TIME    | varchar(256) | キュー待機の終了時刻。キューに入っていない場合は空 |
| QUERY_STATUS      | varchar(256) | クエリのステータス |
| SQL               | text         | クエリ文のテキスト |
