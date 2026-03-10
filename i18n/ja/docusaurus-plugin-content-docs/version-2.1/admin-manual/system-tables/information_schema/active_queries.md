---
{
  "title": "active_queries",
  "language": "ja",
  "description": "現在実行中のクエリを表示するために使用されます"
}
---
## 概要

現在実行中のクエリを表示するために使用されます

## Database


`information_schema`


## テーブル情報

| Column Name       | Type         | Description                                                  |
| ----------------- | ------------ | ------------------------------------------------------------ |
| QUERY_ID          | varchar(256) | クエリのID                                          |
| QUERY_START_TIME  | varchar(256) | クエリの開始時刻                                  |
| QUERY_TIME_MS     | bigint       | クエリの実行時間                              |
| WORKLOAD_GROUP_ID | bigint       | クエリが属するWorkload GroupのID      |
| DATABASE          | varchar(256) | クエリが実行されたDatabase                    |
| FRONTEND_INSTANCE | varchar(256) | クエリリクエストを受信したFrontendインスタンスのIPアドレス |
| QUEUE_START_TIME  | varchar(256) | キューイングの開始時刻；キューイングされていない場合は空               |
| QUEUE_END_TIME    | varchar(256) | キューイングの終了時刻；キューイングされていない場合は空                 |
| QUERY_STATUS      | varchar(256) | クエリのステータス                                      |
| SQL               | text         | クエリステートメントのテキスト                              |
