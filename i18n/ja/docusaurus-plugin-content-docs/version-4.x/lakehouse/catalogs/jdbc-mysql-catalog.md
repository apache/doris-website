---
{
    "title": "MySQL JDBC Catalog",
    "language": "ja",
    "description": "Doris JDBC Catalog は、標準の JDBC インターフェースを介した MySQL データベースへの接続をサポートします。"
}
---

Doris JDBC Catalog は、標準の JDBC インターフェースを介した MySQL データベースへの接続をサポートします。このドキュメントでは、MySQL データベースへの接続方法を説明します。

JDBC Catalog の概要については、[JDBC Catalog の概要](./jdbc-catalog-overview.md)を参照してください。

## 使用上の注意

MySQL データベースに接続するには、以下が必要です。

* MySQL 5.7、8.0、またはそれ以降のバージョン。

* MySQL 用の JDBC ドライバー。[Maven Repository](https://mvnrepository.com/artifact/com.mysql/mysql-connector-j)からダウンロードできます。MySQL Connector/J 8.0.31 以降の使用を推奨します。

* 各 Doris FE ノードおよび BE ノードから MySQL サーバーへのネットワーク接続。デフォルトのポートは 3306 です。

## MySQL への接続

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

`jdbc_url` には、MySQL JDBC ドライバーに渡す接続情報とパラメータを指定します。使用できる URL パラメータについては、[MySQL Developer Guide](https://dev.mysql.com/doc/connector-j/en/connector-j-reference-configuration-properties.html)を参照してください。

### 接続のセキュリティ

データソースで TLS が構成され、グローバルに信頼された証明書がインストールされている場合、`jdbc_url` プロパティの JDBC 接続文字列にパラメータを追加することで、クラスターとデータソース間の TLS を有効にできます。

たとえば、`MySQL Connector/J 8.0` では、`sslMode` パラメータを使用して TLS で接続を保護します。このパラメータのデフォルト値は PREFERRED で、サーバー側で TLS が有効な場合は TLS で接続できます。REQUIRED に設定すると、TLS 接続を確立できない場合に接続が失敗します。

`jdbc_url` に sslMode パラメータを追加して設定できます。

```sql
'jdbc_url' = 'jdbc:mysql://host:3306/?sslMode=REQUIRED'
```

TLS の設定オプションについては、[MySQL JDBC のセキュリティに関するドキュメント](https://dev.mysql.com/doc/connector-j/en/connector-j-connp-props-security.html#cj-conn-prop_sslMode)を参照してください。

## 階層のマッピング

MySQL をマッピングする場合、Doris の Database は MySQL の Database に対応します。Doris の Database 配下の Table は、MySQL のその Database 配下の Table に対応します。対応関係は次のとおりです。

| Doris    | MySQL        |
| -------- | ------------ |
| Catalog  | MySQL Server |
| Database | Database     |
| Table    | Table        |

## 列型のマッピング

| MySQL の型                           | Doris の型                 | 説明                                                                        |
| ------------------------------------ | -------------------------- | ------------------------------------------------------------------------------ |
| boolean                              | tinyint                    |                                                                                |
| tinyint                              | tinyint                    |                                                                                |
| smallint                             | smallint                   |                                                                                |
| mediumint                            | int                        |                                                                                |
| int                                  | int                        |                                                                                |
| bigint                               | bigint                     |                                                                                |
| unsigned tinyint                     | smallint                   | Doris は符号なしデータ型をサポートしていないため、対応する、より大きな Doris のデータ型にマッピングします。             |
| unsigned mediumint                   | int                        | 上記と同じです。                                                                            |
| unsigned int                         | bigint                     | 上記と同じです。                                                                            |
| unsigned bigint                      | largeint                   | 上記と同じです。                                                                            |
| float                                | float                      |                                                                                |
| double                               | double                     |                                                                                |
| decimal(P, S)                        | decimal(P, S)              |                                                                                |
| unsigned decimal(P, S)               | decimal(P + 1, S) / string | Doris がサポートする最大精度を超える場合は、String として扱います。この型が String にマッピングされた場合、クエリのみをサポートし、MySQL への書き込みはできません。 |
| date                                 | date                       |                                                                                |
| timestamp(S) | datetime(S) / timestamptz(S) | `enable.mapping.timestamp_tz` プロパティで制御します（バージョン 4.0.3 以降でサポート）。デフォルト値は `false` で、この場合は `datetime` にマッピングします。`true` に設定すると、`timestamptz` 型にマッピングします。 |
| datetime(S)                          | datetime(S)                |                                                                                |
| year                                 | smallint                   | Doris は year 型をサポートしていないため、smallint にマッピングします。                                       |
| time                                 | string                     | Doris は time 型をサポートしていないため、string にマッピングします。                                         |
| char                                 | char                       |                                                                                |
| varchar                              | varchar                    |                                                                                |
| json                                 | string                     | 読み取り性能と計算性能のバランスを改善するため、Doris は json 型を string 型にマッピングします。                                  |
| set                                  | string                     |                                                                                |
| enum                                 | string                     |                                                                                |
| bit                                  | boolean / string           | Doris は bit 型をサポートしていないため、bit(1) は boolean に、それ以外は string にマッピングします。                |
| tinytext, text, mediumtext, longtext | string                     |                                                                                |
| blob, mediumblob, longblob, tinyblob, binary, varbinary | string/varbinary                     | Catalog の `enable.mapping.varbinary` プロパティで制御します（4.0.2 以降でサポート）。デフォルト値は `false` で、`string` にマッピングします。`true` の場合は `varbinary` 型にマッピングします。                                                                              |
| other                                | UNSUPPORTED                |                                                                                |

## 付録

### タイムゾーンに関する問題

JDBC Catalog を介してデータにアクセスする際、BE の JNI 部分は JVM のタイムゾーンを使用します。JVM のタイムゾーンはデフォルトで BE のデプロイ先マシンのタイムゾーンになり、JDBC でデータを読み取る際のタイムゾーン変換に影響します。タイムゾーンを一致させるため、`be.conf` の `JAVA_OPTS` で JVM のタイムゾーンを Doris のセッション変数 `time_zone` と同じ値に設定することを推奨します。

MySQL の timestamp 型を読み取る場合は、JDBC URL に `connectionTimeZone=LOCAL` と `forceConnectionTimeZoneToSession=true` を追加します。これらのパラメータは MySQL Connector/J バージョン 8 以降で使用でき、読み取られる時刻が MySQL サーバーのタイムゾーンではなく、Doris BE の JVM のタイムゾーンに基づくようにします。

## よくある問題

### 接続例外のトラブルシューティング

* Communications link failure The last packet successfully received from the server was 7 milliseconds ago.

  * 原因：

      * ネットワークの問題：

          * ネットワークが不安定、または接続が中断されている。

          * クライアントとサーバー間のネットワーク遅延が大きい。

      * MySQL サーバーの設定

          * MySQL サーバーの `wait_timeout` や `interactive_timeout` などの接続タイムアウト設定により、接続がタイムアウトして切断された可能性があります。

      * ファイアウォールの設定

          * ファイアウォールのルールがクライアントとサーバー間の通信をブロックしている可能性があります。

      * 接続プールの設定

          * 接続プールの `connection_pool_max_life_time` の設定により、接続が切断または再利用されたか、接続の維持が間に合わなかった可能性があります。

      * サーバーのリソース不足

          * MySQL サーバーに、新しい接続要求を処理するためのリソースが不足している可能性があります。

      * クライアントの設定

          * `autoReconnect` パラメータが未設定か、適切に設定されていないなど、クライアントの JDBC ドライバー設定に誤りがある可能性があります。

  * 対処方法

      * ネットワーク接続を確認する：

          * クライアントとサーバー間のネットワーク接続が安定し、遅延が大きくないことを確認します。

      * MySQL サーバーの設定を確認する：

          * MySQL サーバーの `wait_timeout` と `interactive_timeout` を確認し、適切な値に調整します。

      * ファイアウォールの設定を確認する：

          * ファイアウォールのルールでクライアントとサーバー間の通信が許可されていることを確認します。

      * 接続プールの設定を調整する：

          * `connection_pool_max_life_time` が MySQL の `wait_timeout` と `interactive_timeout` より短く、最長の SQL 実行時間より長くなるよう、接続プールの設定を確認・調整します。

      * サーバーのリソースを監視する：

          * MySQL サーバーのリソース使用量を監視し、接続要求を処理できるだけのリソースがあることを確認します。

      * クライアントの設定を最適化する：

          * 接続が中断された後に自動的に再接続できるよう、`autoReconnect=true` などの JDBC ドライバーのパラメータが正しいことを確認します。

* java.io.EOFException MESSAGE: Can not read response from server. Expected to read 819 bytes, read 686 bytes before connection was unexpectedly lost.

  * 原因：MySQL によって接続が強制終了されたか、MySQL がクラッシュしました。

  * 対処方法：MySQL が接続を能動的に切断する仕組みを備えているか、または大きなクエリが原因で MySQL がクラッシュしたかを確認します。

### その他の問題

1. MySQL の絵文字を読み書きすると文字化けする

   Doris が MySQL をクエリする際、MySQL のデフォルトの utf8 エンコーディングは utf8mb3 であり、4 バイトのエンコーディングが必要な絵文字を表現できません。4 バイトのエンコーディングに対応するには、MySQL のエンコーディングを utf8mb4 に変更する必要があります。

   設定項目をグローバルに変更できます。

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

2. MySQL の DATE/DATETIME 型を読み取る際に例外が発生する

   ```text
   ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.6)[INTERNAL_ERROR]UdfRuntimeException: get next block failed: 
   CAUSED BY: SQLException: Zero date value prohibited
   CAUSED BY: DataReadException: Zero date value prohibited
   ```

   JDBC では、不正な DATE/DATETIME 値に対してデフォルトで例外がスローされます。この動作は URL パラメータ `zeroDateTimeBehavior` で制御できます。選択できる値は `exception`、`convertToNull`、`round` で、それぞれ例外を発生させる、`NULL` 値に変換する、`"0001-01-01 00:00:00"` に変換することを意味します。

   Catalog の作成時に、JDBC 接続文字列の末尾に `zeroDateTimeBehavior=convertToNull` を追加する必要があります。対象は `jdbc_url` で、例は `"jdbc_url" = "jdbc:mysql://127.0.0.1:3306/test?zeroDateTimeBehavior=convertToNull"` です。この場合、JDBC は 0000-00-00 または 0000-00-00 00:00:00 を null に変換し、Doris は現在の Catalog にあるすべての Date/DateTime 型の列を NULL 許容型として扱うため、正常に読み取れるようになります。

3. MySQL Catalog またはその他の JDBC Catalog を読み取る際に、`failed to load driver class com.mysql.cj.jdbc.driver in either of hikariconfig class loader` のようなクラス読み込みエラーが発生する

   これは、Catalog の作成時に指定した `driver_class` が正しくないためです。上の例では大文字と小文字に誤りがあるので、`'driver_class' = 'com.mysql.cj.jdbc.Driver'` と指定します。

4. MySQL を読み取る際に通信リンクの例外が発生する

  ```text
  ERROR 1105 (HY000): errCode = 2, detailMessage = PoolInitializationException: Failed to initialize pool: Communications link failure

  The last packet successfully received from the server was 7 milliseconds ago.  The last packet sent successfully to the server was 4 milliseconds ago.
  CAUSED BY: CommunicationsException: Communications link failure
      
  The last packet successfully received from the server was 7 milliseconds ago.  The last packet sent successfully to the server was 4 milliseconds ago.
  CAUSED BY: SSLHandshakeException
  ```

  BE の be.out ログに次の情報が含まれているか確認できます。

  ```
  WARN: Establishing SSL connection without server's identity verification is not recommended. 
  According to MySQL 5.5.45+, 5.6.26+ and 5.7.6+ requirements SSL connection must be established by default if explicit option isn't set. 
  For compliance with existing applications not using SSL the verifyServerCertificate property is set to 'false'. 
  You need either to explicitly disable SSL by setting useSSL=false, or set useSSL=true and provide truststore for server certificate verification.
  ```

  `useSSL=false` を `jdbc_url` に追加できます。例：`'jdbc_url' = 'jdbc:mysql://127.0.0.1:3306/test?useSSL=false'`。

* MySQL から大量のデータをクエリする際に、成功することもあれば次のエラーが発生することもある場合。エラー発生時には MySQL へのすべての接続が切断され、MySQL Server に接続できなくなります。しばらくすると MySQL は正常に戻りますが、以前の接続は失われています。

  ```text
  ERROR 1105 (HY000): errCode = 2, detailMessage = [INTERNAL_ERROR]UdfRuntimeException: JDBC executor sql has error:
  CAUSED BY: CommunicationsException: Communications link failure
  The last packet successfully received from the server was 4,446 milliseconds ago. The last packet sent successfully to the server was 4,446 milliseconds ago.
  ```

  この現象が起きた場合、MySQL Server 自体のメモリまたは CPU リソースが枯渇し、MySQL サービスが利用できなくなっている可能性があります。MySQL Server のメモリまたは CPU の割り当てを増やしてみてください。

* MySQL をクエリした際に、クエリ結果が MySQL データベース内の結果と一致しない場合

  まず、クエリ対象のフィールドで大文字と小文字の区別が影響していないか確認します。たとえば、`"aaa"` と `"AAA"` という二件のデータが Table のフィールド `c_1` にある場合、MySQL データベースの初期化時に大文字と小文字を区別するよう指定していなければ、MySQL はデフォルトで区別しません。一方、Doris は厳密に区別するため、次のような違いが生じます。

  ```text
  MySQL behavior:
  select count(c_1) from table where c_1 = "aaa"; Does not distinguish case, so the result is: 2

  Doris behavior:
  select count(c_1) from table where c_1 = "aaa"; Strictly distinguishes case, so the result is: 1
  ```

  この現象が起きた場合は、要件に応じて次のように調整します。

  * MySQL のクエリに "BINARY" キーワードを追加して、大文字と小文字を強制的に区別する：`select count(c_1) from table where BINARY c_1 = "aaa";`

  * または、MySQL でテーブルを作成するときに指定する：`CREATE TABLE table (c_1 VARCHAR(255) CHARACTER SET binary);`

  * または、MySQL データベースの初期化時に大文字と小文字を区別する照合順序を指定する：

		```text
		[mysqld]
		character-set-server=utf8
		collation-server=utf8_bin
		[client]
		default-character-set=utf8
		[mysql]
		default-character-set=utf8
		```

* MySQL のクエリが長時間結果を返さずに停止したり、長時間停止して fe.warn.log に大量の書き込みロックのログが出たりする場合

  MySQL によって接続が閉じられた後、JDBC クライアントが無期限に待機しないよう、URL に socketTimeout を追加してみてください。例：`jdbc:mysql://host:port/database?socketTimeout=30000`。

* MySQL Catalog の使用中に、FE の JVM メモリ使用量またはスレッド数が増え続けて減らず、同時に Forward to master connection timed out エラーが発生する場合

  FE のスレッドスタックを `jstack fe_pid > fe.js` で出力します。`mysql-cj-abandoned-connection-cleanup` スレッドが大量に見つかった場合は、MySQL JDBC ドライバーに問題があることを示します。

  次のように対処します。

  * MySQL JDBC ドライバーをバージョン 8.0.31 以降にアップグレードする。

  * `-Dcom.mysql.cj.disableAbandonedConnectionCleanup=true` パラメータを FE と BE の設定ファイルの `JAVA_OPTS` に追加し、MySQL JDBC ドライバーの接続クリーンアップ機能を無効にして、クラスターを再起動する。

	注：Doris のバージョンが 2.0.13 以降または 2.1.5 以降の場合、Doris はデフォルトで MySQL JDBC ドライバーの接続クリーンアップ機能を無効にしているため、このパラメータを追加する必要はありません。MySQL JDBC ドライバーのバージョンを更新するだけで済みます。ただし、以前にリークしたスレッドを解消するには、Doris クラスターの再起動が必要です。
