---
{
    "title": "ADBC Catalog",
    "language": "ja",
    "description": "ADBC ドライバーを介して Arrow Flight SQL やその他の外部データソースをクエリします。Arrow 形式でデータを転送し、複数の BE で並列に読み取ります。",
    "keywords": [
        "ADBC Catalog",
        "Arrow Database Connectivity",
        "Arrow Flight SQL",
        "ADBC ドライバー",
        "driver_url",
        "partitioned_read",
        "並列読み取り",
        "述語プッシュダウン",
        "クラスタ間フェデレーションクエリ",
        "Doris データ統合",
        "ADBC と JDBC の比較"
    ]
}
---

<!-- Knowledge Type: Capability Definition + Configuration Reference -->
<!-- Applicable Scenarios: Cross-cluster federated query / External data source access / Data integration -->

## 概要

ADBC（[Arrow Database Connectivity](https://arrow.apache.org/adbc/)）は、Arrow エコシステムで定義されたデータベースアクセスインターフェースです。**ADBC Catalog は ADBC ドライバーを介して外部データソースを読み取ります。データは Arrow 形式でネットワークを転送され、複数の BE ノードが並列に読み取ります。**

JDBC Catalog との主な違いは次の二点です。

- Arrow ネイティブの転送。データは Arrow 形式でネットワークを転送され、Doris が直接読み取ります。JDBC Catalog で行われる行ごと、値ごとの変換は不要です。
- 並列読み取り。一回のスキャンをドライバーが生成する結果パーティションに分割し、複数の BE ノードが同時に読み取ります。単一の BE ノードが一本の接続で読み取る方式とは異なります。

:::note
- この機能は実験的なもので、バージョン 5.0.0 以降でサポートされています。
- 読み取り操作のみをサポートします。外部データソースへの書き込みはサポートされていません。
- Doris には ADBC ドライバーが同梱されていません。ドライバーライブラリを FE とすべての BE ノードに自分で配置する必要があります。
:::

現段階では、別の Doris クラスタを含む Arrow Flight SQL データソースを対象とし、[Doris Catalog](./doris-catalog.mdx) を置き換えます。ほかのデータソースには、そのデータソース用の ADBC ドライバーライブラリと、SQL が ANSI SQL と異なる場合には対応する方言の実装が必要です。

### JDBC Catalog との違い

| 比較項目 | JDBC Catalog | ADBC Catalog |
| --- | --- | --- |
| データ転送 | ソースの行を JDBC オブジェクトに変換し、さらに値ごとに Doris のデータに変換する | データを Arrow 形式で転送して直接読み取り、値ごとの変換は行わない |
| 読み取りの並列性 | 単一の BE ノードが一本の接続で読み取る | ドライバーの結果パーティションに分割して複数の BE ノードで読み取る |
| ドライバーの形式 | リモート URL からダウンロードできる JDBC ドライバー JAR | ローカルファイルとしてのみ参照できる ADBC ドライバー共有ライブラリ（`.so`） |
| 書き込みサポート | 書き戻しに対応 | 現時点では未対応 |

## 適用シナリオ

| シナリオ | 説明 |
| --- | --- |
| データ統合 | 外部データソースから Doris の内部テーブルに読み込むか、内部テーブルとほかのカタログのテーブルにまたがるフェデレーションクエリを実行します。データは Arrow 形式で転送され、複数の BE ノードで並列に読み取られるため、JDBC 経由より高い性能が得られます。 |
| 書き戻し | サポートされていません。 |

## 機能一覧

<!-- Knowledge Type: Capability Matrix -->

| 機能 | 対応状況 | 説明 |
| --- | --- | --- |
| メタデータへのアクセス | 対応 | `SHOW DATABASES`、`SHOW TABLES`、`DESC`、`SHOW CREATE TABLE`、`information_schema` |
| データクエリ | 対応 | 外部テーブルへのクエリ、および内部テーブルやほかのカタログのテーブルとの結合、集約、`ORDER BY`、`UNION`、サブクエリ |
| 列プルーニング | 対応 | クエリに必要な列のみをデータソースに要求する |
| 述語プッシュダウン | 対応 | 一部のスカラー述語をリモートの `WHERE` 句に変換する |
| `LIMIT` プッシュダウン | 対応 | `WHERE` 句全体がプッシュダウンされた場合に適用する |
| `COUNT(*)` 最適化 | 対応 | 列データを読み取らない |
| 並列読み取り | 対応 | スキャンをドライバーの結果パーティションに分割し、複数の BE ノードで読み取る |
| 型マッピング | 対応 | `ARRAY`、`MAP`、`STRUCT`、`DECIMAL`、日付、タイムゾーン付き／なしのタイムスタンプを含め、自動的にマッピングする |
| メタデータキャッシュ | 対応 | デフォルトでは 10 分間キャッシュし、任意の `REFRESH` 文で消去する |
| `SELECT INTO OUTFILE` | 対応 | クエリ結果をファイルにエクスポートできる |
| マテリアライズドビュー（MTMV） | 対応 | ADBC テーブル上に MTMV を構築して更新できる |
| データソースへの書き込み | 現時点では未対応 | `INSERT`、`CREATE TABLE`、`DROP TABLE` などの書き込み文は拒否される |
| 統計情報 | 現時点では未対応 | 統計情報の収集は利用できない |
| 集約プッシュダウン | 現時点では未対応 | 集約は Doris で実行する |

## ADBC ドライバーの配置

<!-- Knowledge Type: Deployment Steps -->

Doris には ADBC ドライバーが同梱されていません。カタログを作成する前に、ドライバーライブラリをクラスタノードに配置してください。

### ドライバーの配置要件

:::caution
`CREATE CATALOG` の実行時に FE は `driver_url` を絶対パスに解決し、そのパスを変更せずに BE に送ります。各 BE はそのパスからドライバーを読み込みます。そのため、次の要件があります。

- ドライバーファイルが FE と**すべての** BE ノードの**同じ絶対パス**に存在すること。
- FE とすべての BE が**同じビルド**を読み込むこと。ADBC のパーティション情報はドライバー固有の形式で記述され、ドライバー実装間の互換性は保証されません。異なるバージョンを混在させてもエラーにならず、誤った結果が返る可能性があります。
:::

ビルド出力には、次の二つのドライバーディレクトリが作成されます。

- FE: `<FE_HOME>/plugins/adbc_drivers`
- BE: `<BE_HOME>/plugins/adbc_drivers`

通常、FE と BE は異なるデプロイ先ディレクトリにあるため、この二つの絶対パスは一致しません。複数ノードに配置する場合は、すべての FE と BE ノードの共通の絶対パス（例: `/opt/doris/adbc_drivers`）にドライバーを置き、`drivers_dir` を FE の `adbc.conf` でそのディレクトリに設定してください。

### adbc.conf

ADBC コネクタプラグインは、FE 上の `<DORIS_HOME>/plugins/connector/adbc/adbc.conf` から設定を読み取ります。このファイルは**すべての FE ノード**に必要です。Doris はカタログメタデータを使ってこのファイルを複製しません。変更は FE の再起動後に有効になります。

| 設定項目 | デフォルト | 説明 |
| --- | --- | --- |
| `drivers_dir` | `<DORIS_HOME>/plugins/adbc_drivers` | `driver_url` に指定したファイル名のみの値を解決する基準ディレクトリ。 |
| `driver_secure_path` | `*` | ドライバーの読み込みを許可するディレクトリ。セミコロン（`;`）で区切ります。`*` または空欄の場合、すべてのディレクトリを許可します。具体的なパスを設定した場合、ドライバーのパスはコンポーネントごとに照合されるため、パストラバーサルやプレフィックスの混同（`/opt/drv` と `/opt/drv-evil`）による回避はできません。 |

設定例:

```properties
drivers_dir=/opt/doris/adbc_drivers
driver_secure_path=/opt/doris/adbc_drivers
```

## カタログの設定

<!-- Knowledge Type: Configuration Parameters -->

### 構文

```sql
CREATE CATALOG [IF NOT EXISTS] catalog_name PROPERTIES (
    'type' = 'adbc',
    'driver_url' = '<driver_url>',
    'uri' = '<connection_uri>',
    {DriverProperties},
    {ConnectionProperties},
    {ReadProperties},
    {DriverOptions},
    {CommonProperties}
);
```

* `<driver_url>`

    必須。ADBC ドライバーの共有ライブラリを**ローカル参照のみ**で指定します。次の三形式に対応します。

    | 形式 | 説明 |
    | --- | --- |
    | ファイル名のみ | `drivers_dir` ディレクトリ（`adbc.conf` で指定）を基準に解決します。名前は `[A-Za-z0-9._-]+.so` に一致する必要があり、`.so.1` のようなバージョン接尾辞も指定できます。パス区切り文字は含められません。 |
    | `file://` URL | オーソリティ、クエリ、フラグメントを含めることはできません。 |
    | 絶対パス | FE とすべての BE が、そのパスからドライバーライブラリを読み込みます。 |

    `http://` などのリモートスキームは拒否されます。ノードごとにダウンロードすると、すべてのノードに同じドライバービルドが配置されることを保証できないためです。

* `<connection_uri>`

    必須。ADBC の接続文字列です。

    Doris は ADBC の三階層の名前を自身の二階層の名前に対応させるため、`postgresql://host:5432/mydb` のように**単一のリモートカタログを指定する必要があります**。詳しくは[名前空間のマッピング](#namespace-mapping)を参照してください。

* `{DriverProperties}`

    DriverProperties セクションには、ドライバーの読み込みを制御する任意のプロパティを指定します。

    | プロパティ | デフォルト | 説明 |
    | --- | --- | --- |
    | `driver_checksum` | 検証しない | ドライバーライブラリファイルの MD5。`CREATE CATALOG` の実行時に検証します。 |
    | `driver_entrypoint` | 空 | ドライバーのエントリポイントシンボル。空の場合はドライバーが推定します。 |

    `driver_checksum` を指定すると、誤ったドライバービルドや、あるノードに残った古いコピーを検出できます。このようなファイルは通常、問題なく読み込まれ、後になってドライバーとの関連が分からないクエリエラーとして表面化します。

    :::caution
    `driver_checksum` が検証するのは FE 上のコピーのみで、BE 上のコピーは検証しません。
    :::

* `{ConnectionProperties}`

    ConnectionProperties セクションには、データソースの認証情報とプッシュダウン SQL の生成に使用する方言を指定します。

    | プロパティ | デフォルト | 説明 |
    | --- | --- | --- |
    | `user` | なし | ユーザー名。指定したとおりにドライバーへ渡します。必須かどうかはデータソースによって異なります。 |
    | `password` | なし | パスワード。指定したとおりにドライバーへ渡します。必須かどうかはデータソースによって異なります。 |
    | `sql_dialect` | 自動検出 | プッシュダウン SQL の生成に使用する方言。デフォルトでは、ドライバーが報告するデータソースのベンダー名に基づいて Doris が方言を選びます。認識されない名前の場合は `ansi` を使用します。 |

    データソースが報告するベンダー名が適切でない場合や、その名前から想定される SQL と実際の SQL が異なる場合は、`sql_dialect` を明示的に設定してください。次の二つの方言が組み込まれています。

    | 値 | 説明 |
    | --- | --- |
    | `ansi` | 標準 SQL。デフォルトであり、認識されないデータソースにも適用されます。 |
    | `doris` | `ansi` と同じですが、識別子をバッククォート（`` ` ``）で囲みます。Doris は二重引用符で囲んだ名前を文字列リテラルとして読み取るため、Doris データソースに対して ANSI 形式の引用符は解析できません。ベンダー名が大文字と小文字を区別せずに `doris` で始まるデータソースでは、この方言が自動的に選択されます。 |

* `{ReadProperties}`

    ReadProperties セクションでは、並列読み取りを制御します。

    | プロパティ | デフォルト | 説明 |
    | --- | --- | --- |
    | `partitioned_read` | `auto` | 並列読み取りモード。無効な値を指定すると、デフォルトにフォールバックせず、エラーになります。 |
    | `max_partitions` | `1024` | 一回のスキャンで計画できるパーティション数の上限。 |

    `partitioned_read` には次の三つの値を指定できます。

    | 値 | 説明 |
    | --- | --- |
    | `auto` | デフォルト。ドライバーが分割できる場合はスキャンを分割し、できない場合は単一の文として読み取ります。 |
    | `disabled` | パーティションを要求しません。要求にはコストがかかります。Arrow Flight SQL データソースでは、パーティションを返す呼び出し**自体が**クエリの実行であるため、計画時にリモートとの往復が一回増え、Doris がクエリの実行を確定する前にデータソースが処理を開始します。このコストが大きすぎる場合や、返されたパーティションを Doris が読み取れない場合は、この値を使って単一文での読み取りに戻してください。 |
    | `required` | スキャンを分割できなければ、理由を示してクエリを失敗させます。並列性が知らないうちに失われることを避けたい場合に使用します。`auto` では、ドライバーが分割しなくなってもクエリは成功し、結果からはフォールバック経路を使ったことが分かりません。 |

    `max_partitions` は異常なデータソースから保護するための上限であり、性能調整用のパラメータではありません。各パーティションは計画用のリソースを消費し、多すぎると FE のリソースを使い果たします。上限を超えた場合、単一文での読み取りにフォールバックせずクエリを失敗させます。その時点でデータソースはすでにクエリを実行しており、フォールバックすると二回実行することになるためです。

* `{DriverOptions}`

    DriverOptions セクションには、`adbc.` プレフィックスを付けてドライバーにそのまま渡すオプションを指定します。

    :::caution
    **プレフィックスはオプション名の一部として扱われ、削除されません。** ADBC 自体のオプション名はすでに `adbc.` で始まります（例: `adbc.snowflake.sql.db`）。そのため、`CREATE CATALOG` では `adbc.adbc.snowflake.sql.db` と記述します。
    :::

    ```sql
    'adbc.adbc.snowflake.sql.db' = 'my_database'
    ```

* `{CommonProperties}`

    CommonProperties セクションには、共通プロパティを指定します。[Catalog Overview](../catalog-overview.md) の「Common Properties」セクションを参照してください。

    メタデータキャッシュのプロパティについては、[メタデータキャッシュ](#meta-cache)を参照してください。

## 例

<!-- Knowledge Type: Operational Examples -->

### 別の Doris クラスタへのクエリ

Arrow Flight SQL ドライバーを介して別の Doris クラスタを読み取ります。`uri` は対象クラスタの FE の Arrow Flight ポートを指します。

```sql
CREATE CATALOG remote_doris PROPERTIES (
    'type' = 'adbc',
    'driver_url' = 'libadbc_driver_flightsql.so',
    'uri' = 'grpc://remote-doris-fe:8070',
    'user' = 'root',
    'password' = '<password>'
);

SELECT id, name FROM remote_doris.some_db.some_table ORDER BY id LIMIT 10;
```

この `driver_url` はファイル名のみを指定しており、`drivers_dir`（`adbc.conf` で指定）を基準に解決されます。

### 絶対パスの使用とドライバービルドの固定

絶対パスでドライバーを参照し、`driver_checksum` で FE 上のコピーを固定します。

```sql
CREATE CATALOG remote_source PROPERTIES (
    'type' = 'adbc',
    'driver_url' = '/opt/doris/adbc_drivers/libadbc_driver_flightsql.so',
    'driver_checksum' = 'd41d8cd98f00b204e9800998ecf8427e',
    'uri' = 'grpc+tls://remote-host:8070',
    'user' = 'analyst',
    'password' = '<password>'
);
```

### 方言の指定と並列読み取りの必須化

Doris データソースに対して `doris` 方言を使用し、スキャンの分割を必須にして並列性が知らないうちに失われないようにします。

```sql
CREATE CATALOG remote_doris_parallel PROPERTIES (
    'type' = 'adbc',
    'driver_url' = 'libadbc_driver_flightsql.so',
    'uri' = 'grpc://remote-doris-fe:8070',
    'user' = 'root',
    'password' = '<password>',
    'sql_dialect' = 'doris',
    'partitioned_read' = 'required',
    'max_partitions' = '256'
);
```

### 並列読み取りの無効化

クエリ実行前のパーティション要求によるデータソース側の負荷が大きすぎる場合は、並列読み取りを無効にします。

```sql
CREATE CATALOG remote_source_single PROPERTIES (
    'type' = 'adbc',
    'driver_url' = 'libadbc_driver_flightsql.so',
    'uri' = 'grpc://remote-host:8070',
    'user' = 'root',
    'password' = '<password>',
    'partitioned_read' = 'disabled'
);
```

## 名前空間のマッピング {#namespace-mapping}

<!-- Knowledge Type: Behavior Rules -->

ADBC はオブジェクトを三階層（catalog / db_schema / table）で命名しますが、Doris の外部テーブルは二階層（database / table）です。最上位の名前は作成したカタログにすでに使われているため、リモート側の名前から一階層を除く必要があります。

- `uri` で単一のリモートカタログを指定する必要があります。そうすれば、残りの二つのリモート階層のうち変動するのは最大一つとなり、Doris が二つの名前を結合して一つのデータベース名にする必要がありません。
- リモートの `db_schema` が空でない場合は、その `db_schema` が Doris のデータベース名になります。空の場合はリモートのカタログ名が使用されます。

| リモート（catalog, db_schema） | Doris のデータベース名 |
| --- | --- |
| `mydb`, `public` | `public` |
| `mydb`, 空 | `mydb` |

データソースがカタログ名も db_schema 名もないオブジェクトを報告した場合、Doris はそれをデータベースとして参照できず、エラーになります。

`uri` でリモートカタログを指定していない場合、Doris は `CREATE CATALOG` の実行時にそれを報告し、`postgresql://host:5432/mydb` のように URI にリモートカタログ名を含めるか、ドライバーオプションで指定するよう求めます。一部のドライバーは、この確認に Doris が使用するインターフェースを実装していません。その場合、カタログは指定どおりに受け入れられ、最初の `SHOW DATABASES` で問題が表面化します。

## 列型のマッピング

<!-- Knowledge Type: Type Reference -->

Doris はデータソースから返された Arrow 型をマッピングします。

| Arrow 型 | Doris 型 | 備考 |
| --- | --- | --- |
| `bool` | `BOOLEAN` | |
| `int8` | `TINYINT` | |
| `int16` | `SMALLINT` | |
| `int32` | `INT` | |
| `int64` | `BIGINT` | |
| `uint8` | `SMALLINT` | 符号なし整数は一段階広い型にする |
| `uint16` | `INT` | 符号なし整数は一段階広い型にする |
| `uint32` | `BIGINT` | 符号なし整数は一段階広い型にする |
| `uint64` | `LARGEINT` | 符号なし整数は一段階広い型にする |
| `float16`, `float32` | `FLOAT` | |
| `float64` | `DOUBLE` | |
| `decimal128(P,S)` | `DECIMAL(P,S)` | 最大精度は 38。超えると列は拒否される |
| `decimal256(P,S)` | `DECIMAL(P,S)` | 最大精度は 76。超えると列は拒否される |
| `date32(day)` | `DATE` | |
| `date64(ms)` | `DATETIME(3)` | `date64` は時刻も保持しており、`DATE` に変換すると失われる |
| タイムゾーンなしの `timestamp(s)` | `DATETIME(0)` | |
| タイムゾーンなしの `timestamp(ms)` | `DATETIME(3)` | |
| タイムゾーンなしの `timestamp(us)`, `timestamp(ns)` | `DATETIME(6)` | ナノ秒の精度はマイクロ秒に切り捨てられる |
| タイムゾーン付きの `timestamp` | `TIMESTAMPTZ(0-6)` | 精度に関する規則は同じ。タイムゾーン付きの Arrow タイムスタンプは特定の時点を表し、`DATETIME` に変換するとタイムゾーン情報が失われる |
| `utf8`, `large_utf8`, `utf8_view` | `STRING` | |
| `binary`, `large_binary`, `binary_view`, `fixed_size_binary` | `STRING` | Doris の外部テーブル経由では汎用のバイナリ列型がない |
| `list`, `large_list`, `fixed_size_list`, `list_view`, `large_list_view` | `ARRAY` | 要素型は再帰的にマッピングされる |
| `struct` | `STRUCT` | フィールド型は再帰的にマッピングされ、**フィールド名は小文字に変換される** |
| `map` | `MAP` | キー型と値型は再帰的にマッピングされる |
| `dictionary` | 辞書の値型に基づいてマッピング | |
| `run_end_encoded` | 値型に基づいてマッピング | |
| その他 | 未対応 | |

:::note
- Doris には符号なし整数型がないため、符号なし型は一段階広い型にマッピングされます。`uint32` は `BIGINT` にマッピングされ、`INT` にはマッピングされません。狭い型を使うと、2^31 を超える値がすべて負数に変わってしまうためです。
- 型をマッピングできない場合、Doris は損失のある型に変換せず、テーブル情報を取得する際に列名と Arrow 型を示してエラーにします。データソース側でその列をキャストするか、クエリから除外してください。
- Doris データソースを読み取る場合、双方で int32 としてエンコードされるため、`IPV4` 列は `INT` として返され、ソースの `DATETIME` 列は `TIMESTAMPTZ` として返されます。
:::

## クエリ操作

<!-- Knowledge Type: Operational Examples + Behavior Rules -->

### 基本的なクエリ

カタログの設定後は、次のいずれかの方法でテーブルをクエリできます。

```sql
-- 1. switch to catalog, use database and query
SWITCH adbc_ctl;
USE adbc_db;
SELECT * FROM adbc_tbl LIMIT 10;

-- 2. use adbc database directly
USE adbc_ctl.adbc_db;
SELECT * FROM adbc_tbl LIMIT 10;

-- 3. use full qualified name to query
SELECT * FROM adbc_ctl.adbc_db.adbc_tbl LIMIT 10;
```

### メタデータ操作

```sql
SHOW DATABASES FROM adbc_ctl;

SHOW TABLES FROM adbc_ctl.adbc_db;

DESC adbc_ctl.adbc_db.adbc_tbl;

SHOW CREATE TABLE adbc_ctl.adbc_db.adbc_tbl;
```

データベースとテーブルの一覧は常に最新の情報を読み取るため、データソースで作成したテーブルは `REFRESH` なしで表示されます。テーブルスキーマはキャッシュされます。詳しくは[メタデータキャッシュ](#meta-cache)を参照してください。

:::note
データソース上のビューはテーブルとして一覧表示されません。
:::

### データ統合

外部データソースから Doris の内部テーブルへデータを書き込めます。

```sql
INSERT INTO internal.demo.local_tbl
SELECT * FROM adbc_ctl.adbc_db.adbc_tbl;
```

内部テーブルやほかのカタログのテーブルとのフェデレーションクエリに加え、`SELECT ... INTO OUTFILE` や ADBC テーブル上に構築したマテリアライズドビュー（MTMV）も使用できます。

### 列プルーニング

Doris はクエリに必要な列だけを要求します。使用しない列は、生成されるリモート SQL に含まれません。

### 述語プッシュダウン

次の述語は、リモート SQL の `WHERE` 句に変換されます。

| 分類 | 対応する形式 |
| --- | --- |
| 比較 | `=`, `!=`, `<`, `<=`, `>`, `>=` |
| NULL の判定 | `IS NULL`, `IS NOT NULL` |
| 集合 | `IN`, `NOT IN` |
| 論理演算子 | 上記の述語に対する `AND`, `OR`, `NOT` |

関数呼び出し、算術式、`LIKE`、`BETWEEN` はプッシュダウンされず、Doris 側で評価されます。

最上位の `AND` で結合された各条件は、条件全体がプッシュダウンされるか、まったくプッシュダウンされないかのどちらかです。**Doris はプッシュダウンした述語もすべて再適用します。**そのため、プッシュダウンが影響するのはクエリの速度だけで、返される行は変わりません。

### LIMIT プッシュダウン

`LIMIT` は `WHERE` 句全体がプッシュダウンされた場合にのみプッシュダウンされます。これにより、Doris 側でまだ適用する必要があるフィルターより先に、データソース側で結果が切り詰められることを防ぎます。

### COUNT(*) 最適化

`COUNT(*)` はデータソースから列データを読み取りません。

### 生成されたリモート SQL の確認

`EXPLAIN` には、実際にデータソースへ送信される SQL 文が表示されます。

```sql
EXPLAIN
SELECT id, name
FROM adbc_ctl.adbc_db.adbc_tbl
WHERE id > 100 AND name IS NOT NULL
LIMIT 10;
```

出力の `QUERY:` 行はプッシュダウンされたリモート文を表し、その列はスキャンで実際に要求される列と一致します。

:::tip
Arrow Flight SQL データソースでは、パーティションを要求する呼び出し自体がクエリの実行になります。そのため、ADBC テーブルに対して `EXPLAIN` を実行しても、Doris はデータソースにパーティションを要求せず、データソースも実際にはクエリを実行しません。
:::

### 並列読み取り

`partitioned_read` が `auto`（デフォルト）または `required` の場合、Doris はドライバーに一回のスキャンを複数の結果パーティションに分割するよう要求します。各パーティションを一つの BE ノードが読み取り、ノードは並列に動作します。

データソースがスキャンを分割できない場合:

- `auto`: 単一の BE ノードによる単一文での読み取りにフォールバックします。
- `required`: 理由を示してクエリを失敗させます。

パーティション数が `max_partitions` を超える場合、クエリは失敗します。

## メタデータキャッシュ {#meta-cache}

<!-- Knowledge Type: Configuration Parameters + Usage Guidance -->

外部データソースへのアクセスを高速化するため、Doris は ADBC カタログのメタデータの一部をキャッシュします。対象はデータベース名の解決、テーブル名の解決、テーブルスキーマです。

データベースとテーブルの一覧は**キャッシュされません**。常に最新の情報を読み取るため、データソースで作成したテーブルには `REFRESH` なしでアクセスできます。

### キャッシュプロパティの設定 {#meta-cache-unified-model}

ADBC カタログのメタデータキャッシュは、共通のキー `meta.cache.<engine>.<entry>.{enable,ttl-second,capacity}` で設定します。

| プロパティ | デフォルト | 意味 |
| --- | --- | --- |
| `meta.cache.adbc.metadata.enable` | `true` | メタデータキャッシュを有効にするかどうか。 |
| `meta.cache.adbc.metadata.ttl-second` | `600` | `0` はキャッシュを無効にします。すぐに有効になり、最新のメタデータを確認できます。`-1` は期限切れになりません。その他の正の整数は、アクセス時刻を基準とする TTL（秒）です。 |
| `meta.cache.adbc.metadata.capacity` | `1000` | キャッシュエントリ数の上限。`0` はキャッシュを無効にします。 |

**有効になる条件:** キャッシュが有効になるのは、`enable=true`、`ttl-second != 0`、`capacity > 0` のすべてを満たす場合だけです。

:::tip
デフォルトの TTL である 10 分は、ほかのカタログのデフォルトより大幅に短く設定されています。ADBC データソースは稼働中の別のデータベースであり、ほかのユーザーによる DDL でテーブルがいつでも変更されますが、その変更は Doris に通知されません。この設定値は、`REFRESH` を忘れた場合に古いテーブルスキーマが表示され続ける時間の上限です。
:::

### キャッシュモジュール {#meta-cache-unified-modules}

データベース名の解決、テーブル名の解決、テーブルスキーマは、一つの設定群を共有します。これらは一緒に読み込まれ、一緒に破棄されます。いずれもリモートデータソースの構造を表すためです。

| モジュール（`<entry>`） | プロパティキーのプレフィックス | キャッシュする内容と影響 |
| --- | --- | --- |
| `metadata` | `meta.cache.adbc.metadata.` | データベース名の解決、テーブル名の解決、テーブルスキーマをキャッシュします。ソースで列が追加、削除、または型変更された後、Doris から見えるまでの時間に影響します。 |

### 手動更新

次の各文は、それぞれの対象範囲のキャッシュを破棄します。

```sql
REFRESH CATALOG adbc_ctl;
REFRESH DATABASE adbc_ctl.adbc_db;
REFRESH TABLE adbc_ctl.adbc_db.adbc_tbl;
```

### ベストプラクティス {#meta-cache-best-practices}

* **最新メタデータへのリアルタイムアクセス**: すべてのクエリでデータソースの現在のテーブルスキーマを読み取りたい場合は、`ttl-second` を `0` に設定します。

  ```sql
  ALTER CATALOG adbc_ctl SET PROPERTIES ("meta.cache.adbc.metadata.ttl-second" = "0");
  ```

* **スキーマが頻繁に変わるデータソース**: `ttl-second` を短くするか、変更があったことを確認した時点で `REFRESH` を実行します。

### 可観測性 {#meta-cache-unified-observability}

キャッシュのメトリクスは、`information_schema.catalog_meta_cache_statistics` システムテーブルから取得できます。

```sql
SELECT catalog_name, engine_name, entry_name,
       effective_enabled, ttl_second, capacity,
       estimated_size, hit_rate, load_failure_count, last_error
FROM information_schema.catalog_meta_cache_statistics
WHERE catalog_name = 'adbc_ctl' AND engine_name = 'adbc'
ORDER BY entry_name;
```

このシステムテーブルについては、[catalog_meta_cache_statistics](../../admin-manual/system-tables/information_schema/catalog_meta_cache_statistics.md)を参照してください。

:::caution
ADBC 接続では、クエリを実行するユーザーにかかわらず、データソースにはカタログに設定された単一の ID でアクセスします。そのため、キャッシュエントリはすべてのユーザーで共有されます。
:::

## 制限事項

<!-- Knowledge Type: Limitations -->

- 読み取り専用です。データソースに対する `INSERT`、`CREATE TABLE`、`DROP TABLE` などの書き込み文は拒否されます。
- 統計情報の収集と集約プッシュダウンはサポートされていません。
- データソース上のビューはテーブルとして一覧表示されません。
- `driver_checksum` は FE 上のドライバーのコピーのみを検証します。BE 上のコピーは検証されず、FE と BE のファイル同士も比較されません。
- `driver_url` に指定できるのはローカル参照のみです。Doris はリモート URL からドライバーをダウンロードしません。
- Doris データソースを読み取る場合、`IPV4` 列は `INT` として、ソースの `DATETIME` 列は `TIMESTAMPTZ` として返されます。

## 付録

### よくある質問

<!-- Knowledge Type: Troubleshooting -->

| 症状またはエラー | 原因 | 対処方法 |
| --- | --- | --- |
| `Driver file not found` | FE が、解決したパスでドライバーファイルを見つけられません。 | `driver_url` にファイル名のみを指定した場合は、`drivers_dir` ディレクトリ（`adbc.conf` で指定）にファイルがあるか確認してください。絶対パスまたは `file://` URL を指定した場合は、そのパスが FE ノードに存在し、読み取り可能か確認してください。 |
| `Driver path does not match any path allowed by driver_secure_path` | ドライバーのパスが `adbc.conf` の許可リストに含まれていません。 | ドライバーを許可されたディレクトリに移動するか、`driver_secure_path` を変更して FE を再起動してください。 |
| `scheme 'xxx' is not supported, only a local file is` | `driver_url` に `http://` などのリモートスキームが使用されています。 | ADBC ドライバーはノードごとにダウンロードされません。FE とすべての BE にドライバーファイルを配置し、ファイル名のみ、絶対パス、または `file://` URL で参照してください。 |
| `The ADBC source reports no current catalog, so 'uri' does not pin one` | `uri` でリモートカタログが指定されていません。 | `postgresql://host:5432/mydb` のように URI にリモートカタログ名を含めるか、`adbc.` プレフィックスを付けたドライバーオプションで指定してください。 |
| 列の Arrow 型に対応する Doris 型がないというエラーでクエリが失敗する | その列の型をマッピングできません。 | データソース側でマッピング可能な型にキャストするか、`SELECT *` を使わず、クエリからその列を除外してください。 |
| クエリ結果が誤っているように見えるが、エラーは報告されない | FE とすべての BE でドライバーファイルのビルドが一致していない可能性があります。ADBC はパーティション情報をドライバー固有の形式で記述するため、異なる実装同士でエラーなく誤読する可能性があります。 | `driver_checksum` で FE のビルドを固定し、各 BE 上のドライバーファイルの MD5 を手動で比較してください。 |
| リモート SQL が構文エラーで失敗する | データソースの SQL 方言と使用中の方言が一致していません。 | `sql_dialect` を明示的に設定してください。たとえば、Doris データソースに対して `'sql_dialect' = 'doris'` を指定します。 |
