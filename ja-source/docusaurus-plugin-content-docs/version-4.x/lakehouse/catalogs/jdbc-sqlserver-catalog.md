---
{
  "title": "SQL Server JDBC カタログ",
  "language": "ja",
  "description": "Doris JDBC CatalogはJDBCの標準インターフェースを通じてSQL Serverデータベースへの接続をサポートしています。"
}
---
Doris JDBC Catalogは、標準のJDBCインターフェースを通じてSQL Serverデータベースへの接続をサポートします。このドキュメントでは、SQL Serverデータベース接続の設定方法について説明します。

JDBC Catalogの概要については、次を参照してください：[JDBC Catalog Overview](./jdbc-catalog-overview.md)

## 使用上の注意

SQL Serverデータベースに接続するには、以下が必要です

* SQL Server 2012以降、またはAzure SQL Database。

* SQL Serverデータベース用のJDBCドライバー。最新版または指定されたバージョンを[Maven Repository](https://mvnrepository.com/artifact/com.microsoft.sqlserver/mssql-jdbc)からダウンロードできます。SQL Server JDBC Driver 11.2.x以上の使用を推奨します。

* DorisのFEノードとBEノードそれぞれとSQL Serverサーバー間のネットワーク接続。デフォルトポートは1433です。

## SQL Serverへの接続

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
`jdbc_url`は、SQL Server JDBCドライバーに渡される接続情報とパラメータを定義します。URLでサポートされるパラメータは、[SQL Server JDBC Driver Documentation](https://learn.microsoft.com/zh-cn/sql/connect/jdbc/building-the-connection-url?view=sql-server-ver16)で提供されています。

### 接続セキュリティ

JDBCドライバーとコネクターは、Transport Layer Security (TLS)暗号化と証明書検証を自動的に使用します。これには、SQL Serverデータベースホストで適切なTLS証明書を設定する必要があります。

必要な設定を確立していない場合は、encryptプロパティを使用して接続文字列で暗号化を無効にできます：

```sql
'jdbc_url' = 'jdbc:sqlserver://<host>:<port>;databaseName=<databaseName>;encrypt=false'
```
[SQL Server JDBC Driver Documentation](https://learn.microsoft.com/zh-cn/sql/connect/jdbc/using-ssl-encryption?view=sql-server-ver16)のTLSセクションでは、`trustServerCertificate`、`hostNameInCertificate`、`trustStore`、`trustStorePassword`などの他のパラメータについて詳しく説明されています。

## 階層マッピング

SQLServerをマッピングする際、DorisのDatabaseは、SQL Serverの指定されたDatabase（`jdbc_url`の`<databaseName>`パラメータ）配下のSchemaに対応します。DorisのDatabase配下のTableは、SQLServerのSchema配下のTablesに対応します。マッピング関係は以下のとおりです：

| Doris    | SQL Server |
| -------- | ---------- |
| Catalog  | Database   |
| Database | Schema     |
| Table    | Table      |

## カラム型マッピング

| SQL Server Type                        | Doris Type    | Comment                                          |
| -------------------------------------- | ------------- | ------------------------------------------------ |
| bit                                    | boolean       |                                                  |
| tinyint                                | smallint      | SQLServerのtinyintは符号なしのため、Dorisのsmallintにマッピングされます |
| smallint                               | smallint      |                                                  |
| int                                    | int           |                                                  |
| bigint                                 | bigint        |                                                  |
| real                                   | float         |                                                  |
| float                                  | double        |                                                  |
| money                                  | decimal(19,4) |                                                  |
| smallmoney                             | decimal(10,4) |                                                  |
| decimal(P, S)/numeric(P, S)            | decimal(P, S) |                                                  |
| date                                   | date          |                                                  |
| datetime/datetime2/smalldatetime       | datetime(S)   |                                                  |
| char/varchar/text/nchar/nvarchar/ntext | string        |                                                  |
| time/datetimeoffset                    | string        |                                                  |
| timestamp                              | string        | バイナリデータの16進表現を表示、実際の意味はありません |
| image/binary/varbinary             | varbinary     |Catalogの`enable.mapping.varbinary`プロパティによって制御されます（4.0.2以降でサポート）。デフォルトは`false`で`string`にマッピングされます。`true`の場合、`varbinary`型にマッピングされます。|
| other                                  | UNSUPPORTED   |                                                  |

## よくある問題

1. SQL Serverへの接続時の証明書認証例外

   ```text
   SQLServerException: The driver could not establish a secure connection to SQL Server by using Secure Sockets Layer (SSL) encryption.
   Error: "sun.security.validator.ValidatorException: PKIX path building failed: sun.security.provider.certpath.SunCertPathBuilderException:
   unable to find valid certification path to requested target". ClientConnectionId:a92f3817-e8e6-4311-bc21-7c66
   ```
Catalogを作成する際、JDBC接続文字列の末尾に`encrypt=false`を追加できます。例：`"jdbc_url" = "jdbc:sqlserver://127.0.0.1:1433;DataBaseName=doris_test;encrypt=false"`

2. SQL Serverへの接続時のTLS例外

   ```text
   The server selected protocol version TLS10 is not accepted by client preferences [TLS13, TLS12]
   ```
これは、SQL Server と JDBC クライアント間の TLS プロトコルバージョンが一致しないためです。接続された SQL Server は TLS 1.0 のみをサポートしていますが、JDBC クライアントが配置されている JAVA 環境では、TLS 1.0 がデフォルトで無効になっています。

   解決策は以下の通りです：

   1. SQL Server で TLS 1.2 を有効にする。参照：[SQL Server TLS 1.2 Support](https://learn.microsoft.com/zh-cn/troubleshoot/sql/database-engine/connect/tls-1-2-support-microsoft-sql-server)

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
