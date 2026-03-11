---
{
  "title": "Oceanbase JDBC カタログ",
  "description": "Doris JDBC カタログは、標準のJDBCインターフェースを通じてOceanBaseデータベースへの接続をサポートします。",
  "language": "ja"
}
---
Doris JDBC カタログは標準のJDBCインターフェースを通じてOceanBaseデータベースへの接続をサポートしています。このドキュメントでは、OceanBaseデータベース接続の設定方法について説明します。

JDBC カタログの概要については、次を参照してください：[JDBC カタログ 概要](./jdbc-catalog-overview.md)

## 使用上の注意

OceanBaseデータベースに接続するには、以下が必要です

* OceanBase 3.1.0以上

* OceanBaseデータベース用のJDBCドライバー。最新版または指定バージョンのOceanBase JDBCドライバーは[Maven Repository](https://mvnrepository.com/artifact/com.oceanbase/oceanbase-client)からダウンロードできます。OceanBase Connector/J 2.4.8以上の使用を推奨します。

* DorisのすべてのFEおよびBEノードとOceanBaseサーバー間のネットワーク接続。

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
`jdbc_url`は、OceanBase JDBCドライバーに渡される接続情報とパラメータを定義します。サポートされているURLパラメータは、[OceanBase JDBC Driver 構成](https://www.oceanbase.com/docs/common-oceanbase-connector-j-cn-1000000000517111)で確認できます。

## スキーマ互換性

OceanBase Catalogを作成する際、DorisはOceanBaseがMySQLモードかOracleモードかを自動的に認識し、メタデータを正しく解析します。

異なるモードでの階層マッピング、型マッピング、およびクエリ最適化は、MySQLまたはOracleデータベースのCatalogと同じ方法で処理されます。詳細については以下のドキュメントを参照してください。

* [MySQL カタログ](./jdbc-mysql-catalog.md)

* [Oracle カタログ](./jdbc-oracle-catalog.md)
