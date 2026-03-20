---
{
  "title": "SQL サーバー JDBC カタログ",
  "language": "ja",
  "description": "Doris JDBC カタログはJDBCの標準インターフェースを通じてSQL サーバーデータベースへの接続をサポートしています。"
}
---
Doris JDBC カタログは、標準のJDBCインターフェースを通じてSQL サーバーデータベースへの接続をサポートしています。このドキュメントでは、SQL サーバーデータベース接続の設定方法について説明します。

JDBC カタログの概要については、次を参照してください：[JDBC カタログ 概要](./jdbc-catalog-overview.md)

## 使用上の注意事項

SQL サーバーデータベースに接続するには、以下が必要です

* SQL サーバー 2012以降、またはAzure SQL Database。

* SQL サーバーデータベース用のJDBCドライバー。最新版または指定されたバージョンを[Maven Repository](https://mvnrepository.com/artifact/com.microsoft.sqlserver/mssql-jdbc)からダウンロードできます。SQL サーバー JDBC Driver 11.2.x以上の使用を推奨します。

* DorisのFEおよびBEノードとSQL サーバーサーバー間のネットワーク接続。デフォルトポートは1433です。

## SQL サーバーへの接続

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

### Connection Security

JDBCドライバーとコネクターは、Transport Layer Security (TLS)暗号化と証明書検証を自動的に使用します。これには、SQL Serverデータベースホスト上で適切なTLS証明書を設定する必要があります。

必要な設定を確立していない場合は、encryptプロパティを使用して接続文字列で暗号化を無効にできます：

```sql
'jdbc_url' = 'jdbc:sqlserver://<host>:<port>;databaseName=<databaseName>;encrypt=false'
```
[SQL Server JDBC Driver Documentation](https://learn.microsoft.com/zh-cn/sql/connect/jdbc/using-ssl-encryption?view=sql-server-ver16)のTLSセクションには、`trustServerCertificate`、`hostNameInCertificate`、`trustStore`、`trustStorePassword`などの他のパラメータの詳細が記載されています。

## 階層マッピング

SQLServerをマッピングする際、DorisのDatabaseはSQL Serverの指定されたDatabase（`jdbc_url`の`<databaseName>`パラメータ）配下のSchemaに対応します。DorisのDatabase配下のTableは、SQLServerのSchema配下のTablesに対応します。マッピング関係は以下の通りです：

| Doris    | SQL Server |
| -------- | ---------- |
| Catalog  | Database   |
| Database | Schema     |
| Table    | Table      |

## カラムタイプマッピング

| SQL Server Type                        | Doris Type    | Comment                                          |
| -------------------------------------- | ------------- | ------------------------------------------------ |
| bit                                    | boolean       |                                                  |
| tinyint                                | smallint      | SQLServerのtinyintはunsignedなので、Dorisのsmallintにマッピングされます |
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
| image/binary/varbinary             | varbinary     |Catalogの`enable.mapping.varbinary`プロパティによって制御されます（4.0.2以降サポート）。デフォルトは`false`で`string`にマッピングされます；`true`の場合は`varbinary`タイプにマッピングされます。|
| other                                  | UNSUPPORTED   |                                                  |

## よくある問題

1. SQL Serverへの接続時の証明書認証例外

   ```text
   SQLServerException: The driver could not establish a secure connection to SQL Server by using Secure Sockets Layer (SSL) encryption.
   Error: "sun.security.validator.ValidatorException: PKIX path building failed: sun.security.provider.certpath.SunCertPathBuilderException:
   unable to find valid certification path to requested target". ClientConnectionId:a92f3817-e8e6-4311-bc21-7c66
   ```
Catalogを作成する際に、JDBC接続文字列の末尾に`encrypt=false`を追加できます。例：`"jdbc_url" = "jdbc:sqlserver://127.0.0.1:1433;DataBaseName=doris_test;encrypt=false"`

2. SQL Serverへの接続時のTLS例外

   ```text
   The server selected protocol version TLS10 is not accepted by client preferences [TLS13, TLS12]
   ```
これは、SQL ServerとJDBCクライアント間のTLSプロトコルバージョンが一致しないためです。接続されたSQL ServerはTLS 1.0のみをサポートしていますが、JDBCクライアントが配置されているJAVA環境では、TLS 1.0がデフォルトで無効になっています。

   解決策は以下の通りです：

   1. SQL ServerでTLS 1.2を有効にする。参照：[SQL Server TLS 1.2 Support](https://learn.microsoft.com/zh-cn/troubleshoot/sql/database-engine/connect/tls-1-2-support-microsoft-sql-server)

   2. JDKでTLS 1.0を有効にする。

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
