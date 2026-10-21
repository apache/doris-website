---
{
    "title": "MySQL JDBC Catalog",
    "language": "ja",
    "description": "Doris JDBC Catalog は、標準の JDBC インターフェースを介した MySQL データベースへの接続をサポートします。"
}
---

Doris JDBC Catalog は、標準の JDBC インターフェースを介した MySQL データベースへの接続をサポートします。このドキュメントでは、MySQL データベースへの接続方法を説明します。

JDBC Catalog の概要については、[JDBC Catalog の概要](./jdbc-catalog-overview.md)を参照してください。

## 使用上の注意 {#usage-notes}

MySQL データベースに接続するには、以下が必要です。

* MySQL 5.7、8.0、またはそれ以降のバージョン。

* MySQL 用の JDBC ドライバー。[Maven Repository](https://mvnrepository.com/artifact/com.mysql/mysql-connector-j)からダウンロードできます。MySQL Connector/J バージョン 8.0.31 以降の使用を推奨します。

* 各 Doris FE ノードおよび BE ノードと MySQL サーバーの間のネットワーク接続。デフォルトのポートは 3306 です。

## MySQL への接続 {#connecting-to-mysql}

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

`jdbc_url` では、MySQL JDBC ドライバーに渡す接続情報とパラメーターを指定します。サポートされる URL パラメーターについては、[MySQL 開発者ガイド](https://dev.mysql.com/doc/connector-j/en/connector-j-reference-configuration-properties.html)を参照してください。

### 接続のセキュリティ {#connection-security}

データソースにグローバルに信頼された証明書をインストールし、TLS を設定している場合は、`jdbc_url` プロパティの JDBC 接続文字列にパラメーターを追加することで、クラスターとデータソースの間で TLS を有効にできます。

たとえば、`MySQL Connector/J 8.0` では、`sslMode` パラメーターを使用して TLS で接続を保護します。このパラメーターのデフォルト値は PREFERRED で、サーバー側で TLS が有効な場合に接続を保護できます。REQUIRED に設定すると、TLS 接続を確立できなかった場合に接続が失敗します。

`jdbc_url` に sslMode パラメーターを追加して設定できます。

```sql
'jdbc_url' = 'jdbc:mysql://host:3306/?sslMode=REQUIRED'
```

TLS の設定オプションについて詳しくは、[MySQL JDBC のセキュリティに関するドキュメント](https://dev.mysql.com/doc/connector-j/en/connector-j-connp-props-security.html#cj-conn-prop_sslMode)を参照してください。

## 階層のマッピング {#hierarchical-mapping}

MySQL をマッピングする場合、Doris のデータベースは MySQL のデータベースに対応します。Doris のデータベース内のテーブルは、MySQL の対応するデータベース内のテーブルに対応します。対応関係は次のとおりです。

| Doris      | MySQL           |
| ---------- | --------------- |
| カタログ   | MySQL サーバー  |
| データベース | データベース    |
| テーブル   | テーブル        |

## カラム型のマッピング {#column-type-mapping}

| MySQL の型 | Doris の型 | 説明 |
| ---------- | ---------- | ---- |
| boolean | tinyint | |
| tinyint | tinyint | |
| smallint | smallint | |
| mediumint | int | |
| int | int | |
| bigint | bigint | |
| unsigned tinyint | smallint | Doris は符号なしデータ型をサポートしていないため、対応する、より大きな Doris のデータ型にマッピングします。 |
| unsigned mediumint | int | 上記と同じです。 |
| unsigned int | bigint | 上記と同じです。 |
| unsigned bigint | largeint | 上記と同じです。 |
| float | float | |
| double | double | |
| decimal(P, S) | decimal(P, S) | |
| unsigned decimal(P, S) | decimal(P + 1, S) / string | Doris がサポートする最大精度を超える場合は、String として扱います。この型が String にマッピングされた場合はクエリのみをサポートし、MySQL への書き込みはできません。 |
| date | date | |
| timestamp(S) | TIMESTAMPTZ(S) | 4.1.5 以降、この型は常に `TIMESTAMPTZ(S)` にマッピングされます。`enable.mapping.timestamp_tz` プロパティは互換性のために残されていますが、`false` に設定しても `DATETIME` へのマッピングには戻りません。精度の上限は 6 のため、それを超える精度は失われます。以前のバージョンでは、このプロパティで従来のマッピングを選択できます。 |
| datetime(S) | datetime(S) | |
| year | smallint | Doris は year 型をサポートしていないため、smallint にマッピングします。 |
| time | string | Doris は time 型をサポートしていないため、string にマッピングします。 |
| char | char | |
| varchar | varchar | |
| json | string | 読み取り性能と計算性能のバランスを考慮し、Doris は json 型を string 型にマッピングします。 |
| set | string | |
| enum | string | |
| bit | boolean / string | Doris は bit 型をサポートしていないため、bit(1) は boolean に、それ以外は string にマッピングします。 |
| tinytext, text, mediumtext, longtext | string | |
| blob, mediumblob, longblob, tinyblob, binary, varbinary | VARBINARY | 4.1.5 以降、この型は常に `VARBINARY` にマッピングされます。`enable.mapping.varbinary` プロパティは互換性のために残されていますが、`false` に設定しても `STRING` へのマッピングには戻りません。以前のバージョンでは、このプロパティで従来のマッピングを選択できます。 |
| other | UNSUPPORTED | |

## 付録 {#appendix}

### タイムゾーンに関する問題 {#time-zone-issues}

JDBC Catalog を介してデータにアクセスする際、BE の JNI 部分は JVM のタイムゾーンを使用します。JVM のタイムゾーンはデフォルトで BE を配置したマシンのタイムゾーンになり、JDBC がデータを読み取る際のタイムゾーン変換に影響します。タイムゾーンの一貫性を保つため、`be.conf` の `JAVA_OPTS` に設定する JVM のタイムゾーンを、Doris のセッション変数 `time_zone` と一致させることを推奨します。

MySQL の timestamp 型を読み取る場合は、JDBC URL に `connectionTimeZone=LOCAL` と `forceConnectionTimeZoneToSession=true` を追加してください。これらのパラメーターは MySQL Connector/J バージョン 8 以降に適用され、読み取り時のタイムゾーンが MySQL サーバーのタイムゾーンではなく、Doris BE の JVM タイムゾーンになるようにします。

## よくある問題 {#common-issues}

### 接続例外のトラブルシューティング {#connection-exception-troubleshooting}

* Communications link failure The last packet successfully received from the server was 7 milliseconds ago.

  * 原因:

      * ネットワークの問題:

          * ネットワークが不安定、または接続が中断された。

          * クライアントとサーバー間のネットワーク遅延が大きい。

      * MySQL サーバーの設定

          * MySQL サーバーに `wait_timeout` や `interactive_timeout` などの接続タイムアウトパラメーターが設定されており、タイムアウトによって接続が閉じられた可能性があります。

      * ファイアウォールの設定

          * ファイアウォールのルールによって、クライアントとサーバー間の通信がブロックされている可能性があります。

      * 接続プールの設定

          * 接続プールの `connection_pool_max_life_time` の設定により、接続が閉じられたり再利用のために回収されたり、適切なタイミングで接続が維持されなかったりする可能性があります。

      * サーバーのリソース不足

          * MySQL サーバーに、新しい接続要求を処理するためのリソースが不足している可能性があります。

      * クライアントの設定

          * `autoReconnect` パラメーターが未設定、または設定が不適切であるなど、クライアントの JDBC ドライバーの設定が誤っている可能性があります。

  * 対処方法

      * ネットワーク接続を確認する:

          * クライアントとサーバー間のネットワーク接続が安定しており、遅延が大きくないことを確認します。

      * MySQL サーバーの設定を確認する:

          * MySQL サーバーの `wait_timeout` と `interactive_timeout` を確認し、適切な値に調整します。

      * ファイアウォールの設定を確認する:

          * ファイアウォールのルールで、クライアントとサーバー間の通信が許可されていることを確認します。

      * 接続プールの設定を調整する:

          * 接続プールの `connection_pool_max_life_time` を確認し、MySQL の `wait_timeout` と `interactive_timeout` より短く、SQL の最長実行時間より長くなるよう調整します。

      * サーバーのリソースを監視する:

          * MySQL サーバーのリソース使用状況を監視し、接続要求を処理するためのリソースが十分にあることを確認します。

      * クライアントの設定を最適化する:

          * 接続が中断された後に自動再接続できるよう、`autoReconnect=true` など、JDBC ドライバーの設定パラメーターが正しいことを確認します。

* java.io.EOFException MESSAGE: Can not read response from server. Expected to read 819 bytes, read 686 bytes before connection was unexpectedly lost.

  * 原因: MySQL によって接続が切断されたか、MySQL がクラッシュしました。

  * 対処方法: MySQL に接続を能動的に切断する仕組みがあるか、または大規模なクエリによって MySQL がクラッシュしたかを確認します。

### その他の問題 {#other-issues}

1. MySQL の絵文字を読み書きする際の文字化け

   Doris から MySQL にクエリを実行する際、MySQL のデフォルトの utf8 エンコーディングは utf8mb3 であり、4 バイトのエンコーディングが必要な絵文字を表現できません。4 バイトのエンコーディングをサポートするには、MySQL のエンコーディングを utf8mb4 に変更する必要があります。

   設定項目はグローバルに変更できます。

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

2. MySQL の DATE/DATETIME 型を読み取る際の例外

   ```text
   ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.6)[INTERNAL_ERROR]UdfRuntimeException: get next block failed:
   CAUSED BY: SQLException: Zero date value prohibited
   CAUSED BY: DataReadException: Zero date value prohibited
   ```

   JDBC はデフォルトで、不正な DATE/DATETIME 値に対して例外をスローします。この動作は URL パラメーター `zeroDateTimeBehavior` で制御できます。選択できる値は `exception`、`convertToNull`、`round` で、それぞれ例外を発生させる、`NULL` 値に変換する、`"0001-01-01 00:00:00"` に変換する、という意味です。

   Catalog を作成する際、`zeroDateTimeBehavior=convertToNull` を `jdbc_url` の末尾にある JDBC 接続文字列に追加する必要があります。たとえば、`"jdbc_url" = "jdbc:mysql://127.0.0.1:3306/test?zeroDateTimeBehavior=convertToNull"` のように指定します。この場合、JDBC は 0000-00-00 または 0000-00-00 00:00:00 を null に変換します。その後、Doris は現在の Catalog のすべての Date/DateTime 型カラムを nullable 型として扱うため、正常に読み取れます。

3. MySQL Catalog やその他の JDBC Catalog を読み取る際に、`failed to load driver class com.mysql.cj.jdbc.driver in either of hikariconfig class loader` のようなクラス読み込みエラーが発生する

   原因は、Catalog の作成時に指定した `driver_class` が正しくないことです。上記の例では大文字と小文字の誤りがあるため、`'driver_class' = 'com.mysql.cj.jdbc.Driver'` と正しく指定してください。

4. MySQL の読み取り時に発生する通信リンクの例外

  ```text
  ERROR 1105 (HY000): errCode = 2, detailMessage = PoolInitializationException: Failed to initialize pool: Communications link failure

  The last packet successfully received from the server was 7 milliseconds ago.  The last packet sent successfully to the server was 4 milliseconds ago.
  CAUSED BY: CommunicationsException: Communications link failure

  The last packet successfully received from the server was 7 milliseconds ago.  The last packet sent successfully to the server was 4 milliseconds ago.
  CAUSED BY: SSLHandshakeException
  ```

  BE の be.out ログに次の情報が含まれているか確認してください。

  ```
  WARN: Establishing SSL connection without server's identity verification is not recommended.
  According to MySQL 5.5.45+, 5.6.26+ and 5.7.6+ requirements SSL connection must be established by default if explicit option isn't set.
  For compliance with existing applications not using SSL the verifyServerCertificate property is set to 'false'.
  You need either to explicitly disable SSL by setting useSSL=false, or set useSSL=true and provide truststore for server certificate verification.
  ```

  `'jdbc_url' = 'jdbc:mysql://127.0.0.1:3306/test?useSSL=false'` のように、`jdbc_url` に `useSSL=false` を追加できます。

* MySQL から大量のデータをクエリする際、成功したり次のエラーが発生したりする場合があります。このエラーが発生すると、MySQL へのすべての接続が切断され、MySQL Server に接続できなくなります。しばらくすると MySQL は正常に戻りますが、以前の接続は失われています。

  ```text
  ERROR 1105 (HY000): errCode = 2, detailMessage = [INTERNAL_ERROR]UdfRuntimeException: JDBC executor sql has error:
  CAUSED BY: CommunicationsException: Communications link failure
  The last packet successfully received from the server was 4,446 milliseconds ago. The last packet sent successfully to the server was 4,446 milliseconds ago.
  ```

  このような現象が発生する場合、MySQL Server 自体のメモリまたは CPU リソースが枯渇し、MySQL サービスが利用できなくなっている可能性があります。MySQL Server のメモリまたは CPU の割り当てを増やしてみてください。

* MySQL をクエリする際、クエリ結果が MySQL データベース内の結果と一致しない場合

  まず、クエリ対象のフィールドで大文字と小文字の区別が関係していないか確認します。たとえば、テーブルのフィールド `c_1` に `"aaa"` と `"AAA"` というデータがあるとします。MySQL データベースの初期化時に大文字と小文字を区別するよう指定していない場合、MySQL はデフォルトで区別しますか？ いいえ、MySQL は区別しません。一方、Doris は厳密に区別するため、次のような違いが生じます。

  ```text
  MySQL behavior:
  select count(c_1) from table where c_1 = "aaa"; Does not distinguish case, so the result is: 2

  Doris behavior:
  select count(c_1) from table where c_1 = "aaa"; Strictly distinguishes case, so the result is: 1
  ```

  この現象が発生する場合は、要件に応じて次のように調整してください。

  * MySQL のクエリに "BINARY" キーワードを追加して、大文字と小文字を強制的に区別する: `select count(c_1) from table where BINARY c_1 = "aaa";`

  * または、MySQL でテーブルを作成する際に指定する: `CREATE TABLE table (c_1 VARCHAR(255) CHARACTER SET binary);`

  * または、MySQL データベースの初期化時に、大文字と小文字を区別する照合順序を指定する:

		```text
		[mysqld]
		character-set-server=utf8
		collation-server=utf8_bin
		[client]
		default-character-set=utf8
		[mysql]
		default-character-set=utf8
		```

* MySQL へのクエリが長時間結果を返さずに停止したように見える場合、または長時間停止したように見え、fe.warn.log に書き込みロックのログが大量に出力される場合

  MySQL によって接続が閉じられた後、JDBC クライアントが無期限に待機するのを防ぐため、URL に socketTimeout を追加してみてください。例: `jdbc:mysql://host:port/database?socketTimeout=30000`。

* MySQL Catalog の使用中、FE の JVM メモリ使用量やスレッド数が減少せずに増え続け、同時に Forward to master connection timed out エラーが報告される場合

  `jstack fe_pid > fe.js` で FE のスレッドスタックを出力してください。`mysql-cj-abandoned-connection-cleanup` スレッドが大量にある場合は、MySQL JDBC ドライバーに問題があります。

  次のように対処してください。

  * MySQL JDBC ドライバーをバージョン 8.0.31 以降にアップグレードします。

  * FE と BE の設定ファイルの `JAVA_OPTS` にパラメーター `-Dcom.mysql.cj.disableAbandonedConnectionCleanup=true` を追加して、MySQL JDBC ドライバーの接続クリーンアップ機能を無効にし、クラスターを再起動します。

	注: Doris のバージョンが 2.0.13 以降、または 2.1.5 以降の場合、このパラメーターを追加する必要はありません。Doris はデフォルトで MySQL JDBC ドライバーの接続クリーンアップ機能を無効にしているためです。MySQL JDBC ドライバーのバージョンを変更するだけで済みます。ただし、以前にリークしたスレッドを解消するには、Doris クラスターを再起動する必要があります。
