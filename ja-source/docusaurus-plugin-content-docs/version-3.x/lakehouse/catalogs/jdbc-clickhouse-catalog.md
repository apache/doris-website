---
{
  "title": "Clickhouse JDBC カタログ",
  "description": "Doris JDBC カタログは、標準のJDBCインターフェースを介してClickHouseデータベースへの接続をサポートしています。",
  "language": "ja"
}
---
Doris JDBC カタログは標準のJDBCインターフェースを通じてClickHouseデータベースへの接続をサポートします。このドキュメントでは、ClickHouseデータベース接続の設定方法について説明します。

JDBC カタログの概要については、以下を参照してください：[JDBC カタログ 概要](./jdbc-catalog-overview.md)

## 使用上の注意

ClickHouseデータベースに接続するには、以下が必要です

* ClickHouseバージョン23.x以上（これより低いバージョンは完全にテストされていません）。

* ClickHouseデータベース用のJDBCドライバー。最新バージョンまたは指定バージョンのClickHouse JDBCドライバーは[Maven Repository](https://mvnrepository.com/artifact/com.clickhouse/clickhouse-jdbc)からダウンロードできます。ClickHouse JDBC Driverはバージョン0.4.6の使用を推奨します。

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
`jdbc_url`は、ClickHouse JDBCドライバーに渡される接続情報とパラメータを定義します。サポートされているURLパラメータは[ClickHouse JDBC Driver 構成](https://clickhouse.com/docs/en/integrations/java#configuration)で確認できます。

### 接続セキュリティ

データソースにグローバルに信頼された証明書がインストールされたTLSを設定している場合は、jdbc\_urlプロパティに設定されたJDBC接続文字列にパラメータを追加することで、クラスターとデータソース間のTLSを有効にできます。

たとえば、jdbc\_url設定プロパティにssl=trueパラメータを追加してTLSを有効にします：

```sql
'jdbc_url' = 'jdbc:clickhouse://example.net:8123/db?ssl=true'
```
TLS設定オプションの詳細については、[Clickhouse JDBC Driver Documentation SSL 構成 Section](https://clickhouse.com/docs/en/integrations/java#connect-to-clickhouse-with-ssl)を参照してください。

## 階層マッピング

ClickHouseをマッピングする際、DorisのDatabaseはClickHouseのDatabaseに対応します。そして、DorisのDatabase下のTableは、ClickHouseのそのDatabase下のTablesに対応します。マッピング関係は以下の通りです：

| Doris    | ClickHouse        |
| -------- | ----------------- |
| カタログ  | ClickHouse サーバー |
| Database | Database          |
| Table    | Table             |

## カラムタイプマッピング

| ClickHouse タイプ           | Doris タイプ              | Comment                          |
| ------------------------- | ----------------------- | -------------------------------- |
| bool                      | boolean                 |                                  |
| string                    | string                  |                                  |
| date/date32               | date                    |                                  |
| datetime(S)/datetime64(S) | datetime(S)             |                                  |
| float32                   | float                   |                                  |
| float64                   | double                  |                                  |
| int8                      | tinyint                 |                                  |
| int16/uint8               | smallint                | DorisはUNSIGNEDデータ型を持たないため、1段階スケールアップされます |
| int32/uInt16              | int                     | 上記と同様                    |
| int64/uint32              | bigint                  | 上記と同様                    |
| int128/uint64             | largeint                | 上記と同様                    |
| int256/uint128/uint256    | string                  | Dorisはこの規模のデータ型を持たないため、STRINGで処理されます |
| decimal(P, S)             | decimal(P, S) or string | Dorisがサポートする最大精度を超える場合は、stringを使用して処理します |
| enum/ipv4/ipv6/uuid       | string                  |                                  |
| array                     | array                   |                                  |
| other                     | UNSUPPORTED             |                                  |

## 関連パラメータ

- `jdbc_clickhouse_query_final`

  セッション変数、デフォルトはfalseです。trueに設定すると、Clickhouseに送信されるSQL文に`SETTINGS final = 1`が追加されます。

## よくある問題

1. Clickhouseデータの読み取り時に`NoClassDefFoundError: net/jpountz/lz4/LZ4Factory`エラーメッセージが発生する場合

   まず[lz4-1.3.0.jar](https://repo1.maven.org/maven2/net/jpountz/lz4/lz4/1.3.0/lz4-1.3.0.jar)パッケージをダウンロードし、各FEおよびBEディレクトリ下の`custom_lib/`ディレクトリに配置してください（存在しない場合は手動で作成してください）。
