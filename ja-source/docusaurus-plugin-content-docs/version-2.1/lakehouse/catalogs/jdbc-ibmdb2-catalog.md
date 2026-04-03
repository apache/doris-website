---
{
  "title": "IBM Db2 JDBCカタログ",
  "language": "ja",
  "description": "Doris JDBC カタログは、標準のJDBCインターフェースを通じてIBM Db2データベースへの接続をサポートします。"
}
---
Doris JDBC カタログは、標準のJDBCインターフェースを通じてIBM Db2データベースへの接続をサポートします。このドキュメントでは、IBM Db2データベース接続の設定方法について説明します。

JDBC カタログの概要については、[JDBC カタログ 概要](./jdbc-catalog-overview.md)を参照してください。

## 使用上の注意

IBM Db2データベースに接続するには、以下が必要です：

* IBM Db2 11.5.x以上

* IBM Db2データベース用のJDBCドライバー。[Maven Repository](https://mvnrepository.com/artifact/com.ibm.db2/jcc)から最新版または指定バージョンのIBM Db2ドライバーをダウンロードできます。IBM db2 jccバージョン11.5.8.0の使用を推奨します。

* 各Doris FEおよびBEノードとIBM Db2サーバー間のネットワーク接続。デフォルトポートは51000です。

## IBM Db2への接続

```sql
CREATE CATALOG db2_catalog PROPERTIES (
    'type' = 'jdbc',
    'user' = 'USERNAME',
    'password' = 'PASSWORD',
    'jdbc_url' = 'jdbc:db2://host:port/database',
    'driver_url' = 'jcc-11.5.8.0.jar',
    'driver_class' = 'com.ibm.db2.jcc.DB2Driver'
)
```
`jdbc_url`はIBM Db2ドライバーに渡される接続情報とパラメータを定義します。サポートされているURLパラメータは[Db2 JDBC Driver Documentation](https://www.ibm.com/docs/en/db2-big-sql/5.0?topic=drivers-jdbc-driver)で確認できます。

## 階層マッピング

IBM Db2をマッピングする際、DorisのDatabaseはDB2の指定されたDataBase（`jdbc_url`の「database」パラメータ）の下のSchemaに対応します。そしてDorisのDatabase下のTableは、DB2のSchema下のTablesに対応します。マッピング関係は以下の通りです：

| Doris    | IBM Db2  |
| -------- | -------- |
| Catalog  | DataBase |
| Database | Schema   |
| Table    | Table    |

## カラム型マッピング

| IBM Db2 Type     | Doris Type    | Comment |
| ---------------- | ------------- | ------- |
| smallint         | smallint      |         |
| int              | int           |         |
| bigint           | bigint        |         |
| double           | double        |         |
| double precision | double        |         |
| float            | double        |         |
| real             | float         |         |
| decimal(P, S)    | decimal(P, S) |         |
| decfloat(P, S)   | decimal(P, S) |         |
| date             | date          |         |
| timestamp(S)     | datetime(S)   |         |
| char(N)          | char(N)       |         |
| varchar(N)       | varchar(N)    |         |
| long varchar(N)  | varchar(N)    |         |
| vargraphic       | string        |         |
| long vargraphic  | string        |         |
| time             | string        |         |
| clob             | string        |         |
| xml              | string        |         |
| BLOB             | varbinary     |Catalogの`enable.mapping.varbinary`プロパティによって制御されます（4.0.2以降でサポート）。デフォルトは`false`で`string`にマップされ、`true`の場合は`varbinary`タイプにマップされます。|
| other            | UNSUPPORTED   |         |

## よくある問題

1. JDBC CatalogからIBM Db2データを読み取る際に、`Invalid operation: result set is closed. ERRORCODE=-4470`例外が発生する。

    IBM Db2 Catalogを作成する際に、jdbc\_url接続文字列に接続パラメータ`allowNextOnExhaustedResultSet=1;resultSetHoldability=1;`を追加してください。例：`jdbc:db2://host:port/database:allowNextOnExhaustedResultSet=1;resultSetHoldability=1;`。

2. Caught java.io.CharConversionException

    この問題は文字セットの問題が原因の可能性があります。`be.conf`の`JAVA_OPTS`に設定`-Ddb2.jcc.charsetDecoderEncoder=3`を追加し、BEを再起動して問題が解決するかどうか確認してください。`1`や`2`などの値も試すことができます。詳細については、https://www.ibm.com/docs/en/content-collector/4.0.1?topic=manager-jdbc-throws-javaiocharconversionexception を参照してください。
