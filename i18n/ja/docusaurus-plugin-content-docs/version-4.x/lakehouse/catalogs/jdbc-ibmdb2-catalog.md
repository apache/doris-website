---
{
    "title": "IBM Db2 JDBC Catalog",
    "language": "ja",
    "description": "Doris JDBC Catalog は、標準の JDBC インターフェースを介した IBM Db2 データベースへの接続をサポートしています。"
}
---

Doris JDBC Catalog は、標準の JDBC インターフェースを介した IBM Db2 データベースへの接続をサポートしています。このドキュメントでは、IBM Db2 データベースへの接続方法を説明します。

JDBC Catalog の概要については、[JDBC Catalog の概要](./jdbc-catalog-overview.md)を参照してください。

## 利用上の注意 {#usage-notes}

IBM Db2 データベースに接続するには、以下が必要です。

* IBM Db2 11.5.x 以降

* IBM Db2 データベース用の JDBC ドライバー。[Maven Repository](https://mvnrepository.com/artifact/com.ibm.db2/jcc)から、IBM Db2 ドライバーの最新バージョンまたは指定したバージョンをダウンロードできます。IBM db2 jcc バージョン 11.5.8.0 の使用を推奨します。

* 各 Doris FE ノードおよび BE ノードと IBM Db2 サーバー間のネットワーク接続。デフォルトのポートは 51000 です。

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

`jdbc_url` には、IBM Db2 ドライバーに渡す接続情報とパラメータを指定します。使用できる URL パラメータについては、[Db2 JDBC ドライバーのドキュメント](https://www.ibm.com/docs/en/db2-big-sql/5.0?topic=drivers-jdbc-driver)を参照してください。

## 階層のマッピング {#hierarchical-mapping}

IBM Db2 をマッピングする際、Doris のデータベースは、DB2 の指定されたデータベース（`jdbc_url` の「database」パラメータ）配下の Schema に対応します。また、Doris のデータベースに属するテーブルは、DB2 の Schema に属するテーブルに対応します。対応関係は次のとおりです。

| Doris    | IBM Db2  |
| -------- | -------- |
| Catalog  | DataBase |
| Database | Schema   |
| Table    | Table    |

## カラム型のマッピング {#column-type-mapping}

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
| BLOB | VARBINARY | 4.1.5 以降、この型は常に `VARBINARY` にマッピングされます。`enable.mapping.varbinary` プロパティは互換性のために残されていますが、`false` に設定しても `STRING` へのマッピングには戻りません。それ以前のバージョンでは、このプロパティで従来のマッピングを選択できます。 |
| other            | UNSUPPORTED   |         |

## よくある問題 {#common-issues}

1. JDBC Catalog を介して IBM Db2 のデータを読み込む際に、`Invalid operation: result set is closed. ERRORCODE=-4470` という例外が発生する。

    IBM Db2 Catalog の作成時に、jdbc\_url の接続文字列に接続パラメータ `allowNextOnExhaustedResultSet=1;resultSetHoldability=1;` を追加します。例: `jdbc:db2://host:port/database:allowNextOnExhaustedResultSet=1;resultSetHoldability=1;`。

2. java.io.CharConversionException が発生する

    この問題は文字セットに起因する可能性があります。設定 `-Ddb2.jcc.charsetDecoderEncoder=3` を `JAVA_OPTS`（`be.conf` 内）に追加し、BE を再起動して問題が解消されるか確認してください。`1` や `2` などの値も試すことができます。詳細については、https://www.ibm.com/docs/en/content-collector/4.0.1?topic=manager-jdbc-throws-javaiocharconversionexception を参照してください。
