---
{
  "title": "MySQL JDBC カタログ",
  "description": "Doris JDBC カタログは、標準のJDBCインターフェースを通じてMySQLデータベースへの接続をサポートしています。",
  "language": "ja"
}
---
Doris JDBC カタログ は、標準のJDBCインターフェースを介してMySQLデータベースへの接続をサポートしています。このドキュメントでは、MySQLデータベース接続の設定方法について説明します。

JDBC カタログの概要については、以下を参照してください：[JDBC カタログ 概要](./jdbc-catalog-overview.md)

## 使用上の注意

MySQLデータベースに接続するには、以下が必要です：

* MySQL 5.7、8.0、またはそれ以降のバージョン。

* MySQLのJDBCドライバー。[Maven Repository](https://mvnrepository.com/artifact/com.mysql/mysql-connector-j)からダウンロードできます。MySQL Connector/J バージョン8.0.31以降の使用を推奨します。

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
`jdbc_url`は、MySQL JDBCドライバーに渡される接続情報とパラメーターを定義します。サポートされているURLパラメーターは、[MySQL Developer Guide](https://dev.mysql.com/doc/connector-j/en/connector-j-reference-configuration-properties.html)で確認できます。

### Connection Security

ユーザーがデータソース上にグローバルに信頼された証明書がインストールされたTLSを設定している場合、`jdbc_url`プロパティに設定されたJDBC接続文字列にパラメーターを追加することで、クラスターとデータソース間でTLSを有効にできます。

例えば、`MySQL Connector/J 8.0`の場合、`sslMode`パラメーターを使用してTLS経由で接続を保護します。デフォルトでは、このパラメーターはPREFERREDに設定されており、サーバーが有効になっている場合に接続を保護できます。このパラメーターはREQUIREDに設定することもでき、その場合TLSが確立されなければ接続は失敗します。

`jdbc_url`にsslModeパラメーターを追加することで設定できます：

```sql
'jdbc_url' = 'jdbc:mysql://host:3306/?sslMode=REQUIRED'
```
TLS設定オプションの詳細については、[MySQL JDBC Security Documentation](https://dev.mysql.com/doc/connector-j/en/connector-j-connp-props-security.html#cj-conn-prop_sslMode)を参照してください。

## 階層マッピング

MySQLをマッピングする際、DorisのDatabaseはMySQLのDatabaseに対応します。DorisのDatabase下のTableは、MySQLの該当Database下のTablesに対応します。マッピング関係は以下の通りです：

| Doris    | MySQL        |
| -------- | ------------ |
| カタログ  | MySQL サーバー |
| Database | Database     |
| Table    | Table        |

## カラム型マッピング

| MySQL タイプ                           | Doris タイプ                 | Comment                                                                        |
| ------------------------------------ | -------------------------- | ------------------------------------------------------------------------------ |
| boolean                              | tinyint                    |                                                                                |
| tinyint                              | tinyint                    |                                                                                |
| smallint                             | smallint                   |                                                                                |
| mediumint                            | int                        |                                                                                |
| int                                  | int                        |                                                                                |
| bigint                               | bigint                     |                                                                                |
| unsigned tinyint                     | smallint                   | Dorisはunsignedデータ型をサポートしていないため、unsignedデータ型はDorisの対応するより大きなデータ型にマッピングされます。             |
| unsigned mediumint                   | int                        | 上記と同様。                                                                            |
| unsigned int                         | bigint                     | 上記と同様。                                                                            |
| unsigned bigint                      | largeint                   | 上記と同様。                                                                            |
| float                                | float                      |                                                                                |
| double                               | double                     |                                                                                |
| decimal(P, S)                        | decimal(P, S)              |                                                                                |
| unsigned decimal(P, S)               | decimal(P + 1, S) / string | Dorisがサポートする最大精度を超える場合、Stringで処理されます。なお、この型がStringにマッピングされた場合、クエリのみをサポートし、MySQLへの書き込みはできません。 |
| date                                 | date                       |                                                                                |
| timestamp(S)                         | datetime(S)                |                                                                                |
| datetime(S)                          | datetime(S)                |                                                                                |
| year                                 | smallint                   | Dorisはyear型をサポートしていないため、year型はsmallintにマッピングされます。                                       |
| time                                 | string                     | Dorisはtime型をサポートしていないため、time型はstringにマッピングされます。                                         |
| char                                 | char                       |                                                                                |
| varchar                              | varchar                    |                                                                                |
| json                                 | string                     | 読み取りと計算パフォーマンスのバランスを向上させるため、Dorisはjson型をstring型にマッピングします。                                  |
| set                                  | string                     |                                                                                |
| enum                                 | string                     |                                                                                |
| bit                                  | boolean / string           | Dorisはbit型をサポートしていないため、bit(1)の場合はbooleanに、その他の場合はstringにマッピングされます。                |
| tinytext, text, mediumtext, longtext | string                     |                                                                                |
| blob, mediumblob, longblob, tinyblob, binary, varbinary | string/varbinary                     |  Catalogの`enable.mapping.varbinary`プロパティで制御されます（4.0.2以降でサポート）。デフォルトは`false`で、`string`にマッピングされます。`true`の場合、`varbinary`型にマッピングされます。                                                                              |
| other                                | UNSUPPORTED                |                                                                                |

## 付録

### タイムゾーンの問題

JDBC Catalogを通じてデータにアクセスする際、BEのJNI部分はJVMタイムゾーンを使用します。JVMタイムゾーンはデフォルトでBE配置マシンのタイムゾーンになり、JDBCがデータを読み取る際のタイムゾーン変換に影響します。タイムゾーンの整合性を確保するため、`be.conf`の`JAVA_OPTS`でJVMタイムゾーンをDorisセッション変数`time_zone`と一致するよう設定することを推奨します。

MySQLのtimestamp型を読み取る際は、JDBC URLにパラメータ`connectionTimeZone=LOCAL`と`forceConnectionTimeZoneToSession=true`を追加してください。これらのパラメータはMySQL Connector/Jバージョン8以上に適用され、読み取り時刻がMySQLサーバーのタイムゾーンではなく、Doris BE JVMタイムゾーンになることを保証します。

## よくある問題

### 接続例外のトラブルシューティング

* Communications link failure The last packet successfully received from the server was 7 milliseconds ago.

  * 原因：

      * ネットワークの問題：

          * ネットワークが不安定または接続が中断された。

          * クライアントとサーバー間のネットワーク遅延が大きい。

      * MySQLサーバーの設定

          * MySQLサーバーが`wait_timeout`や`interactive_timeout`などの接続タイムアウトパラメータを設定しており、タイムアウトにより接続が閉じられる。

      * ファイアウォール設定

          * ファイアウォールルールがクライアントとサーバー間の通信をブロックしている可能性がある。

      * 接続プール設定

          * 接続プールの設定`connection_pool_max_life_time`により、接続が閉じられたり、リサイクルされたり、適時に維持されない可能性がある。

      * サーバーリソースの問題

          * MySQLサーバーが新しい接続要求を処理するリソースが不足している可能性がある。

      * クライアント設定

          * クライアントJDBCドライバー設定が不正確で、`autoReconnect`パラメータが設定されていないか不適切に設定されている。

  * 解決策

      * ネットワーク接続の確認：

          * クライアントとサーバー間のネットワーク接続が安定していることを確認し、高いネットワーク遅延を避ける。

      * MySQLサーバー設定の確認：

          * MySQLサーバーの`wait_timeout`と`interactive_timeout`パラメータを確認・調整し、適切に設定されていることを確認する。

      * ファイアウォール設定の確認：

          * ファイアウォールルールがクライアントとサーバー間の通信を許可していることを確認する。

      * 接続プール設定の調整：

          * 接続プールの設定パラメータ`connection_pool_max_life_time`を確認・調整し、MySQLの`wait_timeout`と`interactive_timeout`パラメータより小さく、SQLの最長実行時間より大きく設定する。

      * サーバーリソースの監視：

          * MySQLサーバーのリソース使用状況を監視し、接続要求を処理するのに十分なリソースがあることを確認する。

      * クライアント設定の最適化：

          * JDBCドライバーの設定パラメータが正しいことを確認し、`autoReconnect=true`などを設定して、接続が中断後に自動的に再接続できるようにする。

* java.io.EOFException MESSAGE: Can not read response from server. Expected to read 819 bytes, read 686 bytes before connection was unexpectedly lost.

  * 原因：MySQLによって接続がkillされたか、MySQLがクラッシュした

  * 解決策：MySQLに能動的に接続をkillするメカニズムがあるかを確認するか、大きなクエリがMySQLをクラッシュさせているかを確認する

### その他の問題

1. MySQL emojiの読み書き時に文字化けが発生する

   DorisがMySQLにクエリを実行する際、MySQLのデフォルトのutf8エンコーディングはutf8mb3で、4バイトエンコーディングが必要なemojiを表現できません。ここでは、MySQLのエンコーディングをutf8mb4に変更して4バイトエンコーディングをサポートする必要があります。

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
2. MySQL DATE/DATETIME型の読み込み時の例外

   ```text
   ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.6)[INTERNAL_ERROR]UdfRuntimeException: get next block failed: 
   CAUSED BY: SQLException: Zero date value prohibited
   CAUSED BY: DataReadException: Zero date value prohibited
   ```
JDBCでは、不正なDATE/DATETIMEはデフォルトで例外をスローすることで処理されます。この動作はURLパラメータ`zeroDateTimeBehavior`で制御できます。オプションパラメータは：`exception`、`convertToNull`、`round`があり、それぞれ：例外エラー；`NULL`値に変換；`"0001-01-01 00:00:00"`に変換です。

   Catalogを作成する際、`jdbc_url`の最後のJDBC接続文字列に`zeroDateTimeBehavior=convertToNull`を追加する必要があります。例：`"jdbc_url" = "jdbc:mysql://127.0.0.1:3306/test?zeroDateTimeBehavior=convertToNull"`。この場合、JDBCは0000-00-00または0000-00-00 00:00:00をnullに変換し、その後Dorisは現在のCatalogのすべてのDate/DateTime型カラムをnullable型として処理するため、正常に読み取ることができます。

3. MySQL Catalogやその他のJDBC Catalogを読み取る際にクラスローディング失敗が発生する場合、例：`failed to load driver class com.mysql.cj.jdbc.driver in either of hikariconfig class loader`

   これはCatalog作成時に入力した`driver_class`が正しくないためで、正しく入力する必要があります。例えば上記の例は大文字小文字の問題で、`'driver_class' = 'com.mysql.cj.jdbc.Driver'`と入力する必要があります。

4. MySQLを読み取る際の通信リンク例外

  ```text
  ERROR 1105 (HY000): errCode = 2, detailMessage = PoolInitializationException: Failed to initialize pool: Communications link failure

  The last packet successfully received from the server was 7 milliseconds ago.  The last packet sent successfully to the server was 4 milliseconds ago.
  CAUSED BY: CommunicationsException: Communications link failure
      
  The last packet successfully received from the server was 7 milliseconds ago.  The last packet sent successfully to the server was 4 milliseconds ago.
  CAUSED BY: SSLHandshakeException
  ```
beのbe.outログを確認し、以下の情報が含まれているかをチェックできます：

  ```
  WARN: Establishing SSL connection without server's identity verification is not recommended. 
  According to MySQL 5.5.45+, 5.6.26+ and 5.7.6+ requirements SSL connection must be established by default if explicit option isn't set. 
  For compliance with existing applications not using SSL the verifyServerCertificate property is set to 'false'. 
  You need either to explicitly disable SSL by setting useSSL=false, or set useSSL=true and provide truststore for server certificate verification.
  ```
`jdbc_url`に`useSSL=false`を追加できます。例：`'jdbc_url' = 'jdbc:mysql://127.0.0.1:3306/test?useSSL=false'`

* MySQLから大量のデータをクエリする際、クエリが時々成功し、時々以下のエラーが報告され、このエラーが発生するとMySQLへの全ての接続が切断されてMySQL Serverに接続できなくなりますが、しばらくするとMySQLは正常に戻ります。ただし、以前の接続は失われています：

  ```text
  ERROR 1105 (HY000): errCode = 2, detailMessage = [INTERNAL_ERROR]UdfRuntimeException: JDBC executor sql has error:
  CAUSED BY: CommunicationsException: Communications link failure
  The last packet successfully received from the server was 4,446 milliseconds ago. The last packet sent successfully to the server was 4,446 milliseconds ago.
  ```
上記の現象が発生した場合、MySQL ServerのメモリまたはCPUリソースが枯渇し、MySQLサービスが利用できなくなっている可能性があります。MySQL Serverのメモリまたは CPU構成を増やしてみてください。

* MySQLクエリの実行中に、クエリ結果がMySQLデータベースの結果と一致しないことが判明した場合

  まず、クエリフィールドに大文字小文字を区別する状況があるかどうかを確認してください。例えば、Tableのフィールド `c_1` に `"aaa"` と `"AAA"` の2つのデータがある場合、MySQLデータベースの初期化時に大文字小文字を区別するよう指定されていなければ、MySQLはデフォルトで大文字小文字を区別しませんが、Dorisは厳密に大文字小文字を区別するため、以下のような状況が発生します：

  ```text
  MySQL behavior:
  select count(c_1) from table where c_1 = "aaa"; Does not distinguish case, so the result is: 2

  Doris behavior:
  select count(c_1) from table where c_1 = "aaa"; Strictly distinguishes case, so the result is: 1
  ```
上記の現象が発生した場合は、要件に応じて以下のように調整する必要があります：

  * MySQLクエリに「BINARY」キーワードを追加して大文字小文字の区別を強制する：`select count(c_1) from table where BINARY c_1 = "aaa";`

  * またはMySQLでTable作成時に指定する：`CREATE TABLE table (c_1 VARCHAR(255) CHARACTER SET binary);`

  * またはMySQLデータベース初期化時に大文字小文字を区別するように照合順序ルールを指定する：

		```text
		[mysqld]
		character-set-server=utf8
		collation-server=utf8_bin
		[client]
		default-character-set=utf8
		[mysql]
		default-character-set=utf8
		```
* MySQLをクエリする際に、結果を返すことなく長時間スタックしたり、長時間スタックして大量の書き込みロックログがfe.warn.logに出力される場合。

  URLにsocketTimeoutを追加することを試してください。例：`jdbc:mysql://host:port/database?socketTimeout=30000`。これにより、MySQLによって閉じられた後にJDBCクライアントが無限に待機することを防げます。

* MySQL Catalogの使用中に、FEのJVMメモリやThreads数が継続的に増加し減少しない、同時にForward to master connection timed outエラーが報告される可能性がある場合

  FEスレッドスタック `jstack fe_pid > fe.js` を出力し、大量の `mysql-cj-abandoned-connection-cleanup` スレッドが現れる場合、MySQL JDBCドライバの問題を示しています。

  以下のように対処してください：

  * MySQL JDBCドライバをバージョン8.0.31以上にアップグレードする

  * FEおよびBE confファイルの `JAVA_OPTS` にパラメータ `-Dcom.mysql.cj.disableAbandonedConnectionCleanup=true` を追加してMySQL JDBCドライバの接続クリーンアップ機能を無効にし、クラスタを再起動する

	注意：Dorisのバージョンが2.0.13以上、または2.1.5以上の場合、DorisはデフォルトでMySQL JDBCドライバの接続クリーンアップ機能を無効にしているため、このパラメータを追加する必要はありません。MySQL JDBCドライバのバージョンを置き換えるだけです。ただし、以前にリークしたスレッドをクリーンアップするためにDorisクラスタの再起動が必要です。
