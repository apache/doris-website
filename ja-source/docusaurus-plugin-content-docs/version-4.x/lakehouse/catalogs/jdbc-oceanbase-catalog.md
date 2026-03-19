---
{
  "title": "Oceanbase JDBC カタログ",
  "language": "ja",
  "description": "Doris JDBC CatalogはOceanBaseデータベースに標準JDBCインターフェースを通じて接続することをサポートしています。"
}
---
Doris JDBC Catalogは、標準のJDBCインターフェースを通じてOceanBaseデータベースへの接続をサポートします。このドキュメントでは、OceanBaseデータベース接続の設定方法について説明します。

JDBC Catalogの概要については、以下を参照してください：[JDBC Catalog Overview](./jdbc-catalog-overview.md)

## 使用上の注意事項

OceanBaseデータベースに接続するには、以下が必要です

* OceanBase 3.1.0以上

* OceanBaseデータベース用のJDBCドライバー。[Maven Repository](https://mvnrepository.com/artifact/com.oceanbase/oceanbase-client)から最新版または指定されたバージョンのOceanBase JDBCドライバーをダウンロードできます。OceanBase Connector/J 2.4.8以上の使用を推奨します。

* DorisのFEおよびBE各ノードとOceanBaseサーバー間のネットワーク接続。

## OceanBaseへの接続

```sql
CREATE CATALOG oceanbase_catalog PROPERTIES (
    'type' = 'jdbc',
    'user' = 'username',
    'password' = 'pwd',
    'jdbc_url' = 'jdbc:oceanbase://host:port/db',
    'driver_url' = 'oceanbase-client-2.4.8.jar',
    'driver_class' = 'com.oceanbase.jdbc.Driver'
)
```
`jdbc_url`は、OceanBase JDBCドライバーに渡される接続情報とパラメータを定義します。サポートされるURLパラメータは[OceanBase JDBC Driver Configuration](https://www.oceanbase.com/docs/common-oceanbase-connector-j-cn-1000000000517111)で確認できます。

## スキーマの互換性

OceanBase Catalogを作成する際、DorisはOceanBaseがMySQLモードかOracleモードかを自動的に認識し、メタデータを正しく解析します。

異なるモードでの階層マッピング、型マッピング、およびクエリ最適化は、MySQLまたはOracleデータベースのCatalogと同様に処理され、以下のドキュメントを参照できます

* [MySQL Catalog](./jdbc-mysql-catalog.md)

* [Oracle Catalog](./jdbc-oracle-catalog.md)
