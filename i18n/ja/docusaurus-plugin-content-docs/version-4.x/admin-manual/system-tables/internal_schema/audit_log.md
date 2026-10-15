---
{
    "title": "audit_log",
    "language": "ja",
    "description": "監査ログを格納します"
}
---

## 概要

監査ログを格納します

## データベース


`__internal_schema`


## テーブル情報

| カラム名       | 型         | 説明                                                  |
| ----------------- | ------------ | ------------------------------------------------------------ |
| query_id          | varchar(48)  | クエリの ID |
| time              | datetime(3)  | クエリの実行時刻（ミリ秒精度） |
| client_ip         | varchar(128) | クエリを送信したクライアントの IP アドレス |
| user              | varchar(128) | ユーザー |
| catalog           | varchar(128) | ステートメント実行時の現在の Catalog |
| db                | varchar(128) | ステートメント実行時の現在のデータベース |
| state             | varchar(128) | ステートメントの実行状態 |
| error_code        | int          | エラーコード |
| error_message     | text         | エラーメッセージ |
| query_time        | bigint       | ステートメントの実行時間 |
| queue_time_ms     | bigint       | ステートメントが Workload キューで待機した時間（ミリ秒）。バージョン 4.1.4 以降でサポートされます。テーブルスキーマでは `query_time` と `cpu_time_ms` の間に配置されます。 |
| scan_bytes        | bigint       | スキャンしたデータ量 |
| scan_rows         | bigint       | スキャンした行数 |
| return_rows       | bigint       | 返された行数 |
| shuffle_send_rows             | bigint  | ステートメント実行中にノード間で転送された行数。バージョン 3.0 以降でサポートされます。 |
| shuffle_send_bytes            | bigint    | ステートメント実行中にノード間で転送されたデータ量。バージョン 3.0 以降でサポートされます。 |
| scan_bytes_from_local_storage   | bigint    | ローカルディスクから読み取ったデータ量。バージョン 3.0 以降でサポートされます。 |
| scan_bytes_from_remote_storage  | bigint    | リモートストレージから読み取ったデータ量。バージョン 3.0 以降でサポートされます。 |
| stmt_id           | bigint       | ステートメント ID |
| stmt_type                   | string    | ステートメントの種類。バージョン 3.0 以降でサポートされます。 |
| is_query          | tinyint      | クエリかどうか |
| is_nereids                  | boolean    | Nereids Optimizer を使用しているかどうか。 |
| frontend_ip       | varchar(128) | 接続先 Frontend の IP アドレス |
| cpu_time_ms       | bigint       | ステートメント実行時に Backend が消費した累積 CPU 時間（ミリ秒） |
| sql_hash          | varchar(128) | ステートメントのハッシュ値 |
| sql_digest        | varchar(128) | ステートメントのダイジェスト（署名） |
| peak_memory_bytes | bigint       | ステートメント実行中の Backend のピークメモリ使用量 |
| workload_group    | text         | ステートメント実行に使用した Workload Group |
| compute_group                 | string    | ストレージとコンピュートの分離モードで、ステートメント実行に使用した Compute Group。バージョン 3.0 以降でサポートされます。 |
| stmt              | text         | ステートメントのテキスト |


## 説明

- `client_ip`：プロキシサービスを使用し、IP アドレスの透過転送を有効にしていない場合、実際のクライアント IP アドレスではなくプロキシサービスの IP アドレスが記録されることがあります。
- `state`：`EOF` はクエリの実行成功、`OK` は DDL および DML ステートメントの実行成功、`ERR` はステートメントの実行失敗を示します。
- `scan_bytes`：BE が処理したデータ量を示します。Doris の内部ページキャッシュから読み取ったデータも含め、ディスクから読み取ったデータの非圧縮時のサイズで、クエリが処理する必要のあるデータ量を反映します。この値は `scan_bytes_from_local_storage` + `scan_bytes_from_remote_storage` と等しくありません。
- `scan_rows`：クエリ実行中にスキャンした行数を示します。Doris はカラム型データベースのため、まず述語によるフィルタリングがあるカラムをスキャンし、その結果に基づいてほかのカラムをスキャンします。カラムごとにスキャンする行数は異なり、述語を持つカラムの方がそれ以外のカラムより多くなります。この値は述語を持つカラムをスキャンした行数を反映します。
- `scan_bytes_from_local_storage`：ローカルディスクから読み取ったデータの圧縮前のサイズを示します。Doris のページキャッシュから読み取ったデータは含まず、OS のページキャッシュから読み取ったデータは含みます。
- `scan_bytes_from_remote_storage`：リモートストレージから読み取ったデータの圧縮前のサイズを示します。
