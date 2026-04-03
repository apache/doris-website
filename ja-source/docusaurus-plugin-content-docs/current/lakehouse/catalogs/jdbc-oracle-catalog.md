---
{
  "title": "Oracle JDBC カタログ",
  "language": "ja",
  "description": "Apache Doris JDBC カタログは標ードJDBCインターフェース経由でOracleデータベースへの接続をサポートしています。"
}
---
Apache Doris JDBC カタログはOracle データベースへの標準 JDBC インターフェースを介した接続をサポートしています。このドキュメントでは、Oracle データベース接続の設定方法について説明します。

JDBC カタログ の概要については、次を参照してください：[JDBC カタログ 概要](./jdbc-catalog-overview.md)

## 使用上の注意

Oracle データベースに接続するには、以下が必要です

* Oracle 19c、18c、12c、11g、または 10g。

* Oracle データベース用の JDBC ドライバー。これは Ojdbc8 以降のバージョンの Oracle JDBC ドライバーについて [Maven Repository](https://mvnrepository.com/artifact/com.oracle.database.jdbc) からダウンロードできます。

* Apache Doris の各 FE および BE ノードと Oracle サーバーとの間のネットワーク接続（デフォルトポートは 1521、Oracle RAC で ONS が有効な場合は、ポート 6200 も必要）。

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
`jdbc_url`はJDBCドライバに渡される接続情報とパラメータを定義します。Oracle JDBC Thinドライバを使用する場合、URLの構文はOracleの設定によって異なる場合があります。たとえば、Oracle SIDまたはOracleサービス名に接続する場合、接続URLは異なります。詳細については、[Oracle Database JDBC Driver Documentation](https://docs.oracle.com/en/database/oracle/oracle-database/19/jjdbc/data-sources-and-URLs.html)を参照してください。上記のサンプルURLは`orcl`という名前のOracle SIDに接続します。

## 階層マッピング

Oracleをマッピングする際、Apache DorisのDatabaseはOracleのUserに対応します。そして、Apache DorisのDatabase配下のTableは、OracleにおいてそのUserがアクセス可能なTableに対応します。マッピング関係は以下のとおりです：

| Doris    | Oracle   |
| -------- | -------- |
| Catalog  | Database |
| Database | User     |
| Table    | Table    |

## カラム型マッピング

| Oracle Type                           | Doris Type                           | Comment                                                                                                         |
| ------------------------------------- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| number(P) / number(P, 0)              | tinyint/smallint/int/bigint/largeint | DorisはPのサイズに基づいて対応する型を選択します：P < 3: TINYINT; P < 5: SMALLINT; P < 10: INT; P < 19: BIGINT; P > 19: LARGEINT |
| number(P, S), if (S > 0 && P > S) | decimal(P, S)                        |                                                                                                                 |
| number(P, S), if (S > 0 && P < S) | decimal(S, S)                        |                                                                                                                 |
| number(P, S), if (S < 0)          | tinyint/smallint/int/bigint/largeint | S < 0の場合、DorisはPを`P + |S|`に設定し、`number(P) / number(P, 0)`と同じマッピングを実行します                                         |
| number                                |                                      | Dorisは現在、PとSが指定されていないnumber型をサポートしていません                                                                                       |
| decimal(P, S)                         | decimal(P, S)                        |                                                                                                                 |
| float/real                            | double                               |                                                                                                                 |
| date                                  | date                                 |                                                                                                                 |
| timestamp                             | datetime(S)                          |                                                                                                                 |
| timestamp(s) with local time zone | datetime / timestamptz | `enable.mapping.timestamp_tz`プロパティによって制御されます（バージョン4.0.3以降でサポート）。デフォルトでは`false`で、この場合`datetime`にマッピングされます；`true`に設定すると`timestamptz`型にマッピングされます。 |
| char/nchar                            | string                               |                                                                                                                 |
| varchar2/nvarchar2                    | string                               |                                                                                                                 |
| long/raw/long raw/internal            | string                               |                                                                                                                 |
| BLOB             | varbinary     |Catalogの`enable.mapping.varbinary`プロパティによって制御されます（4.0.2以降でサポート）。デフォルトは`false`で`string`にマッピングされます；`true`の場合は`varbinary`型にマッピングされます。|
| other                                 | UNSUPPORTED                          |                                                                                                                 |

## よくある問題

1. Oracle Catalogの作成またはクエリ時に`ONS configuration failed`が発生する

   be.confのJAVA_OPTSに-Doracle.jdbc.fanEnabled=falseを追加し、ドライバを<https://repo1.maven.org/maven2/com/oracle/database/jdbc/ojdbc8/19.23.0.0/ojdbc8-19.23.0.0.jar>にアップグレードしてください

2. Oracle Catalogの作成またはクエリ時に`Non supported character set (add orai18n.jar in your classpath): ZHS16GBK`例外が発生する

   [orai18n.jar](https://www.oracle.com/database/technologies/appdev/jdbc-downloads.html)をダウンロードし、各FEとBE配下の`custom_lib/`ディレクトリ（存在しない場合は手動で作成）に配置し、各FEとBEを再起動してください。
