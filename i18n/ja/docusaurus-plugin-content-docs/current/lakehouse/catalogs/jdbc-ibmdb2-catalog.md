---
{
    "title": "IBM Db2 JDBC カタログ",
    "language": "ja",
    "description": "Doris JDBC カタログは、標準の JDBC インターフェースを介した IBM Db2 データベースへの接続をサポートします。"
}
---

Doris JDBC カタログは、標準の JDBC インターフェースを介した IBM Db2 データベースへの接続をサポートします。このドキュメントでは、IBM Db2 データベースへの接続方法を説明します。

JDBC Catalog の概要については、[JDBC Catalog の概要](./jdbc-catalog-overview.md)を参照してください。

## 利用上の注意 {#usage-notes}

IBM Db2 データベースに接続するには、以下が必要です。

* IBM Db2 11.5.x 以降

* IBM Db2 データベース用の JDBC ドライバー。[Maven Repository](https://mvnrepository.com/artifact/com.ibm.db2/jcc)から、最新バージョンまたは指定したバージョンの IBM Db2 ドライバーをダウンロードできます。IBM db2 jcc バージョン 11.5.8.0 の使用を推奨します。

* 各 Doris FE および BE ノードと IBM Db2 サーバー間のネットワーク接続。デフォルトのポートは 51000 です。

## IBM Db2 への接続 {#connecting-to-ibm-db2}

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

`jdbc_url` には、IBM Db2 ドライバーに渡す接続情報とパラメータを指定します。サポートされる URL パラメータについては、[Db2 JDBC ドライバーのドキュメント](https://www.ibm.com/docs/en/db2-big-sql/5.0?topic=drivers-jdbc-driver)を参照してください。

## 階層のマッピング {#hierarchical-mapping}

IBM Db2 をマッピングする際、Doris のデータベースは、DB2 の指定されたデータベース（`jdbc_url` の「database」パラメータ）内の Schema に対応します。また、Doris のデータベース内のテーブルは、DB2 の Schema 内のテーブルに対応します。対応関係は次のとおりです。

| Doris    | IBM Db2  |
| -------- | -------- |
| Catalog  | DataBase |
| Database | Schema   |
| Table    | Table    |

## 列型のマッピング {#column-type-mapping}

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
| BLOB | VARBINARY | 4.1.5 以降、この型は常に `VARBINARY` にマッピングされます。`enable.mapping.varbinary` プロパティは互換性のために残されていますが、`false` に設定しても `STRING` へのマッピングには戻りません。以前のバージョンでは、このプロパティで従来のマッピングを選択できます。 |
| other            | UNSUPPORTED   |         |

## よくある問題 {#common-issues}

1. JDBC Catalog 経由で IBM Db2 のデータを読み込むと、`Invalid operation: result set is closed. ERRORCODE=-4470` 例外が発生する。

    IBM Db2 Catalog を作成する際、jdbc\_url 接続文字列に接続パラメータ `allowNextOnExhaustedResultSet=1;resultSetHoldability=1;` を追加してください。例: `jdbc:db2://host:port/database:allowNextOnExhaustedResultSet=1;resultSetHoldability=1;`。

2. java.io.CharConversionException が発生する

    この問題は文字セットが原因の可能性があります。設定 `-Ddb2.jcc.charsetDecoderEncoder=3` を `JAVA_OPTS`（`be.conf` 内）に追加し、BE を再起動して解消するか確認してください。`1` や `2` などの値も試すことができます。詳細については、https://www.ibm.com/docs/en/content-collector/4.0.1?topic=manager-jdbc-throws-javaiocharconversionexception を参照してください。
