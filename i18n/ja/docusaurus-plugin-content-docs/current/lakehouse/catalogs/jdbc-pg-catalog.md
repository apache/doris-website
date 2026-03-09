---
{
  "title": "PostgreSQL JDBC カタログ",
  "language": "ja",
  "description": "Doris JDBC CatalogはJDBC標準インターフェースを通じてPostgreSQLデータベースへの接続をサポートします。"
}
---
Doris JDBC Catalogは、標準のJDBCインターフェースを介してPostgreSQLデータベースへの接続をサポートしています。このドキュメントでは、PostgreSQLデータベース接続の設定方法について説明します。

JDBC Catalogの概要については、以下を参照してください：[JDBC Catalog Overview](./jdbc-catalog-overview.md)

## 使用上の注意

PostgreSQLデータベースに接続するには、以下が必要です

* PostgreSQL 11.x以上

* PostgreSQLデータベース用のJDBCドライバ。最新版または指定バージョンは[Maven Repository](https://mvnrepository.com/artifact/org.postgresql/postgresql)からダウンロードできます。PostgreSQL JDBC Driverバージョン42.5.x以上の使用を推奨します。

* DorisのFEおよびBEノードとPostgreSQLサーバー間のネットワーク接続。デフォルトポートは5432です。

## PostgreSQLへの接続

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
`jdbc_url`はPostgreSQL JDBCドライバーに渡される接続情報とパラメータを定義します。サポートされているURLパラメータは[PostgreSQL JDBC Driver Documentation](https://jdbc.postgresql.org/documentation/use/#connecting-to-the-database)で確認できます。

### 接続セキュリティ

データソースにグローバルに信頼された証明書がインストールされたTLSを設定している場合、jdbc\_urlプロパティに設定されたJDBC接続文字列にパラメータを追加することで、クラスターとデータソース間のTLSを有効にできます。

例えば、PostgreSQL JDBCドライバーのバージョン42の場合、jdbc\_url設定プロパティにssl=trueパラメータを追加してTLSを有効にします：

```sql
"jdbc_url"="jdbc:postgresql://example.net:5432/database?ssl=true"
```
TLS設定オプションの詳細については、[PostgreSQL JDBC Driver Documentation](https://jdbc.postgresql.org/documentation/use/#connecting-to-the-database)を参照してください。

## 階層マッピング

PostgreSQLをマッピングする際、DorisのDatabaseは、PostgreSQLの指定されたデータベース下のSchemaに対応します（例：`postgres`下の`jdbc_url`パラメータの例）。DorisのDatabase下のTableは、PostgreSQLのそのSchema下のTablesに対応します。マッピング関係は以下の通りです：

| Doris    | PostgreSQL |
| -------- | ---------- |
| Catalog  | Database   |
| Database | Schema     |
| Table    | Table      |

## カラム型マッピング

| PostgreSQL Type                         | Doris Type             |                                                                 |
| --------------------------------------- | ---------------------- | --------------------------------------------------------------- |
| boolean                                 | boolean                |                                                                 |
| smallint/int2                           | smallint               |                                                                 |
| integer/int4                            | int                    |                                                                 |
| bigint/int8                             | bigint                 |                                                                 |
| decimal/numeric                         | decimal(P, S) / string | 精度のないNumericはstring型にマッピングされ、数値計算のためにdecimal型に変換する必要があり、ライトバックはサポートされません。    |
| real/float4                             | float                  |                                                                 |
| double                                  | double                 |                                                                 |
| smallserial                             | smallint               |                                                                 |
| serial                                  | int                    |                                                                 |
| bigserial                               | bigint                 |                                                                 |
| char(N)                                 | char(N)                |                                                                 |
| varchar/text                            | string                 |                                                                 |
| timestamp(S)              | datetime(S)            |                                                                 |
| timestamptz(S) | datetime(S) / timestamptz(S) | `enable.mapping.timestamp_tz`プロパティによって制御されます（バージョン4.0.3以降でサポート）。デフォルトでは`false`で、この場合`datetime`にマッピングされます；`true`に設定すると、`timestamptz`型にマッピングされます。 |
| date                                    | date                   |                                                                 |
| json/jsonb                              | string                 | より良い読み取りと計算パフォーマンスのバランスのため、DorisはJSON型をSTRING型にマッピングします。                   |
| time                                    | string                 | Dorisはtime型をサポートしていないため、time型はstringにマッピングされます。                          |
| interval                                | string                 |                                                                 |
| point/line/lseg/box/path/polygon/circle | string                 |                                                                 |
| cidr/inet/macaddr                       | string                 |                                                                 |
| uuid                                    | string                 |                                                                 |
| bit                                     | boolean / string       | Dorisはbit型をサポートしていないため、bit型はbit(1)の場合booleanに、それ以外はstringにマッピングされます。 |
| bytea             | varbinary     |Catalogの`enable.mapping.varbinary`プロパティによって制御されます（4.0.2以降でサポート）。デフォルトは`false`で`string`にマッピングされます；`true`の場合、`varbinary`型にマッピングされます。|
| array                                   | array                  | array型のマッピング方法については、以下の説明を参照してください。 |
| other                                   | UNSUPPORTED            |                                                                 |

- Array Types

    PostgreSQLでは、array型は以下のように定義できます：

    ```
    col1 text[]
    col2 in4[][]
    ```
ただし、配列の次元数はPostgreSQLのメタデータから直接取得することはできません。例えば、`text[]`は1次元配列である可能性もあれば2次元配列である可能性もあります。配列の次元数はデータが書き込まれた後にのみ決定できます。

    Dorisでは配列の次元数を明示的に宣言する必要があります。そのため、PostgreSQLの対応する配列カラムにデータが含まれている場合のみDorisは正しくマッピングできます。そうでなければ、配列カラムは`UNSUPPORTED`としてマッピングされます。

## 付録

### タイムゾーンの問題

Dorisはタイムゾーン付きのtimestamp型をサポートしていないため、PostgreSQLからtimestampz型を読み取る際、DorisはそれをDATETIME型にマッピングし、読み取り時にローカルタイムゾーン時間に変換します。

また、JDBC型Catalogからデータを読み取る際、BEのJava部分はJVMタイムゾーンを使用するためです。JVMタイムゾーンはデフォルトでBE配置マシンのタイムゾーンになり、これがJDBCでデータを読み取る際のタイムゾーン変換に影響します。

タイムゾーンの一貫性を確保するため、`be.conf`の`JAVA_OPTS`でJVMタイムゾーンをDorisセッションの`time_zone`と一致するように設定することを推奨します。
