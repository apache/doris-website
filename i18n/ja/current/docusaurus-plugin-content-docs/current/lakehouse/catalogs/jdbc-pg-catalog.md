---
{
  "title": "PostgreSQL JDBC カタログ",
  "language": "ja",
  "description": "Doris JDBC CatalogはJDBCインターフェースを介してPostgreSQLデータベースへの接続をサポートします。"
}
---
Doris JDBC Catalogは、標準のJDBCインターフェースを介してPostgreSQLデータベースへの接続をサポートしています。このドキュメントでは、PostgreSQLデータベース接続の設定方法について説明します。

JDBC Catalogの概要については、次を参照してください：[JDBC Catalog Overview](./jdbc-catalog-overview.md)

## 使用上の注意

PostgreSQLデータベースに接続するには、以下が必要です

* PostgreSQL 11.x以上

* PostgreSQLデータベース用のJDBCドライバー。最新バージョンまたは指定されたバージョンは[Maven Repository](https://mvnrepository.com/artifact/org.postgresql/postgresql)からダウンロードできます。PostgreSQL JDBC Driverバージョン42.5.x以上の使用を推奨します。

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
`jdbc_url`は、PostgreSQL JDBCドライバーに渡される接続情報とパラメータを定義します。サポートされているURLパラメータは[PostgreSQL JDBC Driver Documentation](https://jdbc.postgresql.org/documentation/use/#connecting-to-the-database)で確認できます。

### Connection Security

データソースにグローバルに信頼された証明書がインストールされたTLSを設定している場合、jdbc\_urlプロパティで設定されたJDBC接続文字列にパラメータを追加することで、クラスタとデータソース間のTLSを有効にできます。

例えば、PostgreSQL JDBCドライバーのバージョン42では、jdbc\_url設定プロパティにssl=trueパラメータを追加してTLSを有効にします：

```sql
"jdbc_url"="jdbc:postgresql://example.net:5432/database?ssl=true"
```
TLS設定オプションの詳細については、[PostgreSQL JDBC Driver Documentation](https://jdbc.postgresql.org/documentation/use/#connecting-to-the-database)を参照してください。

## 階層マッピング

PostgreSQLをマッピングする際、DorisのDatabaseは、PostgreSQLの指定されたデータベース下のSchemaに対応します（例の`postgres`下の`jdbc_url`パラメータのように）。DorisのDatabase下のTableは、PostgreSQLのそのSchema下のTablesに対応します。マッピング関係は以下の通りです：

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
| decimal/numeric                         | decimal(P, S) / string | 精度のないNumericはstring型にマッピングされ、数値計算のためにdecimal型に変換する必要があり、書き戻しはサポートされません。    |
| real/float4                             | float                  |                                                                 |
| double                                  | double                 |                                                                 |
| smallserial                             | smallint               |                                                                 |
| serial                                  | int                    |                                                                 |
| bigserial                               | bigint                 |                                                                 |
| char(N)                                 | char(N)                |                                                                 |
| varchar/text                            | string                 |                                                                 |
| timestamp(S)              | datetime(S)            |                                                                 |
| timestamptz(S) | datetime(S) / timestamptz(S) | `enable.mapping.timestamp_tz`プロパティによって制御されます（バージョン4.0.3以降でサポート）。デフォルトでは`false`で、その場合は`datetime`にマッピングされます；`true`に設定すると`timestamptz`型にマッピングされます。 |
| date                                    | date                   |                                                                 |
| json/jsonb                              | string                 | より良い読み取りと計算のパフォーマンスバランスのため、DorisはJSON型をSTRING型にマッピングします。                   |
| time                                    | string                 | Dorisはtime型をサポートしないため、time型はstringにマッピングされます。                          |
| interval                                | string                 |                                                                 |
| point/line/lseg/box/path/polygon/circle | string                 |                                                                 |
| cidr/inet/macaddr                       | string                 |                                                                 |
| uuid                                    | string                 |                                                                 |
| bit                                     | boolean / string       | Dorisはbit型をサポートしないため、bit型はbit(1)の場合booleanに、それ以外の場合stringにマッピングされます。 |
| bytea             | varbinary     |Catalogの`enable.mapping.varbinary`プロパティによって制御されます（4.0.2以降でサポート）。デフォルトは`false`で`string`にマッピングされます；`true`の場合は`varbinary`型にマッピングされます。|
| array                                   | array                  | 配列型のマッピング方法については、以下の説明を参照してください。 |
| other                                   | UNSUPPORTED            |                                                                 |

- 配列型

    PostgreSQLでは、配列型は以下のように定義できます：

    ```
    col1 text[]
    col2 in4[][]
    ```
ただし、配列の次元はPostgreSQLのメタデータから直接取得することはできません。例えば、`text[]`は一次元配列または二次元配列である可能性があります。配列の次元は、データが書き込まれた後にのみ決定できます。

Dorisは配列の次元を明示的に宣言する必要があります。そのため、PostgreSQLの対応する配列列にデータが含まれている場合のみ、Dorisは正しくマッピングできます。そうでなければ、配列列は`UNSUPPORTED`としてマッピングされます。

## 付録

### タイムゾーンの問題

Dorisはタイムゾーン付きのtimestamp型をサポートしていないため、PostgreSQLからtimestampz型を読み取る際、Dorisはそれをdatetimeデータ型にマッピングし、読み取り時にローカルタイムゾーン時刻に変換します。

そして、JDBC型Catalogからデータを読み取る際、BEのJava部分はJVMタイムゾーンを使用するためです。JVMタイムゾーンは、デフォルトではBE展開マシンのタイムゾーンに設定されており、これがJDBCがデータを読み取る際のタイムゾーン変換に影響します。

タイムゾーンの整合性を確保するため、`be.conf`の`JAVA_OPTS`でJVMタイムゾーンを、Dorisセッションの`time_zone`と一致するように設定することを推奨します。
