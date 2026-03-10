---
{
  "title": "SAP HANA JDBCカタログ",
  "language": "ja",
  "description": "Doris JDBC CatalogはstandJDBC interfaceを通じてSAP HANAデータベースへの接続をサポートしています。"
}
---
Doris JDBC Catalogは、標準のJDBCインターフェースを通じてSAP HANAデータベースへの接続をサポートしています。このドキュメントでは、SAP HANAデータベース接続の設定方法について説明します。

JDBC Catalogの概要については、次を参照してください：[JDBC Catalog Overview](./jdbc-catalog-overview.md)

## 使用上の注意

SAP HANAデータベースに接続するには、以下が必要です

* SAP HANA 2.0以上

* SAP HANAデータベース用のJDBCドライバー。[Maven Repository](https://mvnrepository.com/artifact/com.sap.cloud.db.jdbc/ngdbc)からダウンロードできます。ngdbc 2.4.51以上のバージョンを使用することを推奨します。

* 各Doris FEおよびBEノードとSAP HANAサーバー間のネットワーク接続。デフォルトポートは30015です。

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
SAP HANA JDBC ドライバーがサポートするJDBC URLフォーマットとパラメータの詳細については、[SAP HANA](https://help.sap.com/docs/)を参照してください。

## 階層マッピング

SAP HANAをマッピングする際、DorisのDatabaseは、SAP HANAの指定されたDataBase下のSchemaに対応します（`jdbc_url`パラメータの"DATABASE"）。DorisのDatabase下のTableは、SAP HANAのSchema下のTablesに対応します。マッピング関係は以下の通りです：

| Doris    | SAP HANA |
| -------- | -------- |
| Catalog  | Database |
| Database | Schema   |
| Table    | Table    |

## カラム型マッピング

| SAP HANA Type      | Doris Type                        | Comment                                                      |
| ------------------ | --------------------------------- | ------------------------------------------------------------ |
| boolean            | boolean                           |                                                              |
| tinyint            | tinyint                           |                                                              |
| smalling           | smalling                          |                                                              |
| integer            | int                               |                                                              |
| bigint             | bigint                            |                                                              |
| smalldecimal(P, S) | decimal(P, S) or double or string | 精度が指定されていない場合は、double型が使用されます。精度がDorisでサポートされる最大精度を超える場合は、string型が使用されます。 |
| decimal(P, S)      | decimal(P, S) or double or string | 上記と同じ。                                               |
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
