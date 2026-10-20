---
{
    "title": "SQL Server JDBC Catalog",
    "language": "ja",
    "description": "Doris JDBC Catalog は、標準の JDBC インターフェースを通じた SQL Server データベースへの接続をサポートします。"
}
---

Doris JDBC Catalog は、標準の JDBC インターフェースを通じた SQL Server データベースへの接続をサポートします。このドキュメントでは、SQL Server データベースへの接続方法を説明します。

JDBC Catalog の概要については、[JDBC Catalog の概要](./jdbc-catalog-overview.md)を参照してください。

## 使用上の注意 {#usage-notes}

SQL Server データベースに接続するには、以下が必要です。

* SQL Server 2012 以降、または Azure SQL Database。

* SQL Server データベース用の JDBC ドライバー。最新版または指定したバージョンを [Maven Repository](https://mvnrepository.com/artifact/com.microsoft.sqlserver/mssql-jdbc) からダウンロードできます。SQL Server JDBC Driver 11.2.x 以降の使用を推奨します。

* Doris の各 FE ノードおよび BE ノードと SQL Server サーバー間のネットワーク接続。デフォルトのポートは 1433 です。

## SQL Server への接続 {#connecting-to-sql-server}

```sql
CREATE CATALOG sqlserver_catalog PROPERTIES (
    'type' = 'jdbc',
    'user' = 'username',
    'password' = 'pwddd',
    'jdbc_url' = 'jdbc:sqlserver://<host>:<port>;databaseName=<databaseName>;encrypt=false',
    'driver_url' = 'mssql-jdbc-11.2.3.jre8.jar',
    'driver_class' = 'com.microsoft.sqlserver.jdbc.SQLServerDriver'
)
```

`jdbc_url` には、SQL Server JDBC ドライバーに渡す接続情報とパラメータを指定します。URL で使用できるパラメータについては、[SQL Server JDBC Driver のドキュメント](https://learn.microsoft.com/zh-cn/sql/connect/jdbc/building-the-connection-url?view=sql-server-ver16)を参照してください。

### 接続のセキュリティ {#connection-security}

JDBC ドライバーとコネクターは、Transport Layer Security（TLS）による暗号化と証明書の検証を自動的に使用します。そのため、SQL Server データベースのホストに適切な TLS 証明書を設定する必要があります。

必要な設定がまだ整っていない場合は、接続文字列で encrypt プロパティを使用して暗号化を無効にできます。

```sql
'jdbc_url' = 'jdbc:sqlserver://<host>:<port>;databaseName=<databaseName>;encrypt=false'
```

[SQL Server JDBC Driver のドキュメント](https://learn.microsoft.com/zh-cn/sql/connect/jdbc/using-ssl-encryption?view=sql-server-ver16)の TLS に関するセクションでは、`trustServerCertificate`、`hostNameInCertificate`、`trustStore`、`trustStorePassword` などのパラメータについて説明しています。

## 階層マッピング {#hierarchical-mapping}

SQL Server をマッピングする場合、Doris のデータベースは、SQL Server で指定したデータベース（`<databaseName>` は `jdbc_url` のパラメータ）内のスキーマに対応します。Doris のデータベース内のテーブルは、SQL Server のスキーマ内のテーブルに対応します。対応関係は次のとおりです。

| Doris        | SQL Server   |
| ------------ | ------------ |
| Catalog      | データベース |
| データベース | スキーマ     |
| テーブル     | テーブル     |

## カラム型のマッピング {#column-type-mapping}

| SQL Server の型                        | Doris の型    | 備考 |
| -------------------------------------- | ------------- | ---- |
| bit                                    | boolean       |      |
| tinyint                                | smallint      | SQL Server の tinyint は符号なしのため、Doris の smallint にマッピングされます。 |
| smallint                               | smallint      |      |
| int                                    | int           |      |
| bigint                                 | bigint        |      |
| real                                   | float         |      |
| float                                  | double        |      |
| money                                  | decimal(19,4) |      |
| smallmoney                             | decimal(10,4) |      |
| decimal(P, S)/numeric(P, S)            | decimal(P, S) |      |
| date                                   | date          |      |
| datetime/datetime2/smalldatetime       | datetime(S)   |      |
| char/varchar/text/nchar/nvarchar/ntext | string        |      |
| time | string | |
| datetimeoffset | TIMESTAMPTZ(S) | 4.1.5 以降、この型は絶対時刻としての意味を保持し、精度の上限は 6 です。 |
| timestamp                              | string        | バイナリデータの十六進表現を表示しますが、実際の意味はありません。 |
| image/binary/varbinary | VARBINARY | 4.1.5 以降、この型は常に `VARBINARY` にマッピングされます。`enable.mapping.varbinary` プロパティは互換性のために残されていますが、`false` に設定しても `STRING` へのマッピングには戻りません。以前のバージョンでは、このプロパティで従来のマッピングを選択できます。 |
| other                                  | UNSUPPORTED   |      |

## よくある問題 {#common-issues}

1. SQL Server への接続時に証明書認証の例外が発生する

   ```text
   SQLServerException: The driver could not establish a secure connection to SQL Server by using Secure Sockets Layer (SSL) encryption.
   Error: "sun.security.validator.ValidatorException: PKIX path building failed: sun.security.provider.certpath.SunCertPathBuilderException:
   unable to find valid certification path to requested target". ClientConnectionId:a92f3817-e8e6-4311-bc21-7c66
   ```

   Catalog の作成時に、JDBC 接続文字列の末尾に `encrypt=false` を追加できます。例：`"jdbc_url" = "jdbc:sqlserver://127.0.0.1:1433;DataBaseName=doris_test;encrypt=false"`

2. SQL Server への接続時に TLS の例外が発生する

   ```text
   The server selected protocol version TLS10 is not accepted by client preferences [TLS13, TLS12]
   ```

   これは、SQL Server と JDBC クライアントの TLS プロトコルのバージョンが一致しないためです。接続先の SQL Server は TLS 1.0 のみをサポートしていますが、JDBC クライアントを実行する JAVA 環境では TLS 1.0 がデフォルトで無効になっています。

   対処方法は次のとおりです。

   1. SQL Server で TLS 1.2 を有効にする。参照先：[SQL Server の TLS 1.2 サポート](https://learn.microsoft.com/zh-cn/troubleshoot/sql/database-engine/connect/tls-1-2-support-microsoft-sql-server)

   2. JDK で TLS 1.0 を有効にする。

   ```shell
   vim ${JAVA_HOME}/lib/security/java.security
   # Find this section
   jdk.tls.disabledAlgorithms=SSLv3, TLSv1, TLSv1.1, RC4, DES, MD5withRSA, \
   DH keySize < 1024, EC keySize < 224, 3DES_EDE_CBC, anon, NULL, \
   include jdk.disabled.namedCurves

   # Remove TLSv1, TLSv1.1, change it to the following
   jdk.tls.disabledAlgorithms=SSLv3, RC4, DES, MD5withRSA, \
   DH keySize < 1024, EC keySize < 224, anon, NULL, \
   include jdk.disabled.namedCurves
   ```
