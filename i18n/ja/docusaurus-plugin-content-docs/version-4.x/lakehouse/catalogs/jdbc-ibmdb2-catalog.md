---
{
    "title": "IBM Db2 JDBC カタログ",
    "language": "ja",
    "description": "Doris JDBC Catalog は、標準の JDBC インターフェースを介した IBM Db2 データベースへの接続をサポートします。"
}
---

Doris JDBC Catalog は、標準の JDBC インターフェースを介した IBM Db2 データベースへの接続をサポートします。このドキュメントでは、IBM Db2 データベースへの接続方法を説明します。

JDBC Catalog の概要については、[JDBC Catalog の概要](./jdbc-catalog-overview.md)を参照してください。

## 利用上の注意

IBM Db2 データベースに接続するには、以下が必要です。

* IBM Db2 11.5.x 以降

* IBM Db2 データベース用の JDBC ドライバー。[Maven リポジトリ](https://mvnrepository.com/artifact/com.ibm.db2/jcc)から IBM Db2 ドライバーの最新バージョンまたは指定したバージョンをダウンロードできます。IBM Db2 jcc バージョン 11.5.8.0 の使用を推奨します。

* 各 Doris FE ノードおよび BE ノードと IBM Db2 サーバー間のネットワーク接続。デフォルトのポートは 51000 です。

## IBM Db2 への接続

```sql
CREATE CATALOG db2_catalog PROPERTIES (
    'type' = 'jdbc',
    'user' = 'USERNAME',
    'password' = 'PASSWORD',
    'jdbc_url' = 'jdbc:db2://host:port/database',
    'driver_url' = 'jcc-11.5.8.0.jar',
    'driver_class' = 'com.ibm.db2.jcc.DB2Driver'
)
```

`jdbc_url` には、IBM Db2 ドライバーに渡す接続情報とパラメーターを指定します。サポートされる URL パラメーターについては、[Db2 JDBC ドライバーのドキュメント](https://www.ibm.com/docs/en/db2-big-sql/5.0?topic=drivers-jdbc-driver)を参照してください。

## 階層マッピング

IBM Db2 をマッピングする場合、Doris の Database は、`jdbc_url` の「database」パラメーターで指定した Db2 の DataBase に属する Schema に対応します。また、Doris の Database に属する Table は、Db2 の Schema に属する Table に対応します。対応関係は以下のとおりです。

| Doris    | IBM Db2  |
| -------- | -------- |
| Catalog  | DataBase |
| Database | Schema   |
| Table    | Table    |

## 列型のマッピング

| IBM Db2 の型     | Doris の型    | 備考 |
| ---------------- | ------------- | ------- |
| smallint         | smallint      |         |
| int              | int           |         |
| bigint           | bigint        |         |
| double           | double        |         |
| double precision | double        |         |
| float            | double        |         |
| real             | float         |         |
| decimal(P, S)    | decimal(P, S) |         |
| decfloat(P, S)   | decimal(P, S) |         |
| date             | date          |         |
| timestamp(S)     | datetime(S)   |         |
| char(N)          | char(N)       |         |
| varchar(N)       | varchar(N)    |         |
| long varchar(N)  | varchar(N)    |         |
| vargraphic       | string        |         |
| long vargraphic  | string        |         |
| time             | string        |         |
| clob             | string        |         |
| xml              | string        |         |
| BLOB             | varbinary     |Catalog の `enable.mapping.varbinary` プロパティーで制御します（4.0.2 以降でサポート）。デフォルト値は `false` で、この場合は `string` にマッピングされます。`true` の場合は `varbinary` 型にマッピングされます。|
| other            | UNSUPPORTED   |         |

## よくある問題

1. JDBC Catalog を介して IBM Db2 のデータを読み取る際に、`Invalid operation: result set is closed. ERRORCODE=-4470` 例外が発生する。

    IBM Db2 Catalog の作成時に、jdbc\_url の接続文字列へ `allowNextOnExhaustedResultSet=1;resultSetHoldability=1;` という接続パラメーターを追加してください。例：`jdbc:db2://host:port/database:allowNextOnExhaustedResultSet=1;resultSetHoldability=1;`。

2. java.io.CharConversionException が発生する。

    この問題は文字セットに起因する可能性があります。設定 `-Ddb2.jcc.charsetDecoderEncoder=3` を `JAVA_OPTS`（`be.conf` 内）に追加し、BE を再起動して問題が解消するか確認してください。`1` や `2` などの値も試すことができます。詳細については、https://www.ibm.com/docs/en/content-collector/4.0.1?topic=manager-jdbc-throws-javaiocharconversionexception を参照してください。
