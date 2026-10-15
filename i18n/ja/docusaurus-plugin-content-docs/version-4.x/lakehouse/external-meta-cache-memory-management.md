---
{
    "title": "外部メタデータキャッシュのメモリ管理",
    "language": "ja",
    "description": "Hive、Iceberg、Paimon の外部メタデータキャッシュが使用する FE ヒープを、Doris 4.1.4 の FE、Catalog、エントリ単位のクォータで制限します。",
    "keywords": ["外部メタデータキャッシュ", "meta.cache.max-weight", "external_meta_cache_max_weight", "FE メモリ", "catalog_meta_cache_statistics", "Hive Iceberg Paimon メタデータキャッシュ"]
}
---

Doris 4.1.4 以降では、一部の外部メタデータキャッシュを、保持メモリの推定量に基づいて制限できます。これにより、大きなテーブル、単一の Catalog、または複数の Catalog のメタデータが FE ヒープを継続的に消費することを防げます。

この機能は、次のような場合に使用します。

- Hive テーブルのパーティション数が多く、パーティションプルーニング用の構造が大きくなる場合。
- Iceberg のテーブルメタデータ、スナップショット、またはマニフェストが大きい場合。
- Paimon のテーブル世代またはスナップショットに、保持されるメタデータやパーティション投影が大量に含まれる場合。
- 一つの FE が複数の Catalog を提供しており、単一の Catalog がメタデータキャッシュのメモリを占有しないようにする必要がある場合。

:::caution
これらの制限が対象とするのは、このドキュメントに記載された、推定器に対応するキャッシュエントリだけです。FE ヒープ全体の厳密な上限ではありません。Catalog クライアントやスレッドプールなど、共有される実行時の基盤は、個々のキャッシュエントリに完全には計上されません。一方、認証コンテキストや Iceberg FileIO の設定・認証情報など、エントリが保持する所有者固有の有界なペイロードは、保守的に計上されます。推定器に対応していないメタデータキャッシュは、このクォータの対象外です。
:::

<!-- Knowledge Type: Operational Steps -->
<!-- Applicable Scenarios: Configuring FE, Catalog, and entry memory limits -->
## クイックスタート

前提条件:

- 既存の Hive、Iceberg、または Paimon Catalog。
- FE 設定と対象の Catalog を更新する権限。
- すべての FE で Doris 4.1.4 以降を使用していること。

### 1. FE 全体の制限を設定する

すべての FE の `fe.conf` に次を設定します。

```properties
external_meta_cache_max_weight = 10%
```

これにより、その FE 上で管理対象となるすべての外部メタデータキャッシュが使用できるメモリは、合計で JVM の最大ヒープの 10% 以下になります。この設定を変更した後は FE を再起動してください。

固定サイズも指定できます。

```properties
external_meta_cache_max_weight = 8GB
```

### 2. 単一の Catalog を制限する

次の例では、`iceberg_ctl` 内の管理対象メタデータキャッシュの合計を 4 GB に制限します。

```sql
ALTER CATALOG iceberg_ctl SET PROPERTIES (
    "meta.cache.max-weight" = "4GB"
);
```

変更後、Doris はこの Catalog の初期化済みキャッシュグループをクリアし、次回アクセス時に新しい設定で再作成します。

:::tip
`meta.cache.max-weight` は、FE 全体の制限が設定されていない場合も機能します。その場合は、この Catalog のみが制限され、FE 上の全 Catalog の合計は制限されません。
:::

### 3. 個々のキャッシュエントリを制限する

次の例では、Catalog の制限と、Iceberg の各エントリの制限を設定します。

```sql
ALTER CATALOG iceberg_ctl SET PROPERTIES (
    "meta.cache.max-weight" = "4GB",
    "meta.cache.iceberg.table.max-weight" = "1GB",
    "meta.cache.iceberg.snapshot.max-weight" = "2GB",
    "meta.cache.iceberg.manifest.enable" = "true",
    "meta.cache.iceberg.manifest.max-weight" = "1GB"
);
```

`table`、`snapshot`、`manifest` エントリの上限は、それぞれ 1 GB、2 GB、1 GB です。合計使用量は Catalog の上限である 4 GB を超えられず、Catalog には FE 全体の制限も適用されます。

<!-- Knowledge Type: Configuration Parameters -->
<!-- Applicable Scenarios: Understanding how FE, Catalog, and entry limits combine -->
## クォータの階層

メモリ制限は 三つのレベルで設定できます。

| レベル | 設定場所 | 設定項目 | 形式 | デフォルト | 対象範囲 |
|---|---|---|---|---|---|
| FE | `fe.conf` | `external_meta_cache_max_weight` | 固定サイズ、または JVM の最大ヒープに対する割合 | 未設定（`0`）。FE 全体のクォータなし | 現在の FE 上のすべての管理対象外部メタデータキャッシュ |
| Catalog | Catalog プロパティ | `meta.cache.max-weight` | 固定サイズ。正の値が必要 | 未設定。Catalog クォータなし | 現在の Catalog 内のすべての管理対象エントリ |
| キャッシュエントリ | Catalog プロパティ | `meta.cache.<engine>.<entry>.max-weight` | 固定サイズ。`0` はエントリを無効化 | 未設定。親の制限のみ適用 | 一つのエンジンの 一つのキャッシュエントリ |

実効上限は、設定されたすべての上限のうち最も小さい値です。

| FE の制限 | Catalog の制限 | エントリの制限 | 動作 |
|---|---|---|---|
| 未設定 | 未設定 | 未設定 | メモリの計上は無効。既存の件数と TTL によるポリシーを引き続き使用 |
| 設定済み | 未設定 | 未設定 | すべての管理対象エントリで FE クォータを共有 |
| 未設定 | 設定済み | 未設定 | Catalog 内の管理対象エントリで Catalog クォータを共有 |
| 未設定 | 未設定 | 設定済み | そのエントリのみを制限。FE または Catalog 全体の合計制限はなし |
| 設定済み | 設定済み | 設定済み | 三つのレベルすべてが適用され、最も厳しい制限が優先 |

設定する階層は、次のルールを満たす必要があります。

- Catalog の上限は、FE 全体の上限を超えられません。
- エントリの上限は、設定済みの直接の親の上限を超えられません。
- FE 間で構成が異なる場合、follower は自身の FE 上限に合わせて受け入れをさらに制限します。

階層が無効な場合、プロパティを黙って無視する代わりに、`CREATE CATALOG` または `ALTER CATALOG` が失敗します。

<!-- Knowledge Type: Configuration Parameters -->
<!-- Applicable Scenarios: Writing size and percentage values -->
## 値の形式

固定サイズには、大文字と小文字を区別しない次の 二進単位を使用できます。

```text
B, KB, MB, GB, TB, PB
```

たとえば `512MB` や `4GB` を指定できます。

固定サイズの値には整数を使用する必要があります。`12.5%` のような小数値を使用できるのは、割合だけです。

`external_meta_cache_max_weight` だけが、`10%` や `12.5%` のような割合を受け付けます。割合は各 FE の JVM 最大ヒープから計算されるため、ヒープサイズが異なる FE には異なるバイト数の上限が適用されます。

ゼロの意味は、レベルによって異なります。

| 設定項目 | `0` の意味 |
|---|---|
| `external_meta_cache_max_weight` | キャッシュは無効にせず、FE 全体のクォータを無効化 |
| `meta.cache.max-weight` | 無効な値。Catalog の上限は正の値が必要 |
| `meta.cache.<engine>.<entry>.max-weight` | そのキャッシュエントリを無効化。エントリ単位の上書き設定は削除しない |

`0%` は無効です。FE 全体のクォータを無効にするには、`0` を指定してください。

<!-- Knowledge Type: Capability Matrix -->
<!-- Applicable Scenarios: Choosing which cache entries to limit -->
## 対応するキャッシュエントリ

このバージョンで `max-weight` を指定できるのは、次のエントリだけです。

| Catalog/エンジン | エントリ | プロパティ | キャッシュされるデータ |
|---|---|---|---|
| Hive | `partition_values` | `meta.cache.hive.partition_values.max-weight` | パーティション名、値、プルーニング用インデックス、ソート済み範囲 |
| Iceberg | `table` | `meta.cache.iceberg.table.max-weight` | Iceberg テーブルメタデータと、保持されるメタデータ世代 |
| Iceberg | `snapshot` | `meta.cache.iceberg.snapshot.max-weight` | スナップショット、パーティション投影、および保持されるテーブル世代 |
| Iceberg | `manifest` | `meta.cache.iceberg.manifest.max-weight` | 解析済みの DataFile と DeleteFile のリスト。このエントリはデフォルトで無効であり、`enable=true` も必要 |
| Paimon | `table` | `meta.cache.paimon.table.max-weight` | 保持される Paimon テーブルメタデータとその世代 |
| Paimon | `snapshot` | `meta.cache.paimon.snapshot.max-weight` | スナップショット、スキーマ世代、パーティション投影 |

次の一般的なエントリは引き続き件数で制限され、`max-weight` は指定できません。

- Hive の `schema`、`partition`、`file`。
- Iceberg の `schema`、`view`。
- Paimon の `schema`。
- 既存の Hudi、MaxCompute、Doris Catalog のキャッシュエントリ。

対応していないエントリに `max-weight` を設定すると、Catalog の作成または変更が失敗します。たとえば、次の設定は無効です。

```sql
ALTER CATALOG hive_ctl SET PROPERTIES (
    "meta.cache.hive.file.max-weight" = "1GB"
);
```

:::note
HMS Catalog は、Hive、Hudi、Iceberg のメタデータキャッシュに振り分けることができます。Iceberg テーブルを含む場合、同じ HMS Catalog で `meta.cache.iceberg.table.max-weight`、`meta.cache.iceberg.snapshot.max-weight`、`meta.cache.iceberg.manifest.max-weight` を使用できます。
:::

<!-- Knowledge Type: Operational Steps -->
<!-- Applicable Scenarios: Typical Hive, Iceberg, and Paimon limit configurations -->
## 例

### Catalog の制限のみを使用する

FE 全体の制限がない場合は、Catalog を個別に制限します。

```sql
ALTER CATALOG hive_prod SET PROPERTIES (
    "meta.cache.max-weight" = "6GB"
);

ALTER CATALOG iceberg_ad_hoc SET PROPERTIES (
    "meta.cache.max-weight" = "2GB"
);
```

各 Catalog の上限はそれぞれ 6 GB と 2 GB ですが、FE 上での合計使用量には共通の上限がありません。

### 大きな Hive パーティション構造を制限する

```sql
ALTER CATALOG hive_ctl SET PROPERTIES (
    "meta.cache.max-weight" = "4GB",
    "meta.cache.hive.partition_values.max-weight" = "3GB"
);
```

主に、パーティション数の多い Hive テーブルのために作成されるパーティションプルーニング用の構造を制限します。Hive のファイルリストキャッシュは、このクォータには含まれません。

### Paimon のテーブル世代とスナップショットを制限する

```sql
ALTER CATALOG paimon_ctl SET PROPERTIES (
    "meta.cache.max-weight" = "2GB",
    "meta.cache.paimon.table.max-weight" = "512MB",
    "meta.cache.paimon.snapshot.max-weight" = "1536MB"
);
```

Paimon では、`table` と `snapshot` の両エントリに対して、独立したメモリ制限を設定できます。この例では、Catalog の上限である 2 GB の範囲内で、保持されるテーブル世代に最大 512 MB、スナップショットの投影に最大 1536 MB を割り当てます。

### 既存のキャッシュプロパティとの互換性

既存の Catalog との互換性のため、Iceberg と Paimon の `table.enable`、`table.ttl-second`、`table.capacity` の値は、対応するスナップショットエントリのプロパティが明示的に設定されていない場合、そのデフォルト値としても使用されます。例:

```sql
ALTER CATALOG paimon_ctl SET PROPERTIES (
    "meta.cache.paimon.table.ttl-second" = "600",
    "meta.cache.paimon.snapshot.max-weight" = "1536MB"
);
```

この場合、`table.ttl-second` は Paimon のテーブルオブジェクトキャッシュとスナップショットキャッシュの両方の TTL を制御し、`snapshot.max-weight` はスナップショットキャッシュだけを制限します。

`max-weight` には互換性のための対応付けは適用されません。推定器に対応する実際のエントリ名を使用してください。

- Iceberg のテーブルオブジェクトには `meta.cache.iceberg.table.max-weight`。
- Iceberg のスナップショットには `meta.cache.iceberg.snapshot.max-weight`。
- Paimon のテーブル世代には `meta.cache.paimon.table.max-weight`。
- Paimon のスナップショットには `meta.cache.paimon.snapshot.max-weight`。

### メモリ制限と TTL ポリシーを組み合わせる

メモリ制限は、`enable`、`ttl-second`、`capacity` と併用できます。

```sql
ALTER CATALOG iceberg_ctl SET PROPERTIES (
    "meta.cache.iceberg.snapshot.enable" = "true",
    "meta.cache.iceberg.snapshot.ttl-second" = "1800",
    "meta.cache.iceberg.snapshot.capacity" = "1000",
    "meta.cache.iceberg.snapshot.max-weight" = "2GB"
);
```

`max-weight` が有効な場合、退避はメモリの重みで制限され、`capacity` は同時に最大エントリ数を制限しなくなります。ただし、`capacity=0` は引き続きキャッシュを無効にするため、メモリ制限を使用するときはゼロより大きい値にしてください。

<!-- Knowledge Type: Behavior Description -->
<!-- Applicable Scenarios: Understanding admission rejection and its effect on queries -->
## 制限に達したときの動作

キャッシュミスが発生すると、Doris は次の処理を行います。

1. 外部ソースからメタデータを読み込みます。
2. 候補オブジェクトを固定または実体化し、保持メモリを推定します。
3. FE、Catalog、エントリのクォータをアトミックに確認します。
4. クォータが不足している場合、同じエントリから古いデータを退避して再試行します。ローカルでの退避だけでは予約を満たせない場合は、兄弟エントリからの回収をスケジュールします。FE 全体の不足であれば、他の Catalog からの回収も対象になります。
5. それでもキャッシュへの受け入れが失敗する場合、読み込んだオブジェクトをキャッシュせず、現在のリクエストに返します。

したがって、利用可能なクォータより大きい新しいオブジェクトでも、通常はキャッシュのクォータが原因でクエリが失敗することはありません。ただし、そのオブジェクトは保持されないため、以降のアクセスで再読み込みが発生し、クエリ計画のレイテンシーが増える可能性があります。

保持されるテーブル形式が未対応である、Iceberg メタデータの遅延読み込みが続いている、準備に失敗した、または計上処理の作業量上限を超えたなどの理由で、信頼できる完全な推定値を算出できない場合も、過少に計上する代わりにキャッシュへの保存をスキップします。推定器は、汎用的なリフレクションによるオブジェクトグラフの走査や、コンテナーのサンプリングを行いません。Iceberg は、スナップショットメタデータがすでに読み込まれていることを確認するためにだけ、失敗時は受け入れない方式で非公開フィールドを 一回確認し、推定時の I/O を回避します。

:::note
ローカルでの退避は同期的に行われます。兄弟エントリからの回収は非同期のベストエフォート処理です。そのため、後続の受け入れに備えて兄弟エントリを回収している間も、現在のキャッシュミスではキャッシュせずにオブジェクトが返されることがあります。一つのエントリが共有の FE または Catalog クォータを占有しないようにする必要がある場合は、エントリ単位の制限を設定してください。
:::

スケジュールされた更新が、不完全な推定値やクォータ不足によって受け入れられない場合、Doris は以前の正常なキャッシュ済み世代を保持します。拒否された更新は公開されません。

:::caution
クォータは、オブジェクトの読み込みと準備が終わった後、キャッシュに受け入れる際に確認されます。Doris は外部ソースにアクセスする前にヒープを予約しません。そのため、リモートからの読み込みが失敗した場合や、例外的に大きなオブジェクトの構築が完了する前に FE ヒープを使い切った場合、現在のリクエストは失敗する可能性があります。この機能が制限するのは、正常に読み込んだ後に保持されるメモリです。単一のメタデータ読み込みで発生する OOM を防ぐものではありません。
:::

<!-- Knowledge Type: Operational Steps -->
<!-- Applicable Scenarios: Applying limit changes without restarting queries -->
## 設定の適用とキャッシュの更新

- `external_meta_cache_max_weight` を変更した後は、FE を再起動します。
- `meta.cache.max-weight` や `meta.cache.<engine>.<entry>.*` を含む Catalog プロパティを変更すると、Catalog の実行コンテキストがリセットされ、その Catalog が振り分けるすべてのメタデータキャッシュエンジンの初期化済みエントリがクリアされます。次回アクセス時に、新しいコンテキストと設定で再構築されます。
- 進行中のクエリは、読み込み済みのオブジェクトを使って処理を継続できます。以降のアクセスには新しい設定が適用されます。

メモリ制限が制御するのは、オブジェクトを保持するかどうかです。外部メタデータ自体は変更せず、`REFRESH CATALOG`、TTL、メタデータイベントの同期を代替するものでもありません。

<!-- Knowledge Type: Operational Steps -->
<!-- Applicable Scenarios: Troubleshooting / Performance tuning of FE heap usage -->
## メモリ圧迫の監視とトラブルシューティング

システムテーブル [`catalog_meta_cache_statistics`](../admin-manual/system-tables/information_schema/catalog_meta_cache_statistics) は、FE、Catalog、メタデータキャッシュエンジン、キャッシュエントリの組み合わせごとに一行を返します。メモリ管理に関係する列は次のとおりです。

| 列 | 意味 | 時間上の性質 |
|---|---|---|
| `MAX_WEIGHT` | エントリの実効メモリ上限（バイト単位）。`-1` は FE、Catalog、エントリのいずれの制限も適用されないことを示す | 設定値 |
| `ESTIMATED_WEIGHT` | エントリが現在予約している推定バイト数 | クエリ時点のゲージ値 |
| `WEIGHT_REJECT_COUNT` | クォータ不足または推定値が不完全なために拒否された受け入れの回数 | 現在のキャッシュインスタンスでの累積値 |
| `LAST_WEIGHT_REJECT_REASON` | 直近の拒否理由 | 最新値 |

Catalog プロパティの変更や FE の再起動によってキャッシュグループが再構築されると、累積カウンターはゼロから再開します。このテーブルには履歴が残らないため、推移が必要な場合は定期的に値を取得してください。`max_weight >= 0` の行は、メモリ管理の対象となるエントリです。上限値そのものは `fe.conf` と Catalog プロパティで設定します。

FE ヒープの使用量が多く、外部メタデータキャッシュが原因と考えられる場合は、次の手順を使用します。

### 1. 管理対象キャッシュが圧迫の原因か確認する

```sql
SELECT fe_host,
       SUM(estimated_weight) AS estimated_weight,
       SUM(weight_reject_count) AS weight_reject_count
FROM information_schema.catalog_meta_cache_statistics
WHERE max_weight >= 0
GROUP BY fe_host
ORDER BY fe_host;
```

予約量の合計を、設定済みの `external_meta_cache_max_weight` と FE ヒープと比較します。この値は、保持されるキャッシュの推定量であり、FE ヒープ全体の使用量ではありません。読み込み時の一時メモリ、件数で制限されるエントリ、コネクター SDK のキャッシュは含まれません。予約量が少ないのに FE ヒープの使用量が高いままであれば、手順 6 に進んでください。

### 2. 原因となる Catalog を特定する

```sql
SELECT fe_host, catalog_name,
       SUM(estimated_weight) AS estimated_weight,
       SUM(weight_reject_count) AS weight_reject_count
FROM information_schema.catalog_meta_cache_statistics
WHERE max_weight >= 0
GROUP BY fe_host, catalog_name
ORDER BY estimated_weight DESC;
```

各 Catalog の予約量を、その `meta.cache.max-weight` と比較します。予約量が上限に近い Catalog や、ほかの FE と比べて 一つの FE 上で大幅に大きい Catalog がないか確認してください。

### 3. キャッシュエントリまで掘り下げる

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

`estimated_weight` が `max_weight` に近いエントリは、その Catalog の使用量を占めています。`weight_reject_count` が増加している場合は、クォータが逼迫しています。オブジェクトを読み込み、古いデータを退避しても保持できず、以降のアクセスで再読み込みが発生します。`last_weight_reject_reason` で、直近の拒否がクォータ不足によるものか、不完全な推定値によるものかを確認できます。不完全な推定値はクォータの問題ではなく、オブジェクトはキャッシュされずにリクエストに返されます。

### 4. 対処方法を選ぶ

| 目的 | 設定項目 | 適用タイミング |
|---|---|---|
| 一つの FE の合計を制限する | `external_meta_cache_max_weight`（`fe.conf` 内） | FE の再起動後 |
| 一つの Catalog を個別に制限する | `meta.cache.max-weight` | `ALTER CATALOG` 後の次回アクセス時 |
| 対応する 一つのエントリによる占有を防ぐ | `meta.cache.<engine>.<entry>.max-weight` | `ALTER CATALOG` 後の次回アクセス時 |
| キャッシュよりも新しいメタデータを優先する | `meta.cache.<engine>.<entry>.ttl-second` を小さくするか、`meta.cache.<engine>.<entry>.enable` を `false` に設定する | `ALTER CATALOG` 後の次回アクセス時 |

### 5. 変更後の動作

- Catalog プロパティを変更すると、その Catalog の初期化済みキャッシュグループがクリアされ、必要になったときに再構築されます。システムテーブルのカウンターはゼロから再開します。
- 進行中のクエリは、読み込み済みのオブジェクトを引き続き使用します。
- クォータを小さくするとキャッシュミスが増えます。ワーキングセットが再び収まるまで、外部メタデータの読み込みが増え、計画のレイテンシーが高くなると見込んでください。

### 6. この仕組みでは解決できないこと

計上された重みが小さいのに FE ヒープの使用量が高いままであれば、圧迫の原因はクォータの対象外にあります。`max-weight` をさらに下げても改善しません。代わりに、次を調べてください。

- Hive の `schema`、`partition`、`file` など、件数で制限されるエントリ。`capacity` と `ttl-second` を調整します。
- 実行中のクエリから参照され続けているメタデータオブジェクト。
- `io.manifest.cache-enabled` で制御する Iceberg のマニフェストキャッシュや、Paimon の `CachingCatalog`（`paimon.cache-enabled` で制御）など、コネクター SDK のキャッシュ。
- 単一の大きなメタデータを読み込む際、受け入れ前に発生する読み込みと実体化のメモリ使用量のピーク。

### 症状別の対処

| 症状 | 確認する手順 | 解釈 | 対処 |
|---|---|---|---|
| FE ヒープの使用量が高く、予約量の合計が `external_meta_cache_max_weight` に近い | 手順 1 | 管理対象キャッシュが FE 全体の上限に達している | FE の上限または最大の Catalog の上限を下げるか、FE のヒープを増やす |
| FE ヒープの使用量は高いが、予約量の合計は少ない | 手順 1 | 圧迫の原因はクォータの対象外にある | 手順 6 に従う |
| 一つの Catalog が `meta.cache.max-weight` に近いか、一つの FE 上で大幅に大きい | 手順 2 | ワーキングセットが割り当てられた量を超えている | ヒープに余裕があれば上限を上げるか、Catalog 内にエントリ単位の制限を追加する |
| `weight_reject_count` が増え続け、理由がクォータ不足である | 手順 3 | オブジェクトは読み込まれるが保持されず、後で再読み込みされる | クォータを上げるか、競合するエントリの上限を下げる |
| `weight_reject_count` が増え続け、理由が不完全な推定値である | 手順 3 | オブジェクトを信頼できる形で推定できず、キャッシュされない | クォータを変更しても改善しない。クエリはキャッシュせずに引き続き成功する |
| `estimated_weight` が `max_weight` に張り付き、ヒット率が低い | 手順 3 | エントリ内で入れ替わりが頻発している | エントリの上限を上げるか、TTL を短くしてワーキングセットを小さくする |

<!-- Knowledge Type: Behavior Description -->
<!-- Applicable Scenarios: Limits of estimated memory accounting -->
## 注意事項

- `max-weight` は、保持されるキャッシュの受け入れに使用する推定予算です。型ごとの計算式では、オフラインで調整された切り上げ済みの構造定数と、読み込み時に数えたペイロードを使用します。稼働中の JVM やサードパーティ SDK の正確なメモリ配置はモデル化しません。結果は OS の RSS ではなく、FE ヒープや GC の監視に代わるものでもありません。
- 共有される実行時の基盤は、個々のエントリに完全には計上されません。一方、エントリが保持する、所有者固有の有界な認証コンテキスト、FileIO 設定、ストレージ認証情報、変換ペイロードは保守的に含めます。
- 重みで制限されるエントリはソフト値を使用します。予約レコードにはキー、世代、重みが残りますが、キャッシュされた値への強参照は保持しません。ヒープが逼迫すると、TTL の期限が切れる前やクォータがいっぱいになる前に JVM が値を回収する場合があります。Doris は対応する予約を解放し、次回アクセス時に値を再読み込みします。
- 大きなオブジェクトは、読み込み、更新、置換の際にのみ推定されます。算出済みの重みは公開された世代とともに保持されるため、キャッシュヒット時にオブジェクトの内容を再走査しません。
- Iceberg のテーブルまたはスナップショットを初めて受け入れる際、現在のスナップショットのマニフェストリストが実体化され、初回の読み込みレイテンシーが増える場合があります。
- 新たに指定する DDL プロパティでは、エンジン名、エントリ名、オプションの誤記は厳密に拒否されます。以前から保存されているプロパティを実行時に解析できない場合は、アップグレードした Catalog を初期化できるよう、警告して無視します。
- Iceberg Catalog で Doris のメモリ管理が有効な場合、Iceberg SDK のマニフェスト内容キャッシュは Doris のクォータ対象外であるため、自動的には有効になりません。明示的な `io.manifest.cache-enabled` 設定が優先されます。
- Paimon Catalog で Doris のメモリ管理が有効な場合、上限のない別のメタデータキャッシュを避けるため、Paimon SDK レベルの `CachingCatalog` はデフォルトで無効になります。明示的な `paimon.cache-enabled` 設定が優先されます。
- Iceberg または Paimon をアップグレードした後は、FE の SDK JAR を個別に置き換えず、Doris のリリースに同梱された SDK バージョンを使用してください。

<!-- Knowledge Type: Architecture Decision -->
<!-- Applicable Scenarios: Planning metadata-cache memory across Catalogs -->
## ベストプラクティス

1. まず FE 全体の制限を設定し、複数の Catalog の合計使用量が無制限に増えないようにします。
2. FE を共有する大規模な本番 Catalog には、Catalog 単位の制限を追加します。
3. エントリ単位の制限は、使用量を占めるエントリにだけ追加します。すべてのエントリに設定する必要はありません。
4. JVM ヒープの大半を外部メタデータキャッシュに割り当てず、クエリ計画やほかの FE キャッシュのために十分なヒープを確保します。
5. 受け入れを拒否された同じオブジェクトが繰り返し再読み込みされる場合は、クォータを増やすか、競合するエントリの上限を下げます。
6. FE のヒープサイズが異なる場合は割合を使用します。すべての FE で同じバイト数の上限が必要な場合は固定サイズを使用します。
