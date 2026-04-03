---
{
  "title": "SAP HANA JDBC カタログ",
  "description": "Doris JDBC カタログはHDBC標準インターフェースを通じてSAP HANAデータベースへの接続をサポートします。",
  "language": "ja"
}
---
Doris JDBC カタログは標準のJDBCインターフェースを通じてSAP HANAデータベースへの接続をサポートしています。このドキュメントでは、SAP HANAデータベース接続の設定方法について説明します。

JDBC カタログの概要については、以下を参照してください：[JDBC カタログ 概要](./jdbc-catalog-overview.md)

## 使用上の注意

SAP HANAデータベースに接続するには、以下が必要です

* SAP HANA 2.0以上。

* SAP HANAデータベース用のJDBCドライバー。これは[Maven Repository](https://mvnrepository.com/artifact/com.sap.cloud.db.jdbc/ngdbc)からダウンロードできます。ngdbc 2.4.51以上のバージョンの使用を推奨します。

* 各DorisのFEおよびBEノードとSAP HANAサーバー間のネットワーク接続。デフォルトポートは30015です。

## SAP HANAへの接続

```sql
CREATE CATALOG saphana_catalog PROPERTIES (
    'type' = 'jdbc',
    'user' = 'username',
    'password' = 'pwd',
    'jdbc_url' = 'jdbc:sap://Hostname:Port/?optionalparameters',
    'driver_url' = 'ngdbc-2.4.51.jar',
    'driver_class' = 'com.sap.db.jdbc.Driver'
)
```
SAP HANA JDBCドライバーでサポートされているJDBC URLフォーマットとパラメータの詳細については、[SAP HANA](https://help.sap.com/docs/)を参照してください。

## 階層マッピング

SAP HANAをマッピングする際、DorisのDatabaseは、SAP HANAの指定されたDataBase配下のSchemaに対応します（`jdbc_url`パラメータの"DATABASE"）。DorisのDatabase配下のTableは、SAP HANAのSchema配下のTablesに対応します。マッピング関係は以下の通りです：

| Doris    | SAP HANA |
| -------- | -------- |
| カタログ  | Database |
| Database | Schema   |
| Table    | Table    |

## カラム型マッピング

| SAP HANA タイプ      | Doris タイプ                        | Comment                                                      |
| ------------------ | --------------------------------- | ------------------------------------------------------------ |
| boolean            | boolean                           |                                                              |
| tinyint            | tinyint                           |                                                              |
| smalling           | smalling                          |                                                              |
| integer            | int                               |                                                              |
| bigint             | bigint                            |                                                              |
| smalldecimal(P, S) | decimal(P, S) or double or string | 精度が指定されていない場合、double型が使用されます。精度がDorisでサポートされる最大精度を超える場合、string型が使用されます。 |
| decimal(P, S)      | decimal(P, S) or double or string | 上記と同様。                                               |
| real               | float                             |                                                              |
| double             | double                            |                                                              |
| date               | date                              |                                                              |
| time               | string                            |                                                              |
| timestamp(S)       | datetime(S)                       |                                                              |
| seconddate         | datetime(S)                       |                                                              |
| varchar            | string                            |                                                              |
| nvarchar           | string                            |                                                              |
| alphanum           | string                            |                                                              |
| shorttext          | string                            |                                                              |
| char(N)            | char(N)                           |                                                              |
| nchar(N)           | char(N)                           |                                                              |
| other              | UNSUPPORTED                       |                                                              |
