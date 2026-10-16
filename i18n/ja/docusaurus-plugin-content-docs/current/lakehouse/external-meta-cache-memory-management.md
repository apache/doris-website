---
{
    "title": "外部メタデータキャッシュのメモリ管理",
    "language": "ja",
    "description": "Hive、Iceberg、Paimon の外部メタデータキャッシュが使用する FE ヒープを、FE、Catalog、エントリごとのメモリ割り当て上限で制限します。",
    "keywords": ["external metadata cache", "meta.cache.max-weight", "external_meta_cache_max_weight", "FE memory", "catalog_meta_cache_statistics", "Hive Iceberg Paimon metadata cache"]
}
---

Doris 4.1.4 以降、管理対象の外部メタデータキャッシュは、保持するメモリの推定量に基づいて制限できます。これにより、大きなテーブル、単一の Catalog、または複数の Catalog のメタデータが FE ヒープを消費し続けることを防ぎます。

次のような場合にこの機能を使用します。

- Hive テーブルのパーティションやファイルが多く、パーティションやファイル一覧のデータ構造が大きくなる場合。
- Iceberg テーブルのメタデータ、パーティションの投影、またはマニフェストが大きい場合。
- Paimon のパーティションの投影が大きい場合。
- 単一の FE が複数の Catalog を扱っており、特定の Catalog にメタデータキャッシュ用メモリを占有させたくない場合。

:::tip
管理対象のキャッシュエントリの種類と名前は、Doris 4.1.x／4.2.x と current バージョンで異なります。4.1.x または 4.2.x のクラスターについては、このページの 4.x バージョンを参照してください。
:::

:::caution
これらの上限が対象とするのは、このドキュメントに記載された管理対象のメタデータキャッシュだけです。FE ヒープ全体の厳密な上限ではありません。ロード時に一時的に使うメモリ、実行中のクエリから参照されているメタデータオブジェクト、コネクタ SDK のキャッシュ、および Catalog クライアントやスレッドプールなどの共有ランタイム基盤は、割り当て上限の対象外です。
:::

<!-- Knowledge Type: Operational Steps -->
<!-- Applicable Scenarios: Configuring FE, Catalog, and entry memory limits -->
## クイックスタート {#quick-start}

前提条件：

- Hive、Iceberg、Paimon などの外部 Catalog がすでに存在すること。
- FE の設定と対象の Catalog を更新する権限があること。
- すべての FE が Doris 4.1.4 以降であること。

### 1. FE 全体の上限を設定する {#1-configure-the-fe-wide-limit}

すべての FE の `fe.conf` に次を設定します。

```properties
external_meta_cache_max_weight = 10%
```

これにより、その FE 上の管理対象の外部メタデータキャッシュ全体で、JVM の最大ヒープの 10% まで使用できます。この設定を変更した後は FE を再起動してください。

固定サイズも指定できます。

```properties
external_meta_cache_max_weight = 8GB
```

### 2. 単一の Catalog を制限する {#2-limit-one-catalog}

次の例では、`hive_ctl` の管理対象メタデータキャッシュの合計を 4 GB に制限します。

```sql
ALTER CATALOG hive_ctl SET PROPERTIES (
    "meta.cache.max-weight" = "4GB"
);
```

変更後、Doris はこの Catalog の初期化済みキャッシュをクリアし、次にアクセスされたときに新しい設定で再作成します。

:::tip
`meta.cache.max-weight` は、FE 全体の上限を設定していない場合も機能します。その場合はこの Catalog だけを制限し、FE 上の全 Catalog の合計は制限しません。
:::

### 3. 個々のキャッシュエントリを制限する {#3-limit-individual-cache-entries}

次の例では、Catalog の上限と、個々の Hive エントリの上限を設定します。

```sql
ALTER CATALOG hive_ctl SET PROPERTIES (
    "meta.cache.max-weight" = "4GB",
    "meta.cache.hive.file.max-weight" = "2GB",
    "meta.cache.hive.partition_view.max-weight" = "1GB"
);
```

`file` エントリと `partition_view` エントリは、それぞれ 2 GB と 1 GB に制限されます。両者の使用量の合計は Catalog の上限である 4 GB を超えられず、その Catalog には FE 全体の上限も適用されます。

<!-- Knowledge Type: Configuration Parameters -->
<!-- Applicable Scenarios: Understanding how FE, Catalog, and entry limits combine -->
## 割り当て上限の階層 {#quota-hierarchy}

メモリの上限には、次の三つの階層があります。

| 階層 | 設定場所 | 設定項目 | 形式 | デフォルト | 適用範囲 |
|---|---|---|---|---|---|
| FE | `fe.conf` | `external_meta_cache_max_weight` | 固定サイズ、または JVM の最大ヒープに対する割合 | `0`。FE 全体の割り当て上限なし | 現在の FE 上にある、管理対象のすべての外部メタデータキャッシュ |
| Catalog | Catalog プロパティ | `meta.cache.max-weight` | 固定サイズ。正の値が必要 | 未設定。Catalog の割り当て上限なし | 現在の Catalog 内にある、管理対象のすべてのエントリ |
| キャッシュエントリ | Catalog プロパティ | `meta.cache.<engine>.<entry>.max-weight` | 固定サイズ。正の値が必要 | 未設定。親階層の上限のみが適用される | 一つのキャッシュエントリ、またはそのエントリを共有するキャッシュ群 |

エントリに実際に適用される上限は、設定されたすべての階層の上限のうち最小の値です。

| FE の上限 | Catalog の上限 | エントリの上限 | 動作 |
|---|---|---|---|
| 未設定 | 未設定 | 未設定 | メモリの使用量計算は無効。エントリ数と TTL のポリシーのみが適用される |
| 設定済み | 未設定 | 未設定 | FE 上の管理対象のすべてのエントリが、FE の割り当て上限を共有する |
| 未設定 | 設定済み | 未設定 | Catalog 内の管理対象のすべてのエントリが、Catalog の割り当て上限を共有する |
| 未設定 | 未設定 | 設定済み | そのエントリだけが制限される。FE または Catalog 全体に対する合計の上限はない |
| 設定済み | 設定済み | 設定済み | 三つの階層すべてが適用され、最も厳しい上限が優先される |

検証ルール：

- エントリの上限は、同じ Catalog の上限を超えられません。超えると、`CREATE CATALOG` または `ALTER CATALOG` は `meta.cache.<engine>.<entry>.max-weight can not exceed meta.cache.max-weight` というエラーで失敗します。
- 各 FE は、自身の JVM ヒープを基準に `external_meta_cache_max_weight` を評価します。ヒープサイズが異なる FE では、同じ割合を指定してもバイト数で表した上限は異なります。

<!-- Knowledge Type: Configuration Parameters -->
<!-- Applicable Scenarios: Writing size and percentage values -->
## 値の形式 {#value-format}

固定サイズには、大文字と小文字を区別しない次のバイナリ単位を使用できます。

```text
B, KB, MB, GB, TB, PB
```

たとえば `512MB` や `4GB` を指定できます。固定サイズの値には整数を使用し、負の値は指定できません。

割合を指定できるのは `external_meta_cache_max_weight` だけです。たとえば `10%` や `12.5%` を指定できます。この割合は、各 FE の JVM の最大ヒープを基準に計算されます。

ゼロの意味は階層によって異なります。

| 設定項目 | `0` の意味 |
|---|---|
| `external_meta_cache_max_weight` | キャッシュは無効にせず、FE 全体の割り当て上限を無効にする |
| `meta.cache.max-weight` | 無効。Catalog の上限は正の値でなければならない |
| `meta.cache.<engine>.<entry>.max-weight` | 無効。エントリの上限は正の値でなければならない |

`0%` は無効です。FE 全体の割り当て上限を無効にするには、単純な値 `0` を使用します。キャッシュエントリを無効にするには、その `enable` を `false` にするか、`ttl-second` を `0` にします。`max-weight` はこの目的には使用できません。

<!-- Knowledge Type: Capability Matrix -->
<!-- Applicable Scenarios: Choosing which cache entries to limit -->
## 管理対象のキャッシュエントリ {#managed-cache-entries}

管理対象のすべてのメタデータキャッシュには、サイズ推定器があります。FE 全体、Catalog、またはエントリの上限のいずれかがエントリに適用されると、そのエントリはメモリ使用量に基づいて管理されます。エントリ数のみで管理される別のグループはありません。適用される上限が何もない場合、すべてのエントリでは `enable`、`ttl-second`、`capacity` の設定のみが使用されます。

キャッシュエントリは `meta.cache.<engine>.<entry>.{enable,ttl-second,capacity,max-weight}` で設定します。以下の表に、`<engine>` と `<entry>` のトークン、`ENTRY_NAME`（`information_schema.catalog_meta_cache_statistics` に表示される名前）、デフォルト値を示します。表に記載された `<entry>` トークンだけが `max-weight` を受け付けます。既知のエンジンでそれ以外の `max-weight` キーを指定すると、`CREATE CATALOG` または `ALTER CATALOG` は `Unknown metadata cache weight property` というエラーで失敗します。

### すべての外部 Catalog のテーブルスキーマ {#table-schema-of-every-external-catalog}

| `<engine>` | `<entry>` | `ENTRY_NAME` | キャッシュするデータ | デフォルトの enable／TTL／capacity |
|---|---|---|---|---|
| `default` | `schema` | `schema` | すべての Catalog タイプにおける外部テーブルのカラムスキーマ | `true` / `external_cache_expire_time_seconds_after_access` (86400 s) / `max_external_schema_cache_num` (10000) |

従来の Catalog プロパティ `schema.cache.ttl-second` は、`meta.cache.default.schema.ttl-second` に対応します。

### Hive {#hive}

`hive` エンジンは、Hive Catalog と Hudi Catalog の Hive Metastore キャッシュで使用されます。

| `<entry>` | `ENTRY_NAME` | キャッシュするデータ | デフォルトの enable／TTL／capacity |
|---|---|---|---|
| `table` | `hive-table` | Hive Metastore のテーブルオブジェクト | `true` / 86400 s / 10000 |
| `partition_names` | `hive-partition-names` | テーブルのパーティション名の一覧 | `true` / 86400 s / 10000 |
| `partition` | `hive-partition` | 場所と入力形式を含むパーティションオブジェクト | `true` / 86400 s / 100000 |
| `column_stats` | `hive-column-stats` | Hive Metastore のカラム統計 | `true` / 86400 s / 10000 |
| `file` | `hive-file` | テーブルまたはパーティションのファイル一覧 | `true` / 86400 s / 10000 |
| `partition_view` | `hive-partition-view` | パーティション名から生成された、パーティションの絞り込みに使うデータ構造 | `true` / 86400 s / 1000 |

従来のプロパティと統一されたキーの対応は次のとおりです。`schema.cache.ttl-second` は `meta.cache.hive.table.ttl-second`、`partition.cache.ttl-second` は `meta.cache.hive.partition_names.ttl-second`、`file.meta.cache.ttl-second` は `meta.cache.hive.file.ttl-second` に対応します。

Iceberg テーブルを含む Hive Metastore Catalog では、以下の `iceberg` エントリも使用されます。

### Iceberg {#iceberg}

| `<entry>` | `ENTRY_NAME` | キャッシュするデータ | デフォルトの enable／TTL／capacity |
|---|---|---|---|
| `table` | `iceberg-table` | ロードされた Iceberg テーブルのメタデータ | `true` / `meta.cache.iceberg.table.ttl-second` (86400 s) / 1000 |
| `partition` | `iceberg-partition` | テーブルスナップショットの生のパーティションデータ | `true` / `table` と同じ / 1000 |
| `manifest` | `iceberg-manifest` | 解析済みのマニフェスト内容。`meta.cache.iceberg.manifest.enable` が `true`（デフォルトは `false`）の場合にのみスキャン計画で使用される | `true` / 有効期限なし / 100000 |
| `partition_view` | `iceberg.mvcc-partition-view`, `iceberg.list-partitions-view` | 単一の割り当て上限を共有する、二種類の派生パーティション投影 | `true` / 86400 s / 1000 |

次の Iceberg キャッシュには `<entry>` トークンがありません。Catalog と FE 全体の上限に従い、TTL には `meta.cache.iceberg.table.ttl-second` の値を使用します。

| `ENTRY_NAME` | キャッシュするデータ |
|---|---|
| `iceberg-latest-snapshot` | テーブルの最新スナップショット ID |
| `iceberg-format` | テーブルから推定されたファイル形式 |
| `iceberg-comment` | テーブルのコメント。委譲された認証情報を使用する REST Catalog に対してのみ作成される |
| `iceberg-equality-delete-field-ids` | スナップショットの等価削除フィールド ID |

:::note
`iceberg.rest.session` が `user` の場合、共有キャッシュではユーザーごとの認可を回避してしまうため、`table`、`partition`、`partition_view`、最新スナップショット、ファイル形式のキャッシュは作成されません。委譲された認証情報を使用する REST Catalog でも、`table` キャッシュは作成されません。
:::

### Paimon {#paimon}

| `<entry>` | `ENTRY_NAME` | キャッシュするデータ | デフォルトの enable／TTL／capacity |
|---|---|---|---|
| `partition_view` | `paimon.partition-view` | テーブルスナップショットから生成されたパーティション投影 | `true` / 86400 s / 1000 |

次の Paimon キャッシュには `<entry>` トークンがなく、Catalog と FE 全体の上限のみに従います。

| `ENTRY_NAME` | キャッシュするデータ | TTL |
|---|---|---|
| `paimon-schema-at` | 特定のスナップショットにおけるテーブルのスキーマ | 有効期限なし。capacity は 10000 |
| `paimon-latest-snapshot` | テーブルの最新スナップショット ID | `meta.cache.paimon.table.ttl-second` (86400 s)。capacity は 1000 |

`meta.cache.paimon.table.ttl-second` は、Paimon のテーブルスキーマキャッシュの TTL も制御します。

### Hudi {#hudi}

Hudi Catalog は、そのキャッシュを `hudi` エンジンのエントリとして報告します。ただし、これらは Hive Metastore キャッシュであり、`meta.cache.hive.<entry>.*` キーで設定します。対象のエントリは `table`、`partition_names`、`partition`、`column_stats` です。

### MaxCompute {#maxcompute}

| `<engine>` | `<entry>` | `ENTRY_NAME` | キャッシュするデータ | デフォルトの enable／TTL／capacity |
|---|---|---|---|---|
| `max_compute` | `partition` | `max-compute-partition` | テーブルのパーティション一覧 | `true` / 600 s / 10000 |

### ADBC {#adbc}

| `<engine>` | `<entry>` | `ENTRY_NAME` | キャッシュするデータ | デフォルトの enable／TTL／capacity |
|---|---|---|---|---|
| `adbc` | `metadata` | `adbc-namespaces`, `adbc-table-names`, `adbc-table-schema` | 名前空間、テーブル名、テーブルスキーマ。三つのキャッシュが単一の割り当て上限を共有する | `true` / 600 s / 1000 |

### Doris {#doris}

Doris Catalog は、`schema` と `backends` エントリを `doris` エンジンのエントリとして報告します。これらは `meta.cache.doris.<entry>.*` キーで設定します。

<!-- Knowledge Type: Operational Steps -->
<!-- Applicable Scenarios: Typical Hive, Iceberg, and Paimon limit configurations -->
## 例 {#examples}

### Catalog の上限だけを使用する {#use-only-catalog-limits}

FE 全体の上限がない場合、Catalog ごとに独立した上限を設定します。

```sql
ALTER CATALOG hive_prod SET PROPERTIES (
    "meta.cache.max-weight" = "6GB"
);

ALTER CATALOG iceberg_ad_hoc SET PROPERTIES (
    "meta.cache.max-weight" = "2GB"
);
```

それぞれの Catalog は 6 GB と 2 GB に制限されますが、FE 上での合計使用量には共通の上限がありません。

### Hive のファイル一覧とパーティション構造を制限する {#limit-hive-file-listings-and-partition-structures}

```sql
ALTER CATALOG hive_ctl SET PROPERTIES (
    "meta.cache.max-weight" = "4GB",
    "meta.cache.hive.file.max-weight" = "2GB",
    "meta.cache.hive.partition_view.max-weight" = "1GB"
);
```

通常、ファイル数の多いテーブルのファイル一覧と、パーティション数の多いテーブルのパーティション絞り込み用データ構造が、Hive で最も大きなエントリになります。

### Iceberg のメタデータを制限し、マニフェストキャッシュを有効にする {#limit-iceberg-metadata-and-enable-the-manifest-cache}

```sql
ALTER CATALOG iceberg_ctl SET PROPERTIES (
    "meta.cache.max-weight" = "4GB",
    "meta.cache.iceberg.table.max-weight" = "1GB",
    "meta.cache.iceberg.partition.max-weight" = "1GB",
    "meta.cache.iceberg.manifest.enable" = "true",
    "meta.cache.iceberg.manifest.max-weight" = "1GB"
);
```

### Paimon のパーティション投影を制限する {#limit-paimon-partition-projections}

```sql
ALTER CATALOG paimon_ctl SET PROPERTIES (
    "meta.cache.max-weight" = "2GB",
    "meta.cache.paimon.partition_view.max-weight" = "1GB"
);
```

残りの Paimon キャッシュには、Catalog の 2 GB の上限が適用されます。

### メモリと TTL のポリシーを組み合わせる {#combine-memory-and-ttl-policies}

メモリの上限は `enable`、`ttl-second`、`capacity` と併用できます。

```sql
ALTER CATALOG hive_ctl SET PROPERTIES (
    "meta.cache.hive.file.enable" = "true",
    "meta.cache.hive.file.ttl-second" = "1800",
    "meta.cache.hive.file.capacity" = "20000",
    "meta.cache.hive.file.max-weight" = "2GB"
);
```

`capacity` は引き続きエントリ数の上限であり、`max-weight` はメモリの上限を追加します。どちらかに先に到達すると、キャッシュからの削除が発生します。`capacity=0` または `ttl-second=0` を指定した場合も、エントリは無効になります。

<!-- Knowledge Type: Behavior Description -->
<!-- Applicable Scenarios: Understanding admission rejection and its effect on queries -->
## 上限に達したときの動作 {#behavior-when-a-limit-is-reached}

キャッシュミスが発生した場合、Doris は次の処理を行います。

1. 外部ソースからメタデータをロードします。
2. ロードしたオブジェクトが保持するメモリを推定し、使用量計算のための固定オーバーヘッドとして 512 バイトを加算します。
3. FE、Catalog、エントリの割り当て上限をアトミックに確認します。
4. キャッシュへの格納が拒否された場合、ロードしたオブジェクトをキャッシュせずに現在のリクエストへ返し、ほかのエントリに対して、アクセス頻度の低いデータを非同期に解放するよう要求します。まず同じ Catalog のエントリに要求し、FE 全体で不足している場合はほかの Catalog にも要求します。

格納が拒否されても、クエリは失敗しません。オブジェクトは保持されないため、非同期のメモリ回収によって十分な空きができるまで、以後のアクセスで再ロードが発生し、クエリ計画のレイテンシーが増加します。

キャッシュヒット時はメモリの推定を行いません。推定器には次の二種類があります。

- 型固有の推定器は、Hive Metastore のオブジェクト、Hive のファイル一覧、Iceberg テーブルのメタデータとマニフェスト、および Hive、Iceberg、Paimon の派生パーティション投影のサイズを推定します。
- 汎用推定器は、訪問数に固定の上限を設けたうえで、残りのキャッシュのオブジェクトグラフ全体をたどります。この上限に達した場合、またはグラフに検査できないクラスが含まれる場合、推定は不完全になります。

推定が不完全な場合、オブジェクトの使用量を過少に計上しないよう、キャッシュへの格納を拒否します。拒否理由は `LAST_WEIGHT_REJECT_REASON` に記録されます。

| 理由 | 意味 |
|---|---|
| `budget_exceeded` | FE、Catalog、またはエントリの割り当て上限ではオブジェクトを保持できない |
| `entry_too_large` | オブジェクト単体が、エントリに適用される上限を超えている |
| `incomplete_estimate:<detail>` | 推定器がオブジェクトのサイズを確実に求められなかった |
| `invalid_zero_estimate` | 推定器がゼロを返した |

:::caution
割り当て上限は、オブジェクトをロードした後、キャッシュに格納するときに確認されます。Doris は外部ソースにアクセスする前にヒープを予約しません。そのため、リモートからのロードに失敗した場合や、例外的に大きな単一のオブジェクトが構築完了前に FE ヒープを使い尽くした場合、現在のリクエストが失敗する可能性があります。この機能は、正常なロード後に保持されるメモリを制限するものであり、単一のメタデータロードによる OOM を防ぐものではありません。
:::

<!-- Knowledge Type: Operational Steps -->
<!-- Applicable Scenarios: Applying limit changes without restarting queries -->
## 設定の適用とキャッシュの更新 {#applying-configuration-and-refreshing-caches}

- `external_meta_cache_max_weight` を変更した後は FE を再起動します。Catalog の初期化後は、この値を変更できません。
- `meta.cache.max-weight` または `schema.cache.ttl-second` を変更すると、Catalog のすべてのメタデータキャッシュが破棄されます。`meta.cache.<engine>.<entry>.*` を変更すると、そのエンジンのキャッシュが破棄されます。次のアクセス時に、新しい設定で再構築されます。
- 実行中のクエリは、すでにロードしたオブジェクトを引き続き保持します。
- FE 全体または Catalog の上限が Paimon Catalog に適用されるときは、使用量に計上されない二つ目のメタデータキャッシュができないよう、Paimon SDK 自体の `CachingCatalog` はデフォルトで無効になります。明示的な `paimon.cache-enabled` プロパティの設定が優先されます。

メモリの上限は、オブジェクトをキャッシュに保持するかどうかを制御します。外部メタデータを変更することはなく、`REFRESH CATALOG`、TTL、メタデータイベントの同期に代わるものでもありません。

<!-- Knowledge Type: Operational Steps -->
<!-- Applicable Scenarios: Troubleshooting / Performance tuning of FE heap usage -->
## メモリ使用量の監視と問題の調査 {#monitoring-and-troubleshooting-memory-pressure}

システムテーブル [`catalog_meta_cache_statistics`](../admin-manual/system-tables/information_schema/catalog_meta_cache_statistics) は、FE、Catalog、メタデータキャッシュのエンジン、キャッシュエントリの組み合わせごとに一行を返します。メモリの管理状況は、次のカラムで確認できます。

| カラム | 意味 | 時間的な性質 |
|---|---|---|
| `MAX_WEIGHT` | エントリに適用されるメモリの上限（バイト単位）。`-1` は、そのエントリに FE、Catalog、エントリのいずれの上限も適用されないことを示す。 | 設定値 |
| `ESTIMATED_WEIGHT` | 現在そのエントリに予約されていると推定されるバイト数。 | クエリ実行時点の値 |
| `WEIGHT_REJECT_COUNT` | 上記いずれかの理由で、キャッシュへの格納が拒否された回数。 | 現在のキャッシュインスタンスでの累積値 |
| `LAST_WEIGHT_REJECT_REASON` | 直近の拒否理由。 | 最新の値 |

Catalog プロパティの変更や FE の再起動によってキャッシュが再構築されると、累積カウンターはゼロから再開します。このテーブルには履歴が保持されないため、推移が必要な場合は定期的に値を取得してください。`max_weight >= 0` の行は、メモリ使用量に基づいて管理されるエントリです。上限値自体は `fe.conf` と Catalog プロパティで設定します。

格納が拒否されると、Doris はエントリごとに最大一分に一回、次のような警告をログに記録します。

```text
Metadata cache entry 'hive-file' rejected a value by weight: reason=budget_exceeded, used=..., max=...
```

FE ヒープの使用量が多く、外部メタデータキャッシュが原因と考えられる場合は、次の手順に従います。

### 1. 管理対象キャッシュがメモリ使用量に影響しているか確認する {#1-check-whether-managed-caches-contribute-to-the-pressure}

```sql
SELECT fe_host,
       SUM(estimated_weight) AS estimated_weight,
       SUM(weight_reject_count) AS weight_reject_count
FROM information_schema.catalog_meta_cache_statistics
WHERE max_weight >= 0
GROUP BY fe_host
ORDER BY fe_host;
```

予約量の合計を、設定した `external_meta_cache_max_weight` および FE ヒープと比較します。この値は、キャッシュが保持するメモリの推定量であり、FE ヒープの総使用量ではありません。ロード時の一時メモリ、実行中のクエリから参照されているオブジェクト、コネクタ SDK のキャッシュは含まれません。予約量が少ないのに FE ヒープの使用量が多い状態が続く場合は、手順 6 に進みます。

### 2. 原因となる Catalog を特定する {#2-locate-the-responsible-catalogs}

```sql
SELECT fe_host, catalog_name,
       SUM(estimated_weight) AS estimated_weight,
       SUM(weight_reject_count) AS weight_reject_count
FROM information_schema.catalog_meta_cache_statistics
WHERE max_weight >= 0
GROUP BY fe_host, catalog_name
ORDER BY estimated_weight DESC;
```

各 Catalog の予約量を、その `meta.cache.max-weight` と比較します。予約量が上限に近い Catalog や、ほかの FE と比べて一台の FE 上で大幅に大きい Catalog を探します。

### 3. キャッシュエントリを詳しく調べる {#3-drill-down-to-cache-entries}

```sql
SELECT engine_name, entry_name,
       estimated_weight, max_weight,
       weight_reject_count, last_weight_reject_reason
FROM information_schema.catalog_meta_cache_statistics
WHERE fe_host = '<fe_host>'
  AND catalog_name = '<catalog_name>'
  AND max_weight >= 0
ORDER BY estimated_weight DESC;
```

`estimated_weight` が `max_weight` に近いエントリは、その Catalog の使用量の大部分を占めています。`weight_reject_count` が `budget_exceeded` を理由に増え続けている場合、割り当て上限が不足しています。オブジェクトはロードして返されますが保持されないため、後続のアクセスで再ロードされます。`entry_too_large` は、単一のオブジェクトがエントリの上限を超えていることを意味します。`incomplete_estimate` は割り当て上限の問題ではなく、オブジェクトはキャッシュされずに提供されます。

### 4. 対応策を選ぶ {#4-choose-a-control}

| 目的 | 設定項目 | 反映されるタイミング |
|---|---|---|
| 一台の FE 上での合計を制限する | `external_meta_cache_max_weight`（`fe.conf` で設定） | FE の再起動後 |
| 一つの Catalog を独立して制限する | `meta.cache.max-weight` | `ALTER CATALOG` 後の次のアクセス時 |
| 一つのエントリによるメモリの占有を防ぐ | `meta.cache.<engine>.<entry>.max-weight` | `ALTER CATALOG` 後の次のアクセス時 |
| キャッシュよりも新しいメタデータを優先する | `meta.cache.<engine>.<entry>.ttl-second` を小さくするか、`meta.cache.<engine>.<entry>.enable` を `false` にする | `ALTER CATALOG` 後の次のアクセス時 |

### 5. 変更後の動作 {#5-what-happens-after-the-change}

- Catalog プロパティを変更すると、対象のキャッシュは破棄され、必要になったときに再構築されます。システムテーブルのカウンターはゼロから再開します。
- 実行中のクエリは、すでにロードしたオブジェクトを引き続き保持します。
- 上限を下げるとキャッシュミスが増えます。ワーキングセットが再び上限内に収まるまで、外部メタデータのロードが増え、クエリ計画のレイテンシーも高くなります。

### 6. この仕組みで解決できない問題 {#6-what-this-mechanism-cannot-solve}

使用量に計上されたメモリが少ないのに FE ヒープの使用量が多い状態が続く場合、負荷の原因は割り当て上限の対象外にあります。`max-weight` をさらに下げても改善しません。代わりに次を調べてください。

- 実行中のクエリから参照されているメタデータオブジェクト。
- Paimon の `CachingCatalog`（`paimon.cache-enabled` を明示的に設定した場合）など、コネクタ SDK のキャッシュ。
- キャッシュへの格納前に発生する、単一の大きなメタデータのロード時および実体化時のメモリ使用量のピーク。
- 管理対象の Catalog 所有者とは別に作成され、システムテーブルに表示されない FE 内部のキャッシュ。

### 症状別の対処方法 {#symptom-reference}

| 症状 | クエリ | 解釈 | 対応 |
|---|---|---|---|
| FE ヒープの使用量が多く、予約量の合計が `external_meta_cache_max_weight` に近い | 手順 1 | 管理対象キャッシュが FE 全体の上限に達している | FE の上限または最大の Catalog の上限を下げるか、FE のヒープを増やす |
| FE ヒープの使用量が多いが、予約量の合計は少ない | 手順 1 | 負荷の原因は割り当て上限の対象外にある | 手順 6 に従う |
| 一つの Catalog が `meta.cache.max-weight` に近いか、一台の FE 上で大幅に大きい | 手順 2 | ワーキングセットが割り当てられた容量を超えている | ヒープに余裕があれば上限を上げるか、Catalog 内にエントリごとの上限を追加する |
| `weight_reject_count` が `budget_exceeded` を理由に増え続ける | 手順 3 | オブジェクトはロードされるが保持されず、後で再ロードされる | 割り当て上限を上げるか、競合するエントリの上限を下げる |
| `weight_reject_count` が `entry_too_large` を理由に増え続ける | 手順 3 | 単一のオブジェクトがエントリの上限を超えている | エントリの上限を上げるか、それらのオブジェクトをキャッシュせずに提供することを許容する |
| `weight_reject_count` が `incomplete_estimate` を理由に増え続ける | 手順 3 | オブジェクトのサイズを確実に推定できず、キャッシュされない | 割り当て上限を変更しても改善しない。キャッシュされなくてもクエリは成功する |
| `estimated_weight` が `max_weight` に張り付き、ヒット率が低い | 手順 3 | エントリが割り当て上限内で頻繁に入れ替わっている | エントリの上限を上げるか、TTL を短くしてワーキングセットを縮小する |

<!-- Knowledge Type: Behavior Description -->
<!-- Applicable Scenarios: Limits of estimated memory accounting -->
## 注意事項 {#caveats}

- `max-weight` は、キャッシュに保持する推定メモリ量について、格納を許可するかどうかを決めるための上限です。推定にはデータ構造の定数とペイロードのカウンターを使用しますが、実行中の JVM における正確なメモリ配置は再現しません。この値は OS の RSS ではなく、FE ヒープと GC の監視に代わるものでもありません。
- キャッシュ内の値は、削除、有効期限切れ、または無効化が発生するまで強参照によって保持されます。メタデータキャッシュがワーキングセットに応じて増え続けてはならない場合は、割り当て上限を設定してください。
- Catalog クライアント、FileIO インスタンス、スレッドプールなどの共有ランタイム基盤は、どのエントリにも計上されません。
- 複数の物理キャッシュが一つの `<entry>` トークンを共有し、その結果として一つのエントリ上限を共有する場合があります。たとえば、二つの Iceberg `partition_view` キャッシュと三つの ADBC `metadata` キャッシュが該当します。
- 推定が不完全なオブジェクトはキャッシュされません。エントリのヒット率が低く、同時に `incomplete_estimate` による拒否が発生している場合、そのオブジェクトタイプに対してキャッシュは有効に機能していません。
- 新しく送信された DDL プロパティでは、既知のエンジンに属する未知の `max-weight` キーが厳密に拒否されます。以前または以後のバージョンで永続化された未知のキーは、アップグレード後も Catalog を初期化できるよう許容されます。

<!-- Knowledge Type: Architecture Decision -->
<!-- Applicable Scenarios: Planning metadata-cache memory across Catalogs -->
## ベストプラクティス {#best-practices}

1. まず FE 全体の上限を設定し、複数の Catalog の合計が無制限に増えないようにします。
2. FE を共有する大規模な本番用 Catalog には、Catalog ごとの上限を追加します。
3. 使用量の大部分を占めるエントリにのみ、エントリごとの上限を追加します。すべてのエントリに個別の設定は必要ありません。
4. JVM ヒープの大部分を外部メタデータキャッシュに割り当てず、クエリ計画やほかの FE キャッシュのためのヒープを十分に確保します。
5. `budget_exceeded` による拒否の後に同じオブジェクトが繰り返しロードされる場合は、割り当て上限を上げるか、競合するエントリの上限を下げます。
6. FE ごとのヒープサイズが異なる場合は割合を使用します。すべての FE で同じバイト数の上限が必要な場合は、固定サイズを使用します。
