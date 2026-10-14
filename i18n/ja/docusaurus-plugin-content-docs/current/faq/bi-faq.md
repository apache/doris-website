---
{
    "title": "BI に関するよくある質問",
    "language": "ja",
    "description": "通常、Power BI がデータソースからデータを取得する際のタイムアウトが原因です。データソースのサーバーとデータベースを入力する際に、詳細オプションをクリックします。",
}
---

## Power BI

### Q1. JDBC を使用して Power BI Desktop にデータを取り込むと、「Timeout expired. The timeout period elapsed prior to completion of the operation or the server is not responding」というエラーが発生します。

通常、Power BI がデータソースからデータを取得する際のタイムアウトが原因です。データソースのサーバーとデータベースを入力する際に、詳細オプションをクリックして、タイムアウトの値を大きくしてください。

### Q2. バージョン 2.1.x で JDBC を使用して Power BI に接続すると、「An error happened while reading data from the provider: the given key was not present in the dictionary」というエラーが発生します。

まず、データベースで「show collation」を実行してください。通常は utf8mb4_900_bin のみが表示され、文字セットは utf8mb4 です。このエラーの主な原因は、Power BI への接続時に ID 33 を参照する必要があることです。つまり、テーブル内の ID が 33 の行については、バージョン 2.1.5 以降にアップグレードする必要があります。

### Q3. Doris への接続時に、「Reading data from the provider times error index and count must refer to the location within the string」というエラーが発生します。

接続処理中にグローバルパラメータを読み込む際、SQL の列名と値が同じになることが原因です。

```
SELECT
@@max_allowed_packet  as max_allowed_packet, @@character_set_client ,@@character_set_connection ,
@@license,@@sql_mode ,@@lower_case_table_names , @@autocommit ;
```

現行バージョンでは新しいオプティマイザを無効にするか、バージョン 2.0.7 または 2.1.6、もしくはそれ以降にアップグレードしてください。

### Q4. バージョン 2.1.x の JDBC 接続で、「Character set 'utf8mb3' is not supported by.net.Framework」というエラーが発生します。

この問題はバージョン 2.1.x で発生しやすくなっています。発生した場合は、JDBC Driver を 8.0.32 にアップグレードしてください。

## Tableau

### Q1. バージョン 2.0.x で、エラーコード 37CE01A3 が表示され、Tableau がデータソースに接続できません。

現行バージョンでは新しいオプティマイザを無効にするか、バージョン 2.0.7 以降にアップグレードしてください。

### Q2. SSL 接続エラー: protocol version mismatch Failed to connect to the MySQL server

このエラーは、Doris で SSL 認証が有効になっている一方、接続時に SSL 接続を使用していないことが原因です。fe.conf の enable_ssl 変数を無効にしてください。

### Q3. 接続エラー: Unsupported command(COM_STMT_PREPARED)

インストールされている MySQL ドライバーのバージョンが適切ではありません。代わりに MySQL 5.1.x 接続ドライバーをインストールしてください。
