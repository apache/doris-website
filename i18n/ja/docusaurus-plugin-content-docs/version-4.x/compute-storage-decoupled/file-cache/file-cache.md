---
{
    "title": "File Cache の設定と使用ガイド（コンピュートとストレージの分離）",
    "sidebar_label": "File Cache の設定",
    "language": "ja",
    "description": "コンピュートとストレージを分離したモードの Doris で、クエリ性能の向上とオブジェクトストレージのコスト削減に役立つ File Cache の設定、インデックスのみのキャッシュ書き込み、クエリ単位のキャッシュ制御、キャッシュのウォームアップと追い出し、ヒット率の監視、TTL ポリシーについて説明します。",
    "keywords": ["Doris file cache", "compute-storage decoupled cache", "file cache", "index-only cache writes", "cache warmup", "peer cache read", "cache quota", "file_cache_query_limit_bytes", "TTL cache", "LRU", "cache hit rate", "object storage acceleration"]
}
---

<!-- Knowledge type: Architecture and design decisions -->
<!-- Applicable scenarios: Compute-storage decoupled deployment / Query performance optimization / Object storage cost optimization -->

コンピュートとストレージを分離したモードでは、データはリモートのオブジェクトストレージ（S3 や HDFS など）に保存されます。Doris は BE ノードのローカルディスクを File Cache 層として使用し、複数キューの LRU（Least Recently Used）方式でキャッシュ領域を効率的に管理します。インデックスとメタデータのアクセス経路は特に最適化されており、頻繁に使われるデータのキャッシュヒット率を最大化します。

複数のコンピュートグループを使う場合、Doris は**キャッシュウォームアップ**機能を提供します。新しいコンピュートグループの起動時に、指定したテーブルやパーティションのデータを先に取り込み、ローカルキャッシュをすばやく構築して最初のクエリの性能を高めます。[Peer cache read](./file-cache-peer-read) を有効にすると、ローカルキャッシュにないブロックをリモートストレージから取得する前に、別の BE（他のコンピュートグループの BE を含む）のキャッシュから読み取ります。

## File Cache の役割 {#the-role-of-file-cache}

<!-- Knowledge type: Architecture and design decisions -->

コンピュートとストレージを分離したモードでリモートストレージにアクセスすると、通常は次のような問題が生じます。

| 問題 | 説明 |
|---|---|
| アクセスの遅延が大きい | オブジェクトストレージのレイテンシはローカルディスクよりはるかに大きく、同時実行数が多い場合に特に顕著になります |
| QPS／帯域幅の制限 | オブジェクトストレージには通常、QPS の上限と帯域幅の制約があり、高い並行性のクエリではボトルネックになります |
| 従量課金のコスト | オブジェクトストレージはリクエスト数とデータ転送量に応じて課金されるため、頻繁なアクセスは運用コストを増やします |

頻繁に使われるデータをローカルディスクにキャッシュすることで、Doris はクエリのレイテンシを大幅に減らし、オブジェクトストレージへの直接リクエストを抑えてコストを削減できます。

### キャッシュ対象のファイル形式 {#cached-file-types}

Doris の File Cache は主に次の種類のファイルをキャッシュします。

- **Segment データファイル**：Doris の内部テーブルデータの基本的な保存単位です。これらをキャッシュすると、データの読み取りが速くなり、クエリ性能が向上します。
- **転置インデックスファイル**：クエリのフィルタ処理を高速化するために使います。これらをキャッシュすると、条件に一致するデータをより速く特定でき、複雑なクエリにも対応できます。

## キャッシュの設定 {#cache-configuration}

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenarios: Pre-deployment configuration for compute-storage decoupled mode / BE parameter tuning -->

Doris では、BE の設定ファイルにある以下のパラメータで File Cache の動作を制御します。

### File Cache の有効化 {#enabling-file-cache}

| パラメータ | デフォルト値 | 説明 |
|---|---|---|
| `enable_file_cache` | `true` | File Cache 機能を有効にするかどうか。バージョン 4.1.5 以降はデフォルトで有効です（以前は `false`）。コンピュートとストレージを分離したモードでは、BE が常に強制的に有効化します。 |

:::caution

`file_cache_path` のデフォルトは、BE のデプロイ先パス配下のストレージディレクトリです。`total_size` を指定しない場合、ディスク使用率が 85%～88% に達するまでキャッシュが増える可能性があります。上限を設けるには `total_size` を設定してください。

:::

同名のセッション変数も有効にする必要があります。値とアップグレード時のデフォルトについては、[セッション変数](../../sql-manual/basic-element/session-variables.md#enable_file_cache)のリファレンスを参照してください。

### インデックスのみをキャッシュに書き込む設定 {#configuring-index-only-cache-writes}

ローカルキャッシュの容量が限られ、クエリ性能がインデックスと Segment メタデータに大きく依存する場合は、インデックスのみを書き込むポリシーを有効にできます。このポリシーは、データ取り込み、Schema Change、Compaction などの書き込み経路が File Cache に**能動的に書き込む**対象を制限します。キャッシュミス後のクエリ側でのキャッシュ充填やキャッシュウォームアップには影響しません。

Doris は、全体に適用するポリシーと Compaction 専用のポリシーを提供します。

| パラメータ | 型 | デフォルト値 | 適用範囲 | 説明 |
|---|---|---|---|---|
| `enable_file_cache_write_index_file_only` | Boolean | `false` | コンピュートとストレージを分離したモードでの、データ取り込み、Schema Change、Cumulative Compaction、Base Compaction を含むすべての rowset 書き込み | **Doris 4.0 系では 4.0.8 以降、4.1 系では 4.1.4 以降でサポートされます。** `true` にすると、Segment データは能動的にキャッシュされません。Segment がクローズされると、そのフッターと内部インデックスの範囲が同期的に事前読み込みされ、独立した転置インデックスファイルは引き続き File Cache に書き込まれます。このパラメータは、Compaction 専用の他のパラメータより優先されます |
| `enable_file_cache_write_base_compaction_index_only` | Boolean | `false` | Base Compaction | 既存の Base Compaction ポリシーが出力を File Cache に書き込むと決定した場合に限り、独立した転置インデックスファイルのキャッシュは維持しつつ、Segment ファイルの能動的なキャッシュを防ぎます。本来キャッシュを経由しない Base Compaction の出力を、このパラメータによってキャッシュすることはありません |
| `enable_file_cache_write_cumu_compaction_index_only` | Boolean | `false` | Cumulative Compaction | Cumulative Compaction の出力が File Cache に書き込まれる場合に、独立した転置インデックスファイルのキャッシュは維持しつつ、Segment ファイルの能動的なキャッシュを防ぎます |

書き込み経路では、次の優先順位でキャッシュの動作が決まります。

1. `enable_file_cache=false` が最優先され、Segment フッター／内部インデックスの事前読み込みと、独立した転置インデックスの書き込みを含む、すべての File Cache への書き込みを無効にします。
2. `enable_file_cache=true` かつ `enable_file_cache_write_index_file_only=true` の場合、全体に適用するインデックスのみのポリシーが有効になります。Compaction 専用の他のパラメータは、最終的な動作を変えません。適応的な書き込み、Compaction の保持ポリシー、キャッシュヒット率のしきい値、リクエスト単位の `write_file_cache` 設定によって Segment データが能動的にキャッシュされることはありません。インデックス関連の内容は、前述の全体ポリシーに従って引き続き書き込まれます。
3. 全体に適用するインデックスのみのポリシーが無効な場合、Base/Cumulative Compaction 専用のパラメータは、**すでにキャッシュ対象として選ばれた**該当する種類の出力をさらに制限するだけです。他の書き込み処理やクエリの読み取り経路には影響しません。
4. インデックスのみのパラメータがすべて `false` の場合、既存の能動的なキャッシュ書き込み、適応的な書き込み、Compaction 出力の保持動作は変わりません。

:::caution

Compaction 専用のパラメータは、独立した転置インデックスファイルと Segment ファイルのみを区別します。全体に適用するインデックスのみのポリシーで行われる、Segment フッター／内部インデックス範囲の事前読み込みは実行しません。独立した転置インデックスに加えて Segment の内部インデックスとメタデータも能動的に保持するには、`enable_file_cache_write_index_file_only` を使用してください。

:::

#### 全体に適用するインデックスのみのポリシーを有効にする {#enabling-the-global-index-only-policy}

すべての BE ノードの `be.conf` に次の設定を追加します。

```properties
enable_file_cache=true
enable_file_cache_write_index_file_only=true
enable_file_cache_write_base_compaction_index_only=false
enable_file_cache_write_cumu_compaction_index_only=false
```

想定される動作は次のとおりです。

| シナリオ | File Cache に能動的に書き込まれる内容 |
|---|---|
| データ取り込み、Schema Change、Cumulative Compaction、Base Compaction | Segment データは能動的に書き込まれず、Segment フッター／内部インデックスの範囲が同期的に事前読み込みされ、独立した転置インデックスファイルが書き込まれます |
| クエリによるデータページの読み取り | 動作は変わりません。キャッシュミス後も、既存の読み取り経路のルールに従って Segment データをキャッシュに充填できます |
| キャッシュウォームアップ | 動作は変わりません |
| Packed File | パックされた小さな Segment ファイルはファイル全体としてはキャッシュされません。パックされた独立の小さなインデックスファイルは、引き続きファイル全体としてキャッシュできます |

全体に適用するインデックスのみのポリシーでは、Segment フッター／内部インデックスの範囲は同期読み取りを通じてキャッシュに書き込まれ、`enable_flush_file_cache_async` の制御を受けません。独立した転置インデックスファイルには、既存の直接書き込みと非同期フラッシュの動作が引き続き適用されます。

#### Compaction の出力だけを制限する {#restricting-only-compaction-output}

データ取り込みと Schema Change の能動的なキャッシュ書き込みを変えずに、Compaction 出力によるキャッシュ負荷を減らすには、次のように設定します。

```properties
enable_file_cache=true
enable_file_cache_write_index_file_only=false
enable_file_cache_write_base_compaction_index_only=true
enable_file_cache_write_cumu_compaction_index_only=true
```

Cumulative Compaction はデフォルトで出力をキャッシュに書き込むため、対応するパラメータを有効にすると Segment ファイルの書き込みを省略し、独立した転置インデックスファイルだけを保持します。Base Compaction では、まず `enable_file_cache_keep_base_compaction_output` と入力 rowset のキャッシュヒット率を使って、出力をキャッシュするかどうかを決めます。Base Compaction のインデックスのみのパラメータは、その決定後に書き込む内容を制限します。

#### 推奨事項 {#recommendations}

- これらは BE のパラメータです。ノード間で異なるキャッシュ書き込みポリシーが使われないよう、同じコンピュートグループ内のすべての BE ノードで設定を揃えてください。
- 「インデックスのみ」は、File Cache に Segment データが一切入らないという意味ではありません。クエリ側でキャッシュミスしたデータページを読み取る際には、Segment データがキャッシュに充填されることがあります。
- このポリシーはデータ取り込みと Compaction によるキャッシュの汚染を減らせますが、書き込み直後に大量のデータをスキャンすると、リモートストレージからの読み取りが増える可能性があります。本番環境のクエリ負荷でベンチマークし、SQL Profile で Index キューからの追い出しとインデックス読み取りのメトリクスを監視してください。

### キャッシュのパスとサイズを設定する {#configuring-cache-paths-and-size}

```plaintext
file_cache_path  Default: the storage directory under the BE deployment path
```

このパラメータは JSON 配列です。各要素でキャッシュのパスと属性を指定します。使用できるフィールドは次のとおりです。

| フィールド | 説明 |
|---|---|
| `path` | キャッシュファイルの保存先パス |
| `total_size` | このパスのキャッシュの総容量（バイト単位） |
| `ttl_percent` | TTL キューに割り当てる領域の割合 |
| `normal_percent` | Normal キューに割り当てる領域の割合 |
| `disposable_percent` | Disposable キューに割り当てる領域の割合 |
| `index_percent` | Index キューに割り当てる領域の割合 |
| `storage` | キャッシュの保存先の種類：`disk`（デフォルト）または `memory` |

**設定例：**

- 単一パスの設定：

    ```json
    [{"path":"/path/to/file_cache","total_size":21474836480}]
    ```

- 複数パスの設定：

    ```json
    [{"path":"/path/to/file_cache","total_size":21474836480},{"path":"/path/to/file_cache2","total_size":21474836480}]
    ```

- メモリを保存先にする設定：

    ```json
    [{"path": "xxx", "total_size":53687091200, "storage": "memory"}]
    ```

### キャッシュの自動消去 {#automatic-cache-clearing}

| パラメータ | デフォルト値 | 説明 |
|---|---|---|
| `clear_file_cache` | `false` | BE の再起動時にキャッシュデータを自動的に消去するかどうか。`true` にすると、再起動のたびにキャッシュが消去されます。 |

### 事前の追い出し {#proactive-eviction}

事前の追い出しは、キャッシュ使用率がしきい値に達したときに能動的に領域を解放します。これにより、クエリの実行中に受動的な追い出しが発生して性能がばらつくことを防ぎます。

| パラメータ | デフォルト値 | 説明 |
|---|---|---|
| `enable_evict_file_cache_in_advance` | `true` | 事前の追い出しを有効にするかどうか |
| `file_cache_enter_need_evict_cache_in_advance_percent` | `88` | 事前の追い出しを開始する使用率のしきい値（%）。使用中のキャッシュ領域または inode 数がこの割合に達すると開始します |
| `file_cache_exit_need_evict_cache_in_advance_percent` | `85` | 事前の追い出しを停止する使用率のしきい値（%）。使用中のキャッシュ領域がこの割合まで下がると停止します |

## キャッシュの割り当て上限 {#cache-quota}

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenarios: Multi-user shared cache / Preventing large-query cache thrashing -->

Doris は、クエリ単位の独立した File Cache 制御を提供します。クエリがすでに占有しているキャッシュ領域を制御したいか、以降のキャッシュ充填を止めたいかに応じて、パラメータを選んでください。

| 制御 | 主なパラメータ | 上限に達した後の動作 | 用途 |
|---|---|---|---|
| キャッシュ占有率による制限 | `file_cache_query_limit_percent` | 新しいキャッシュブロックも書き込めます。BE はまず現在のクエリについて記録された解放可能なブロックを追い出し、必要に応じて他のキャッシュキューからも追い出します | 以降のキャッシュ充填を許可しながら、クエリが占有するキャッシュ領域を制限する |
| バイト数のしきい値によるリモートスキャンのキャッシュ書き込み停止 | `file_cache_query_limit_bytes` | 次のキャッシュブロックによって受け入れ済みのバイト数がしきい値を超える場合、その BE でクエリはキャッシュミス時にリモートからのみ読み取るモードに入ります。その後のミスは、File Cache への追加書き込みを行わずにリモートストレージから読み取ります | 大規模なリモートスキャンによるキャッシュ書き込みと入れ替わりを抑える |
| TopN 遅延マテリアライズのフェーズ 2 でのキャッシュ書き込み停止 | `enable_topn_lazy_mat_phase2_no_write_file_cache` | TopN 遅延マテリアライズのフェーズ 2 のルックアップ読み取りは、キャッシュミス時にリモートからのみ読み取り、File Cache を充填しません | 再利用されにくい TopN ルックアップ読み取りによるキャッシュの汚染を防ぐ |

### キャッシュ占有率による制限 {#limit-by-cache-footprint-percentage}

> この機能はバージョン 4.0.3 以降でサポートされます。

キャッシュ占有率の上限は、単一のクエリが各 File Cache インスタンスで使用できる最大割合を制御します。複数のユーザーや複雑なクエリがキャッシュを共有する場合に、1 つの大きなクエリがキャッシュを過度に占有し、他の頻繁に使われるデータを追い出すリスクを減らします。

この機能には、BE 設定、FE 設定、セッション変数という 3 つの設定レベルがあります。

**BE の設定**

| パラメータ | 型 | デフォルト値 | 説明 |
|---|---|---|---|
| `enable_file_cache_query_limit` | Boolean | `false` | BE 側でクエリのキャッシュ上限を有効にするマスタースイッチ。有効な場合にのみ、BE は FE から渡されたクエリ上限パラメータを処理します |

**FE の設定**

| パラメータ | 型 | デフォルト値 | 説明 |
|---|---|---|---|
| `file_cache_query_limit_max_percent` | Integer | `100` | クエリの割り当て上限に指定できる最大値。セッション変数の上限の検証に使用します |

**セッション変数**

| 変数 | 型 | デフォルト値 | 説明 |
|---|---|---|---|
| `file_cache_query_limit_percent` | Integer | `-1` | 明示的に設定する場合、値は `[1, file_cache_query_limit_max_percent]` の範囲内でなければなりません。単一のクエリが使用できるキャッシュの最大割合を指定します。算出された割り当て上限は 256 MB 以上である必要があり、下回る場合は BE がログに警告を書き込みます |

この制御を使用する前に、BE で `enable_file_cache` と `enable_file_cache_query_limit` の両方を有効にし、クエリセッションの `enable_file_cache` が `true` であることを確認してください。

**使用例**

```sql
-- Limit a single query to using at most 50% of the cache
SET file_cache_query_limit_percent = 50;

-- Execute the query
SELECT * FROM large_table;
```

その後のキャッシュミスでも、File Cache への書き込みは可能です。クエリが占有するキャッシュ領域が割り当て上限を超えると、BE はクエリ単位の LRU 記録と他のキャッシュキューを通じて領域を解放します。この制御によってクエリが以後の書き込みを行わないモードに切り替わることはありません。

### バイト数のしきい値によるリモートスキャンのキャッシュ書き込み停止 {#stop-remote-scan-cache-writes-by-byte-threshold}

> この機能は Doris 4.1.x でのみサポートされます。Doris 4.0.x ではサポートされません。

`file_cache_query_limit_bytes` は、1 つの SELECT クエリについて、リモートスキャンのキャッシュミス後の読み取りによって File Cache への書き込みが受け入れられた累計バイト数を、**各 BE** で制限します。BE の `enable_file_cache=true` が設定されたコンピュートとストレージを分離したモードでのみ有効です。`enable_file_cache_query_limit` や `file_cache_query_limit_max_percent` には依存しません。

同じクエリの並列スキャナーは、1 つの BE 上で同じしきい値を共有しますが、しきい値はクエリ全体やクラスタ全体の合計には適用されません。たとえば、1 GiB のしきい値を設定したクエリが 10 台の BE で実行される場合、各 BE が個別に約 1 GiB を受け入れられます。全 BE の合計を 1 GiB に制限するものではありません。

**パラメータ**

| パラメータ | 設定場所 | 型 | デフォルト値 | 必須 | 説明 |
|---|---|---|---|---|---|
| `file_cache_query_limit_bytes` | セッション変数 | BigInt | `-1` | はい | 1 つのクエリについて各 BE に適用される、リモートスキャンによるキャッシュ充填のしきい値（バイト単位）。`0` 未満はこの制御を無効にし、`0` はクエリの開始時からキャッシュ充填を無効にします。正の値では、受け入れたバイト数をキャッシュブロック単位で累積します |
| `enable_file_cache_query_limit_segment_meta` | BE 設定 | Boolean | `false` | いいえ | Segment フッターと Segment メタデータのキャッシュ書き込みを、同じバイト数のしきい値に算入するかどうか。このパラメータは動的に設定できます。この制御が有効な場合、データページと転置インデックスの書き込みには常にバイト数のしきい値が適用されます |

`file_cache_query_limit_bytes` は値に応じて次のように動作します。

| 値 | 動作 |
|---|---|
| `< 0` | この制御を無効にし、キャッシュミス時の元の充填動作を維持します |
| `= 0` | 開始時からすべての BE でクエリをキャッシュミス時にリモートからのみ読み取るモードにします。ローカルキャッシュに完全に含まれるリクエスト範囲はローカルから読み取れます。完全には含まれない範囲は、キャッシュを充填せずにリモートストレージから直接読み取ります |
| `> 0` | 受け入れた累計バイト数がしきい値を超えない間は、キャッシュブロックを受け入れます。次のブロックで超過する場合、そのブロックを拒否し、その BE での当該クエリの以降のキャッシュミスではキャッシュを充填しません |

受け入れ可否はキャッシュブロック単位で判断するため、実際の書き込み量がしきい値と一致するとは限りません。残りの容量が次のキャッシュブロックより小さい場合、そのブロック全体がスキップされ、残りの容量を後続の小さなブロックに使うこともありません。ある BE でクエリがキャッシュミス時にリモートからのみ読み取るモードに入ると、その BE ではキャッシュの充填を再開しません。

**リモートスキャンによるキャッシュ充填を制限する**

次の例では、`large_table` がコンピュートとストレージを分離したクラスタにあり、すべての BE で File Cache が有効であるとします。各 BE で、リモートスキャンによるキャッシュブロックを最大 1 GiB まで受け入れます。

```sql
SET enable_profile = true;
SET profile_level = 2;
SET file_cache_query_limit_bytes = 1073741824;

SELECT COUNT(*) FROM large_table;
```

クエリ結果は変わりません。ある BE で次のキャッシュブロックを受け入れると累計バイト数が 1 GiB を超える場合、同じ BE でのそのクエリの以降のキャッシュミスでは、ローカルキャッシュに追加で書き込まずにリモートデータを読み取ります。

一度きりのスキャンによって開始時から File Cache が充填されるのを防ぐには、しきい値を `0` に設定し、クエリ後にデフォルト値へ戻します。

```sql
SET file_cache_query_limit_bytes = 0;
SELECT COUNT(*) FROM large_table;

SET file_cache_query_limit_bytes = -1;
```

**Segment メタデータを算入するかどうか**

デフォルトでは、データページと転置インデックスのキャッシュ書き込みはしきい値に算入されますが、Segment フッターと Segment メタデータの書き込みは算入されません。そのため、クエリがキャッシュミス時にリモートからのみ読み取るモードに入った後も、Segment フッターとメタデータが書き込まれることがあり、Profile に表示される総書き込み量が `file_cache_query_limit_bytes` を超える場合があります。

Segment フッターとメタデータの充填も止めるには、同じコンピュートグループ内のすべての BE で次のように設定します。

```properties
enable_file_cache_query_limit_segment_meta=true
```

このパラメータは BE の動的設定 API で直ちに変更できます。再起動後も設定を維持するには、`be.conf` に追加するか、永続的な動的設定を使用してください。詳細は [BE の設定](../../admin-manual/config/be-config.md)を参照してください。

**Query Profile で確認する**

Query Profile を有効にした後、Scanner の下にある `FileCache` メトリクスグループを確認します。

| メトリクス | 説明 |
|---|---|
| `RemoteOnlyOnMissTriggered` | 値が `1` の場合、Scanner がクエリのキャッシュミス時にリモートからのみ読み取るモードへの移行を観測したことを示します |
| `RemoteOnlyOnMissThresholdBytes` | クエリに設定されたバイト数のしきい値 |
| `BytesWriteIntoCache` | File Cache に実際に書き込まれた総バイト数 |
| `InvertedIndexBytesWriteIntoCache` | File Cache に実際に書き込まれた転置インデックスのバイト数 |
| `SegmentFooterIndexBytesWriteIntoCache` | File Cache に実際に書き込まれた Segment フッターとメタデータのバイト数 |
| `NumSkipCacheIOTotal` | キャッシュをスキップした I/O 操作の回数。他のキャッシュポリシーによってスキップされた I/O も含まれる場合があるため、`RemoteOnlyOnMissTriggered` と併せて評価してください |

受け入れたバイト数がしきい値にちょうど一致し、クエリの終了までにそれを超えるキャッシュブロックの試行がない場合、`RemoteOnlyOnMissTriggered` は `0` のままになることがあります。状態が変わるのは、後続のブロックによってしきい値を超えるときだけです。

**推奨事項と注意点**

- 一度きりのフルスキャン、再利用頻度の低い ETL、アドホッククエリでは、小さな正のしきい値を使うか、`0` を指定して開始時からキャッシュ充填を無効にし、頻繁に使われるデータが使用頻度の低いデータに置き換わるのを防いでください。
- このパラメータは、クエリの読み取りでキャッシュミスした後の File Cache への充填を制限します。リモートからの読み取りバイト数を制限したり、クエリを終了したり、データ取り込み、Compaction、Schema Change、明示的なキャッシュウォームアップによるキャッシュ書き込みに影響したりはしません。
- キャッシュミス時にリモートからのみ読み取るモードでも、ローカルキャッシュに完全に含まれるリクエスト範囲はローカルから読み取れます。完全には含まれない範囲はリモートストレージに直接アクセスするため、オブジェクトストレージの I/O とクエリのレイテンシが増える可能性があります。
- 以降のキャッシュミスによる充填を許可しつつ、クエリが保持するキャッシュ領域を制限したい場合は `file_cache_query_limit_percent` を使用します。指定した量が受け入れられた後の充填を停止したい場合は `file_cache_query_limit_bytes` を使用します。
- デフォルトで Segment フッターとメタデータを算入しない設定は、再利用性の高いメタデータをキャッシュする利点を維持します。しきい値に達した後にそれらの書き込みも停止する必要がある場合にのみ `enable_file_cache_query_limit_segment_meta` を有効にし、Query Profile で結果を確認してください。

### TopN 遅延マテリアライズのフェーズ 2 でキャッシュ書き込みを停止する {#stop-cache-writes-in-topn-lazy-materialization-phase-2}

> この機能はバージョン 4.0.8 以降でサポートされます。

`ORDER BY ... LIMIT` を含むクエリは、TopN 遅延マテリアライズを使用します。フェーズ 1 では候補行を選ぶためにソート列のみを読み取り、フェーズ 2 では行 ID を使って残りの列を取得します。フェーズ 2 の読み取りはまばらで再利用されにくいため、コンピュートとストレージを分離したモードでは、これらを File Cache に充填すると頻繁に使われるデータが追い出されやすくなります。

| 変数 | 型 | デフォルト値 | 説明 |
|---|---|---|---|
| `enable_topn_lazy_mat_phase2_no_write_file_cache` | Boolean | `false` | 有効にすると、TopN 遅延マテリアライズのフェーズ 2 の読み取りでは、File Cache のミス時にリモートストレージから直接読み取り、その範囲を File Cache に充填しません |

**使用例**

```sql
SET enable_topn_lazy_mat_phase2_no_write_file_cache = true;

SELECT * FROM large_table ORDER BY create_time DESC LIMIT 100;
```

**注意事項**

- この変数はコンピュートとストレージを分離したモードでのみ有効です。コンピュートとストレージが一体のモードで設定しても効果はありません。
- TopN 遅延マテリアライズのフェーズ 2 のルックアップ読み取りだけに影響します。フェーズ 1 のソート列の読み取り、他のクエリによるキャッシュ充填、データ取り込み、Compaction、キャッシュウォームアップによるキャッシュ書き込みには影響しません。
- フェーズ 2 で File Cache に見つかった範囲は、引き続きローカルから読み取られます。キャッシュにない範囲はリモートストレージに直接アクセスするため、オブジェクトストレージの I/O が増える可能性があります。
- TopN クエリが同じ頻繁に使われる行に繰り返しアクセスする場合、充填を無効にするとリモートからの読み取りが増える可能性があります。実際のクエリパターンに照らして評価してください。

## キャッシュウォームアップ {#cache-warmup}

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: New compute group going online / Fast loading of hot data -->

Doris は、リモートストレージからローカルキャッシュへデータを事前に取り込むキャッシュウォームアップ機能を提供します。次のウォームアップモードをサポートします。

| モード | 説明 |
|---|---|
| コンピュートグループ間のウォームアップ | コンピュートグループ A で頻繁に使われるデータのキャッシュを、コンピュートグループ B にウォームアップします。Doris は各コンピュートグループのテーブル／パーティションへのアクセス集中情報を定期的に収集し、それに基づいて対象を選んでウォームアップします |
| テーブルデータのウォームアップ | 指定したテーブルの全データを対象のコンピュートグループに取り込みます |
| パーティションデータのウォームアップ | 指定したテーブルの特定のパーティションのデータを対象のコンピュートグループに取り込みます |

詳しい使用方法は、[WARM-UP SQL ドキュメント](../../sql-manual/sql-statements/cluster-management/storage-management/WARM-UP.md)を参照してください。

キャッシュウォームアップは、リモートストレージからデータを事前に取り込みます。[Peer cache read](./file-cache-peer-read) はクエリ実行時にそれを補います。ローカルキャッシュにないブロックを、まず別の BE から読み取り、どの BE にもない場合にのみリモートストレージから読み取るため、ウォームアップされなかったデータの初回読み取りに対応できます。

## キャッシュの消去 {#cache-clearing}

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: Insufficient cache space / Test environment reset / Troubleshooting -->

Doris は、同期と非同期のキャッシュ消去方法を提供します。

| 方法 | コマンド | 説明 |
|---|---|---|
| 同期消去 | `curl 'http://BE_IP:WEB_PORT/api/file_cache?op=clear&sync=true'` | 消去が完了してからコマンドが戻ります。Doris はローカルファイルシステムからキャッシュファイルを同期的に削除し、メモリ内のメタデータも消去します。領域をすばやく解放できますが、実行中のクエリに影響する可能性があります。通常は迅速なテストに使用します |
| 非同期消去 | `curl 'http://BE_IP:WEB_PORT/api/file_cache?op=clear&sync=false'` | コマンドはすぐに戻り、消去処理は非同期に実行されます。キャッシュ領域が徐々に減る様子を確認できます。Doris はメモリ内のメタデータを走査し、キャッシュファイルを順に削除します。使用中のファイルは削除を延期します。実行中のクエリへの影響は小さくなりますが、完全な消去には時間がかかります |

## キャッシュの監視 {#cache-monitoring}

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: Cache hit rate analysis / Troubleshooting / Performance tuning -->

### キャッシュブロックの詳細 {#cache-block-details}

Doris 4.1 以降では、[`information_schema.file_cache_info`](../../admin-manual/system-tables/information_schema/file_cache_info.md) をクエリして、ブロック単位のキャッシュエントリを調べたり、tablet、BE、キャッシュパス、キャッシュの種類ごとにキャッシュ領域を集計したりできます。Doris 4.0.x では、このシステムテーブルはサポートされません。

### アクセス集中情報 {#hotspot-information}

Doris は各コンピュートグループのキャッシュへのアクセス集中情報を 10 分ごとに収集し、内部システムテーブル `__internal_schema.cloud_cache_hotspot` に書き込みます。次のクエリで頻繁に使われるデータを分析し、キャッシュの計画に役立てられます。

:::info 注
バージョン 3.0.4 より前は、`SHOW CACHE HOTSPOT` ステートメントでキャッシュへのアクセス集中情報を照会できました。バージョン 3.0.4 以降、このステートメントはサポートされません。代わりにシステムテーブル `__internal_schema.cloud_cache_hotspot` を直接クエリしてください。
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

### キャッシュ領域とヒット率のメトリクス {#cache-space-and-hit-rate-metrics}

<!-- Knowledge type: Configuration parameters -->

次のエンドポイントで BE ノードのキャッシュ統計を取得します（`brpc_port` のデフォルトは 8060）。

```bash
curl {be_ip}:{brpc_port}/vars
```

返されるメトリクス名には、ディスクパスに対応するプレフィックスが付きます。たとえば、プレフィックス `_mnt_disk1_gavinchou_debug_doris_cloud_be0_storage_file_cache_` はパス `/mnt/disk1/gavinchou/debug/doris-cloud/be0_storage_file_cache/` に対応します。パスのプレフィックスを除いた各メトリクスの意味は次のとおりです（サイズはすべてバイト単位）。

| メトリクス名（パスのプレフィックスを除く） | 説明 |
|---|---|
| `file_cache_cache_size` | File Cache の現在の総サイズ |
| `file_cache_disposable_queue_cache_size` | Disposable キューの現在のサイズ |
| `file_cache_disposable_queue_element_count` | Disposable キューの現在の要素数 |
| `file_cache_disposable_queue_evict_size` | 起動後に Disposable キューから追い出されたデータの累計サイズ |
| `file_cache_index_queue_cache_size` | Index キューの現在のサイズ |
| `file_cache_index_queue_element_count` | Index キューの現在の要素数 |
| `file_cache_index_queue_evict_size` | 起動後に Index キューから追い出されたデータの累計サイズ |
| `file_cache_normal_queue_cache_size` | Normal キューの現在のサイズ |
| `file_cache_normal_queue_element_count` | Normal キューの現在の要素数 |
| `file_cache_normal_queue_evict_size` | 起動後に Normal キューから追い出されたデータの累計サイズ |
| `file_cache_total_evict_size` | 起動後に File Cache 全体から追い出されたデータの累計サイズ |
| `file_cache_ttl_cache_evict_size` | 起動後に TTL キューから追い出されたデータの累計サイズ |
| `file_cache_ttl_cache_lru_queue_element_count` | TTL キューの現在の要素数 |
| `file_cache_ttl_cache_size` | TTL キューの現在のサイズ |
| `file_cache_evict_by_heat_[A]_to_[B]` | 種類 B のキャッシュデータ用の領域を確保するために追い出された種類 A のキャッシュデータの量（有効期限に基づく追い出し） |
| `file_cache_evict_by_size_[A]_to_[B]` | 種類 B のキャッシュデータ用の領域を確保するために追い出された種類 A のキャッシュデータの量（空き領域に基づく追い出し） |
| `file_cache_evict_by_self_lru_[A]` | 新しいデータを書き込むために、種類 A のキューが自身から追い出した種類 A のキャッシュデータの量（LRU に基づく追い出し） |
| `file_cache_evict_not_downloaded_size` | 4.1.5 で追加。ダウンロード完了前に削除されたブロックの論理範囲サイズの累計バイト数。現在ダウンロード中のブロックは含みません。ダウンロード済みデータの物理的な追い出し量を表すものではありません |
| `file_cache_evict_not_downloaded_num` | 4.1.5 で追加。このように削除されたブロックの累計数 |
| `file_cache_ttl_mgr_ttl_info_map_size` | 4.1.5 で追加。追跡中の tablet の TTL 情報エントリの現在の数。ブロック数ではありません |

バージョン 4.1.5 以降、全体およびキュー別の追い出しバイト数のカウンターは、ダウンロードが完全に終わったブロックのみを数えます。ダウンロード完了前に削除されたブロックは新しいカウンターで別に数えます。ダウンロード中に削除対象とされたブロックは、これらの削除カウンターを増やしません。対応する SQL システムテーブルのメトリクス名は `evict_not_downloaded_size` と `evict_not_downloaded_num` です。[file_cache_statistics](../../admin-manual/system-tables/information_schema/file_cache_statistics.md) を参照してください。

### SQL Profile のキャッシュメトリクス {#sql-profile-cache-metrics}

SQL Profile のキャッシュ関連メトリクスは、`SegmentIterator` ノードの下にあります。

| メトリクス名 | 説明 |
|---|---|
| `BytesScannedFromCache` | File Cache から読み取ったデータの量 |
| `BytesScannedFromRemote` | リモートストレージから読み取ったデータの量 |
| `BytesWriteIntoCache` | File Cache に書き込んだデータの量 |
| `LocalIOUseTimer` | File Cache からの読み取りに費やした時間 |
| `NumLocalIOTotal` | File Cache からの読み取り回数 |
| `NumRemoteIOTotal` | リモートストレージからの読み取り回数 |
| `NumSkipCacheIOTotal` | File Cache に書き込まなかった、リモートストレージからの読み取り回数 |
| `RemoteIOUseTimer` | リモートストレージからの読み取りに費やした時間 |
| `WriteCacheIOUseTimer` | File Cache への書き込みに費やした時間 |

インデックスのみのキャッシュ書き込みを有効にした後は、以下の種類別メトリクスを監視し、独立した転置インデックスと Segment フッター／内部インデックスのデータがキャッシュにヒットしているか確認してください。

| メトリクス | 説明 |
|---|---|
| `InvertedIndexBytesScannedFromCache` / `InvertedIndexBytesScannedFromRemote` | File Cache／リモートストレージから読み取った、独立した転置インデックスデータの量 |
| `InvertedIndexNumLocalIOTotal` / `InvertedIndexNumRemoteIOTotal` | 独立した転置インデックスのローカル／リモート読み取り回数 |
| `InvertedIndexLocalIOUseTimer` / `InvertedIndexRemoteIOUseTimer` | 独立した転置インデックスのローカル／リモート読み取りに費やした時間 |
| `SegmentFooterIndexBytesScannedFromCache` / `SegmentFooterIndexBytesScannedFromRemote` | File Cache／リモートストレージから読み取った Segment フッターと内部インデックスデータの量 |
| `SegmentFooterIndexNumLocalIOTotal` / `SegmentFooterIndexNumRemoteIOTotal` | Segment フッターと内部インデックスデータのローカル／リモート読み取り回数 |
| `SegmentFooterIndexLocalIOUseTimer` / `SegmentFooterIndexRemoteIOUseTimer` | Segment フッターと内部インデックスデータのローカル／リモート読み取りに費やした時間 |

完全なクエリ性能レポートは、[クエリ性能の分析](../../query-acceleration/performance-tuning-overview/analysis-tools#doris-profile)から確認できます。

`NumPeerIOTotal`、`PeerIOUseTimer`、`SameCGPeerIOTotal`、`CrossCGPeerIOTotal` および関連カウンターは、データが別の BE のキャッシュから取得されたかどうか（peer cache read）を示します。[Peer Cache Read：Query Profile のカウンター](./file-cache-peer-read#query-profile-counters)を参照してください。

## TTL キャッシュポリシー {#ttl-cache-policy}

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: Keeping hot tables resident in cache / Preventing large queries from evicting hot data -->

TTL（Time-To-Live）キャッシュポリシーでは、特定のテーブルに属するデータのキャッシュ保持期間を設定できます。これにより、頻繁に使われる小さなテーブルや最近取り込んだデータを十分な期間キャッシュに残し、大規模なクエリによって発生する LRU の追い出し処理で置き換えられるのを防げます。

### テーブル作成時に TTL を設定する {#setting-ttl-at-table-creation}

`CREATE TABLE` の `PROPERTIES` 句で `file_cache_ttl_seconds`（秒単位）を設定します。

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

バージョン 4.1.5 以降、すべての書き込み経路と読み取り経路は、絶対的な保護期限を `tablet creation time + file_cache_ttl_seconds` として計算します。上の例では、各 tablet は作成後 300 秒まで保護されます。その後のデータ取り込み、読み取り、Compaction、Schema Change、ウォームアップによってタイマーが再開することはありません。期限を過ぎたデータには通常のキャッシュ処理が適用され、データを新たに取り込むたびに追加の 300 秒間の保護が保証されるわけではありません。

`file_cache_ttl_seconds` の有効範囲は `0 <= value <= 4611686018427387903`（`Long.MAX_VALUE / 2`）です。バージョン 4.1.4 以降、`CREATE TABLE` と `ALTER TABLE ... SET` の両方でこの値が検証され、範囲外または形式が不正な値は次のエラーで拒否されます。

```text
The value <v> formats error or is out of range (0 <= integer <= 4611686018427387903). Larger values may overflow in BE and change TTL cache to normal cache; please use 4611686018427387903 or a smaller value.
```

4.1.4 より前は上限が検証されず、値が大きすぎると BE 側でオーバーフローし、TTL キャッシュが通常のキャッシュに切り替わっていました。

### テーブルの TTL 設定を変更する {#modifying-the-ttl-setting-for-a-table}

```sql
ALTER TABLE customer SET ("file_cache_ttl_seconds" = "3000");
```

:::info 注
TTL の変更は、メタデータの同期に伴う遅延の後で有効になります。テーブル作成時に TTL を設定していなかった場合は、`ALTER TABLE` で追加できます。新しい期限も tablet の作成時刻を基準とします。バージョン 4.1.5 以降、期限切れの TTL を将来の期限まで延長すると、キャッシュ済みの通常のブロックも TTL キューへ戻されます。TTL を `0` に設定すると、通常のキャッシュ処理に戻ります。
:::

## 実用例 {#practical-example}

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: Mixed large-and-small table scenarios / TTL policy tuning -->

**シナリオ：**

あるユーザーは合計データサイズが 3 TB を超える複数のデータテーブルを持っていますが、使用可能なキャッシュ容量は 1.2 TB しかありません。そのうち、次のテーブルは頻繁にアクセスされます。

| テーブル | サイズ | アクセスパターン |
|---|---|---|
| `dimension_table` | 200 MB | アクセス頻度が高く、データの変更頻度は低い |
| `fact_table` | 100 GB | 毎日新しいデータが取り込まれ、T+1 のタイミングでクエリできる必要がある |

他の大きなテーブルは、あまりアクセスされません。

**問題：** デフォルトの LRU ポリシーでは、大きなテーブルへのクエリによって `dimension_table` のデータがキャッシュから追い出され、ディメンションテーブルのクエリ性能がばらつく可能性があります。

**解決策：** 頻繁にアクセスされる両方のテーブルに TTL を設定し、データが十分な期間キャッシュに保持されるようにします。

```sql
-- Dimension table: protect each tablet until 1 year after creation; use a longer TTL if it is already older than 1 year
ALTER TABLE dimension_table SET ("file_cache_ttl_seconds" = "31536000");

-- Fact table with new daily partitions: protect each new partition's tablets until 1 day after creation
ALTER TABLE fact_table SET ("file_cache_ttl_seconds" = "86400");
```

## よくある質問 {#faq}

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenarios: Low cache hit rate / Cache configuration troubleshooting -->

**Q：キャッシュヒット率が低く、クエリも遅いままです。どう調査すればよいですか？**

1. `curl {be_ip}:{brpc_port}/vars` を使って各キューの `evict_size` メトリクスを確認し、追い出しが頻繁に発生しているか判断します。
2. SQL Profile で `BytesScannedFromRemote` と `BytesScannedFromCache` の比率を確認し、実際のヒット率を確かめます。
3. 大規模なクエリが頻繁に使われるデータを繰り返し追い出している場合は、**クエリのキャッシュ上限制御**（`enable_file_cache_query_limit`）の有効化や、頻繁に使われるテーブルへの **TTL ポリシー**の設定を検討してください。

**Q：BE の再起動後にキャッシュデータが失われます。**

`clear_file_cache` が `true` に設定されていないか確認してください。再起動時にキャッシュを消去したくない場合は、`false`（デフォルト値）に設定します。

**Q：新しいコンピュートグループが稼働した直後の最初のクエリが非常に遅いです。**

**キャッシュウォームアップ**機能を使い、クエリが到着する前に、頻繁に使われるテーブルやパーティションのデータをリモートストレージから新しいコンピュートグループのローカルキャッシュへ事前に取り込んでください。詳しい使用方法は、[WARM-UP SQL ドキュメント](../../sql-manual/sql-statements/cluster-management/storage-management/WARM-UP.md)を参照してください。別のコンピュートグループのキャッシュにすでにデータがある場合は、[peer cache read](./file-cache-peer-read) を有効にすると、新しいコンピュートグループはキャッシュミス時にそのグループの BE からデータを読み取れます。

**Q：現在のキャッシュ領域が満杯かどうかは、どう判断しますか？**

`file_cache_cache_size` メトリクスを、`file_cache_path` で設定した `total_size` と比較します。上限に近づいている場合は、容量を増やす必要があるか、各キューへの割り当て割合を調整する必要があるかを確認してください。
