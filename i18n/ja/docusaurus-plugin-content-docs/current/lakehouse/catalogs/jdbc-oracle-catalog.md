---
{
    "title": "Oracle JDBC Catalog",
    "language": "ja",
    "description": "Apache Doris の JDBC Catalog は、標準の JDBC インターフェースを介した Oracle データベースへの接続をサポートします。"
}
---

Apache Doris の JDBC Catalog は、標準の JDBC インターフェースを介した Oracle データベースへの接続をサポートします。このドキュメントでは、Oracle データベースへの接続方法を説明します。

JDBC Catalog の概要については、[JDBC Catalog の概要](./jdbc-catalog-overview.md)を参照してください。

## 使用上の注意

Oracle データベースに接続するには、以下が必要です。

* Oracle 19c、18c、12c、11g、または 10g。

* Oracle データベース用の JDBC ドライバー。Oracle JDBC ドライバーの [Maven Repository](https://mvnrepository.com/artifact/com.oracle.database.jdbc) から、Ojdbc8 以降のバージョンをダウンロードできます。

* Apache Doris の各 FE および BE ノードと Oracle サーバー間のネットワーク接続。デフォルトのポートは 1521 です。Oracle RAC で ONS が有効な場合は、ポート 6200 も必要です。

## Oracle への接続

```sql
CREATE CATALOG oracle_catalog PROPERTIES (
    'type' = 'jdbc',
    'user' = 'username',
    'password'='pwd',
    'jdbc_url' = 'jdbc:oracle:thin:@example.net:1521:orcl',
    'driver_url' = 'ojdbc8.jar',
    'driver_class' = 'oracle.jdbc.driver.OracleDriver'
)
```

`jdbc_url` は、JDBC ドライバーに渡す接続情報とパラメーターを定義します。Oracle JDBC Thin ドライバーを使用する場合、URL の構文は Oracle の構成によって異なることがあります。たとえば、Oracle SID に接続する場合と Oracle サービス名に接続する場合では、接続 URL が異なります。詳細は、[Oracle Database JDBC ドライバーのドキュメント](https://docs.oracle.com/en/database/oracle/oracle-database/19/jjdbc/data-sources-and-URLs.html)を参照してください。上の URL の例は、`orcl` という名前の Oracle SID に接続します。

## 階層のマッピング

Oracle をマッピングする場合、Apache Doris のデータベースは Oracle のユーザーに対応します。また、Apache Doris のデータベース内のテーブルは、その Oracle ユーザーがアクセスできるテーブルに対応します。対応関係は次のとおりです。

| Doris          | Oracle         |
| -------------- | -------------- |
| カタログ       | データベース   |
| データベース   | ユーザー       |
| テーブル       | テーブル       |

## 列型のマッピング

| Oracle の型                           | Doris の型                           | 備考                                                                                                         |
| ------------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| number(P) / number(P, 0)              | tinyint/smallint/int/bigint/largeint | Doris は P の大きさに応じて型を選択します。P < 3: TINYINT、P < 5: SMALLINT、P < 10: INT、P < 19: BIGINT、P > 19: LARGEINT |
| number(P, S)、(S > 0 && P > S) の場合 | decimal(P, S)                        |                                                                                                              |
| number(P, S)、(S > 0 && P < S) の場合 | decimal(S, S)                        |                                                                                                              |
| number(P, S)、(S < 0) の場合          | tinyint/smallint/int/bigint/largeint | S < 0 の場合、Doris は P を `P + |S|`, and perform the same mapping as `number(P) / number(P, 0)` と同じマッピングを行います。 |
| number                                |                                      | 現在、Doris は P と S が指定されていない number 型をサポートしていません。                                    |
| decimal(P, S)                         | decimal(P, S)                        |                                                                                                              |
| float/real                            | double                               |                                                                                                              |
| date                                  | date                                 |                                                                                                              |
| timestamp                             | datetime(S)                          |                                                                                                              |
| timestamp(s) with local time zone | datetime / timestamptz | `enable.mapping.timestamp_tz` プロパティで制御します（バージョン 4.0.3 以降でサポート）。デフォルトは `false` で、その場合は `datetime` にマッピングされます。`true` に設定すると、`timestamptz` 型にマッピングされます。 |
| char/nchar                            | string                               |                                                                                                              |
| varchar2/nvarchar2                    | string                               |                                                                                                              |
| long/raw/long raw/internal            | string                               |                                                                                                              |
| BLOB                                  | varbinary                            | カタログの `enable.mapping.varbinary` プロパティで制御します（4.0.2 以降でサポート）。デフォルトは `false` で、その場合は `string` にマッピングされます。`true` の場合は `varbinary` 型にマッピングされます。 |
| その他                                | UNSUPPORTED                          |                                                                                                              |

## よくある問題

1. Oracle Catalog の作成時またはクエリ実行時に `ONS configuration failed` が発生する

   be.conf の JAVA\_OPTS に -Doracle.jdbc.fanEnabled=false を追加し、ドライバーを <https://repo1.maven.org/maven2/com/oracle/database/jdbc/ojdbc8/19.23.0.0/ojdbc8-19.23.0.0.jar> にアップグレードしてください。

2. Oracle Catalog の作成時またはクエリ実行時に `Non supported character set (add orai18n.jar in your classpath): ZHS16GBK` 例外が発生する

   [orai18n.jar](https://www.oracle.com/database/technologies/appdev/jdbc-downloads.html)をダウンロードし、各 FE および BE の `custom_lib/` ディレクトリに配置してください。ディレクトリが存在しない場合は手動で作成します。その後、各 FE および BE を再起動してください。
