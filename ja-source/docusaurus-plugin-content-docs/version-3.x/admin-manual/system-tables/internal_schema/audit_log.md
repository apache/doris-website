---
{
  "title": "audit_log",
  "language": "ja",
  "description": "監査ログを保存する"
}
---
## 概要

監査ログを保存する

## データベース

`__internal_schema`

## テーブル情報

| カラム名 | 型 | 説明 |
| ----------------- | ------------ | ------------------------------------------------------------ |
| query_id          | varchar(48)  | Queryの ID                                              |
| time              | datetime(3)  | クエリが実行された時刻（ミリ秒単位）                           |
| client_ip         | varchar(128) | クエリを送信するクライアントのIPアドレス                   |
| user              | varchar(128) | ユーザー                                                         |
| catalog           | varchar(128) | ステートメント実行時の現在のカタログ                   |
| db                | varchar(128) | ステートメント実行時の現在のDatabase                  |
| state             | varchar(128) | ステートメントの実行ステータス                            |
| error_code        | int          | エラーコード                                                   |
| error_message     | text         | エラーメッセージ                                                |
| query_time        | bigint       | ステートメントの実行時間                              |
| scan_bytes        | bigint       | スキャンされたデータ量                                       |
| scan_rows         | bigint       | スキャンされた行数                                       |
| return_rows       | bigint       | 返された行数                                      |
| shuffleSendRows             | bigint  | ステートメント実行中にノード間で転送された行数。バージョン 3.0 以降でサポート。 |
| shuffleSendBytes            | bigint    | ステートメント実行中にノード間で転送されたデータ量。バージョン 3.0 以降でサポート。 | 
| scanBytesFromLocalStorage   | bigint    | ローカルディスクから読み取られたデータ量。バージョン 3.0 以降でサポート。 |
| scanBytesFromRemoteStorage  | bigint    | リモートストレージから読み取られたデータ量。バージョン 3.0 以降でサポート。 |
| stmt_id           | bigint       | ステートメントID                                                 |
| stmt_type                   | string    | ステートメントタイプ。バージョン 3.0 以降でサポート。 |
| is_query          | tinyint      | クエリかどうか                                        |
| is_nereids                  | booean    | Nereids Optimizerを使用しているかどうか。 |
| frontend_ip       | varchar(128) | 接続されたFrontendのIPアドレス                         |
| cpu_time_ms       | bigint       | ステートメント実行のためにBackendで消費された累積CPU時間（ミリ秒単位） |
| sql_hash          | varchar(128) | ステートメントのハッシュ値                                  |
| sql_digest        | varchar(128) | ステートメントのDigest（署名）                          |
| peak_memory_bytes | bigint       | ステートメント実行中のBackendのピークメモリ使用量  |
| workload_group    | text         | ステートメント実行に使用されたWorkload Group                  |
| compute_group                 | string    | ストレージとコンピュート分離モードにおいて、実行ステートメントで使用されるcompute group。バージョン 3.0 以降でサポート。|
| trace_id                    | string    | ステートメント実行時に設定されたTrace ID。バージョン 3.0.3 以降で削除 |
| stmt              | text         | ステートメントテキスト                                               |

## 説明

- `client_ip`: プロキシサービスが使用され、IP パススルーが有効になっていない場合、実際のクライアントIPの代わりにプロキシサービスIPがここに記録される可能性があります。
- `state`: `EOF` はクエリが正常に実行されたことを示します。`OK` はDDLおよびDMLステートメントが正常に実行されたことを示します。`ERR` はステートメント実行が失敗したことを示します。
