---
{
    "title": "File Cache の設定と使用ガイド（コンピュートとストレージの分離）",
    "sidebar_label": "File Cache の設定",
    "language": "ja",
    "description": "コンピュートとストレージを分離したモードの Doris について、クエリ性能の向上とオブジェクトストレージのコスト削減に役立つ File Cache の設定、インデックスのみのキャッシュ書き込み、クエリ単位のキャッシュ制御、キャッシュのウォームアップと退避、ヒット率の監視、TTL ポリシーを説明します。",
    "keywords": ["Doris file cache", "compute-storage decoupled cache", "file cache", "index-only cache writes", "cache warmup", "peer cache read", "cache quota", "file_cache_query_limit_bytes", "TTL cache", "LRU", "cache hit rate", "object storage acceleration"]
}
---

<!-- Knowledge type: Architecture and design decisions -->
<!-- Applicable scenarios: Compute-storage decoupled deployment / Query performance optimization / Object storage cost optimization -->

コンピュートとストレージを分離したモードでは、データはリモートのオブジェクトストレージ（S3 や HDFS など）に保存されます。Doris は BE ノードのローカルディスクを File Cache 層として使用し、複数キューによる LRU（Least Recently Used）方式でキャッシュ領域を効率的に管理します。インデックスとメタデータのアクセス経路は特に最適化されており、頻繁に使われるデータのキャッシュヒット率を最大化します。

複数のコンピュートグループを使用する場合、Doris の**キャッシュウォームアップ**機能を使うと、新しいコンピュートグループの起動時に指定したテーブルやパーティションのデータを先行して取得できます。これによりローカルキャッシュをすばやく構築し、最初のクエリの性能を向上させます。[ピアキャッシュ読み取り](./file-cache-peer-read)を有効にすると、ローカルキャッシュにないブロックをリモートストレージから取得する前に、別の BE（ほかのコンピュートグループの BE を含む）のキャッシュから取得します。

## File Cache の役割 {#the-role-of-file-cache}

<!-- Knowledge type: Architecture and design decisions -->

コンピュートとストレージを分離したモードでリモートストレージにアクセスすると、通常、次のような問題が生じます。

| 問題 | 説明 |
|---|---|
| アクセス遅延が大きい | オブジェクトストレージのアクセス遅延はローカルディスクよりはるかに大きく、特に同時実行数が多い場合に顕著です |
| QPS と帯域幅の制限 | オブジェクトストレージには通常、QPS の上限と帯域幅の制約があり、高い並行度でクエリを実行するとボトルネックになります |
| 従量課金によるコスト | オブジェクトストレージはリクエスト数とデータ転送量に応じて課金されるため、頻繁なアクセスは運用コストを増やします |

頻繁に使われるデータをローカルディスクにキャッシュすることで、Doris はクエリの遅延とオブジェクトストレージへの直接リクエストを大幅に減らし、コストを削減できます。

### キャッシュするファイルの種類 {#cached-file-types}

Doris の File Cache は主に次の種類のファイルをキャッシュします。

- **Segment データファイル**: Doris の内部テーブルデータの基本的な保存単位です。これらのファイルをキャッシュすると、データの読み取りとクエリの性能が向上します。
- **転置インデックスファイル**: クエリのフィルタ処理を高速化するために使用します。キャッシュすることで、条件を満たすデータをすばやく特定でき、複雑なクエリにも対応できます。

## キャッシュの設定 {#cache-configuration}

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenarios: Pre-deployment configuration for compute-storage decoupled mode / BE parameter tuning -->

Doris では、BE の設定ファイルにある次のパラメータで File Cache の動作を制御します。

### File Cache の有効化 {#enabling-file-cache}

| パラメータ | デフォルト | 説明 |
|---|---|---|
| `enable_file_cache` | `true` | File Cache 機能を有効にするかどうかを指定します。バージョン 4.1.5 以降はデフォルトで有効です（以前は `false`）。コンピュートとストレージを分離したモードでは、BE が常に有効にします。 |

:::caution

`file_cache_path` のデフォルトは、BE のデプロイ先パスにあるストレージディレクトリです。`total_size` を指定しない場合、キャッシュはディスク使用率が 85%～88% に達するまで増える可能性があります。上限を設けるには `total_size` を設定してください。

:::

同名のセッション変数も有効にする必要があります。設定値とアップグレード時のデフォルト値については、[セッション変数](../../sql-manual/basic-element/session-variables.md#enable_file_cache)を参照してください。

### インデックスのみを書き込むキャッシュポリシーの設定 {#configuring-index-only-cache-writes}

ローカルキャッシュの容量が限られ、クエリ性能がインデックスと Segment メタデータに大きく依存する場合は、インデックスのみを書き込むポリシーを有効にできます。このポリシーは、データ取り込み、Schema Change、Compaction などの書き込み経路が File Cache に**能動的に書き込む**内容を制限します。キャッシュミス後のクエリ側のキャッシュ充填やキャッシュウォームアップには影響しません。

Doris には、全体に適用するポリシーと、Compaction 専用のポリシーがあります。

| パラメータ | 型 | デフォルト | 適用範囲 | 説明 |
|---|---|---|---|---|
| `enable_file_cache_write_index_file_only` | Boolean | `false` | コンピュートとストレージを分離したモードでのすべての rowset 書き込み。データ取り込み、Schema Change、Cumulative Compaction、Base Compaction を含む | **Doris 4.0 系では 4.0.8 以降、4.1 系では 4.1.4 以降でサポートされます。** `true` に設定すると、Segment データは能動的にキャッシュされません。Segment を閉じた後、そのフッターと内部インデックスの範囲は同期的にプリロードされ、独立した転置インデックスファイルは引き続き File Cache に書き込まれます。このパラメータは Compaction 専用のパラメータより優先されます |
| `enable_file_cache_write_base_compaction_index_only` | Boolean | `false` | Base Compaction | 既存の Base Compaction ポリシーが出力を File Cache に書き込むと決定した場合に限り、Segment ファイルの能動的なキャッシュを防ぎ、独立した転置インデックスファイルのキャッシュは維持します。通常はキャッシュを経由しない Base Compaction の出力を、このパラメータによってキャッシュすることはありません |
| `enable_file_cache_write_cumu_compaction_index_only` | Boolean | `false` | Cumulative Compaction | Cumulative Compaction の出力が File Cache に書き込まれる場合、Segment ファイルの能動的なキャッシュを防ぎ、独立した転置インデックスファイルのキャッシュは維持します |

書き込み経路では、次の優先順位でキャッシュの動作が決まります。

1. `enable_file_cache=false` が最優先です。Segment フッターと内部インデックスのプリロード、独立した転置インデックスの書き込みを含む、File Cache へのすべての書き込みが無効になります。
2. `enable_file_cache=true` かつ `enable_file_cache_write_index_file_only=true` の場合、全体に適用するインデックスのみのポリシーが有効になります。Compaction 専用のパラメータは最終的な動作に影響しません。適応型書き込み、Compaction の保持ポリシー、キャッシュヒット率のしきい値、リクエスト単位の `write_file_cache` 設定によって Segment データが能動的にキャッシュされることはありません。インデックス関連の内容は、前述の全体ポリシーに従って書き込まれます。
3. 全体に適用するインデックスのみのポリシーが無効の場合、Base/Cumulative Compaction 専用のパラメータは、**すでにキャッシュ対象に選ばれた**該当する種類の出力だけをさらに制限します。ほかの書き込み場面やクエリの読み取り経路には影響しません。
4. インデックスのみのパラメータがすべて `false` の場合、既存の能動的なキャッシュ書き込み、適応型書き込み、Compaction 出力の保持動作は変わりません。

:::caution

Compaction 専用のパラメータは、独立した転置インデックスファイルと Segment ファイルを区別するだけです。全体に適用するインデックスのみのポリシーが行う Segment フッターと内部インデックス範囲のプリロードは実行しません。独立した転置インデックスに加え、Segment の内部インデックスとメタデータも能動的に保持するには、`enable_file_cache_write_index_file_only` を使用してください。

:::

#### 全体に適用するインデックスのみのポリシーを有効にする {#enabling-the-global-index-only-policy}

すべての BE ノードの `be.conf` に、次の設定を追加します。

```properties
enable_file_cache=true
enable_file_cache_write_index_file_only=true
enable_file_cache_write_base_compaction_index_only=false
enable_file_cache_write_cumu_compaction_index_only=false
```

想定される動作は次のとおりです。

| 場面 | File Cache に能動的に書き込まれる内容 |
|---|---|
| データ取り込み、Schema Change、Cumulative Compaction、Base Compaction | Segment データは能動的に書き込まれず、Segment フッターと内部インデックスの範囲が同期的にプリロードされます。独立した転置インデックスファイルは書き込まれます |
| クエリによるデータページの読み取り | 動作は変わりません。キャッシュミス後も、既存の読み取り経路のルールに従って Segment データをキャッシュに格納できます |
| キャッシュウォームアップ | 動作は変わりません |
| Packed File | パックされた小さな Segment ファイルはファイル全体をキャッシュしません。パックされた独立した小さなインデックスファイルは、引き続きファイル全体をキャッシュできます |

全体に適用するインデックスのみのポリシーでは、Segment フッターと内部インデックスの範囲は同期読み取りを通じてキャッシュに書き込まれ、`enable_flush_file_cache_async` の制御を受けません。独立した転置インデックスファイルには、既存の直接書き込みと非同期フラッシュの動作が引き続き適用されます。

#### Compaction の出力だけを制限する {#restricting-only-compaction-output}

データ取り込みや Schema Change の能動的なキャッシュ書き込みを変えずに、Compaction 出力によるキャッシュへの負荷を減らすには、次のように設定します。

```properties
enable_file_cache=true
enable_file_cache_write_index_file_only=false
enable_file_cache_write_base_compaction_index_only=true
enable_file_cache_write_cumu_compaction_index_only=true
```

Cumulative Compaction はデフォルトで出力をキャッシュに書き込みます。そのため、対応するパラメータを有効にすると Segment ファイルをスキップし、独立した転置インデックスファイルだけを保持します。Base Compaction は、まず `enable_file_cache_keep_base_compaction_output` と入力 rowset のキャッシュヒット率を使って出力をキャッシュするか判断します。Base Compaction のインデックスのみのパラメータは、その判断が行われた後に書き込み内容を制限します。

#### 推奨事項 {#recommendations}

- これらのパラメータは BE パラメータです。ノード間で異なるキャッシュ書き込みポリシーが使われないよう、同じコンピュートグループのすべての BE ノードで設定を統一してください。
- 「インデックスのみ」は、File Cache に Segment データが一切含まれないという意味ではありません。クエリ側でキャッシュミスしたデータページを読み取ると、Segment データがキャッシュに格納される場合があります。
- このポリシーはデータ取り込みや Compaction によるキャッシュ汚染を減らせますが、書き込み直後に大量のデータをスキャンすると、リモートストレージからの読み取りが増える可能性があります。本番環境のクエリ負荷で性能を測定し、SQL Profile で Index キューの退避とインデックス読み取りの指標を監視してください。

### キャッシュパスとサイズの設定 {#configuring-cache-paths-and-size}

```plaintext
file_cache_path  Default: the storage directory under the BE deployment path
```

このパラメータは JSON 配列です。各要素でキャッシュパスとその属性を指定します。使用できるフィールドは次のとおりです。

| フィールド | 説明 |
|---|---|
| `path` | キャッシュファイルの保存先パス |
| `total_size` | このパスのキャッシュ総容量（バイト単位） |
| `ttl_percent` | TTL キューに割り当てる領域の割合 |
| `normal_percent` | Normal キューに割り当てる領域の割合 |
| `disposable_percent` | Disposable キューに割り当てる領域の割合 |
| `index_percent` | Index キューに割り当てる領域の割合 |
| `storage` | キャッシュのストレージ種別。`disk`（デフォルト）または `memory` |

**設定例:**

- 単一パスの設定:

    ```json
    [{"path":"/path/to/file_cache","total_size":21474836480}]
    ```

- 複数パスの設定:

    ```json
    [{"path":"/path/to/file_cache","total_size":21474836480},{"path":"/path/to/file_cache2","total_size":21474836480}]
    ```

- メモリストレージの設定:

    ```json
    [{"path": "xxx", "total_size":53687091200, "storage": "memory"}]
    ```

### キャッシュの自動クリア {#automatic-cache-clearing}

| パラメータ | デフォルト | 説明 |
|---|---|---|
| `clear_file_cache` | `false` | BE の再起動時にキャッシュデータを自動的にクリアするかどうかを指定します。`true` に設定すると、再起動のたびにキャッシュがクリアされます。 |

### 事前退避 {#proactive-eviction}

事前退避は、キャッシュ使用率がしきい値に達すると能動的に領域を解放します。これにより、クエリ実行中に受動的な退避が発生して性能が不安定になることを防ぎます。

| パラメータ | デフォルト | 説明 |
|---|---|---|
| `enable_evict_file_cache_in_advance` | `true` | 事前退避を有効にするかどうかを指定します |
| `file_cache_enter_need_evict_cache_in_advance_percent` | `88` | 事前退避を開始する使用率のしきい値（%）。使用中のキャッシュ領域または inode 数がこの割合に達すると開始します |
| `file_cache_exit_need_evict_cache_in_advance_percent` | `85` | 事前退避を停止する使用率のしきい値（%）。使用中のキャッシュ領域がこの割合まで下がると停止します |

## キャッシュクォータ {#cache-quota}

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenarios: Multi-user shared cache / Preventing large-query cache thrashing -->

Doris には、クエリ単位の独立した File Cache 制御があります。クエリがすでに占有しているキャッシュ量を制御するか、その後のキャッシュ充填を停止するかに応じて、パラメータを選んでください。

| 制御 | 主なパラメータ | 制限に達した後の動作 | 用途 |
|---|---|---|---|
| キャッシュ占有率による制限 | `file_cache_query_limit_percent` | 新しいキャッシュブロックを引き続き書き込めます。BE はまず現在のクエリについて記録された解放可能なブロックを退避し、必要に応じてほかのキャッシュキューから退避します | その後のキャッシュ充填を許可しながら、クエリのキャッシュ占有量を制限する |
| バイト数のしきい値によるリモートスキャンのキャッシュ書き込み停止 | `file_cache_query_limit_bytes` | 次のキャッシュブロックで受け入れ済みのバイト数がしきい値を超える場合、その BE 上のクエリはキャッシュミス時にリモートからのみ読み取るモードに移行します。その後のミスでは File Cache に書き込まず、リモートストレージから読み取ります | 大規模なリモートスキャンによるキャッシュ書き込みと入れ替わりを抑える |
| TopN 遅延マテリアライゼーションのフェーズ 2 でキャッシュ書き込みを停止 | `enable_topn_lazy_mat_phase2_no_write_file_cache` | TopN 遅延マテリアライゼーションのフェーズ 2 の参照読み取りでは、キャッシュミス時にリモートからのみ読み取り、File Cache を充填しません | 再利用の少ない TopN の参照読み取りによるキャッシュ汚染を防ぐ |

### キャッシュ占有率による制限 {#limit-by-cache-footprint-percentage}

> この機能はバージョン 4.0.3 以降でサポートされます。

キャッシュ占有率の制限では、単一のクエリが各 File Cache インスタンスで使用できる割合の上限を制御します。複数のユーザーや複雑なクエリがキャッシュ資源を共有する場合、大規模なクエリがキャッシュを占有しすぎて、ほかの頻繁に使われるデータを退避してしまうリスクを減らせます。

この機能には、BE 設定、FE 設定、セッション変数という階層の設定が関わります。

**BE の設定**

| パラメータ | 型 | デフォルト | 説明 |
|---|---|---|---|
| `enable_file_cache_query_limit` | Boolean | `false` | BE 側のクエリキャッシュ制限のマスタースイッチです。有効な場合にのみ、BE は FE から渡されたクエリ制限パラメータを処理します |

**FE の設定**

| パラメータ | 型 | デフォルト | 説明 |
|---|---|---|---|
| `file_cache_query_limit_max_percent` | Integer | `100` | クエリクォータの最大許容値です。セッション変数の上限を検証するために使用します |

**セッション変数**

| 変数 | 型 | デフォルト | 説明 |
|---|---|---|---|
| `file_cache_query_limit_percent` | Integer | `-1` | 明示的に設定する場合、値は `[1, file_cache_query_limit_max_percent]` の範囲内である必要があります。単一のクエリが使用できるキャッシュの最大割合を指定します。計算されたクォータが 256 MB 未満の場合、BE はログに警告を出力します |

この制御を使用する前に、BE で `enable_file_cache` と `enable_file_cache_query_limit` の両方を有効にし、クエリのセッションで `enable_file_cache` が `true` であることを確認してください。

**使用例**

```sql
-- Limit a single query to using at most 50% of the cache
SET file_cache_query_limit_percent = 50;

-- Execute the query
SELECT * FROM large_table;
```

その後のキャッシュミスでも、File Cache への書き込みは可能です。クエリのキャッシュ占有量がクォータを超えると、BE はクエリ単位の LRU 記録やほかのキャッシュキューを使って領域を解放します。この制御によって、クエリが以降の書き込みを停止するモードへ移行することはありません。

### バイト数のしきい値によるリモートスキャンのキャッシュ書き込み停止 {#stop-remote-scan-cache-writes-by-byte-threshold}

`file_cache_query_limit_bytes` は、SELECT クエリによるリモートスキャンのキャッシュミスに伴い、読み取り時に File Cache へ書き込むことを許可した累積バイト数を、**BE ごと**に制限します。BE で `enable_file_cache=true` のコンピュートとストレージを分離したモードでのみ有効です。`enable_file_cache_query_limit` や `file_cache_query_limit_max_percent` には依存しません。

同じクエリの並列スキャナーは、BE 上でしきい値を共有します。ただし、このしきい値はクエリ全体やクラスタ全体の合計ではありません。たとえば、クエリが 10 台の BE で 1 GiB のしきい値を使って実行される場合、各 BE はそれぞれ約 1 GiB を受け入れられます。全 BE の合計を 1 GiB に制限するものではありません。

**パラメータ**

| パラメータ | 設定場所 | 型 | デフォルト | 必須 | 説明 |
|---|---|---|---|---|---|
| `file_cache_query_limit_bytes` | セッション変数 | BigInt | `-1` | はい | 各 BE で単一のクエリに適用するリモートスキャンのキャッシュ充填しきい値（バイト単位）。`0` 未満ではこの制御が無効になり、`0` ではクエリ開始時からキャッシュ充填が無効になります。正の値では、受け入れたバイト数をキャッシュブロック単位で累積します |
| `enable_file_cache_query_limit_segment_meta` | BE 設定 | Boolean | `false` | いいえ | Segment フッターと Segment メタデータのキャッシュ書き込みを同じバイト数のしきい値に算入するかどうかを指定します。このパラメータは動的に設定できます。この制御が有効な場合、データページと転置インデックスの書き込みには常にバイト数のしきい値が適用されます |

`file_cache_query_limit_bytes` の値によって、次のように動作します。

| 値 | 動作 |
|---|---|
| `< 0` | この制御を無効にし、キャッシュミス時に充填する従来の動作を維持します |
| `= 0` | すべての BE で、クエリ開始時からキャッシュミス時にリモートからのみ読み取るモードにします。要求範囲の全体がローカルキャッシュにある場合は、引き続きローカルから読み取れます。全体がキャッシュにない範囲は、キャッシュに格納せずにリモートストレージから直接読み取ります |
| `> 0` | 累積した受け入れ済みバイト数がしきい値を超えない間は、キャッシュブロックを受け入れます。次のブロックでしきい値を超える場合、そのブロックは拒否され、その BE 上のクエリで以降に発生するキャッシュミスではキャッシュを充填しません |

受け入れ可否はキャッシュブロック単位で判定するため、実際の書き込み量がしきい値と一致するとは限りません。残りの許容量が次のキャッシュブロックより小さい場合、そのブロック全体をスキップし、残った許容量を後続の小さなブロックに使うこともありません。BE 上でクエリがキャッシュミス時にリモートからのみ読み取るモードに移行すると、その BE ではキャッシュ充填を再開しません。

**リモートスキャンによるキャッシュ充填を制限する**

次の例では、`large_table` がコンピュートとストレージを分離したクラスタにあり、すべての BE で File Cache が有効であることを前提とします。各 BE で最大 1 GiB のリモートスキャン由来のキャッシュブロックを受け入れます。

```sql
SET enable_profile = true;
SET profile_level = 2;
SET file_cache_query_limit_bytes = 1073741824;

SELECT COUNT(*) FROM large_table;
```

クエリ結果は変わりません。BE 上の次のキャッシュブロックによって受け入れ済みバイト数が 1 GiB を超える場合、同じ BE 上でそのクエリに以降発生するキャッシュミスでは、ローカルキャッシュに追加せずにリモートデータを読み取ります。

単発のスキャンで最初から File Cache を充填しないようにするには、しきい値を `0` に設定し、クエリ後にデフォルト値に戻します。

```sql
SET file_cache_query_limit_bytes = 0;
SELECT COUNT(*) FROM large_table;

SET file_cache_query_limit_bytes = -1;
```

**Segment メタデータを算入するかどうか**

デフォルトでは、データページと転置インデックスのキャッシュ書き込みはしきい値に算入されますが、Segment フッターと Segment メタデータの書き込みは算入されません。そのため、クエリがキャッシュミス時にリモートからのみ読み取るモードに移行した後も、Segment フッターとメタデータが書き込まれる場合があり、Profile に表示される書き込み総量が `file_cache_query_limit_bytes` を超えることがあります。

Segment フッターとメタデータの充填も停止するには、同じコンピュートグループのすべての BE で次のように設定します。

```properties
enable_file_cache_query_limit_segment_meta=true
```

このパラメータは、BE の動的設定 API を使ってすぐに変更できます。再起動後も設定を維持するには、`be.conf` に追加するか、永続化される動的設定を使用してください。詳しくは [BE の設定](../../admin-manual/config/be-config.md)を参照してください。

**Query Profile で確認する**

Query Profile を有効にした後、Scanner 配下の `FileCache` メトリックグループを確認します。

| メトリック | 説明 |
|---|---|
| `RemoteOnlyOnMissTriggered` | 値が `1` の場合、Scanner がクエリのキャッシュミス時にリモートからのみ読み取るモードへの移行を検出したことを示します |
| `RemoteOnlyOnMissThresholdBytes` | クエリに設定されたバイト数のしきい値 |
| `BytesWriteIntoCache` | 実際に File Cache に書き込まれた総バイト数 |
| `InvertedIndexBytesWriteIntoCache` | 実際に File Cache に書き込まれた転置インデックスのバイト数 |
| `SegmentFooterIndexBytesWriteIntoCache` | 実際に File Cache に書き込まれた Segment フッターとメタデータのバイト数 |
| `NumSkipCacheIOTotal` | キャッシュを経由しなかった I/O 操作の回数。このメトリックには、ほかのキャッシュポリシーによってキャッシュを経由しなかった I/O も含まれるため、`RemoteOnlyOnMissTriggered` と併せて評価してください |

受け入れ済みバイト数がしきい値と正確に一致し、クエリ終了までにそれを超えるキャッシュブロックが試みられなかった場合、`RemoteOnlyOnMissTriggered` は `0` のままになることがあります。後続のブロックによってしきい値を超える場合にのみ、状態が変わります。

**推奨事項と注意点**

- 単発の全件スキャン、再利用の少ない ETL、アドホッククエリでは、小さな正のしきい値または `0` を使用して、最初からキャッシュ充填を無効にし、頻繁に使われるデータが使用頻度の低いデータに置き換えられるのを防いでください。
- このパラメータは、クエリの読み取りでキャッシュミスした後の File Cache 充填を制限します。リモートから読み取るバイト数を制限したり、クエリを終了したり、データ取り込み、Compaction、Schema Change、明示的なキャッシュウォームアップによるキャッシュ書き込みに影響したりすることはありません。
- キャッシュミス時にリモートからのみ読み取るモードでも、要求範囲の全体がローカルキャッシュにあればローカルから読み取れます。全体がキャッシュにない範囲はリモートストレージに直接アクセスするため、オブジェクトストレージの I/O やクエリの遅延が増える可能性があります。
- その後のキャッシュミスでの充填を許可しつつ、クエリが保持するキャッシュの占有量を制限するには `file_cache_query_limit_percent` を使用します。指定した量を受け入れた後の充填を停止するには `file_cache_query_limit_bytes` を使用します。
- Segment フッターとメタデータをデフォルトで算入しないことで、再利用性の高いメタデータをキャッシュする利点を保てます。しきい値到達後にこれらの書き込みも停止する必要がある場合にのみ `enable_file_cache_query_limit_segment_meta` を有効にし、Query Profile で結果を確認してください。

### TopN 遅延マテリアライゼーションのフェーズ 2 でキャッシュ書き込みを停止する {#stop-cache-writes-in-topn-lazy-materialization-phase-2}

> この機能はバージョン 4.0.8 以降でサポートされます。

`ORDER BY ... LIMIT` を含むクエリは、TopN 遅延マテリアライゼーションを使用します。フェーズ 1 ではソート列だけを読み取って候補行を選び、フェーズ 2 では行 ID を使って残りの列を参照します。フェーズ 2 の読み取りはまばらで再利用されにくいため、コンピュートとストレージを分離したモードでこれらを File Cache に格納すると、頻繁に使われるデータが容易に追い出されます。

| 変数 | 型 | デフォルト | 説明 |
|---|---|---|---|
| `enable_topn_lazy_mat_phase2_no_write_file_cache` | Boolean | `false` | 有効にすると、TopN 遅延マテリアライゼーションのフェーズ 2 の読み取りでは、File Cache にない範囲をリモートストレージから直接読み取り、その範囲を File Cache に格納しません |

**使用例**

```sql
SET enable_topn_lazy_mat_phase2_no_write_file_cache = true;

SELECT * FROM large_table ORDER BY create_time DESC LIMIT 100;
```

**注意事項**

- この変数はコンピュートとストレージを分離したモードでのみ有効です。ストレージとコンピュートが統合されたモードで設定しても効果はありません。
- TopN 遅延マテリアライゼーションのフェーズ 2 における参照読み取りにのみ影響します。フェーズ 1 のソート列の読み取り、ほかのクエリによるキャッシュ充填、データ取り込み、Compaction、キャッシュウォームアップによるキャッシュ書き込みには影響しません。
- フェーズ 2 で File Cache に見つかった範囲は、引き続きローカルから読み取ります。キャッシュにない範囲はリモートストレージに直接アクセスするため、オブジェクトストレージの I/O が増える可能性があります。
- TopN クエリが同じ頻繁に使われる行に繰り返しアクセスする場合、充填を無効にするとリモートからの読み取りが増える可能性があります。実際のクエリパターンに照らして評価してください。

## キャッシュウォームアップ {#cache-warmup}

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: New compute group going online / Fast loading of hot data -->

Doris のキャッシュウォームアップ機能を使うと、リモートストレージからローカルキャッシュへデータを先行して取得できます。次のウォームアップ方式をサポートしています。

| 方式 | 説明 |
|---|---|
| コンピュートグループ間のウォームアップ | コンピュートグループ A の頻繁に使われるデータのキャッシュを、コンピュートグループ B にウォームアップします。Doris は各コンピュートグループのテーブルやパーティションのアクセス集中情報を定期的に収集し、その情報に基づいて対象を選びます |
| テーブルデータのウォームアップ | 指定したテーブルの全データを対象のコンピュートグループに取得します |
| パーティションデータのウォームアップ | 指定したテーブルの特定のパーティションのデータを対象のコンピュートグループに取得します |

詳しい使い方は、[WARM-UP の SQL ドキュメント](../../sql-manual/sql-statements/cluster-management/storage-management/WARM-UP.md)を参照してください。

キャッシュウォームアップは、事前にリモートストレージからデータを取得します。[ピアキャッシュ読み取り](./file-cache-peer-read)はクエリ実行時にこれを補完します。ローカルキャッシュにないブロックをまず別の BE から読み取り、どの BE にもない場合にだけリモートストレージから読み取るため、ウォームアップの対象外だったデータへの初回アクセスにも対応できます。

## キャッシュのクリア {#cache-clearing}

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: Insufficient cache space / Test environment reset / Troubleshooting -->

Doris には、同期と非同期のキャッシュクリア方法があります。

| 方法 | コマンド | 説明 |
|---|---|---|
| 同期クリア | `curl 'http://BE_IP:WEB_PORT/api/file_cache?op=clear&sync=true'` | クリアが完了してからコマンドが返ります。Doris はローカルファイルシステムからキャッシュファイルを同期的に削除し、メモリ内のメタデータもクリアします。領域をすばやく解放できますが、実行中のクエリに影響する場合があります。通常は迅速なテストに使用します |
| 非同期クリア | `curl 'http://BE_IP:WEB_PORT/api/file_cache?op=clear&sync=false'` | コマンドはすぐに返り、クリア処理は非同期で実行されます。キャッシュ領域が徐々に減る様子を確認できます。Doris はメモリ内のメタデータを走査してキャッシュファイルを順に削除し、使用中のファイルは削除を延期します。実行中のクエリへの影響は小さくなりますが、完全な終了までには時間がかかります |

## キャッシュの監視 {#cache-monitoring}

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: Cache hit rate analysis / Troubleshooting / Performance tuning -->

### キャッシュブロックの詳細 {#cache-block-details}

Doris 4.1 以降では、[`information_schema.file_cache_info`](../../admin-manual/system-tables/information_schema/file_cache_info.md) をクエリしてブロック単位のキャッシュエントリを調べ、tablet、BE、キャッシュパス、キャッシュ種別ごとにキャッシュ領域を集計できます。Doris 4.0.x はこのシステムテーブルに対応していません。

### アクセス集中情報 {#hotspot-information}

Doris は、各コンピュートグループのキャッシュへのアクセス集中情報を 10 分ごとに収集し、内部システムテーブル `__internal_schema.cloud_cache_hotspot` に書き込みます。次のクエリで頻繁に使われるデータを分析し、キャッシュ計画に役立てることができます。

:::info 注記
バージョン 3.0.4 より前は、`SHOW CACHE HOTSPOT` 文でキャッシュへのアクセス集中情報を取得できました。バージョン 3.0.4 以降、この文はサポートされません。代わりにシステムテーブル `__internal_schema.cloud_cache_hotspot` を直接クエリしてください。
:::

#### すべてのコンピュートグループで最も頻繁にアクセスされるテーブルを表示する {#view-the-most-frequently-accessed-tables-across-all-compute-groups}

```sql
-- Equivalent to SHOW CACHE HOTSPOT "/" before version 3.0.4
WITH t1 AS (
    SELECT
        cluster_id,
        cluster_name,
        table_id,
        table_name,
        insert_day,
        SUM(query_per_day) AS query_per_day_total,
        SUM(query_per_week) AS query_per_week_total
    FROM __internal_schema.cloud_cache_hotspot
    GROUP BY cluster_id, cluster_name, table_id, table_name, insert_day
)
SELECT
    cluster_id AS ComputeGroupId,
    cluster_name AS ComputeGroupName,
    table_id AS TableId,
    table_name AS TableName
FROM (
    SELECT
        ROW_NUMBER() OVER (
            PARTITION BY cluster_id
            ORDER BY insert_day DESC, query_per_day_total DESC, query_per_week_total DESC
        ) AS dr2,
        *
    FROM t1
) t2
WHERE dr2 = 1;
```

#### 特定のコンピュートグループで最も頻繁にアクセスされるテーブルを表示する {#view-the-most-frequently-accessed-tables-in-a-specific-compute-group}

`cluster_name = "compute_group_name0"` を実際のコンピュートグループ名に置き換えてください。

```sql
-- Equivalent to SHOW CACHE HOTSPOT '/compute_group_name0' before version 3.0.4
WITH t1 AS (
    SELECT
        cluster_id,
        cluster_name,
        table_id,
        table_name,
        insert_day,
        SUM(query_per_day) AS query_per_day_total,
        SUM(query_per_week) AS query_per_week_total
    FROM __internal_schema.cloud_cache_hotspot
    WHERE cluster_name = "compute_group_name0" -- Replace with the actual compute group name, e.g. "default_compute_group"
    GROUP BY cluster_id, cluster_name, table_id, table_name, insert_day
)
SELECT
    cluster_id AS ComputeGroupId,
    cluster_name AS ComputeGroupName,
    table_id AS TableId,
    table_name AS TableName
FROM (
    SELECT
        ROW_NUMBER() OVER (
            PARTITION BY cluster_id
            ORDER BY insert_day DESC, query_per_day_total DESC, query_per_week_total DESC
        ) AS dr2,
        *
    FROM t1
) t2
WHERE dr2 = 1;
```

### キャッシュ領域とヒット率のメトリック {#cache-space-and-hit-rate-metrics}

<!-- Knowledge type: Configuration parameters -->

次のエンドポイントから BE ノードのキャッシュ統計を取得できます（`brpc_port` のデフォルトは 8060）。

```bash
curl {be_ip}:{brpc_port}/vars
```

返されるメトリック名には、ディスクパスが接頭辞として付きます。たとえば、接頭辞 `_mnt_disk1_gavinchou_debug_doris_cloud_be0_storage_file_cache_` はパス `/mnt/disk1/gavinchou/debug/doris-cloud/be0_storage_file_cache/` に対応します。パスの接頭辞を除いた各メトリックの意味は次のとおりです（サイズはすべてバイト単位）。

| メトリック名（パスの接頭辞を除く） | 説明 |
|---|---|
| `file_cache_cache_size` | 現在の File Cache の総サイズ |
| `file_cache_disposable_queue_cache_size` | Disposable キューの現在のサイズ |
| `file_cache_disposable_queue_element_count` | Disposable キューの現在の要素数 |
| `file_cache_disposable_queue_evict_size` | 起動以降に Disposable キューから退避されたデータの累積量 |
| `file_cache_index_queue_cache_size` | Index キューの現在のサイズ |
| `file_cache_index_queue_element_count` | Index キューの現在の要素数 |
| `file_cache_index_queue_evict_size` | 起動以降に Index キューから退避されたデータの累積量 |
| `file_cache_normal_queue_cache_size` | Normal キューの現在のサイズ |
| `file_cache_normal_queue_element_count` | Normal キューの現在の要素数 |
| `file_cache_normal_queue_evict_size` | 起動以降に Normal キューから退避されたデータの累積量 |
| `file_cache_total_evict_size` | 起動以降に File Cache 全体から退避されたデータの累積量 |
| `file_cache_ttl_cache_evict_size` | 起動以降に TTL キューから退避されたデータの累積量 |
| `file_cache_ttl_cache_lru_queue_element_count` | TTL キューの現在の要素数 |
| `file_cache_ttl_cache_size` | TTL キューの現在のサイズ |
| `file_cache_evict_by_heat_[A]_to_[B]` | 種別 B のキャッシュデータ用の領域を確保するために退避された、種別 A のキャッシュデータ量（有効期限に基づく退避） |
| `file_cache_evict_by_size_[A]_to_[B]` | 種別 B のキャッシュデータ用の領域を確保するために退避された、種別 A のキャッシュデータ量（空き領域に基づく退避） |
| `file_cache_evict_by_self_lru_[A]` | 新しいデータを書き込むために、種別 A のキューが自身から退避した種別 A のキャッシュデータ量（LRU に基づく退避） |
| `file_cache_evict_not_downloaded_size` | 4.1.5 で追加。ダウンロード完了前に削除されたブロックの論理範囲サイズの累積値（バイト単位）。現在ダウンロード中のブロックは含まず、ダウンロード済みデータの物理的な退避量を表すものではありません |
| `file_cache_evict_not_downloaded_num` | 4.1.5 で追加。上記の削除されたブロックの累積数 |
| `file_cache_ttl_mgr_ttl_info_map_size` | 4.1.5 で追加。現在追跡している tablet の TTL 情報エントリ数であり、ブロック数ではありません |

バージョン 4.1.5 以降、全体とキューごとの退避バイト数カウンターは、ダウンロードが完了したブロックのみを数えます。ダウンロード完了前に削除されたブロックには、別の新しいカウンターを使用します。ダウンロード中に削除対象としてマークされたブロックは、これらの削除カウンターを増やしません。対応する SQL システムテーブルのメトリック名は `evict_not_downloaded_size` と `evict_not_downloaded_num` です。詳しくは [file_cache_statistics](../../admin-manual/system-tables/information_schema/file_cache_statistics.md) を参照してください。

### SQL Profile のキャッシュメトリック {#sql-profile-cache-metrics}

SQL Profile のキャッシュ関連メトリックは、`SegmentIterator` ノードの下にあります。

| メトリック名 | 説明 |
|---|---|
| `BytesScannedFromCache` | File Cache から読み取ったデータ量 |
| `BytesScannedFromRemote` | リモートストレージから読み取ったデータ量 |
| `BytesWriteIntoCache` | File Cache に書き込んだデータ量 |
| `LocalIOUseTimer` | File Cache からの読み取りにかかった時間 |
| `NumLocalIOTotal` | File Cache からの読み取り回数 |
| `NumRemoteIOTotal` | リモートストレージからの読み取り回数 |
| `NumSkipCacheIOTotal` | File Cache に書き込まなかったリモートストレージからの読み取り回数 |
| `RemoteIOUseTimer` | リモートストレージからの読み取りにかかった時間 |
| `WriteCacheIOUseTimer` | File Cache への書き込みにかかった時間 |

インデックスのみのキャッシュ書き込みを有効にした後は、次の種類別メトリックを監視し、独立した転置インデックスと Segment フッター・内部インデックスのデータがキャッシュにヒットしているか確認してください。

| メトリック | 説明 |
|---|---|
| `InvertedIndexBytesScannedFromCache` / `InvertedIndexBytesScannedFromRemote` | File Cache / リモートストレージから読み取った、独立した転置インデックスのデータ量 |
| `InvertedIndexNumLocalIOTotal` / `InvertedIndexNumRemoteIOTotal` | 独立した転置インデックスに対するローカル / リモートの読み取り回数 |
| `InvertedIndexLocalIOUseTimer` / `InvertedIndexRemoteIOUseTimer` | 独立した転置インデックスに対するローカル / リモートの読み取りにかかった時間 |
| `SegmentFooterIndexBytesScannedFromCache` / `SegmentFooterIndexBytesScannedFromRemote` | File Cache / リモートストレージから読み取った Segment フッターと内部インデックスのデータ量 |
| `SegmentFooterIndexNumLocalIOTotal` / `SegmentFooterIndexNumRemoteIOTotal` | Segment フッターと内部インデックスのデータに対するローカル / リモートの読み取り回数 |
| `SegmentFooterIndexLocalIOUseTimer` / `SegmentFooterIndexRemoteIOUseTimer` | Segment フッターと内部インデックスのデータに対するローカル / リモートの読み取りにかかった時間 |

クエリ性能の完全なレポートは、[クエリ性能の分析](../../query-acceleration/performance-tuning-overview/analysis-tools#doris-profile)で確認できます。

`NumPeerIOTotal`、`PeerIOUseTimer`、`SameCGPeerIOTotal`、`CrossCGPeerIOTotal` および関連するカウンターは、別の BE のキャッシュからデータを取得したかどうか（ピアキャッシュ読み取り）を示します。詳しくは、[ピアキャッシュ読み取り: Query Profile のカウンター](./file-cache-peer-read#query-profile-counters)を参照してください。

## TTL キャッシュポリシー {#ttl-cache-policy}

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: Keeping hot tables resident in cache / Preventing large queries from evicting hot data -->

TTL（Time-To-Live）キャッシュポリシーでは、特定のテーブルに属するデータのキャッシュ保持期間を設定できます。これにより、頻繁に使われる小さなテーブルや最近取り込んだデータを十分な期間キャッシュに残し、大規模なクエリによって動作する LRU の退避処理で置き換えられるのを防げます。

### テーブル作成時に TTL を設定する {#setting-ttl-at-table-creation}

`file_cache_ttl_seconds`（秒単位）を、`CREATE TABLE` の `PROPERTIES` 句で設定します。

```sql
CREATE TABLE IF NOT EXISTS customer (
    C_CUSTKEY     INTEGER NOT NULL,
    C_NAME        VARCHAR(25) NOT NULL,
    C_ADDRESS     VARCHAR(40) NOT NULL,
    C_NATIONKEY   INTEGER NOT NULL,
    C_PHONE       CHAR(15) NOT NULL,
    C_ACCTBAL     DECIMAL(15,2) NOT NULL,
    C_MKTSEGMENT  CHAR(10) NOT NULL,
    C_COMMENT     VARCHAR(117) NOT NULL
)
DUPLICATE KEY(C_CUSTKEY, C_NAME)
DISTRIBUTED BY HASH(C_CUSTKEY) BUCKETS 32
PROPERTIES (
    "file_cache_ttl_seconds" = "300"
);
```

バージョン 4.1.5 以降、すべての書き込み経路と読み取り経路で、`tablet creation time + file_cache_ttl_seconds` を絶対的な保護期限として計算します。上記の例では、各 tablet は作成から 300 秒後まで保護されます。その後のデータ取り込み、読み取り、Compaction、Schema Change、ウォームアップによってタイマーが再スタートすることはありません。期限を過ぎたデータには通常のキャッシュ処理が適用され、新たなデータ取り込みごとに再び 300 秒間保護される保証はありません。

`file_cache_ttl_seconds` の有効範囲は `0 <= value <= 4611686018427387903`（つまり `Long.MAX_VALUE / 2`）です。バージョン 4.1.4 以降、`CREATE TABLE` と `ALTER TABLE ... SET` の両方でこの値が検証され、範囲外または形式が正しくない値は次のエラーで拒否されます。

```text
The value <v> formats error or is out of range (0 <= integer <= 4611686018427387903). Larger values may overflow in BE and change TTL cache to normal cache; please use 4611686018427387903 or a smaller value.
```

4.1.4 より前は上限が検証されず、値が大きすぎると BE 側でオーバーフローが発生し、TTL キャッシュが通常のキャッシュに切り替わっていました。

### テーブルの TTL 設定を変更する {#modifying-the-ttl-setting-for-a-table}

```sql
ALTER TABLE customer SET ("file_cache_ttl_seconds" = "3000");
```

:::info 注記
TTL の変更は、メタデータの同期に伴う遅延の後で反映されます。テーブル作成時に TTL を設定していない場合は、`ALTER TABLE` で追加できます。新しい期限も tablet の作成時刻を基準に計算されます。バージョン 4.1.5 以降、期限切れの TTL を将来の期限まで延長すると、通常のキャッシュに入っているブロックも TTL キューに戻ります。TTL を `0` に設定すると、通常のキャッシュ処理に戻ります。
:::

## 実践例 {#practical-example}

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: Mixed large-and-small table scenarios / TTL policy tuning -->

**状況:**

あるユーザーは合計データサイズが 3 TB を超える複数のデータテーブルを持っていますが、利用できるキャッシュ容量は 1.2 TB しかありません。その中で、次のテーブルは頻繁にアクセスされます。

| テーブル | サイズ | アクセスパターン |
|---|---|---|
| `dimension_table` | 200 MB | 頻繁にアクセスされ、データの変更は少ない |
| `fact_table` | 100 GB | 新しいデータを毎日取り込み、T+1 でクエリ可能にする必要がある |

ほかの大きなテーブルへのアクセスはまれです。

**問題:** デフォルトの LRU ポリシーでは、大きなテーブルに対するクエリが `dimension_table` のデータをキャッシュから退避させ、ディメンションテーブルのクエリ性能が変動する可能性があります。

**解決策:** 頻繁にアクセスされる両方のテーブルに TTL を設定し、データが十分な期間キャッシュに保持されるようにします。

```sql
-- Dimension table: protect each tablet until 1 year after creation; use a longer TTL if it is already older than 1 year
ALTER TABLE dimension_table SET ("file_cache_ttl_seconds" = "31536000");

-- Fact table with new daily partitions: protect each new partition's tablets until 1 day after creation
ALTER TABLE fact_table SET ("file_cache_ttl_seconds" = "86400");
```

## よくある質問 {#faq}

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenarios: Low cache hit rate / Cache configuration troubleshooting -->

**Q: キャッシュヒット率が低く、クエリも遅い場合は、どう調査すればよいですか？**

1. `curl {be_ip}:{brpc_port}/vars` で各キューの `evict_size` メトリックを確認し、頻繁な退避が起きているか調べます。
2. SQL Profile で `BytesScannedFromRemote` と `BytesScannedFromCache` の比率を確認し、実際のヒット率を把握します。
3. 大規模なクエリが頻繁に使用するデータを退避している場合は、**クエリキャッシュ制限**機能（`enable_file_cache_query_limit`）を有効にするか、頻繁に使われるテーブルに **TTL ポリシー**を設定することを検討してください。

**Q: BE の再起動後にキャッシュデータが失われます。**

`clear_file_cache` が `true` に設定されているか確認してください。再起動時にキャッシュをクリアしたくない場合は、`false`（デフォルト値）に設定します。

**Q: 新しいコンピュートグループの稼働開始後、最初のクエリが非常に遅いです。**

**キャッシュウォームアップ**機能を使い、クエリが到着する前に、頻繁に使われるテーブルやパーティションのデータをリモートストレージから新しいコンピュートグループのローカルキャッシュへ取得してください。詳しい使い方は、[WARM-UP の SQL ドキュメント](../../sql-manual/sql-statements/cluster-management/storage-management/WARM-UP.md)を参照してください。ほかのコンピュートグループがすでにデータをキャッシュしている場合は、[ピアキャッシュ読み取り](./file-cache-peer-read)を有効にすると、キャッシュミス時にそのグループの BE から読み取れます。

**Q: 現在のキャッシュ領域がいっぱいかどうかは、どう判断できますか？**

`file_cache_cache_size` メトリックを、`file_cache_path` に設定した `total_size` と比較してください。上限に近づいている場合は、容量の拡張や各キューへの割り当て割合の調整が必要か確認します。
