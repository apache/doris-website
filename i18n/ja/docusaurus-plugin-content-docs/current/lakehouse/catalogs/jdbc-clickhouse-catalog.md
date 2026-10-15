---
{
    "title": "ClickHouse JDBC Catalog",
    "language": "ja",
    "description": "Doris JDBC Catalog は、標準の JDBC インターフェースを介した ClickHouse データベースへの接続をサポートします。"
}
---

Doris JDBC Catalog は、標準の JDBC インターフェースを介した ClickHouse データベースへの接続をサポートします。このドキュメントでは、ClickHouse データベースへの接続方法を説明します。

JDBC Catalog の概要については、[JDBC Catalog の概要](./jdbc-catalog-overview.md)を参照してください。

## 使用上の注意

ClickHouse データベースに接続するには、次のものが必要です。

* ClickHouse バージョン 23.x 以降（それより前のバージョンは十分にテストされていません）。

* ClickHouse データベース用の JDBC ドライバー。[Maven Repository](https://mvnrepository.com/artifact/com.clickhouse/clickhouse-jdbc) から、ClickHouse JDBC ドライバーの最新バージョンまたは指定したバージョンをダウンロードできます。ClickHouse JDBC ドライバーのバージョン 0.4.6 の使用を推奨します。

* Doris の各 FE ノードおよび BE ノードと ClickHouse サーバー間のネットワーク接続。デフォルトのポートは 8123 です。

## ClickHouse への接続

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

`jdbc_url` は、ClickHouse JDBC ドライバーに渡す接続情報とパラメーターを定義します。サポートされる URL パラメーターについては、[ClickHouse JDBC ドライバーの設定](https://clickhouse.com/docs/en/integrations/java#configuration)を参照してください。

### 接続のセキュリティ

データソースにグローバルに信頼された証明書をインストールして TLS を設定している場合は、jdbc\_url プロパティに設定する JDBC 接続文字列にパラメーターを追加することで、クラスターとデータソース間の TLS を有効にできます。

たとえば、jdbc\_url 設定プロパティに ssl=true パラメーターを追加すると、TLS を有効にできます。

```sql
'jdbc_url' = 'jdbc:clickhouse://example.net:8123/db?ssl=true'
```

TLS の設定オプションについて詳しくは、[ClickHouse JDBC ドライバーのドキュメントの SSL 設定セクション](https://clickhouse.com/docs/en/integrations/java#connect-to-clickhouse-with-ssl)を参照してください。

## 階層のマッピング

ClickHouse をマッピングする場合、Doris のデータベースは ClickHouse のデータベースに対応します。また、Doris のデータベース内のテーブルは、対応する ClickHouse データベース内のテーブルに対応します。マッピング関係は次のとおりです。

| Doris | ClickHouse |
| ----- | ---------- |
| カタログ | ClickHouse サーバー |
| データベース | データベース |
| テーブル | テーブル |

## カラム型のマッピング

| ClickHouse の型 | Doris の型 | 備考 |
| --------------- | ---------- | ---- |
| bool | boolean | |
| string | string | |
| date/date32 | date | |
| datetime(S)/datetime64(S) | datetime(S) | |
| float32 | float | |
| float64 | double | |
| int8 | tinyint | |
| int16/uint8 | smallint | Doris には UNSIGNED データ型がないため、一段階大きい型にマッピングします。 |
| int32/uInt16 | int | 同上 |
| int64/uint32 | bigint | 同上 |
| int128/uint64 | largeint | 同上 |
| int256/uint128/uint256 | string | Doris にはこの大きさのデータ型がないため、STRING として扱います。 |
| decimal(P, S) | decimal(P, S) or string | Doris がサポートする最大精度を超える場合は、string として扱います。 |
| enum/ipv4/ipv6 | string | |
| uuid | uuid | ネイティブの UUID にマッピングされます。以前の 4.x および 3.x リリースでは STRING にマッピングされます。 |
| array | array | |
| other | UNSUPPORTED | |

## 関連パラメーター

- `jdbc_clickhouse_query_final`

  セッション変数で、デフォルト値は false です。true に設定すると、ClickHouse に送信する SQL 文に `SETTINGS final = 1` が追加されます。

## よくある問題

1. ClickHouse データの読み取り時に `NoClassDefFoundError: net/jpountz/lz4/LZ4Factory` エラーが発生する

   まず、[lz4-1.3.0.jar](https://repo1.maven.org/maven2/net/jpountz/lz4/lz4/1.3.0/lz4-1.3.0.jar) をダウンロードし、各 FE および BE のディレクトリ内の `custom_lib/` ディレクトリに配置します（存在しない場合は手動で作成してください）。
