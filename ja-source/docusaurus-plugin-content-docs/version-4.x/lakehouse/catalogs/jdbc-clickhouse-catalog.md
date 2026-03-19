---
{
  "title": "ClickHouse JDBC カタログ",
  "language": "ja",
  "description": "Doris JDBC CatalogはJDBCインターフェースを通じてClickHouseデータベースへの接続をサポートしています。"
}
---
Doris JDBC Catalogは、標準のJDBCインターフェースを介してClickHouseデータベースに接続することをサポートしています。この文書では、ClickHouseデータベース接続の設定方法について説明します。

JDBC Catalogの概要については、以下を参照してください：[JDBC Catalog Overview](./jdbc-catalog-overview.md)

## 使用上の注意

ClickHouseデータベースに接続するには以下が必要です

* ClickHouseバージョン23.x以上（これより低いバージョンは完全にテストされていません）。

* ClickHouseデータベース用のJDBCドライバー。[Maven Repository](https://mvnrepository.com/artifact/com.clickhouse/clickhouse-jdbc)から最新版または指定されたバージョンのClickHouse JDBCドライバーをダウンロードできます。ClickHouse JDBC Driverのバージョン0.4.6の使用を推奨します。

* DorisのFEおよびBEノードとClickHouseサーバー間のネットワーク接続。デフォルトポートは8123です。

## ClickHouseへの接続

```sql
CREATE CATALOG clickhouse PROPERTIES (
    'type' = 'jdbc',
    'user' = 'username',
    'password' = 'pwd',
    'jdbc_url' = 'jdbc:clickhouse://example.net:8123/',
    'driver_url' = 'clickhouse-jdbc-0.4.6-all.jar',
    'driver_class' = 'com.clickhouse.jdbc.ClickHouseDriver'
)
```
`jdbc_url`は、ClickHouse JDBCドライバーに渡される接続情報とパラメータを定義します。サポートされているURLパラメータは、[ClickHouse JDBC Driver Configuration](https://clickhouse.com/docs/en/integrations/java#configuration)で確認できます。

### 接続セキュリティ

データソースにグローバルに信頼される証明書がインストールされたTLSを設定している場合、jdbc\_urlプロパティで設定されるJDBC接続文字列にパラメータを追加することで、クラスターとデータソース間のTLSを有効にできます。

例えば、jdbc\_url設定プロパティにssl=trueパラメータを追加してTLSを有効にします：

```sql
'jdbc_url' = 'jdbc:clickhouse://example.net:8123/db?ssl=true'
```
TLS設定オプションの詳細については、[Clickhouse JDBC Driver Documentation SSL Configuration Section](https://clickhouse.com/docs/en/integrations/java#connect-to-clickhouse-with-ssl)を参照してください。

## 階層マッピング

ClickHouseをマッピングする際、DorisのDatabaseはClickHouseのDatabaseに対応します。そして、DorisのDatabase下のTableは、ClickHouseのそのDatabase下のTablesに対応します。マッピング関係は以下の通りです：

| Doris    | ClickHouse        |
| -------- | ----------------- |
| Catalog  | ClickHouse Server |
| Database | Database          |
| Table    | Table             |

## カラム型マッピング

| ClickHouse Type           | Doris Type              | Comment                          |
| ------------------------- | ----------------------- | -------------------------------- |
| bool                      | boolean                 |                                  |
| string                    | string                  |                                  |
| date/date32               | date                    |                                  |
| datetime(S)/datetime64(S) | datetime(S)             |                                  |
| float32                   | float                   |                                  |
| float64                   | double                  |                                  |
| int8                      | tinyint                 |                                  |
| int16/uint8               | smallint                | DorisにはUNSIGNEDデータ型がないため、1つ上の桁数にスケールアップされます |
| int32/uInt16              | int                     | 上記と同様                    |
| int64/uint32              | bigint                  | 上記と同様                    |
| int128/uint64             | largeint                | 上記と同様                    |
| int256/uint128/uint256    | string                  | Dorisにはこの桁数のデータ型がないため、STRINGで処理されます |
| decimal(P, S)             | decimal(P, S) or string | Dorisでサポートされている最大精度を超える場合は、stringを使用して処理します |
| enum/ipv4/ipv6/uuid       | string                  |                                  |
| array                     | array                   |                                  |
| other                     | UNSUPPORTED             |                                  |

## 関連パラメータ

- `jdbc_clickhouse_query_final`

  セッション変数、デフォルトはfalseです。trueに設定すると、Clickhouseに送信されるSQL文に`SETTINGS final = 1`が追加されます。

## よくある問題

1. Clickhouseデータを読み取る際に`NoClassDefFoundError: net/jpountz/lz4/LZ4Factory`エラーメッセージが発生する場合

   まず[lz4-1.3.0.jar](https://repo1.maven.org/maven2/net/jpountz/lz4/lz4/1.3.0/lz4-1.3.0.jar)パッケージをダウンロードし、各FEおよびBEディレクトリ下の`custom_lib/`ディレクトリに配置してください（存在しない場合は手動で作成してください）。
