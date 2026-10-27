---
{
    "title": "PostgreSQL JDBC カタログ",
    "language": "ja",
    "description": "Doris JDBC Catalog は、標準の JDBC インターフェースを介した PostgreSQL データベースへの接続をサポートします。"
}
---

Doris JDBC Catalog は、標準の JDBC インターフェースを介した PostgreSQL データベースへの接続をサポートします。このドキュメントでは、PostgreSQL データベースへの接続方法を説明します。

JDBC Catalog の概要については、[JDBC Catalog の概要](./jdbc-catalog-overview.md)を参照してください。

## 利用上の注意 {#usage-notes}

PostgreSQL データベースに接続するには、以下が必要です。

* PostgreSQL 11.x 以降

* PostgreSQL データベース用の JDBC ドライバー。最新版または指定したバージョンを[Maven Repository](https://mvnrepository.com/artifact/org.postgresql/postgresql)からダウンロードできます。PostgreSQL JDBC Driver のバージョン 42.5.x 以降を推奨します。

* Doris の各 FE ノードおよび BE ノードと PostgreSQL サーバーとのネットワーク接続。デフォルトのポートは 5432 です。

## PostgreSQL への接続 {#connecting-to-postgresql}

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

`jdbc_url` には、PostgreSQL JDBC ドライバーに渡す接続情報とパラメーターを指定します。サポートされる URL パラメーターについては、[PostgreSQL JDBC Driver のドキュメント](https://jdbc.postgresql.org/documentation/use/#connecting-to-the-database)を参照してください。

### 接続のセキュリティ {#connection-security}

データソースにグローバルに信頼された証明書がインストールされ、TLS が設定されている場合は、jdbc\_url プロパティに設定する JDBC 接続文字列にパラメーターを追加して、クラスターとデータソース間の TLS を有効にできます。

たとえば、PostgreSQL JDBC ドライバーのバージョン 42 では、jdbc\_url 設定プロパティに ssl=true パラメーターを追加して TLS を有効にします。

```sql
"jdbc_url"="jdbc:postgresql://example.net:5432/database?ssl=true"
```

TLS の設定オプションについて詳しくは、[PostgreSQL JDBC Driver のドキュメント](https://jdbc.postgresql.org/documentation/use/#connecting-to-the-database)を参照してください。

## 階層マッピング {#hierarchical-mapping}

PostgreSQL をマッピングする場合、Doris のデータベースは、PostgreSQL の指定したデータベース内のスキーマに対応します（例の `jdbc_url` パラメーターでは `postgres`）。Doris のデータベース内のテーブルは、PostgreSQL のそのスキーマ内のテーブルに対応します。対応関係は次のとおりです。

| Doris    | PostgreSQL |
| -------- | ---------- |
| カタログ | データベース |
| データベース | スキーマ |
| テーブル | テーブル |

## カラム型のマッピング {#column-type-mapping}

| PostgreSQL の型                         | Doris の型             |                                                                 |
| --------------------------------------- | ---------------------- | --------------------------------------------------------------- |
| boolean                                 | boolean                |                                                                 |
| smallint/int2                           | smallint               |                                                                 |
| integer/int4                            | int                    |                                                                 |
| bigint/int8                             | bigint                 |                                                                 |
| decimal/numeric                         | decimal(P, S) / string | 精度が指定されていない Numeric は string 型にマッピングされます。数値計算には decimal 型への変換が必要で、書き戻しはサポートされません。 |
| real/float4                             | float                  |                                                                 |
| double                                  | double                 |                                                                 |
| smallserial                             | smallint               |                                                                 |
| serial                                  | int                    |                                                                 |
| bigserial                               | bigint                 |                                                                 |
| char(N)                                 | char(N)                |                                                                 |
| varchar/text                            | string                 |                                                                 |
| timestamp(S)              | datetime(S)            |                                                                 |
| timestamptz(S) | TIMESTAMPTZ(S) | 4.1.5 以降、この型は常に `TIMESTAMPTZ(S)` にマッピングされます。`enable.mapping.timestamp_tz` プロパティは互換性のために残されていますが、`false` に設定しても `DATETIME` へのマッピングには戻りません。精度の上限は 6 のため、それを超える精度は失われます。以前のバージョンでは、このプロパティで従来のマッピングを選択できます。 |
| date                                    | date                   |                                                                 |
| json/jsonb                              | string                 | 読み取りと計算のパフォーマンスのバランスを高めるため、Doris は JSON 型を STRING 型にマッピングします。 |
| time                                    | string                 | Doris は time 型をサポートしていないため、time 型は string にマッピングされます。 |
| interval                                | string                 |                                                                 |
| point/line/lseg/box/path/polygon/circle | string                 |                                                                 |
| cidr/inet/macaddr                       | string                 |                                                                 |
| uuid                                    | string                 |                                                                 |
| bit                                     | boolean / string       | Doris は bit 型をサポートしていません。bit(1) は boolean に、それ以外は string にマッピングされます。 |
| bytea | VARBINARY | 4.1.5 以降、この型は常に `VARBINARY` にマッピングされます。`enable.mapping.varbinary` プロパティは互換性のために残されていますが、`false` に設定しても `STRING` へのマッピングには戻りません。以前のバージョンでは、このプロパティで従来のマッピングを選択できます。 |
| array                                   | array                  | 配列型のマッピング方法については、以下の説明を参照してください。 |
| other                                   | UNSUPPORTED            |                                                                 |

- 配列型

    PostgreSQL では、配列型を次のように定義できます。

    ```
    col1 text[]
    col2 in4[][]
    ```

    ただし、PostgreSQL のメタデータから配列の次元数を直接取得することはできません。たとえば、`text[]` は一次元配列の場合も二次元配列の場合もあります。配列の次元数は、データが書き込まれた後にのみ判別できます。

    Doris では配列の次元数を明示的に宣言する必要があります。そのため、PostgreSQL の対応する配列カラムにデータが含まれている場合にのみ、Doris は正しくマッピングできます。データが含まれていない場合、その配列カラムは `UNSUPPORTED` にマッピングされます。

## 付録 {#appendix}

### タイムゾーンに関する問題 {#time-zone-issues}

Doris はタイムゾーン付きの timestamp 型をサポートしていないため、PostgreSQL の timestampz 型を読み取る際には DATETIME 型にマッピングし、読み取り時にローカルタイムゾーンの時刻へ変換します。

また、JDBC 型の Catalog からデータを読み取る際、BE の Java 部分は JVM のタイムゾーンを使用します。JVM のタイムゾーンはデフォルトで BE を配置したマシンのタイムゾーンになるため、JDBC によるデータの読み取り時のタイムゾーン変換に影響します。

タイムゾーンを一致させるため、`JAVA_OPTS` で指定する JVM のタイムゾーンを、`be.conf` において Doris セッションの `time_zone` と一致するように設定することを推奨します。
