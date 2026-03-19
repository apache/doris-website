---
{
  "title": "MySQL JDBC カタログ",
  "language": "ja",
  "description": "Doris JDBC CatalogはJDBC標準インターフェースを介してMySQLデータベースへの接続をサポートします。"
}
---
Doris JDBC Catalogは、標準のJDBCインターフェースを介してMySQLデータベースに接続することをサポートしています。このドキュメントでは、MySQLデータベース接続の設定方法について説明します。

JDBC Catalogの概要については、次を参照してください：[JDBC Catalog Overview](./jdbc-catalog-overview.md)

## 使用上の注意

MySQLデータベースに接続するには、以下が必要です：

* MySQL 5.7、8.0、またはそれ以降のバージョン。

* MySQLのJDBCドライバー。[Maven Repository](https://mvnrepository.com/artifact/com.mysql/mysql-connector-j)からダウンロードできます。MySQL Connector/Jバージョン8.0.31以上の使用を推奨します。

* 各Doris FEおよびBEノードとMySQLサーバー間のネットワーク接続。デフォルトポートは3306です。

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
`jdbc_url`は、MySQL JDBCドライバに渡される接続情報とパラメータを定義します。サポートされているURLパラメータは[MySQL Developer Guide](https://dev.mysql.com/doc/connector-j/en/connector-j-reference-configuration-properties.html)で確認できます。

### Connection Security

ユーザーがデータソースにインストールされたグローバルに信頼された証明書でTLSを設定している場合、`jdbc_url`プロパティで設定されたJDBC接続文字列にパラメータを追加することで、クラスタとデータソース間でTLSを有効にできます。

例えば、`MySQL Connector/J 8.0`の場合、`sslMode`パラメータを使用してTLS経由で接続を保護します。デフォルトでは、このパラメータはPREFERREDに設定されており、サーバーが有効になっている場合に接続を保護できます。このパラメータはREQUIREDに設定することもでき、その場合TLSが確立されないと接続が失敗します。

`jdbc_url`に`sslMode`パラメータを追加することで設定できます：

```sql
'jdbc_url' = 'jdbc:mysql://host:3306/?sslMode=REQUIRED'
```
TLS設定オプションの詳細については、[MySQL JDBC Security Documentation](https://dev.mysql.com/doc/connector-j/en/connector-j-connp-props-security.html#cj-conn-prop_sslMode)を参照してください。

## 階層マッピング

MySQLをマッピングする際、DorisのDatabaseはMySQLのDatabaseに対応します。DorisのDatabase配下のTableは、MySQLのそのDatabase配下のTablesに対応します。マッピング関係は以下の通りです：

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
| unsigned tinyint                     | smallint                   | Dorisはunsignedデータ型をサポートしていないため、unsignedデータ型はDorisの対応するより大きいデータ型にマッピングされます。             |
| unsigned mediumint                   | int                        | 上記と同様。                                                                            |
| unsigned int                         | bigint                     | 上記と同様。                                                                            |
| unsigned bigint                      | largeint                   | 上記と同様。                                                                            |
| float                                | float                      |                                                                                |
| double                               | double                     |                                                                                |
| decimal(P, S)                        | decimal(P, S)              |                                                                                |
| unsigned decimal(P, S)               | decimal(P + 1, S) / string | Dorisがサポートする最大精度を超える場合、Stringで処理されます。このタイプがStringにマッピングされる場合、クエリのみサポートし、MySQLに書き込むことはできないことに注意してください。 |
| date                                 | date                       |                                                                                |
| timestamp(S) | datetime(S) / timestamptz(S) | `enable.mapping.timestamp_tz`プロパティで制御されます（バージョン4.0.3以降でサポート）。デフォルトでは`false`に設定され、この場合`datetime`にマッピングされます；`true`に設定すると、`timestamptz`タイプにマッピングされます。 |
| datetime(S)                          | datetime(S)                |                                                                                |
| year                                 | smallint                   | Dorisはyear型をサポートしていないため、year型はsmallintにマッピングされます。                                       |
| time                                 | string                     | Dorisはtime型をサポートしていないため、time型はstringにマッピングされます。                                         |
| char                                 | char                       |                                                                                |
| varchar                              | varchar                    |                                                                                |
| json                                 | string                     | 読み取りと計算パフォーマンスのバランスを向上させるため、Dorisはjson型をstring型にマッピングします。                                  |
| set                                  | string                     |                                                                                |
| enum                                 | string                     |                                                                                |
| bit                                  | boolean / string           | Dorisはbit型をサポートしていないため、bit型はbit(1)の場合booleanにマッピングされ、その他の場合はstringにマッピングされます。                |
| tinytext, text, mediumtext, longtext | string                     |                                                                                |
| blob, mediumblob, longblob, tinyblob, binary, varbinary | string/varbinary                     |  Catalogの`enable.mapping.varbinary`プロパティで制御されます（4.0.2以降でサポート）。デフォルトは`false`で`string`にマッピングされ、`true`の場合`varbinary`型にマッピングされます。                                                                              |
| other                                | UNSUPPORTED                |                                                                                |

## 付録

### タイムゾーンの問題

JDBC Catalog経由でデータにアクセスする際、BEのJNI部分はJVMタイムゾーンを使用します。JVMタイムゾーンはデフォルトでBE配置マシンのタイムゾーンとなり、JDBCがデータを読み取る際のタイムゾーン変換に影響します。タイムゾーンの一貫性を確保するため、`be.conf`の`JAVA_OPTS`でJVMタイムゾーンをDorisセッション変数`time_zone`と一致するよう設定することを推奨します。

MySQLのtimestamp型を読み取る際は、JDBC URLにパラメータ`connectionTimeZone=LOCAL`と`forceConnectionTimeZoneToSession=true`を追加してください。これらのパラメータはMySQL Connector/Jバージョン8以上で適用可能で、読み取り時間がMySQLサーバーのタイムゾーンではなく、Doris BE JVMタイムゾーンになることを保証します。

## よくある問題

### 接続例外のトラブルシューティング

* Communications link failure The last packet successfully received from the server was 7 milliseconds ago.

  * 原因：

      * ネットワークの問題：

          * 不安定なネットワークまたは接続の中断。

          * クライアントとサーバー間の高いネットワーク遅延。

      * MySQLサーバー設定

          * MySQLサーバーが`wait_timeout`や`interactive_timeout`などの接続タイムアウトパラメータを設定しており、タイムアウトにより接続が閉じられる可能性があります。

      * ファイアウォール設定

          * ファイアウォールルールがクライアントとサーバー間の通信をブロックしている可能性があります。

      * 接続プール設定

          * 接続プールの設定`connection_pool_max_life_time`により接続が閉じられるかリサイクルされる、または適時にキープアライブされない可能性があります。

      * サーバーリソースの問題

          * MySQLサーバーが新しい接続要求を処理するためのリソースが不足している可能性があります。

      * クライアント設定

          * JDBCドライバの設定が正しくない、例えば`autoReconnect`パラメータが設定されていないか不適切に設定されている。

  * 解決策

      * ネットワーク接続の確認：

          * クライアントとサーバー間の安定したネットワーク接続を確保し、高いネットワーク遅延を避ける。

      * MySQLサーバー設定の確認：

          * MySQLサーバーの`wait_timeout`と`interactive_timeout`パラメータを確認し調整して、適切に設定されていることを確保する。

      * ファイアウォール設定の確認：

          * ファイアウォールルールがクライアントとサーバー間の通信を許可していることを確保する。

      * 接続プール設定の調整：

          * 接続プールの設定パラメータ`connection_pool_max_life_time`を確認し調整して、MySQLの`wait_timeout`と`interactive_timeout`パラメータより小さく、SQLの最長実行時間より大きくなるよう確保する。

      * サーバーリソースの監視：

          * MySQLサーバーのリソース使用状況を監視し、接続要求を処理するのに十分なリソースがあることを確保する。

      * クライアント設定の最適化：

          * JDBCドライバの設定パラメータが正しいことを確保し、例えば`autoReconnect=true`として、接続が中断後に自動的に再接続できるようにする。

* java.io.EOFException MESSAGE: Can not read response from server. Expected to read 819 bytes, read 686 bytes before connection was unexpectedly lost.

  * 原因：接続がMySQLによって切断されたか、MySQLがクラッシュした

  * 解決策：MySQLに接続を積極的に切断するメカニズムがあるか、または大きなクエリがMySQLをクラッシュさせたかを確認する

### その他の問題

1. MySQL emoji読み書き時の文字化け

   DorisがMySQLをクエリする際、MySQLのデフォルトutf8エンコーディングはutf8mb3で、4バイトエンコーディングが必要な絵文字を表現できません。ここでは、MySQLのエンコーディングをutf8mb4に変更して4バイトエンコーディングをサポートする必要があります。

   設定項目をグローバルに変更できます

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
2. MySQL DATE/DATETIME型を読み取る際の例外

   ```text
   ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.6)[INTERNAL_ERROR]UdfRuntimeException: get next block failed: 
   CAUSED BY: SQLException: Zero date value prohibited
   CAUSED BY: DataReadException: Zero date value prohibited
   ```
JDBCでは、不正なDATE/DATETIMEはデフォルトで例外をスローすることによって処理されます。この動作はURLパラメータ`zeroDateTimeBehavior`によって制御できます。オプションのパラメータは：`exception`、`convertToNull`、`round`で、それぞれ：例外エラー；`NULL`値に変換；`"0001-01-01 00:00:00"`に変換です。

   Catalogを作成する際に`jdbc_url`の末尾のJDBC接続文字列に`zeroDateTimeBehavior=convertToNull`を追加する必要があります。例えば`"jdbc_url" = "jdbc:mysql://127.0.0.1:3306/test?zeroDateTimeBehavior=convertToNull"`のようにします。この場合、JDBCは0000-00-00または0000-00-00 00:00:00をnullに変換し、その後Dorisは現在のCatalogのすべてのDate/DateTime型カラムをnullable型として処理するため、正常に読み取ることができます。

3. MySQL Catalogやその他のJDBC Catalogを読み取る際に、`failed to load driver class com.mysql.cj.jdbc.driver in either of hikariconfig class loader`などのクラス読み込み失敗が発生する場合

   これはCatalog作成時に入力された`driver_class`が正しくないためで、正しく入力する必要があります。例えば上記の例は大文字小文字の問題で、`'driver_class' = 'com.mysql.cj.jdbc.Driver'`と入力すべきです。

4. MySQLを読み取る際のCommunication link exception

  ```text
  ERROR 1105 (HY000): errCode = 2, detailMessage = PoolInitializationException: Failed to initialize pool: Communications link failure

  The last packet successfully received from the server was 7 milliseconds ago.  The last packet sent successfully to the server was 4 milliseconds ago.
  CAUSED BY: CommunicationsException: Communications link failure
      
  The last packet successfully received from the server was 7 milliseconds ago.  The last packet sent successfully to the server was 4 milliseconds ago.
  CAUSED BY: SSLHandshakeException
  ```
beのbe.outログを確認できます。以下の情報が含まれているかどうかを確認してください：

  ```
  WARN: Establishing SSL connection without server's identity verification is not recommended. 
  According to MySQL 5.5.45+, 5.6.26+ and 5.7.6+ requirements SSL connection must be established by default if explicit option isn't set. 
  For compliance with existing applications not using SSL the verifyServerCertificate property is set to 'false'. 
  You need either to explicitly disable SSL by setting useSSL=false, or set useSSL=true and provide truststore for server certificate verification.
  ```
`jdbc_url`に`useSSL=false`を追加できます。例：`'jdbc_url' = 'jdbc:mysql://127.0.0.1:3306/test?useSSL=false'`。

* MySQLから大量のデータをクエリする際、クエリが時々成功し、時々以下のエラーが報告され、このエラーが発生すると、MySQLへのすべての接続が切断されてMySQL Serverに接続できなくなりますが、しばらくすると、MySQLは正常に戻りますが、以前の接続は失われています：

  ```text
  ERROR 1105 (HY000): errCode = 2, detailMessage = [INTERNAL_ERROR]UdfRuntimeException: JDBC executor sql has error:
  CAUSED BY: CommunicationsException: Communications link failure
  The last packet successfully received from the server was 4,446 milliseconds ago. The last packet sent successfully to the server was 4,446 milliseconds ago.
  ```
上記の現象が発生した場合、MySQL ServerのメモリまたはCPU リソースが枯渇して、MySQLサービスが利用できなくなっている可能性があります。MySQL Serverのメモリまたは CPU 設定を増やすことを試してください。

* MySQL のクエリ処理中に、クエリ結果が MySQL データベースの結果と一致しないことが判明した場合

  まず、クエリフィールドで大文字小文字を区別する状況があるかどうかを確認してください。例えば、Tableの`c_1`フィールドに`"aaa"`と`"AAA"`の2つのデータがある場合、MySQL データベースの初期化時に大文字小文字を区別するように指定されていなければ、MySQL はデフォルトで大文字小文字を区別しませんが、Dorisは厳密に大文字小文字を区別するため、以下のような状況が発生します：

  ```text
  MySQL behavior:
  select count(c_1) from table where c_1 = "aaa"; Does not distinguish case, so the result is: 2

  Doris behavior:
  select count(c_1) from table where c_1 = "aaa"; Strictly distinguishes case, so the result is: 1
  ```
上記の現象が発生した場合、以下の要件に応じて調整する必要があります：

  * MySQLクエリに"BINARY"キーワードを追加して大文字小文字の区別を強制する：`select count(c_1) from table where BINARY c_1 = "aaa";`

  * またはMySQLでテーブル作成時に指定する：`CREATE TABLE table (c_1 VARCHAR(255) CHARACTER SET binary);`

  * またはMySQLデータベースの初期化時に大文字小文字を区別する照合順序ルールを指定する：

		```text
		[mysqld]
		character-set-server=utf8
		collation-server=utf8_bin
		[client]
		default-character-set=utf8
		[mysql]
		default-character-set=utf8
		```
* MySQLをクエリする際に、長時間結果が返されずにスタックしたり、長時間スタックして大量の書き込みロックログがfe.warn.logに出力される場合。

  URLにsocketTimeoutを追加してみてください。例：`jdbc:mysql://host:port/database?socketTimeout=30000`。これにより、MySQLによって接続が閉じられた後にJDBCクライアントが無期限に待機することを防げます。

* MySQL Catalogの使用中に、FEのJVMメモリやThreads数が継続的に増加して減少せず、同時にForward to master connection timed outエラーが報告される場合

  FEのスレッドスタック`jstack fe_pid > fe.js`を出力してください。大量の`mysql-cj-abandoned-connection-cleanup`スレッドが出現する場合、MySQL JDBCドライバーの問題を示しています。

  以下のように対処してください：

  * MySQL JDBCドライバーをバージョン8.0.31以上にアップグレードする

  * FEとBEのconfファイルの`JAVA_OPTS`にパラメータ`-Dcom.mysql.cj.disableAbandonedConnectionCleanup=true`を追加してMySQL JDBCドライバーの接続クリーンアップ機能を無効化し、クラスターを再起動する

	注意：DorisのバージョンがDoris 2.0.13以上、またはDoris 2.1.5以上の場合、このパラメータを追加する必要はありません。DorisはデフォルトでMySQL JDBCドライバーの接続クリーンアップ機能を無効化しているためです。MySQL JDBCドライバーのバージョンを置き換えるだけで済みます。ただし、以前にリークしたスレッドをクリーンアップするためにDorisクラスターの再起動が必要です。
