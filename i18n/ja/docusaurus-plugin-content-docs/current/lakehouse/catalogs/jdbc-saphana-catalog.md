---
{
    "title": "SAP HANA JDBC カタログ",
    "language": "ja",
    "description": "Doris JDBC カタログは、標準の JDBC インターフェースを介した SAP HANA データベースへの接続をサポートします。"
}
---

Doris JDBC カタログは、標準の JDBC インターフェースを介した SAP HANA データベースへの接続をサポートします。このドキュメントでは、SAP HANA データベースへの接続方法を説明します。

JDBC カタログの概要については、[JDBC カタログの概要](./jdbc-catalog-overview.md)を参照してください。

## 使用上の注意

SAP HANA データベースに接続するには、以下が必要です。

* SAP HANA 2.0 以降。

* SAP HANA データベース用の JDBC ドライバー。[Maven Repository](https://mvnrepository.com/artifact/com.sap.cloud.db.jdbc/ngdbc)からダウンロードできます。ngdbc 2.4.51 以降の使用を推奨します。

* 各 Doris FE および BE ノードと SAP HANA サーバー間のネットワーク接続。デフォルトのポートは 30015 です。

## SAP HANA への接続

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

SAP HANA JDBC ドライバーがサポートする JDBC URL の形式とパラメーターについては、[SAP HANA](https://help.sap.com/docs/)を参照してください。

## 階層の対応関係

SAP HANA をマッピングする場合、Doris の Database は、SAP HANA の指定された DataBase（`jdbc_url` パラメーター内の「DATABASE」）配下にある Schema に対応します。Doris の Database 配下にある Table は、SAP HANA の Schema 配下にある Table に対応します。対応関係は次のとおりです。

| Doris    | SAP HANA |
| -------- | -------- |
| Catalog  | Database |
| Database | Schema   |
| Table    | Table    |

## 列型の対応関係

| SAP HANA の型      | Doris の型                        | 備考                                                      |
| ------------------ | --------------------------------- | ------------------------------------------------------------ |
| boolean            | boolean                           |                                                              |
| tinyint            | tinyint                           |                                                              |
| smallint           | smallint                          |                                                              |
| integer            | int                               |                                                              |
| bigint             | bigint                            |                                                              |
| smalldecimal(P, S) | decimal(P, S) または double または string | 精度が指定されていない場合は double 型が使用されます。精度が Doris のサポートする最大精度を超える場合は string 型が使用されます。 |
| decimal(P, S)      | decimal(P, S) または double または string | 上記と同じです。                                               |
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
