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

| カラム名       | タイプ         | 説明                                                  |
| ----------------- | ------------ | ------------------------------------------------------------ |
| query_id          | varchar(48)  | Queryの ID                                              |
| time              | datetime(3)  | クエリが実行された時刻（ミリ秒）                           |
| client_ip         | varchar(128) | クエリを送信するクライアントのIPアドレス                   |
| user              | varchar(128) | ユーザー                                                         |
| catalog           | varchar(128) | ステートメント実行中の現在のカタログ                   |
| db                | varchar(128) | ステートメント実行中の現在のDatabase                  |
| state             | varchar(128) | ステートメントの実行ステータス                            |
| error_code        | int          | エラーコード                                                   |
| error_message     | text         | エラーメッセージ                                                |
| query_time        | bigint       | ステートメントの実行時間                              |
| scan_bytes        | bigint       | スキャンされたデータ量                                       |
| scan_rows         | bigint       | スキャンされた行数                                       |
| return_rows       | bigint       | 返された行数                                      |
| shuffleSendRows             | bigint  | ステートメント実行中にノード間で転送された行数。バージョン3.0以降でサポート。 |
| shuffleSendBytes            | bigint    | ステートメント実行中にノード間で転送されたデータ量。バージョン3.0以降でサポート。 | 
| scanBytesFromLocalStorage   | bigint    | ローカルディスクから読み取られたデータ量。バージョン3.0以降でサポート。 |
| scanBytesFromRemoteStorage  | bigint    | リモートストレージから読み取られたデータ量。バージョン3.0以降でサポート。 |
| stmt_id           | bigint       | ステートメントID                                                 |
| stmt_type                   | string    | ステートメントタイプ。バージョン3.0以降でサポート。 |
| is_query          | tinyint      | クエリかどうか                                        |
| is_nereids                  | booean    | Nereids Optimizerを使用しているかどうか。 |
| frontend_ip       | varchar(128) | 接続されたFrontendのIPアドレス                         |
| cpu_time_ms       | bigint       | ステートメント実行のためにBackendが消費した累積CPU時間（ミリ秒） |
| sql_hash          | varchar(128) | ステートメントのハッシュ値                                  |
| sql_digest        | varchar(128) | ステートメントのダイジェスト（署名）                          |
| peak_memory_bytes | bigint       | ステートメント実行中のBackendのピークメモリ使用量  |
| workload_group    | text         | ステートメント実行に使用されたWorkload Group                  |
| compute_group                 | string    | ストレージとコンピューティング分離モードにおいて、実行ステートメントが使用するコンピューティンググループ。バージョン3.0以降でサポート。|
| stmt              | text         | ステートメントテキスト                                               |


## 説明

- `client_ip`: プロキシサービスを使用してIPパススルーが有効になっていない場合、実際のクライアントIPではなくプロキシサービスのIPがここに記録される場合があります。
- `state`: `EOF`はクエリが正常に実行されたことを示します。`OK`はDDLおよびDMLステートメントが正常に実行されたことを示します。`ERR`はステートメント実行が失敗したことを示します。
- `scan_bytes`: BEによって処理されたデータのサイズを示します。これはディスクから読み取られたデータの非圧縮サイズを表し、Dorisの内部ページキャッシュから読み取られたデータも含まれ、クエリが処理する必要があるデータ量を真に反映します。この値は`scan_bytes_from_local_storage` + `scan_bytes_from_remote_storage`と等しくありません。
- `scan_rows`: クエリ実行中にスキャンされた行数を示します。Dorisは列指向ストレージデータベースであるため、まず述語フィルターを持つ列をスキャンし、次にフィルターされた結果に基づいて他の列をスキャンします。したがって、異なる列でスキャンされる行数は実際には異なります。実際、述語列でスキャンされる行数は非述語列よりも多く、この値はクエリ実行中の述語列でスキャンされた行数を反映します。
- `scan_bytes_from_local_storage`: ローカルディスクから読み取られたデータのサイズを示し、圧縮前のサイズです。Dorisのページキャッシュから読み取られたデータはカウントされませんが、オペレーティングシステムのページキャッシュからのデータはこの統計に含まれます。
- `scan_bytes_from_remote_storage`: リモートストレージから読み取られたデータのサイズを示し、圧縮前のサイズです。
