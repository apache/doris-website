---
{
  "title": "PostgreSQL JDBC カタログ",
  "description": "Doris JDBC カタログは、標準のJDBCインターフェースを通じてPostgreSQLデータベースへの接続をサポートしています。",
  "language": "ja"
}
---
Doris JDBC カタログは、標準のJDBCインターフェースを介してPostgreSQLデータベースへの接続をサポートします。このドキュメントでは、PostgreSQLデータベース接続の設定方法について説明します。

JDBC カタログの概要については、以下を参照してください: [JDBC カタログ 概要](./jdbc-catalog-overview.md)

## 使用上の注意

PostgreSQLデータベースに接続するには、以下が必要です

* PostgreSQL 11.x以上

* PostgreSQLデータベース用のJDBCドライバー。最新版または指定されたバージョンを[Maven Repository](https://mvnrepository.com/artifact/org.postgresql/postgresql)からダウンロードできます。PostgreSQL JDBC Driverのバージョン42.5.x以上の使用を推奨します。

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
`jdbc_url`は、PostgreSQL JDBCドライバに渡される接続情報とパラメータを定義します。サポートされるURLパラメータは[PostgreSQL JDBC Driver Documentation](https://jdbc.postgresql.org/documentation/use/#connecting-to-the-database)で確認できます。

### Connection Security

データソースにグローバルに信頼された証明書がインストールされたTLSを設定している場合、jdbc\_urlプロパティで設定されるJDBC接続文字列にパラメータを追加することで、クラスタとデータソース間のTLSを有効にできます。

例えば、PostgreSQL JDBCドライバのバージョン42では、jdbc\_url設定プロパティにssl=trueパラメータを追加してTLSを有効にします：

```sql
"jdbc_url"="jdbc:postgresql://example.net:5432/database?ssl=true"
```
TLS設定オプションの詳細については、[PostgreSQL JDBC Driver Documentation](https://jdbc.postgresql.org/documentation/use/#connecting-to-the-database)を参照してください。

## 階層マッピング

PostgreSQLをマッピングする際、DorisのDatabaseは、PostgreSQLの指定されたデータベース下のSchemaに対応します（例：`postgres`下の`jdbc_url`パラメータの例のように）。DorisのDatabase下のTableは、PostgreSQLのそのSchema下のTablesに対応します。マッピング関係は以下の通りです：

| Doris    | PostgreSQL |
| -------- | ---------- |
| カタログ  | Database   |
| Database | Schema     |
| Table    | Table      |

## カラム型マッピング

| PostgreSQL タイプ                         | Doris タイプ             |                                                                 |
| --------------------------------------- | ---------------------- | --------------------------------------------------------------- |
| boolean                                 | boolean                |                                                                 |
| smallint/int2                           | smallint               |                                                                 |
| integer/int4                            | int                    |                                                                 |
| bigint/int8                             | bigint                 |                                                                 |
| decimal/numeric                         | decimal(P, S) / string | 精度のないNumericはstring型にマッピングされ、数値計算のためにdecimal型に変換する必要があり、書き戻しをサポートしません。    |
| real/float4                             | float                  |                                                                 |
| double                                  | double                 |                                                                 |
| smallserial                             | smallint               |                                                                 |
| serial                                  | int                    |                                                                 |
| bigserial                               | bigint                 |                                                                 |
| char(N)                                 | char(N)                |                                                                 |
| varchar/text                            | string                 |                                                                 |
| timestamp(S)/timestampz(S)              | datetime(S)            |                                                                 |
| date                                    | date                   |                                                                 |
| json/jsonb                              | string                 | より良い読み取りと計算パフォーマンスのバランスのため、DorisはJSON型をSTRING型にマッピングします。                   |
| time                                    | string                 | Dorisはtime型をサポートしないため、time型はstringにマッピングされます。                          |
| interval                                | string                 |                                                                 |
| point/line/lseg/box/path/polygon/circle | string                 |                                                                 |
| cidr/inet/macaddr                       | string                 |                                                                 |
| uuid                                    | string                 |                                                                 |
| bit                                     | boolean / string       | Dorisはbit型をサポートしないため、bit型はbit(1)の場合booleanにマッピングされ、それ以外の場合はstringにマッピングされます。 |
| bytea             | varbinary     |Catalogの`enable.mapping.varbinary`プロパティによって制御されます（4.0.2以降でサポート）。デフォルトは`false`で、`string`にマッピングされます。`true`の場合、`varbinary`型にマッピングされます。|
| array                                   | array                  | 配列型のマッピング方法については、以下の説明を参照してください。 |
| other                                   | UNSUPPORTED            |                                                                 |

- 配列型

    PostgreSQLでは、配列型は以下のように定義できます：

    ```
    col1 text[]
    col2 in4[][]
    ```
しかし、配列の次元数はPostgreSQLのメタデータから直接取得することができません。例えば、`text[]`は1次元配列または2次元配列の可能性があります。配列の次元数はデータが書き込まれた後でのみ決定できます。

    Dorisは配列の次元数を明示的に宣言する必要があります。そのため、DorisはPostgreSQLの対応する配列列にデータが含まれている場合にのみ正しくマッピングできます。そうでなければ、配列列は`UNSUPPORTED`としてマッピングされます。

## 付録

### タイムゾーンの問題

Dorisはタイムゾーン付きのtimestamp型をサポートしていないため、PostgreSQLからtimestampz型を読み取る際、Dorisはそれを DATETIME型にマッピングし、読み取り時にローカルタイムゾーンの時刻に変換します。

また、JDBC型のCatalogからデータを読み取る際、BEのJava部分はJVMタイムゾーンを使用します。JVMタイムゾーンはデフォルトでBE配置マシンのタイムゾーンに設定されており、これがJDBCがデータを読み取る際のタイムゾーン変換に影響します。

タイムゾーンの一貫性を確保するため、`be.conf`の`JAVA_OPTS`でJVMタイムゾーンをDorisセッションの`time_zone`と一致するように設定することを推奨します。
