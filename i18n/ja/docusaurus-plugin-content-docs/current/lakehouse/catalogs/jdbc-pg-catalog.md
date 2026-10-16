---
{
    "title": "PostgreSQL JDBC Catalog",
    "language": "ja",
    "description": "Doris JDBC Catalog は、標準の JDBC インターフェースを介した PostgreSQL データベースへの接続をサポートします。"
}
---

Doris JDBC Catalog は、標準の JDBC インターフェースを介した PostgreSQL データベースへの接続をサポートします。このドキュメントでは、PostgreSQL データベースへの接続設定方法を説明します。

JDBC Catalog の概要については、[JDBC Catalog の概要](./jdbc-catalog-overview.md)を参照してください。

## 使用上の注意

PostgreSQL データベースに接続するには、次のものが必要です。

* PostgreSQL 11.x 以降

* PostgreSQL データベース用の JDBC ドライバー。[Maven Repository](https://mvnrepository.com/artifact/org.postgresql/postgresql)から最新バージョンまたは指定したバージョンをダウンロードできます。PostgreSQL JDBC Driver バージョン 42.5.x 以降の使用を推奨します。

* Doris の各 FE ノードおよび BE ノードと PostgreSQL サーバー間のネットワーク接続。デフォルトのポートは 5432 です。

## PostgreSQL への接続

```sql
CREATE CATALOG postgresql_catalog PROPERTIES (
    'type' = 'jdbc',
    'user' = 'username',
    'password' = 'pwd',
    'jdbc_url' = 'jdbc:postgresql://host:5432/postgres',
    'driver_url' = 'postgresql-42.5.6.jar',
    'driver_class' = 'org.postgresql.Driver'
);
```

`jdbc_url` は、PostgreSQL JDBC ドライバーに渡す接続情報とパラメータを定義します。サポートされる URL パラメータについては、[PostgreSQL JDBC Driver のドキュメント](https://jdbc.postgresql.org/documentation/use/#connecting-to-the-database)を参照してください。

### 接続のセキュリティ

データソースにグローバルに信頼された証明書をインストールして TLS を設定している場合は、jdbc\_url プロパティの JDBC 接続文字列にパラメータを追加すると、クラスターとデータソース間の TLS を有効にできます。

たとえば、PostgreSQL JDBC ドライバーのバージョン 42 では、jdbc\_url 設定プロパティに ssl=true パラメータを追加して TLS を有効にします。

```sql
"jdbc_url"="jdbc:postgresql://example.net:5432/database?ssl=true"
```

TLS の設定オプションの詳細については、[PostgreSQL JDBC Driver のドキュメント](https://jdbc.postgresql.org/documentation/use/#connecting-to-the-database)を参照してください。

## 階層構造のマッピング

PostgreSQL をマッピングする際、Doris のデータベースは、PostgreSQL の指定したデータベース（例の `jdbc_url` パラメータでは `postgres`）内のスキーマに対応します。Doris のデータベース内のテーブルは、その PostgreSQL スキーマ内のテーブルに対応します。マッピング関係は次のとおりです。

| Doris          | PostgreSQL       |
| -------------- | ---------------- |
| カタログ       | データベース     |
| データベース   | スキーマ         |
| テーブル       | テーブル         |

## カラムの型のマッピング

| PostgreSQL の型                         | Doris の型             |                                                                 |
| --------------------------------------- | ---------------------- | --------------------------------------------------------------- |
| boolean                                 | boolean                |                                                                 |
| smallint/int2                           | smallint               |                                                                 |
| integer/int4                            | int                    |                                                                 |
| bigint/int8                             | bigint                 |                                                                 |
| decimal/numeric                         | decimal(P, S) / string | 精度が指定されていない数値型は string 型にマッピングされます。数値計算には decimal 型への変換が必要で、書き戻しはサポートされません。 |
| real/float4                             | float                  |                                                                 |
| double                                  | double                 |                                                                 |
| smallserial                             | smallint               |                                                                 |
| serial                                  | int                    |                                                                 |
| bigserial                               | bigint                 |                                                                 |
| char(N)                                 | char(N)                |                                                                 |
| varchar/text                            | string                 |                                                                 |
| timestamp(S)                            | datetime(S)            |                                                                 |
| timestamptz(S)                          | datetime(S) / timestamptz(S) | `enable.mapping.timestamp_tz` プロパティで制御します（バージョン 4.0.3 以降でサポート）。デフォルトは `false` で、その場合は `datetime` にマッピングされます。`true` に設定すると `timestamptz` 型にマッピングされます。 |
| date                                    | date                   |                                                                 |
| json/jsonb                              | string                 | 読み取りと計算のパフォーマンスのバランスを改善するため、Doris は JSON 型を STRING 型にマッピングします。 |
| time                                    | string                 | Doris は time 型をサポートしないため、time 型は string にマッピングされます。 |
| interval                                | string                 |                                                                 |
| point/line/lseg/box/path/polygon/circle | string                 |                                                                 |
| cidr/inet/macaddr                       | string                 |                                                                 |
| uuid                                    | string                 |                                                                 |
| bit                                     | boolean / string       | Doris は bit 型をサポートしないため、bit(1) は boolean に、それ以外は string にマッピングされます。 |
| bytea                                   | varbinary              | Catalog の `enable.mapping.varbinary` プロパティで制御します（バージョン 4.0.2 以降でサポート）。デフォルトは `false` で `string` にマッピングされ、`true` の場合は `varbinary` 型にマッピングされます。 |
| array                                   | array                  | 配列型のマッピング方法については、以下の説明を参照してください。 |
| other                                   | UNSUPPORTED            |                                                                 |

- 配列型

    PostgreSQL では、配列型を次のように定義できます。

    ```
    col1 text[]
    col2 in4[][]
    ```

    ただし、PostgreSQL のメタデータから配列の次元数を直接取得することはできません。たとえば、`text[]` は一次元配列の場合も二次元配列の場合もあります。配列の次元数は、データの書き込み後に初めて判定できます。

    Doris では、配列の次元数を明示的に宣言する必要があります。そのため、PostgreSQL の対応する配列カラムにデータが含まれる場合にのみ、Doris は正しくマッピングできます。データがない場合、配列カラムは `UNSUPPORTED` にマッピングされます。

## 付録

### タイムゾーンに関する問題

Doris はタイムゾーン付きの timestamp 型をサポートしていないため、PostgreSQL の timestampz 型を読み取る際は DATETIME 型にマッピングし、読み取り時にローカルタイムゾーンの時刻に変換します。

また、JDBC 型 Catalog からデータを読み取る際、BE の Java 部分は JVM のタイムゾーンを使用します。JVM のタイムゾーンはデフォルトで BE のデプロイ先マシンのタイムゾーンになり、JDBC によるデータ読み取り時のタイムゾーン変換に影響します。

タイムゾーンの一貫性を保つため、`JAVA_OPTS`（`be.conf` 内）で設定する JVM のタイムゾーンを Doris セッションの `time_zone` と一致させることを推奨します。
