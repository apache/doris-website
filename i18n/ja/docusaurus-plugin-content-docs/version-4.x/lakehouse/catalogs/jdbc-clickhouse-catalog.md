---
{
    "title": "ClickHouse JDBC カタログ",
    "language": "ja",
    "description": "Doris JDBC カタログは、標準の JDBC インターフェースを介した ClickHouse データベースへの接続をサポートします。"
}
---

Doris JDBC カタログは、標準の JDBC インターフェースを介した ClickHouse データベースへの接続をサポートします。このドキュメントでは、ClickHouse データベースへの接続方法を説明します。

JDBC カタログの概要については、[JDBC カタログの概要](./jdbc-catalog-overview.md)を参照してください。

## 使用上の注意

ClickHouse データベースに接続するには、以下が必要です。

* ClickHouse バージョン 23.x 以降（これより前のバージョンは十分にテストされていません）。

* ClickHouse データベース用の JDBC ドライバー。[Maven Repository](https://mvnrepository.com/artifact/com.clickhouse/clickhouse-jdbc)から、ClickHouse JDBC ドライバーの最新版または指定したバージョンをダウンロードできます。ClickHouse JDBC ドライバーのバージョン 0.4.6 を使用することを推奨します。

* Doris の各 FE ノードおよび BE ノードと ClickHouse サーバーの間のネットワーク接続。デフォルトのポートは 8123 です。

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

データソースにインストールされた、グローバルに信頼される証明書を使用して TLS を設定している場合は、jdbc\_url プロパティに設定する JDBC 接続文字列にパラメーターを追加することで、クラスターとデータソース間の TLS を有効にできます。

たとえば、jdbc\_url 設定プロパティに ssl=true パラメーターを追加すると、TLS が有効になります。

```sql
'jdbc_url' = 'jdbc:clickhouse://example.net:8123/db?ssl=true'
```

TLS の設定オプションについて詳しくは、[ClickHouse JDBC ドライバーのドキュメントの SSL 設定に関するセクション](https://clickhouse.com/docs/en/integrations/java#connect-to-clickhouse-with-ssl)を参照してください。

## 階層のマッピング

ClickHouse をマッピングする際、Doris のデータベースは ClickHouse のデータベースに対応します。また、Doris のデータベース内のテーブルは、対応する ClickHouse のデータベース内のテーブルに対応します。マッピング関係は次のとおりです。

| Doris          | ClickHouse            |
| -------------- | --------------------- |
| カタログ       | ClickHouse サーバー   |
| データベース   | データベース          |
| テーブル       | テーブル              |

## カラム型のマッピング

| ClickHouse の型          | Doris の型              | 備考                                                                     |
| ------------------------ | ----------------------- | ------------------------------------------------------------------------ |
| bool                     | boolean                 |                                                                          |
| string                   | string                  |                                                                          |
| date/date32              | date                    |                                                                          |
| datetime(S)/datetime64(S)| datetime(S)             |                                                                          |
| float32                  | float                   |                                                                          |
| float64                  | double                  |                                                                          |
| int8                     | tinyint                 |                                                                          |
| int16/uint8              | smallint                | Doris には UNSIGNED データ型がないため、一段階大きい型にマッピングされます。 |
| int32/uInt16             | int                     | 同上                                                                     |
| int64/uint32             | bigint                  | 同上                                                                     |
| int128/uint64            | largeint                | 同上                                                                     |
| int256/uint128/uint256   | string                  | Doris にはこの大きさのデータ型がないため、STRING として扱われます。      |
| decimal(P, S)            | decimal(P, S) または string | Doris がサポートする最大精度を超える場合は、string として扱われます。 |
| enum/ipv4/ipv6/uuid      | string                  |                                                                          |
| array                    | array                   |                                                                          |
| other                    | UNSUPPORTED             |                                                                          |

## 関連パラメーター

- `jdbc_clickhouse_query_final`

  セッション変数で、デフォルトは false です。true に設定すると、ClickHouse に送信される SQL 文に `SETTINGS final = 1` が追加されます。

## よくある問題

1. ClickHouse のデータを読み取るときに `NoClassDefFoundError: net/jpountz/lz4/LZ4Factory` エラーが発生する

   まず [lz4-1.3.0.jar](https://repo1.maven.org/maven2/net/jpountz/lz4/lz4/1.3.0/lz4-1.3.0.jar) をダウンロードし、各 FE および BE ディレクトリ内の `custom_lib/` ディレクトリに配置してください（存在しない場合は手動で作成してください）。
