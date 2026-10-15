---
{
    "title": "Fluss Catalog",
    "language": "ja",
    "description": "Doris から Apache Fluss のログテーブルと主キーテーブルをクエリし、Paimon に階層化されたデータと Fluss ログを Union Read で読み取る方法を説明します。",
    "keywords": [
        "Fluss Catalog",
        "Apache Fluss",
        "Doris から Fluss をクエリ",
        "Union Read",
        "レイクとログの Union Read",
        "階層化されたレイクテーブル",
        "Fluss Paimon",
        "Tiering Service",
        "tbl$lake",
        "tbl$log",
        "fluss.union_read.mode",
        "fluss.bootstrap.servers",
        "fluss.lake.paimon",
        "Fluss ログテーブル",
        "Fluss 主キーテーブル",
        "Fluss の型マッピング",
        "ストリーミングストレージ",
        "has no readable lake snapshot yet",
        "enable_jni_heap_admission",
        "Java heap space"
    ]
}
---

<!-- Knowledge Type: Capability Definition + Configuration Parameters + Performance Tuning + Troubleshooting -->
<!-- Use Case: Real-time queries on Fluss tables / Lake and log Union Read / Data integration and federated queries -->

Doris は Fluss Catalog を通じて [Apache Fluss](https://fluss.apache.org/) のテーブルを読み取ります。Fluss はリアルタイム分析向けのストリーミングストレージシステムで、その階層化サービスはテーブルデータを Paimon データレイクに継続的に書き込めます。Doris は Fluss 内のデータを直接読み取ることができます。また、Paimon に階層化済みの過去データと、Fluss ログに残る新しい行を統合し、一つのテーブルとしてクエリすることもできます。後者の読み取り方法を Union Read と呼びます。

:::note
- この機能は実験的な機能で、バージョン 5.0.0 から利用できます。
- 読み取りのみをサポートします。書き込み、およびデータベースやテーブルの管理文はサポートしません。
- 階層化されたレイクテーブルでサポートするレイク形式は Paimon のみです。
:::

## ユースケース

| シナリオ | 説明 |
| --- | --- |
| リアルタイムクエリ | Fluss のログテーブルと主キーテーブルの最新データを直接クエリします。 |
| Union Read | レイクへの階層化を有効にしたテーブルでは、一つのクエリで Paimon レイクに階層化された過去データと、まだ階層化されていない Fluss ログの行を一緒に読み取ります。これがレイクとログの Union Read です。 |
| データ統合 | Fluss のデータを Doris 内部テーブルに取り込むか、フェデレーションクエリで内部テーブルや他の Catalog のテーブルと結合します。 |
| 書き戻し | サポートしません。 |

## 仕組み

<!-- Knowledge Type: Architecture Principles -->

Fluss テーブルには三つの形態があり、読み取り方法がそれぞれ異なります。

| テーブル種別 | Doris による読み取り方法 |
| --- | --- |
| ログテーブル | Fluss ログを読み取ります。各バケットが一つのスキャン範囲になります。 |
| 主キーテーブル | 各バケットの最新の KV スナップショットを読み取り、その後に書き込まれた変更ログを適用して、主キーでマージし最新の状態を取得します。 |
| 階層化されたレイクテーブル（`table.datalake.enabled = true`） | Paimon レイク内の階層化済みデータを読み取り、階層化オフセット以降の Fluss ログを適用し、一回のスキャンで両者をマージします。これが Union Read です。 |

レイク側は Doris に組み込まれた Paimon Connector が読み取ります。Fluss Catalog 自体にはレイク用のリーダーはありません。Fluss は階層化された各テーブルについて読み取り可能な Paimon スナップショットを記録し、Doris はそのスナップショット時点の Paimon データを読み取ります。そのため、ネイティブの ORC/Parquet リーダーとファイルキャッシュを利用できます。

階層化された主キーテーブルの Union Read は、レイク側とログ側を主キーでマージします。プランニング時に FE は、バケットのログ末尾のオフセット範囲を、そのバケットの各レイク分割に付加します。BE がレイクデータを読み取る際には、ログ末尾で更新または削除された行を除外し、別のスキャン範囲としてログ末尾自体の最新状態を出力します。各行はちょうど一回だけ出力され、結果はテーブル全体を Fluss から読み取った場合と一致します。

## Catalog の設定

<!-- Knowledge Type: Configuration Parameters -->
<!-- Use Case: Creating a Fluss Catalog / Configuring SASL authentication / Configuring the Paimon lake connection -->

### 構文

```sql
CREATE CATALOG [IF NOT EXISTS] catalog_name PROPERTIES (
    'type' = 'fluss',
    'fluss.bootstrap.servers' = '<bootstrap_servers>',
    {FlussProperties},
    {LakeProperties},
    {CommonProperties}
);
```

* `<bootstrap_servers>`

    必須です。Fluss クラスターのブートストラップアドレスで、`host:port` をカンマで区切って指定します。通常は CoordinatorServer のアドレスを指定します。例: `'fluss.bootstrap.servers' = '10.0.0.1:9123,10.0.0.2:9123'`。

* `{FlussProperties}`

    FlussProperties セクションには、Fluss Catalog 固有のパラメータを指定します。

    | パラメータ | 必須 | デフォルト | 説明 |
    | --- | --- | --- | --- |
    | `fluss.union_read.mode` | いいえ | `auto` | 階層化されたレイクテーブルの Union Read モードです。`auto`、`required`、`disabled` のいずれかを指定します。「Union Read モード」を参照してください。 |
    | `fluss.union_read.max_tail_rows` | いいえ | `2000000` | 主キーテーブルの Union Read で、単一バケットのログ末尾に許容する最大行数です。「Union Read モード」を参照してください。 |
    | `fluss.union_read.max_total_tail_rows` | いいえ | `20000000` | 主キーテーブルの Union Read で、一回のスキャンに含まれる全バケットのログ末尾に許容する合計最大行数です。`fluss.union_read.max_tail_rows` より小さくすることはできません。 |
    | `enable.mapping.varbinary` | いいえ | `false` | Fluss の `BINARY`/`BYTES` 型を Doris の `varbinary` にマッピングするかどうかを指定します。デフォルトでは `string` にマッピングします。 |
    | `enable.mapping.timestamp_tz` | いいえ | `false` | Fluss の `TIMESTAMP_LTZ` 型を Doris の `timestamptz` にマッピングするかどうかを指定します。デフォルトでは `datetime` にマッピングします。 |

    上記の Doris 固有のパラメータと `fluss.lake.paimon.*` を除き、`fluss.` プレフィックスが付いたその他のプロパティは、プレフィックスを除いた形で Fluss クライアントにそのまま渡されます。FE と BE は同じ設定群を共有します。Doris はパラメータ名を制限しないため、Fluss クライアントが理解できる設定項目なら何でもこの方法で渡せます。例えば、Fluss クラスターで SASL 認証が有効な場合は次のように指定します。

    ```sql
    'fluss.client.security.protocol' = 'sasl',
    'fluss.client.security.sasl.mechanism' = 'PLAIN',
    'fluss.client.security.sasl.username' = '<username>',
    'fluss.client.security.sasl.password' = '<password>'
    ```

    全項目については [Fluss の設定リファレンス](https://fluss.apache.org/docs/maintenance/configuration/) と [Fluss の認証ガイド](https://fluss.apache.org/docs/security/authentication/) を参照してください。

    FE と BE の Fluss クライアント設定が異なるのは、ネットワークスレッド数だけです。BE 上の各 Fluss 接続は一度に一つのスキャン範囲を処理します。そのため、Catalog で `fluss.netty.client.num-network-threads` を設定していない場合、BE はスレッドとファイルディスクリプタの使用量を抑えるため、一つのネットワークスレッドで接続を開きます。一方、FE の接続には Fluss クライアントのデフォルト値を使用します。通常、このパラメータを設定する必要はありません。設定すると、FE と BE の両方がその値を使用します。

* `{LakeProperties}`

    LakeProperties セクションには、階層化されたレイクテーブルの背後にある Paimon レイクへの接続設定を、`fluss.lake.paimon.` プレフィックス付きで指定します。プレフィックス以降の部分は、Fluss クラスターの `datalake.paimon.*` 設定（`server.yaml` 内）とまったく同じ形式なので、値をコピーできます。「レイク接続設定」を参照してください。

* `{CommonProperties}`

    CommonProperties セクションには共通プロパティを指定します。[Catalog の概要](../catalog-overview.md) の「共通プロパティ」を参照してください。

### 例

最小構成です。Fluss 自体のデータのみを読み取る場合、またはレイクのストレージに認証情報が不要な場合は、これで十分です。

```sql
CREATE CATALOG fluss PROPERTIES (
    'type' = 'fluss',
    'fluss.bootstrap.servers' = '10.0.0.1:9123'
);
```

Paimon レイクがオブジェクトストレージ上にある場合（以下は S3 互換ストレージの例）:

```sql
CREATE CATALOG fluss_lake PROPERTIES (
    'type' = 'fluss',
    'fluss.bootstrap.servers' = '10.0.0.1:9123',
    'fluss.lake.paimon.s3.endpoint' = 'http://minio:9000',
    'fluss.lake.paimon.s3.access-key' = '<ak>',
    'fluss.lake.paimon.s3.secret-key' = '<sk>'
);
```

Fluss クラスターで SASL 認証が有効な場合:

```sql
CREATE CATALOG fluss_sasl PROPERTIES (
    'type' = 'fluss',
    'fluss.bootstrap.servers' = '10.0.0.1:9123',
    'fluss.client.security.protocol' = 'sasl',
    'fluss.client.security.sasl.mechanism' = 'PLAIN',
    'fluss.client.security.sasl.username' = '<username>',
    'fluss.client.security.sasl.password' = '<password>'
);
```

### デプロイ要件

- FE は Fluss クライアントでメタデータを読み取ってクエリをプランニングし、BE はそれを使ってデータを読み取ります。両方から Fluss クラスターの CoordinatorServer と TabletServer に接続できる必要があります。
- BE は Fluss クラスターへの接続を再利用します。スキャン範囲の読み取り後も接続は後続のスキャン範囲やクエリのために開いたままになり、アイドル状態が 60 秒を超えて初めて閉じられます。そのため、クエリ終了後も Fluss 側に BE からの接続が表示されることがあります。接続はクライアント設定ごとに分けられます。Catalog プロパティ（SASL のユーザー名やパスワードなど）を変更すると、BE は新しい設定で接続を開きます。
- 主キーテーブルの KV スナップショットとアーカイブされたログセグメントは、Fluss で設定したリモートストレージ（`remote.data.dir`）に置かれます。BE はこれらのファイルを直接読み取るため、そのリモートストレージにも接続できる必要があります。
- 階層化されたレイクテーブルを読み取るには、FE と BE の両方から Paimon レイクのストレージに接続できる必要があります。
- レイクデータは Doris に組み込まれた Paimon Connector プラグインが読み取ります。このプラグインは Doris に同梱されており、別途インストールする必要はありません。

## サポート対象の Fluss バージョン

<!-- Knowledge Type: Version Compatibility -->

| Doris バージョン | Fluss クライアントバージョン |
| --- | --- |
| 5.0 | 1.0 |

Fluss 1.0 より古いクラスターはサポートしません。Doris が依存するクライアント API は Fluss 1.0 で初めて導入されました。

## メタデータのマッピング

<!-- Knowledge Type: Behavior Rules -->

Fluss のメタデータ階層は Database -> Table であり、Doris に一対一で対応します。追加の名前マッピングはありません。

レイクへの階層化が有効なテーブルでも、`SHOW TABLES` に表示されるのはテーブル自体だけです。`tbl$lake` と `tbl$log` は同じテーブルを読み取るための二つの方法であり、別のエントリとしては表示されません。

`SHOW CREATE TABLE` は Fluss テーブルの列とコメントを表示しますが、テーブルプロパティは表示しません。レイクへの階層化が有効かどうか（`table.datalake.enabled`）と使用するレイク形式（`table.datalake.format`）を調べるには、Flink SQL などを使って Fluss 側のテーブル定義を確認してください。Doris では、レイクへの階層化が有効なテーブルだけに `tbl$lake` と `tbl$log` があります。

## 列型のマッピング

<!-- Knowledge Type: Type Reference -->

| Fluss の型 | Doris の型 | 備考 |
| --- | --- | --- |
| BOOLEAN | boolean | |
| TINYINT | tinyint | |
| SMALLINT | smallint | |
| INT | int | |
| BIGINT | bigint | |
| FLOAT | float | |
| DOUBLE | double | |
| DECIMAL(P, S) | decimal(P, S) | |
| CHAR(N) | char(N) | N が 255 を超えると string にマッピングします。 |
| STRING | string | |
| BINARY(N) | string / varbinary(N) | `enable.mapping.varbinary` で制御します。デフォルトの `false` では `string`、`true` では `varbinary` にマッピングします。 |
| BYTES | string / varbinary | 上記と同じです。 |
| DATE | date | |
| TIME | UNSUPPORTED | Doris に同じ意味を持つ型はありません。テーブル内の他の列はクエリできますが、この列を参照するクエリだけが失敗します。 |
| TIMESTAMP(P) | datetime(P) | 精度が 6 を超える場合は datetime(6) にマッピングし、精度が失われる可能性があります。 |
| TIMESTAMP_LTZ(P) | datetime(P) / timestamptz(P) | 6 を超える精度は 6 にマッピングします。`enable.mapping.timestamp_tz` で制御します。デフォルトの `false` では `datetime`、`true` では `timestamptz` にマッピングします。 |
| ARRAY | array | |
| MAP | map | |
| ROW | struct | |

> 注:
>
> `TIMESTAMP_LTZ` 列では、Extra 列に `WITH_TIMEZONE` と表示されます（`DESCRIBE` の出力）。`datetime` にマッピングする場合、Doris は返却前に値を現在のセッションタイムゾーン（`SET time_zone = <tz>`）へ変換します。
>
> レイクへの階層化が有効なテーブルでは、`tbl` と `tbl$lake` の列型は同じです。上記のマッピングは、Fluss が Paimon に書き込むときの型変換、および Paimon Catalog の型マッピングと整合しています。

## パーティションテーブル

<!-- Knowledge Type: Behavior Rules + Limitations -->

Doris では、パーティション列は通常の列です。`SHOW PARTITIONS` はパーティションを `k1=v1/k2=v2` の形式で一覧表示します。パーティション列への述語はパーティションプルーニングに使用され、読み取るバケット数を減らします。

Fluss はパーティション値をパーティション名にのみ保存し、パーティション名に使用できない文字（`.` や `:` など）を `_` に置き換えます。Doris が読み取れるのは、この変換を往復しても値が変わらないパーティション列だけです。

- サポート対象: `CHAR`、`STRING`、`BOOLEAN`、`TINYINT`、`SMALLINT`、`INT`、`BIGINT`、`DATE`、および `BINARY`/`BYTES`（`enable.mapping.varbinary` がオフの場合。パーティション値はバイト列の十六進数テキストです）。
- サポート対象外: `FLOAT`、`DOUBLE`、`TIME`、`TIMESTAMP`、`TIMESTAMP_LTZ`。このようなテーブルでも `DESCRIBE` は実行できますが、クエリと `SHOW PARTITIONS` は失敗し、原因となったパーティション列の名前がエラーメッセージに表示されます。

## クエリ操作

<!-- Knowledge Type: Operational Examples + Behavior Rules -->
<!-- Use Case: Querying Fluss tables / Reading only the lake or only the log / Controlling the Union Read mode -->

### 基本的なクエリ

```sql
-- Switch to the catalog, then query
SWITCH fluss;
USE db;
SELECT * FROM tbl LIMIT 10;

-- Use the fully qualified name
SELECT * FROM fluss.db.tbl WHERE dt = '20260101';
```

ログテーブルは、クエリのプランニング時点までのすべてのログレコードを返します。同じパーティション内のバケットでは、同じ時点に取得したオフセットを使うため、一つのクエリでは一貫したビューが得られます。主キーテーブルは各キーの最新状態を返し、削除されたキーは結果に現れません。

### 階層化されたレイクテーブルと Union Read

`table.datalake.enabled = true` のテーブルには、三つの読み取り方法があります。デフォルトではレイクとログを一緒に読み取る Union Read を使用します。

```sql
SELECT * FROM fluss.db.tbl;         -- Union Read: lake + log merged into the full data set (default)
SELECT * FROM fluss.db.`tbl$lake`;  -- Only the tiered data in the Paimon lake
SELECT * FROM fluss.db.`tbl$log`;   -- Only the data in the Fluss log that has not been tiered yet
```

`tbl$lake` と `tbl$log` はデータの保存場所によって分けられています。両者は重複せず、合わせると `tbl` の全データになります。この名前が表すのはデータの場所であり、新しさではありません。階層化サービスが停止しても、`tbl$log` はログに残っているデータを表します。

**`tbl$lake`**

- Paimon Connector は、階層化サービスが書き込んだ Paimon テーブルを直接読み取ります。Fluss 1.0 で階層化されたテーブルでは、`tbl$lake` の列は `tbl` と完全に同じです。以前の Fluss リリースがレイクテーブルに追加していた `__bucket`、`__offset`、`__timestamp` システム列は存在しません。
- Fluss が記録した読み取り可能なレイクスナップショットの時点でレイクを読み取ります。そのようなスナップショットがまだない場合は、レイクの最新状態を読み取ります。Fluss は Fluss テーブルと同時に Paimon テーブルを作成するため、階層化サービスが何もコミットしていない段階では、`tbl$lake` はエラーではなく空の結果を返します。
- 現在のレイク接続設定で Doris がレイクテーブルを見つけられない場合、クエリは `nothing has been tiered` で失敗します。通常は `fluss.lake.paimon.warehouse` などの設定が、Fluss クラスターの書き込み先 warehouse を指していないことを意味します。「レイク接続設定」を参照してください。
- Paimon Catalog のタイムトラベルクエリと増分クエリはサポートしません。

**`tbl$log`**

- レイクスナップショットに対応するログオフセットから読み取りを開始し、そのオフセット以降に書き込まれたデータだけを返します。
- サポートするのはログテーブルだけです。主キーテーブルでは、レイクスナップショット以降のログは、レイクに既存のキーの更新や削除を含む変更ストリームです。そのため、独立した行の集合として返すことはできません。主キーテーブルの `$log` をクエリすると失敗します。
- テーブルには読み取り可能なレイクスナップショットがすでに存在する必要があり、存在しない場合はクエリが失敗します。
- レイクへの階層化が無効なテーブルには、`$lake` も `$log` もありません。

### Union Read モード

<!-- Knowledge Type: Configuration Parameters + Behavior Rules -->
<!-- Use Case: Controlling whether Union Read happens / Finding out why auto mode fell back -->

階層化されたレイクテーブル自体へのクエリ（`SELECT * FROM tbl`）で Union Read を実行するかどうかは、Catalog プロパティ `fluss.union_read.mode` で制御します。

| 値 | 動作 |
| --- | --- |
| `auto`（デフォルト） | 読み取り可能なレイクスナップショットがある場合に Union Read を実行します。条件を満たさない場合は、失敗せずに Fluss からの読み取りへフォールバックします。以下のケースを参照してください。 |
| `required` | Union Read を必須にします。条件を満たさない場合、フォールバックせずに失敗します。 |
| `disabled` | Union Read を行いません。レイクにのみ存在するパーティションも含めてレイクを無視し、Fluss に現在あるデータだけを読み取ります。 |

セッション変数 `fluss_union_read_mode` は、現在のセッションについて Catalog の設定を上書きします。

```sql
SET fluss_union_read_mode = 'required';  -- No fallback to a Fluss-only read; fail instead
SET fluss_union_read_mode = 'disabled';  -- Read from Fluss only
SET fluss_union_read_mode = '';          -- Default: follow the catalog setting
```

単一の文だけでモードを変更するには、`SET_VAR` ヒントを使用します。

```sql
SELECT /*+ SET_VAR(fluss_union_read_mode='required') */ * FROM fluss.db.tbl;
```

Union Read モードは、データをどの経路から読み取るかを決めます。Fluss がテーブルの全データを保持している間、つまり TTL によってログが失効しておらず、レイクにまだ存在するパーティションが Fluss から削除されていない間は、三つのモードはすべて同じ行を返します。`required` は、想定外の読み取り経路へ暗黙に切り替わる代わりに失敗するため、回帰テストやトラブルシューティングに役立ちます。

**`auto` がフォールバックするケース**

| ケース | 説明 |
| --- | --- |
| 読み取り可能なレイクスナップショットがない | 階層化サービスがまだ何もコミットしておらず、全データが Fluss にあるため、テーブルを Fluss のみから読み取ります。 |
| `key-type` | 主キーテーブルの主キー列（パーティション列を除く）の型が、レイク側とログ側で値を正確に比較できない型です。対象は `FLOAT`、`DOUBLE`、`TIME`、精度が 6 を超える `TIMESTAMP`、および `TIMESTAMP_LTZ` です。`enable.mapping.timestamp_tz` が `false`（デフォルト）の場合、夏時間から標準時間への切り替わりで異なる二つの時点が同じローカル時刻になり得るため、どの精度の `TIMESTAMP_LTZ` 列も該当します。`true` の場合は、精度が 6 を超える列だけが該当します。 |
| `partition-type` | 主キーテーブルのパーティション列が `STRING` ではありません。レイク分割と Fluss パーティションはパーティション値のテキスト表現で照合され、双方が同じ表記で書き込むことを保証できるのは `STRING` だけです。 |
| `tail-truncated` | 主キーテーブルのレイクスナップショット以降のログの一部が Fluss の TTL によってすでに削除され、ログ末尾を完全に読み取れません。 |
| `tail-too-large` | 主キーテーブルのログ末尾の行数が、`fluss.union_read.max_tail_rows` または `fluss.union_read.max_total_tail_rows` の制限を超えています。 |

最後の四つのケースは主キーテーブルにのみ適用され、`EXPLAIN` の `degraded` フィールドに報告されます。主キーテーブルがフォールバックすると、Fluss にまだ存在するパーティションは Fluss から全体を読み取ります。Fluss はそれらのパーティションの完全な状態を保持しているため、データは失われません。ただし、それらについてレイクの列指向ファイルを使用できないため、クエリは遅くなります。パーティションの有効期限切れなどで Fluss から削除されてもレイクには残っているパーティションは、引き続きレイクから読み取ります。非パーティションテーブルは Fluss のみから読み取ります。

`partition-type` の場合、Doris はレイク分割がどの Fluss パーティションに属するかを確実には判断できません。Fluss にはもう存在しないパーティションがレイクにある場合や、両者でパーティション値の表記が異なる場合は、フォールバックせずに `cannot be matched safely to a live fluss partition` で失敗します。Fluss に残っているデータだけを読み取るには、Union Read モードを `disabled` に設定してください。

ログテーブルは動作が異なります。Fluss のみから読み取ると、Fluss ログにまだ保持されているデータしか返りません。古いログが TTL で失効すると、Union Read より行数が少なくなります。階層化されたログテーブルには `disabled` を推奨しません。また、ログ末尾が不完全なログテーブルにはフォールバックがありません。レイクスナップショット以降のログの一部がすでに失効した場合、Union Read は `Part of the log tail has expired` で失敗します。これは `auto` と `required` の両方に当てはまり、`tbl$log` のクエリもどのモードでも失敗します。Fluss が新しい読み取り可能なレイクスナップショットを公開するまで待ってください。

**ログ末尾の行数制限**

主キーテーブルの Union Read では、BE は各バケットのログ末尾をメモリに保持します。一つはレイクデータのフィルタリングに使う主キーの集合、もう一つはログ末尾自体が出力する行です。メモリ使用量を制限するため、`fluss.union_read.max_tail_rows` は単一バケットのログ末尾の行数を制限し（デフォルトは 2 百万行）、`fluss.union_read.max_total_tail_rows` は一回のスキャンに含まれる全バケットのログ末尾の合計行数を制限します（デフォルトは 20 百万行）。どちらの制限も Fluss が報告するオフセットに基づき、プランニング時に確認されます。通常、ログ末尾に含まれるのは `table.datalake.freshness` の一期間内に書き込まれたデータだけで、デフォルトの制限を大きく下回ります。制限に達する場合、通常は階層化サービスが停止しているか、大幅に遅れています。ログ末尾が出力する行は BE の JVM ヒープに保持されるため、いずれかの制限を引き上げる前に、JVM ヒープに十分な空きがあることを確認してください。「BE の JVM ヒープメモリ」を参照してください。

**EXPLAIN で読み取り経路を確認する**

`flussScan` 行には、`EXPLAIN` の出力でクエリが実際にテーブルを読み取る方法が表示されます。

```text
flussScan: readMode=default, unionRead=yes, lakeSplits=3, suppressedLakeSplits=1, logRanges=0, pkRanges=0, pkTailRanges=1, mode=auto
```

| フィールド | 意味 |
| --- | --- |
| `readMode` | `default` はテーブル全体を、`log` は `tbl$log` を読み取ります。 |
| `unionRead` | Union Read を実行したかどうかを示します。`yes` は Union Read を実行したことを示し、開始オフセットをレイクスナップショットから取得する `tbl$log` でも同じ値となります。ただし、その場合の `lakeSplits` は 0 です。 |
| `lakeSplits` | レイク分割の数です。 |
| `suppressedLakeSplits` | ログ末尾によるフィルタリングが必要なレイク分割の数です。主キーテーブルにのみ適用されます。 |
| `logRanges` | ログテーブルのログスキャン範囲の数です。 |
| `pkRanges` | Fluss から全体を読み取る主キーテーブルのバケット数です（KV スナップショット + 変更ログ）。 |
| `pkTailRanges` | 主キーテーブルの Union Read におけるログ末尾スキャン範囲の数です。 |
| `mode` | 適用中の Union Read モードです。セッション変数から取得した場合は `(session)` サフィックスが付きます。 |
| `degraded` | 主キーテーブルが `auto` モードでフォールバックした場合にのみ表示されます。値は上表の `key-type`、`partition-type`、`tail-truncated`、`tail-too-large` のいずれかです。読み取り可能なレイクスナップショットがない場合はここには表示されず、`unionRead=no` としてのみ示されます。レイクにのみ存在するパーティションを引き続きレイクから読み取る場合は、`unionRead=yes` と `degraded` が同時に表示されます。 |

### レイク接続設定

<!-- Knowledge Type: Configuration Parameters -->
<!-- Use Case: Paimon lake on object storage that needs credentials / Overriding the lake settings reported by the Fluss cluster -->

Fluss クラスターは `datalake.paimon.*` 設定（`server.yaml` 内）を、階層化された各テーブルのプロパティに書き込み、Doris はそこから Paimon レイクへの接続を構築します。多くの場合、Catalog 側にレイク接続設定を追加する必要はありません。

ただし、Fluss はクライアントにテーブルプロパティを返す前に、名前に `key`、`secret`、または `password` を含むすべての設定項目を削除します。Paimon レイクが認証情報を必要とするオブジェクトストレージ上にある場合、Doris は Fluss から認証情報を取得できません。そのため、Catalog に `fluss.lake.paimon.` プレフィックス付きで指定する必要があります。

```sql
CREATE CATALOG fluss PROPERTIES (
    'type' = 'fluss',
    'fluss.bootstrap.servers' = '10.0.0.1:9123',
    'fluss.lake.paimon.s3.endpoint' = 'http://minio:9000',
    'fluss.lake.paimon.s3.access-key' = '<ak>',
    'fluss.lake.paimon.s3.secret-key' = '<sk>'
);
```

プレフィックス以降には、`datalake.paimon.` に続く部分と同じ、Paimon 固有のパラメータ名を使用します。この設定は Fluss の `server.yaml` にあります。そのままコピーしてください。

| Fluss server.yaml | Doris Catalog プロパティ |
| --- | --- |
| `datalake.paimon.warehouse: s3://bucket/lake` | `'fluss.lake.paimon.warehouse' = 's3://bucket/lake'` |
| `datalake.paimon.metastore: filesystem` | `'fluss.lake.paimon.metastore' = 'filesystem'` |
| `datalake.paimon.s3.endpoint: http://minio:9000` | `'fluss.lake.paimon.s3.endpoint' = 'http://minio:9000'` |

上書きは設定全体ではなく、キーごとに適用されます。Catalog に設定したキーは Fluss クラスターが報告する同じキーを上書きし、設定していないキーは引き続きクラスターから取得します。認証情報だけを指定した場合、`warehouse`、`metastore` などは引き続きクラスターから取得されます。

ストレージパラメータ（認証情報、セッショントークン、エンドポイント、リージョン、アドレス指定方式、Hadoop 設定）は Paimon Catalog には渡されません。Doris 固有のストレージパラメータ名に変換され、Doris のストレージ層で適用されます。これらの設定は FE のマニフェスト読み取りと BE のデータファイル読み取りの両方に必要で、ストレージ層だけが双方に同じ設定群を渡せるためです。マッピングは次のとおりです。

| Paimon パラメータ | Doris ストレージパラメータ |
| --- | --- |
| `s3.access-key` / `s3.access.key` / `fs.s3a.access.key` | `s3.access_key` |
| `s3.secret-key` / `s3.secret.key` / `fs.s3a.secret.key` | `s3.secret_key` |
| `s3.session-token` / `s3.session.token` / `fs.s3a.session.token` | `s3.session_token` |
| `s3.endpoint` / `fs.s3a.endpoint` | `s3.endpoint` |
| `s3.region` / `fs.s3a.endpoint.region` | `s3.region` |
| `s3.path-style-access` / `s3.path.style.access` / `fs.s3a.path.style.access` | `use_path_style` |
| `fs.oss.accessKeyId` | `oss.access_key` |
| `fs.oss.accessKeySecret` | `oss.secret_key` |
| `fs.oss.endpoint` | `oss.endpoint` |
| `fs.obs.access.key` / `fs.obs.access-key` | `obs.access_key` |
| `fs.obs.secret.key` / `fs.obs.secret-key` | `obs.secret_key` |
| `fs.obs.endpoint` | `obs.endpoint` |

HDFS HA や Kerberos の設定など、`fs.`、`dfs.`、`hadoop.` で始まるその他のパラメータも、元の名前のまま Doris のストレージ層に渡されます。

`fluss.lake.paimon.metastore` は `filesystem`（デフォルト）、`hive`、`rest` を受け付けます。Hive Metastore のアドレスや REST の認証設定など、その他のパラメータは [Paimon Catalog](./paimon-catalog.mdx) と同じ方法で指定します。

`ALTER CATALOG` ではプロパティの設定しかできず、削除はできません。`fluss.lake.paimon.*` の上書きを取り消すには、空文字列に設定します。すると Doris は Fluss クラスターが報告する設定に戻ります。

```sql
ALTER CATALOG fluss SET PROPERTIES ('fluss.lake.paimon.warehouse' = '');
```

一つの Fluss Catalog は、単一のレイク設定群でレイクテーブルを読み取ります。Fluss クラスターの `datalake.paimon.*` を変更した後は、Doris が新しい設定を読み込めるよう、Catalog を削除して再作成してください。`REFRESH CATALOG` はメタデータキャッシュをクリアするだけで、レイク設定は再読み込みしません。

### クエリプロファイル

<!-- Knowledge Type: Performance Diagnostics -->

一回の Fluss スキャンで Fluss ログ、Paimon レイク、レイクデータを上書きするログ末尾を読み取り、フィルタリングも行うことがあります。そのためプロファイルには読み取り経路別・範囲種別の時間と行数が記録され、どこで時間を費やしているかを確認できます。

```text
TableReader
├── FlussLogReadTime            8s25ms      Total time on the Fluss side (JNI)
│   ├── FlussPkTailRangeNum          2      Only the range types actually read in this scan are registered
│   ├── FlussPkTailRangeReadTime  6s2ms
│   └── FlussLogRowsReturned         2
├── FlussLakeReadTime           8s25ms      Total time on the Paimon side, including tail reads and filtering
│   ├── FlussLakeRangeNum            1
│   ├── FlussLakeSuppressRangeNum    2
│   └── FlussLakeRowsReturned        7      Rows after filtering; add FlussUnionSuppressedRows to get the count before filtering
├── FlussUnionTailReadTime      5s20ms      One round trip to Fluss per bucket
└── FlussUnionSuppressTime      16.1us      Filtering per block, grows with the number of lake rows
```

各経路の合計時間から範囲種別ごとの時間を引くと、そのリーダーの初期化コスト（JNI クラスのロード、または Paimon 読み取りスタックの準備）が分かります。ログテーブルのみを読み取るクエリのプロファイルには、レイクや主キーに関するカウンターはありません。

レイク分割を読み取るスキャンでは、`TableReader` の下に次のカウンターも表示されます。主キーテーブルの Union Read では、これらに値が入ります。

| カウンター | 意味 |
| --- | --- |
| `FlussUnionSuppressedRows` | ログ末尾で更新または削除されたために除外したレイクの行数です。 |
| `FlussUnionTailKeysRead` | ログ末尾から読み取った変更ログのレコード数です。 |
| `FlussUnionTailKeysRetained` | レイク行のフィルタリングのためメモリに保持した、重複しない主キーの数です。 |
| `FlussUnionTailCacheHitCount` | 読み取り済みのログ末尾を再利用したレイク分割の数です。同じ BE 上では、同じバケットのレイク分割が、読み取り済みのログ末尾を共有します。 |

Fluss から読み取る部分は JNI リーダーを経由します。そのカウンターは `fluss` ノード（`TableReader` の下）にあり、プロファイルの DetailProfile 部分にだけ表示されます。接続と JVM ヒープに関係するカウンターは次のとおりです。

| カウンター | 意味 |
| --- | --- |
| `FlussJniConnectionsOpened` | 読み取りのために開いた Fluss 接続の数です。BE はアイドル接続を再利用するため、直後に同じクエリを実行すると通常は 0 になります。 |
| `JvmHeapDeclaredBytes` | JNI ヒープの使用量制御が有効な場合、リーダーが保持すると申告した JVM ヒープ容量です。主キーテーブル全体の読み取りと、主キーテーブルの Union Read のログ末尾だけが申告し、その他の読み取りでは 0 になります。「BE の JVM ヒープメモリ」を参照してください。 |
| `JvmHeapWaitTime` | JNI ヒープの使用量制御が有効な場合、リーダーが JVM ヒープの空きを待った時間です。「BE の JVM ヒープメモリ」を参照してください。 |

レイク分割を Paimon JNI 経由で読み取る場合、同名の JVM ヒープカウンターは `paimon` ノードの下に表示されます。

## クエリ性能

<!-- Knowledge Type: Architecture Principles + Performance Tuning -->
<!-- Use Case: Performance tuning / Checking whether a query uses the native reader or JNI -->

BE には Fluss テーブルを読み取る経路が二つあり、コストは大きく異なります。

- C++ ネイティブリーダー。BE は Paimon レイクの ORC/Parquet ファイルを、Paimon Catalog と同じリーダーで直接読み取ります。JVM を経由せず、Doris の[ファイルキャッシュ](../data-cache.md)を利用できます。
- JNI リーダー。BE は JNI を介して Fluss Java SDK を呼び出し、Fluss 自体のデータを読み取ります。ログ、KV スナップショット、変更ログは、この方法でしか読み取れません。各バッチを Java オブジェクトから Doris の列指向ブロックに変換する必要があり、ネイティブリーダーより大幅に遅くなります。この種の読み取りには JVM ヒープを大量に保持するものもあります。「BE の JVM ヒープメモリ」を参照してください。

使用する経路はスキャン範囲の種類によって決まり、`flussScan` 行（`EXPLAIN` の出力）にあるカウンターに対応します。

| 読み取るデータ | EXPLAIN のカウンター | 読み取り経路 |
| --- | --- | --- |
| ログテーブルのログ | `logRanges` | JNI |
| 主キーテーブル全体（KV スナップショット + 変更ログ） | `pkRanges` | JNI |
| 主キーテーブルの Union Read のログ末尾 | `pkTailRanges` | JNI |
| ログテーブルの Union Read のレイク分割 | `lakeSplits` | C++ ネイティブリーダー |
| 主キーテーブルの Union Read のレイク分割 | `lakeSplits`、`suppressedLakeSplits` | 以下に示す Paimon Catalog のルールで決まります。ログ末尾の主キーを使ったレイク行のフィルタリングは、BE 上の C++ で行います。 |

`tbl$lake` は Paimon Connector が直接プランニングするため、その `EXPLAIN` に `flussScan` 行はありません。代わりに `paimonNativeReadSplits=N/M` が表示されます。これは M 個の分割のうち N 個がネイティブリーダーを使用することを意味し、プロファイルに Fluss のカウンターはありません。

レイク分割は Paimon Connector がプランニングし、ネイティブリーダーを使用するかどうかは通常の Paimon テーブルと同じルールに従います。

- ログテーブルは Paimon の追加型テーブルに階層化されます。すべての分割はファイルを直接読み取るため、すべてネイティブリーダーを使用します。
- 主キーテーブルは Paimon の主キーテーブルに階層化されます。コンパクション済みで他のファイルとのマージが不要な分割はネイティブリーダーを使用します。書き込まれたばかりで未コンパクションのファイルや、ファイル間でキー範囲が重なり、読み取り時のマージが必要な分割は、Paimon JNI リーダーを使用します。
- セッション変数 `force_jni_scanner = true` を設定すると、すべてのレイク分割が JNI を経由します。トラブルシューティング時にのみ使用してください。

階層化されたテーブルでは、Union Read によってレイク内の部分（通常はデータの大半）をネイティブリーダーで読み取り、階層化オフセット以降の少量のログだけを JNI で読み取れます。階層化が迅速であるほど（`table.datalake.freshness` が小さいほど）、JNI を経由する量は少なくなります。このため、階層化されたテーブルでは Union Read をデフォルトで使用します。次の点を参考にしてください。

- 過去データを分析し、鮮度をあまり重視しない場合は、`tbl$lake` を直接クエリします。Fluss ログを完全にスキップできます。ログテーブルは全体がネイティブリーダーで読み取られ、主キーテーブルは上記の Paimon のルールに従います。
- `fluss.union_read.mode = disabled` を指定すると、テーブル全体が JNI を経由します。トラブルシューティング以外では推奨しません。
- `auto` モードがフォールバックすると（`degraded=` が `EXPLAIN` に表示されると）、Fluss から読み取る部分はすべて JNI を経由します。レイクにしか存在しないパーティションだけは、引き続きレイクから読み取られます。`key-type` と `partition-type` のケースに注意してください。これらはテーブルスキーマで決まり、テーブル定義の変更によってのみ解消できます。
- 主キーテーブルの Union Read では、各 BE 上の各バケットについて、ログ末尾の主キーをもう一度読み取ります（プロファイルの `FlussUnionTailReadTime`）。同じ BE 上のそのバケットの他のレイク分割は、読み取った主キーを再利用します。ログ末尾が長いほどコストは高くなります。

クエリが使用した経路を確認するには、`lakeSplits` と `logRanges`、`pkRanges`、`pkTailRanges` を `EXPLAIN` で比較し、プロファイルの `FlussLakeReadTime` と `FlussLogReadTime` を比較してください。

## BE の JVM ヒープメモリ

<!-- Knowledge Type: Capacity Planning + Configuration Parameters + Troubleshooting -->
<!-- Use Case: OutOfMemoryError when querying primary-key tables / Sizing the BE JVM heap / Turning on JNI heap admission -->

BE は Fluss 自体のデータを JNI 経由で読み取り、マージが必要な Paimon レイク分割も JNI を経由します（「クエリ性能」を参照）。これらのリーダーはすべて BE に組み込まれた JVM で動作し、他の Catalog の JNI 読み取りや Java UDF と一つのヒープを共有します。ヒープサイズは `-Xmx` で設定します。この値は `JAVA_OPTS_FOR_JDK_17` に指定され、設定ファイルは `be.conf` です。デフォルトは 2 GB（`-Xmx2048m`）です。

ログテーブルのログなど、ほとんどの読み取りはデータをストリーミングし、ヒープを数 MB しか保持しません。次の三種類の読み取りは異なり、最初のバッチを返す前にデータの一部をヒープにロードし、読み取りが終わるまで保持します。

| 読み取るデータ | 保持するヒープ |
| --- | --- |
| Fluss からの主キーテーブル全体の読み取り（`pkRanges`、`EXPLAIN` に表示） | バケットの最新の KV スナップショット以降の変更ログをメモリにロードし、主キーでマージします。スナップショット以降の変更が多いほど、より多くのヒープが必要です。 |
| 主キーテーブルの Union Read のログ末尾（`pkTailRanges`） | ログ末尾の各主キーの最新行です。ログ末尾が長いほど、より多くのヒープが必要です。 |
| マージが必要な Paimon レイク分割（未コンパクションの Paimon 主キーテーブル） | マージする各ファイルにつき一つの行グループです。一つの分割で数百 MB を使用することがあります。 |

クエリは複数のスキャン範囲を並列に読み取ります。各スキャンインスタンスは一度に最大 `max_file_scanners_concurrency`（デフォルト 16）個のリーダーを実行し、一つの BE 上で複数のインスタンスやクエリが同時に読み取る場合もあります。このようなヒープ使用量の大きいリーダーが同時にいくつか開くと、ヒープがいっぱいになり、クエリが失敗することがあります。エラーメッセージにはヒープサイズと対処方法が示されます。

```text
errCode = 2, detailMessage = (10.0.0.3)[JNI_ERROR]OutOfMemoryError: Java heap space. BE's JVM is out of heap. Its maximum is 2048 MB, the -Xmx in JAVA_OPTS_FOR_JDK_17 of be.conf: raise it and restart the BE, or have the statement hold less of the heap at once - read with fewer scanners by setting max_file_scanners_concurrency below its default of 16, or set enable_jni_heap_admission = true to have JNI readers wait for room by the heap they declare. A statement that ran out of heap frees it only once its scanners have exited
```

### ヒープ不足への対処

対処方法は次のとおりです。

1. JVM ヒープを増やします。`-Xmx` を変更してください。この値は `JAVA_OPTS_FOR_JDK_17` に指定され、設定ファイルは `be.conf` です。BE の再起動後に有効になります。主キーテーブルを頻繁にクエリするクラスターでは、まずこれを検討してください。JVM ヒープも BE が動作するマシンのメモリを消費するため、増やす前にマシンのメモリが十分か確認してください。
2. 同時に開くリーダー数を減らします。`max_file_scanners_concurrency` を下げると、読み取りは遅くなりますが、同時に開くリーダーと保持するヒープが減ります。

    ```sql
    SET max_file_scanners_concurrency = 4;
    -- For a single statement only
    SELECT /*+ SET_VAR(max_file_scanners_concurrency=4) */ * FROM fluss.db.tbl;
    ```

3. JNI ヒープの使用量制御を有効にし、各リーダーが保持するヒープ容量に応じて順番を待つようにします。詳細は以下を参照してください。
4. ヒープにロードするデータ量を減らします。Fluss が KV スナップショットを取得する頻度（Fluss クラスターの `kv.snapshot.interval`）を上げると、スナップショット以降の変更ログが短くなります。階層化を迅速にするほど（`table.datalake.freshness` を小さくするほど）、ログ末尾は短くなります。レイク内の Paimon 主キーテーブルがコンパクションされると、その分割はマージが不要になり、ネイティブリーダーを経由して JVM ヒープを使用しなくなります。

### JNI ヒープの使用量制御

セッション変数 `enable_jni_heap_admission`（デフォルト `false`）を有効にすると、FE はプランニング時に上記三種類のリーダーが保持するヒープ容量を見積もり、スキャン範囲とともに BE に渡します。BE は、開いているリーダーが申告した容量の合計を追跡します。現在の合計に新しいリーダーの申告容量を加えても、最大 JVM ヒープに対する `jni_scanner_heap_budget_ratio` の割合に収まる場合にのみ、そのリーダーを開きます。最大 JVM ヒープは `-Xmx` で設定します。収まらない場合は、先行するリーダーが終了して閉じられ、割り当て分を返すまで待機します。

```sql
SET enable_jni_heap_admission = true;
-- For a single statement only
SELECT /*+ SET_VAR(enable_jni_heap_admission=true) */ * FROM fluss.db.tbl;
```

この変数を有効にした場合の動作は次のとおりです。

- 申告して待機するのは、上記三種類のリーダーだけです。ログテーブルのログやネイティブリーダーで読み取るレイク分割は何も申告せず、変数がオンでもオフでも速度は変わりません。
- リーダーが待機することはあっても、クエリ結果は変わりません。
- リーダーは到着順に待機するため、申告容量の大きいリーダーが後から来た小さいリーダーに無期限に追い越されることはありません。割り当て分を保持するリーダーがいないときは、次のリーダーを必ず通します。そのため、予算全体を超える容量を申告したリーダーも開けますが、単独で実行されます。
- リーダーが待機する時間は最大 `jni_scanner_heap_max_wait_ms`（デフォルト 60 秒）です。その後は待機をやめて開きます。
- 予算は BE ごとに管理され、その BE 上で変数を有効にしたすべてのクエリで共有されます。無効なクエリは容量を申告せず、待機せず、予算にも計上されません。複数のクエリが同時に主キーテーブルを読み取る場合は、`SET GLOBAL enable_jni_heap_admission = true` で全セッションに対して有効にしてください。
- この変数は [Paimon Catalog](./paimon-catalog.mdx) で JNI 経由で読み取る分割にも適用されます。

関連する二つの BE 設定項目はどちらも実行時に変更できます。変更方法は [BE の設定](../../admin-manual/config/be-config.md) を参照してください。

| 設定項目 | デフォルト | 説明 |
| --- | --- | --- |
| `jni_scanner_heap_budget_ratio` | `0.5` | 開いているリーダーが申告できる容量の合計が、最大 JVM ヒープに対して占める割合です。残りのヒープは、容量を申告しないリーダー、Java UDF など JVM を使用する他の BE 機能、読み取り中の一時的な使用量増加のために確保されます。高すぎる値に設定しないでください。 |
| `jni_scanner_heap_max_wait_ms` | `60000` | リーダーが順番を待つ最長時間（ミリ秒）です。その後は待機をやめて開きます。 |

プロファイルの `JvmHeapDeclaredBytes` と `JvmHeapWaitTime`（「クエリプロファイル」を参照）には、リーダーが申告したヒープ容量と待機時間が記録されます。`JvmHeapWaitTime` が頻繁に高くなる場合は、予算が小さすぎるため、`-Xmx` の引き上げを検討してください。

申告容量は見積もりであるため、この変数はデフォルトでオフです。

- 文字列型、バイナリ型、ネストした型の値は、いずれも 64 バイトとして見積もられます。文字列列に入った JSON や長い文字列の主キーなど、値がこれより長いテーブルでは、リーダーは申告容量より多くのヒープを保持します。使用量制御では防ぎきれず、クエリが `OutOfMemoryError` で失敗する可能性があります。
- Paimon のマージ読み取りには、一時的に申告容量の数倍に達する使用量のピークがあります。このピークは予算外のヒープに収まる必要があります。
- 同じ主キーがログ内で何度も更新される場合、申告容量はリーダーが実際に保持する量より大きくなります。そのため、必要以上に長く待機し、クエリが遅くなることがあります。

### ヒープ不足が発生した後

- `OutOfMemoryError` が発生したクエリは失敗しますが、BE プロセスは動作を続けます。
- そのクエリが保持していたヒープは、すべてのリーダーが終了するまで解放されません。それまでに実行したクエリは `Failed to attach the current thread to the JVM, code=-1` で失敗し、上記と同じ対処方法が表示されることがあります。少し待ってから再試行してください。
- ヒープ不足時に Fluss クライアントのバックグラウンドスレッドの一部が停止し、再起動されない場合があります。この場合、Fluss の読み取りの一部がいつまでもハングする可能性があります。それらのスレッドと保持しているメモリは、BE を再起動しないと解放されません。JVM ヒープ不足が発生したら、都合のよいときに BE を再起動してください。
- JVM ヒープ不足時に BE をすぐ終了させ、外部のプロセス監視機構で再起動したい場合は、`-XX:+ExitOnOutOfMemoryError` を `JAVA_OPTS_FOR_JDK_17` に追加します。ただし、その BE 上で実行中のすべてのクエリとロードが失敗します。

## 制限事項

<!-- Knowledge Type: Limitations -->

- 読み取り専用です。`INSERT`、`UPDATE`、`DELETE` はサポートせず、`CREATE TABLE` や `DROP TABLE` などのデータベース・テーブル管理文もサポートしません。
- サポートするレイク形式は Paimon のみです。`table.datalake.format` が別の形式のテーブルでは、`tbl$lake` は失敗します。そのテーブルに読み取り可能なレイクスナップショットができた後は、テーブル自体へのクエリも `auto` と `required` モードでは失敗します。Fluss 内のデータを読み取るには、Union Read モードを `disabled` に設定してください。
- Fluss の `TIME` 型は `UNSUPPORTED` にマッピングされ、その列はクエリできません。
- 述語は Fluss にプッシュダウンされません。パーティションプルーニングを除き、Doris は Fluss からデータを読み取った後にフィルタリングします。レイク側では、分割のプランニング時にフィルターを Paimon に渡し、Paimon がそれを使用してパーティションやデータファイルをスキップします。列プルーニングとネストした型のサブ列プルーニングは、どちらもサポートします。
- `tbl$lake` に対しても、タイムトラベルクエリと増分クエリはサポートしません。
- Fluss が提供するのはテーブル単位の行数だけで、列単位の統計情報はありません。

## FAQ

<!-- Knowledge Type: Troubleshooting -->
<!-- Use Case: Missing Paimon plugin / Object storage credentials / Lake snapshot not ready / Lake table not found / Lake configuration changed / Expired log tail / Unsupported partition column type / Partition matching failure / Insufficient JVM heap -->

1. 階層化されたレイクテーブルへのクエリが `the paimon connector plugin is not available` で失敗する

    レイクデータは Paimon Connector プラグインが読み取ります。FE のデプロイディレクトリにある `plugins/connector/paimon` ディレクトリが完全であることを確認してください。

2. `tbl$lake` のクエリまたは Union Read が、オブジェクトストレージへのアクセスエラーで失敗する

    Fluss はストレージの認証情報を渡しません。Catalog に `fluss.lake.paimon.*` で設定してください。「レイク接続設定」を参照してください。

3. `has no readable lake snapshot yet` エラー

    階層化サービスは、まだレイクにデータをコミットしていません。テーブル自体へのクエリでこのエラーが報告されるのは `required` モードだけです。階層化サービスのコミットを待つか、`auto` に切り替えてください。`tbl$log` のクエリはどのモードでもこのエラーを報告します。これは `tbl$log` がレイクスナップショットを開始点とするためです。代わりにテーブル自体をクエリしてください。

4. `tbl$lake` が `nothing has been tiered` で失敗する

    Doris は現在のレイク接続設定でレイクテーブルを見つけられません。Fluss 1.0 は Fluss テーブルと同時にレイクテーブルを作成するため、通常は `fluss.lake.paimon.warehouse` などの設定が、Fluss クラスターの書き込み先 warehouse を指していないことを意味します。「レイク接続設定」を参照してください。

5. `is already serving lake tables with a different paimon configuration` エラー

    Catalog がレイクテーブルの読み取りを始めた後に、Fluss クラスターの `datalake.paimon.*` 設定が変更されました。Catalog を削除して再作成してください。`REFRESH CATALOG` はレイク設定を再読み込みしません。

6. `Part of the log tail has expired` エラー

    ログテーブルの Union Read または `tbl$log` のクエリにはレイクスナップショット以降のログが必要ですが、その一部が Fluss の TTL によってすでに削除されています。Fluss が新しい読み取り可能なレイクスナップショットを公開するまで待ってください。「Union Read モード」を参照してください。

7. `cannot be read: its partition column 'xx' has fluss type TIMESTAMP(3)` エラー

    Doris はその型のパーティション列を読み取れません。「パーティションテーブル」を参照してください。

8. `cannot be matched safely to a live fluss partition` エラー

    主キーテーブルが `STRING` 以外の列でパーティション分割されており、Fluss がすでに削除したパーティションなど、Doris が Fluss のパーティションと照合できないパーティションがレイクにあります。「Union Read モード」の `partition-type` ケースを参照してください。Fluss にまだあるデータを読み取るには、Union Read モードを `disabled` に設定してください。

9. `OutOfMemoryError: Java heap space` エラー（メッセージに `BE's JVM is out of heap` を含む）

    BE の JVM ヒープがいっぱいです。主キーテーブルの読み取り、主キーテーブルの Union Read、またはマージが必要な Paimon レイク分割の大量読み取りで主に発生します。`-Xmx` を引き上げるか、`max_file_scanners_concurrency` を下げるか、`enable_jni_heap_admission` を有効にしてください。「BE の JVM ヒープメモリ」を参照してください。ヒープ不足が発生した後は、都合のよいときに BE を再起動してください。

10. `Failed to attach the current thread to the JVM, code=-1` エラー

    通常、JVM ヒープ不足の直後に発生します。`OutOfMemoryError` で失敗したクエリのリーダーがまだすべて終了しておらず、そのクエリのヒープが解放されていません。少し待ってから再試行してください。「BE の JVM ヒープメモリ」を参照してください。

## デバッグ

<!-- Knowledge Type: Debugging Environment -->

Doris のコードベースにある `docker/thirdparties/docker-compose/fluss` ディレクトリには、回帰テストで使用する Fluss 環境が含まれています。Fluss、Flink、Paimon の階層化サービス、MinIO を利用できます。そのディレクトリの README に従って環境を構築し、機能を検証してください。

## 参考資料

- [Apache Fluss ドキュメント](https://fluss.apache.org/docs/)
- [Fluss Lakehouse Storage](https://fluss.apache.org/docs/maintenance/tiered-storage/lakehouse-storage/)
- [Paimon Catalog](./paimon-catalog.mdx)
