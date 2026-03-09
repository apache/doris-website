---
{
  "title": "MySQL JDBC カタログ",
  "language": "ja",
  "description": "Doris JDBC Catalogはstandard JDBCインターフェースを介してMySQLデータベースへの接続をサポートします。"
}
---
Doris JDBC Catalogは、標準のJDBCインターフェース経由でMySQLデータベースへの接続をサポートしています。このドキュメントでは、MySQLデータベース接続の設定方法について説明します。

JDBC Catalogの概要については、以下を参照してください：[JDBC Catalog Overview](./jdbc-catalog-overview.md)

## 使用上の注意

MySQLデータベースに接続するには、以下が必要です：

* MySQL 5.7、8.0、またはそれ以降。

* MySQLのJDBCドライバー。[Maven Repository](https://mvnrepository.com/artifact/com.mysql/mysql-connector-j)からダウンロードできます。MySQL Connector/Jバージョン8.0.31以上の使用を推奨します。

* 各DorisのFEおよびBEノードとMySQLサーバー間のネットワーク接続。デフォルトポートは3306です。

## MySQLへの接続

```sql
CREATE CATALOG mysql_catalog PROPERTIES (
    'type' = 'jdbc',
    'user' = 'username',
    'password' = 'pwd',
    'jdbc_url' = 'jdbc:mysql://host:3306',
    'driver_url' = 'mysql-connector-j-8.3.0.jar',
    'driver_class' = 'com.mysql.cj.jdbc.Driver'
);
```
`jdbc_url`はMySQL JDBCドライバに渡される接続情報とパラメータを定義します。サポートされているURLパラメータは[MySQL Developer Guide](https://dev.mysql.com/doc/connector-j/en/connector-j-reference-configuration-properties.html)で確認できます。

### Connection Security

ユーザーがデータソースにインストールされたグローバルに信頼される証明書でTLSを設定している場合、`jdbc_url`プロパティで設定されたJDBC接続文字列にパラメータを追加することで、クラスタとデータソース間でTLSを有効にできます。

例えば、`MySQL Connector/J 8.0`の場合、`sslMode`パラメータを使用してTLS経由で接続を保護します。デフォルトでは、このパラメータはPREFERREDに設定されており、サーバーが有効になっている場合に接続を保護できます。このパラメータはREQUIREDに設定することも可能で、その場合TLSが確立されなければ接続は失敗します。

`jdbc_url`に sslMode パラメータを追加して設定できます：

```sql
'jdbc_url' = 'jdbc:mysql://host:3306/?sslMode=REQUIRED'
```
TLS設定オプションの詳細については、[MySQL JDBC Security Documentation](https://dev.mysql.com/doc/connector-j/en/connector-j-connp-props-security.html#cj-conn-prop_sslMode)を参照してください。

## 階層マッピング

MySQLをマッピングする際、DorisのDatabaseはMySQLのDatabaseに対応します。DorisのDatabase下のTableは、MySQLのそのDatabase下のTablesに対応します。マッピング関係は以下の通りです：

| Doris    | MySQL        |
| -------- | ------------ |
| Catalog  | MySQL Server |
| Database | Database     |
| Table    | Table        |

## カラムタイプマッピング

| MySQL Type                           | Doris Type                 | Comment                                                                        |
| ------------------------------------ | -------------------------- | ------------------------------------------------------------------------------ |
| boolean                              | tinyint                    |                                                                                |
| tinyint                              | tinyint                    |                                                                                |
| smallint                             | smallint                   |                                                                                |
| mediumint                            | int                        |                                                                                |
| int                                  | int                        |                                                                                |
| bigint                               | bigint                     |                                                                                |
| unsigned tinyint                     | smallint                   | Dorisはunsignedデータタイプをサポートしていないため、unsignedデータタイプはDorisの対応するより大きなデータタイプにマッピングされます。             |
| unsigned mediumint                   | int                        | 上記と同様。                                                                            |
| unsigned int                         | bigint                     | 上記と同様。                                                                            |
| unsigned bigint                      | largeint                   | 上記と同様。                                                                            |
| float                                | float                      |                                                                                |
| double                               | double                     |                                                                                |
| decimal(P, S)                        | decimal(P, S)              |                                                                                |
| unsigned decimal(P, S)               | decimal(P + 1, S) / string | Dorisがサポートする最大精度を超える場合、Stringで処理されます。このタイプがStringにマッピングされる場合、クエリのみサポートし、MySQLに書き込むことはできないことに注意してください。 |
| date                                 | date                       |                                                                                |
| timestamp(S) | datetime(S) / timestamptz(S) | `enable.mapping.timestamp_tz`プロパティによって制御されます（バージョン4.0.3以降でサポート）。デフォルトでは`false`に設定されており、この場合は`datetime`にマッピングされます；`true`に設定された場合は`timestamptz`タイプにマッピングされます。 |
| datetime(S)                          | datetime(S)                |                                                                                |
| year                                 | smallint                   | Dorisはyearタイプをサポートしていないため、yearタイプはsmallintにマッピングされます。                                       |
| time                                 | string                     | Dorisはtimeタイプをサポートしていないため、timeタイプはstringにマッピングされます。                                         |
| char                                 | char                       |                                                                                |
| varchar                              | varchar                    |                                                                                |
| json                                 | string                     | 読み取りと計算パフォーマンスのより良いバランスのために、Dorisはjsonタイプをstringタイプにマッピングします。                                  |
| set                                  | string                     |                                                                                |
| enum                                 | string                     |                                                                                |
| bit                                  | boolean / string           | Dorisはbitタイプをサポートしていないため、bitタイプはbit(1)の場合にboolean、その他の場合にstringにマッピングされます。                |
| tinytext, text, mediumtext, longtext | string                     |                                                                                |
| blob, mediumblob, longblob, tinyblob, binary, varbinary | string/varbinary                     |  Catalogの`enable.mapping.varbinary`プロパティによって制御されます（4.0.2以降でサポート）。デフォルトは`false`で、`string`にマッピングされます；`true`の場合は`varbinary`タイプにマッピングされます。                                                                              |
| other                                | UNSUPPORTED                |                                                                                |

## 付録

### タイムゾーンの問題

JDBC Catalogを通じてデータにアクセスする際、BEのJNI部分はJVMタイムゾーンを使用します。JVMタイムゾーンはデフォルトでBEデプロイメントマシンのタイムゾーンであり、JDBCがデータを読み取る際のタイムゾーン変換に影響します。タイムゾーンの一貫性を確保するために、`be.conf`の`JAVA_OPTS`でJVMタイムゾーンをDorisセッション変数`time_zone`と一致するように設定することを推奨します。

MySQLのtimestampタイプを読み取る際は、JDBC URLにパラメータ`connectionTimeZone=LOCAL`と`forceConnectionTimeZoneToSession=true`を追加してください。これらのパラメータはMySQL Connector/Jバージョン8以上に適用され、読み取り時間がMySQLサーバーのタイムゾーンではなく、Doris BE JVMタイムゾーンになることを保証します。

## よくある問題

### 接続例外のトラブルシューティング

* Communications link failure The last packet successfully received from the server was 7 milliseconds ago.

  * 原因：

      * ネットワークの問題：

          * 不安定なネットワークまたは接続の中断。

          * クライアントとサーバー間の高いネットワーク遅延。

      * MySQLサーバー設定

          * MySQLサーバーが`wait_timeout`や`interactive_timeout`などの接続タイムアウトパラメータを設定している可能性があり、タイムアウトにより接続が閉じられる原因となります。

      * ファイアウォール設定

          * ファイアウォールルールがクライアントとサーバー間の通信をブロックしている可能性があります。

      * コネクションプール設定

          * コネクションプールの設定`connection_pool_max_life_time`により接続が閉じられる、またはリサイクルされる、あるいは適時に保持されない可能性があります。

      * サーバーリソースの問題

          * MySQLサーバーが新しい接続要求を処理するリソースが不足している可能性があります。

      * クライアント設定

          * `autoReconnect`パラメータが設定されていない、または不適切に設定されているなど、クライアントJDBCドライバー設定が不正確です。

  * 解決方法

      * ネットワーク接続の確認：

          * クライアントとサーバー間の安定したネットワーク接続を確保し、高いネットワーク遅延を回避します。

      * MySQLサーバー設定の確認：

          * MySQLサーバーの`wait_timeout`と`interactive_timeout`パラメータを確認・調整し、適切に設定されていることを確認します。

      * ファイアウォール設定の確認：

          * ファイアウォールルールがクライアントとサーバー間の通信を許可していることを確認します。

      * コネクションプール設定の調整：

          * コネクションプールの設定パラメータ`connection_pool_max_life_time`を確認・調整し、MySQLの`wait_timeout`と`interactive_timeout`パラメータより小さく、SQLの最長実行時間より大きいことを確保します。

      * サーバーリソースの監視：

          * MySQLサーバーのリソース使用量を監視し、接続要求を処理するのに十分なリソースがあることを確認します。

      * クライアント設定の最適化：

          * JDBCドライバーの設定パラメータが正しいことを確認し、例えば`autoReconnect=true`のように、接続が中断後に自動的に再接続できることを保証します。

* java.io.EOFException MESSAGE: Can not read response from server. Expected to read 819 bytes, read 686 bytes before connection was unexpectedly lost.

  * 原因：接続がMySQLによってkillされた、またはMySQLがクラッシュした

  * 解決方法：MySQLに接続を能動的にkillするメカニズムがあるか、または大きなクエリがMySQLをクラッシュさせたかを確認してください

### その他の問題

1. MySQL emoji読み書き時の文字化け

   DorisがMySQLをクエリする際、MySQLのデフォルトutf8エンコーディングはutf8mb3であり、4バイトエンコーディングが必要なemojiを表現できません。ここでは、MySQLのエンコーディングをutf8mb4に変更して4バイトエンコーディングをサポートする必要があります。

   設定項目をグローバルに変更することができます

   ```text
   Modify the my.ini file in the mysql directory (for Linux systems, it is the my.cnf file in the etc directory)
   [client]
   default-character-set=utf8mb4

   [mysql]
   Set mysql default character set
   default-character-set=utf8mb4

   [mysqld]
   Set mysql character set server
   character-set-server=utf8mb4
   collation-server=utf8mb4_unicode_ci
   init_connect='SET NAMES utf8mb4

   Modify the type of the corresponding table and column
   ALTER TABLE table_name MODIFY colum_name VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ALTER TABLE table_name CHARSET=utf8mb4;
   SET NAMES utf8mb4
   ```
2. MySQL DATE/DATETIME型の読み取り時の例外

   ```text
   ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.6)[INTERNAL_ERROR]UdfRuntimeException: get next block failed: 
   CAUSED BY: SQLException: Zero date value prohibited
   CAUSED BY: DataReadException: Zero date value prohibited
   ```
JDBCでは、不正なDATE/DATETIMEはデフォルトで例外をスローして処理されます。この動作はURLパラメータ`zeroDateTimeBehavior`で制御できます。オプションパラメータは：`exception`、`convertToNull`、`round`で、それぞれ：例外エラー；`NULL`値に変換；`"0001-01-01 00:00:00"`に変換です。

   Catalogを作成する際に、`jdbc_url`の末尾のJDBC接続文字列に`zeroDateTimeBehavior=convertToNull`を追加する必要があります。例：`"jdbc_url" = "jdbc:mysql://127.0.0.1:3306/test?zeroDateTimeBehavior=convertToNull"`。この場合、JDBCは0000-00-00または0000-00-00 00:00:00をnullに変換し、その後Dorisは現在のCatalogのすべてのDate/DateTime型カラムをnullable型として処理するため、正常に読み取ることができます。

3. MySQL Catalogまたはその他のJDBC Catalogを読み取る際に、`failed to load driver class com.mysql.cj.jdbc.driver in either of hikariconfig class loader`などのクラス読み込み失敗が発生する

   これはCatalogを作成する際に入力された`driver_class`が間違っているためで、正しく入力する必要があります。例えば上記の例は大文字小文字の問題で、`'driver_class' = 'com.mysql.cj.jdbc.Driver'`と入力する必要があります。

4. MySQLを読み取る際のCommunication link exception

  ```text
  ERROR 1105 (HY000): errCode = 2, detailMessage = PoolInitializationException: Failed to initialize pool: Communications link failure

  The last packet successfully received from the server was 7 milliseconds ago.  The last packet sent successfully to the server was 4 milliseconds ago.
  CAUSED BY: CommunicationsException: Communications link failure
      
  The last packet successfully received from the server was 7 milliseconds ago.  The last packet sent successfully to the server was 4 milliseconds ago.
  CAUSED BY: SSLHandshakeException
  ```
beのbe.outログを確認し、以下の情報が含まれているかどうかをチェックできます：

  ```
  WARN: Establishing SSL connection without server's identity verification is not recommended. 
  According to MySQL 5.5.45+, 5.6.26+ and 5.7.6+ requirements SSL connection must be established by default if explicit option isn't set. 
  For compliance with existing applications not using SSL the verifyServerCertificate property is set to 'false'. 
  You need either to explicitly disable SSL by setting useSSL=false, or set useSSL=true and provide truststore for server certificate verification.
  ```
`jdbc_url`に`useSSL=false`を追加できます。例：`'jdbc_url' = 'jdbc:mysql://127.0.0.1:3306/test?useSSL=false'`

* MySQLから大量のデータをクエリする際、クエリが時々成功し、時々以下のエラーが報告される場合があります。このエラーが発生すると、MySQLへのすべての接続が切断され、MySQL Serverに接続できなくなりますが、しばらくすると、MySQLは正常に戻りますが、以前の接続は失われています：

  ```text
  ERROR 1105 (HY000): errCode = 2, detailMessage = [INTERNAL_ERROR]UdfRuntimeException: JDBC executor sql has error:
  CAUSED BY: CommunicationsException: Communications link failure
  The last packet successfully received from the server was 4,446 milliseconds ago. The last packet sent successfully to the server was 4,446 milliseconds ago.
  ```
上記の現象が発生する場合、MySQL ServerのメモリまたはCPU リソースが枯渇し、MySQL サービスが利用できなくなっている可能性があります。MySQL Serverのメモリまたは CPU 構成を増加させることを試してください。

* MySQL のクエリ実行中に、クエリ結果が MySQL データベースの結果と一致しないことがわかった場合

  まず、クエリフィールドで大文字小文字を区別する状況があるかどうかを確認してください。例えば、Table の フィールド `c_1` に `"aaa"` と `"AAA"` という2つのデータがある場合、MySQL データベースの初期化時に大文字小文字を区別するように指定されていなければ、MySQL はデフォルトで大文字小文字を区別しませんが、Doris は厳密に大文字小文字を区別するため、次のような状況が発生します：

  ```text
  MySQL behavior:
  select count(c_1) from table where c_1 = "aaa"; Does not distinguish case, so the result is: 2

  Doris behavior:
  select count(c_1) from table where c_1 = "aaa"; Strictly distinguishes case, so the result is: 1
  ```
上記の現象が発生した場合、以下のように要件に応じて調整する必要があります：

  * MySQLクエリに"BINARY"キーワードを追加して大文字小文字を区別するよう強制する：`select count(c_1) from table where BINARY c_1 = "aaa";`

  * またはMySQLでテーブル作成時に指定する：`CREATE TABLE table (c_1 VARCHAR(255) CHARACTER SET binary);`

  * またはMySQLデータベース初期化時に大文字小文字を区別するcollationルールを指定する：

		```text
		[mysqld]
		character-set-server=utf8
		collation-server=utf8_bin
		[client]
		default-character-set=utf8
		[mysql]
		default-character-set=utf8
		```
* MySQLクエリ実行時に、長時間スタックして結果が返されない場合、または長時間スタックしてfe.warn.logに大量の書き込みロックログが出力される場合。

  URLにsocketTimeoutを追加することをお試しください。例：`jdbc:mysql://host:port/database?socketTimeout=30000`。これにより、MySQLによってクローズされた後にJDBCクライアントが無期限に待機することを防げます。

* MySQL Catalog使用中に、FEのJVMメモリやThreads数が継続的に増加して減少せず、同時にForward to master connection timed outエラーが報告される場合があります

  FEスレッドスタック`jstack fe_pid > fe.js`を出力し、大量の`mysql-cj-abandoned-connection-cleanup`スレッドが出現する場合、MySQL JDBCドライバーに問題があることを示します。

  以下のように対処してください：

  * MySQL JDBCドライバーをバージョン8.0.31以上にアップグレード

  * FEとBE confファイルの`JAVA_OPTS`にパラメータ`-Dcom.mysql.cj.disableAbandonedConnectionCleanup=true`を追加してMySQL JDBCドライバーのコネクションクリーンアップ機能を無効化し、クラスターを再起動

	注意：Dorisのバージョンが2.0.13以上、または2.1.5以上の場合、このパラメータを追加する必要はありません。DorisはデフォルトでMySQL JDBCドライバーのコネクションクリーンアップ機能を無効化しているためです。MySQL JDBCドライバーのバージョンを置き換えるだけで構いません。ただし、以前にリークしたスレッドをクリーンアップするためにDorisクラスターを再起動する必要があります。
