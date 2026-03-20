---
{
  "title": "SAP HANA JDBCカタログ",
  "language": "ja",
  "description": "Doris JDBC カタログはSAP HANAデータベースへの接続を標準JDBC interfaceを通じてサポートします。"
}
---
Doris JDBC カタログは、標準のJDBCインターフェース経由でSAP HANAデータベースへの接続をサポートします。このドキュメントでは、SAP HANAデータベース接続の設定方法について説明します。

JDBC カタログの概要については、以下を参照してください: [JDBC カタログ 概要](./jdbc-catalog-overview.md)

## 使用上の注意事項

SAP HANAデータベースに接続するには、以下が必要です

* SAP HANA 2.0以上。

* SAP HANAデータベース用のJDBCドライバ。[Maven Repository](https://mvnrepository.com/artifact/com.sap.cloud.db.jdbc/ngdbc)からダウンロードできます。ngdbc 2.4.51以上のバージョンを使用することを推奨します。

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

SAP HANA をマッピングする際、Doris の Database は SAP HANA の指定された DataBase 配下の Schema に対応します（`jdbc_url` パラメータの "DATABASE"）。Doris の Database 配下の Table は SAP HANA の Schema 配下の Tables に対応します。マッピング関係は以下の通りです：

| Doris    | SAP HANA |
| -------- | -------- |
| Catalog  | Database |
| Database | Schema   |
| Table    | Table    |

## カラムタイプマッピング

| SAP HANA Type      | Doris Type                        | Comment                                                      |
| ------------------ | --------------------------------- | ------------------------------------------------------------ |
| boolean            | boolean                           |                                                              |
| tinyint            | tinyint                           |                                                              |
| smalling           | smalling                          |                                                              |
| integer            | int                               |                                                              |
| bigint             | bigint                            |                                                              |
| smalldecimal(P, S) | decimal(P, S) or double or string | 精度が指定されていない場合は、double 型が使用されます。精度が Doris でサポートされる最大精度を超える場合は、string 型が使用されます。 |
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
