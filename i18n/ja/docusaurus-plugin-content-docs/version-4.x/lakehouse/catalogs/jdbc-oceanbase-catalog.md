---
{
    "title": "OceanBase JDBC Catalog",
    "language": "ja",
    "description": "Doris JDBC Catalog は、標準の JDBC インターフェースを介した OceanBase データベースへの接続をサポートします。"
}
---

Doris JDBC Catalog は、標準の JDBC インターフェースを介した OceanBase データベースへの接続をサポートします。このドキュメントでは、OceanBase データベースへの接続方法を説明します。

JDBC Catalog の概要については、[JDBC Catalog の概要](./jdbc-catalog-overview.md)を参照してください。

## 利用上の注意

OceanBase データベースに接続するには、以下が必要です。

* OceanBase 3.1.0 以降

* OceanBase データベース用の JDBC ドライバー。[Maven Repository](https://mvnrepository.com/artifact/com.oceanbase/oceanbase-client)から OceanBase JDBC ドライバーの最新版または指定したバージョンをダウンロードできます。OceanBase Connector/J 2.4.8 以降の使用を推奨します。

* Doris の各 FE ノードおよび BE ノードと OceanBase サーバー間のネットワーク接続。

## OceanBase への接続

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

`jdbc_url` は、OceanBase JDBC ドライバーに渡す接続情報とパラメーターを定義します。サポートされる URL パラメーターについては、[OceanBase JDBC ドライバーの設定](https://www.oceanbase.com/docs/common-oceanbase-connector-j-cn-1000000000517111)を参照してください。

## スキーマの互換性

OceanBase Catalog の作成時に、Doris は OceanBase が MySQL モードか Oracle モードかを自動的に判別し、メタデータを正しく解析します。

各モードでの階層マッピング、型マッピング、クエリ最適化は、それぞれ MySQL または Oracle データベースの Catalog と同じように処理されます。詳細は以下のドキュメントを参照してください。

* [MySQL Catalog](./jdbc-mysql-catalog.md)

* [Oracle Catalog](./jdbc-oracle-catalog.md)
