---
{
    "title": "ファイルキャッシュの設定と使用ガイド（コンピュートとストレージの分離）",
    "sidebar_label": "ファイルキャッシュの設定",
    "language": "ja",
    "description": "コンピュートとストレージを分離した Doris で、クエリ性能の向上とオブジェクトストレージのコスト削減に役立つ、ファイルキャッシュの設定、インデックスのみのキャッシュ書き込み、クエリ単位のキャッシュ制御、キャッシュのウォームアップとエビクション、ヒット率の監視、TTL ポリシーを説明します。",
    "keywords": ["Doris ファイルキャッシュ", "コンピュートとストレージを分離した構成のキャッシュ", "ファイルキャッシュ", "インデックスのみのキャッシュ書き込み", "キャッシュのウォームアップ", "ピアキャッシュ読み取り", "キャッシュクォータ", "file_cache_query_limit_bytes", "TTL キャッシュ", "LRU", "キャッシュヒット率", "オブジェクトストレージの高速化"]
}
---

<!-- Knowledge type: Architecture and design decisions -->
<!-- Applicable scenarios: Compute-storage decoupled deployment / Query performance optimization / Object storage cost optimization -->

コンピュートとストレージを分離したモードでは、データはリモートのオブジェクトストレージ（S3 や HDFS など）に保存されます。Doris は BE ノードのローカルディスクをファイルキャッシュ層として使用し、複数キューの LRU（Least Recently Used）方式でキャッシュ領域を効率的に管理します。インデックスとメタデータへのアクセス経路には特別な最適化が施されており、頻繁に使われるデータのキャッシュヒット率を最大化します。

複数のコンピュートグループを使用する場合、Doris は**キャッシュのウォームアップ**機能を提供します。新しいコンピュートグループの起動時に、指定したテーブルやパーティションのデータを先読みしてローカルキャッシュをすばやく構築し、初回クエリの性能を改善します。デフォルトで有効な[ピアキャッシュ読み取り](./file-cache-peer-read)は、ローカルキャッシュにないブロックをリモートストレージから読む前に、別の BE（他のコンピュートグループの BE を含む）のキャッシュから取得します。

## ファイルキャッシュの役割

<!-- Knowledge type: Architecture and design decisions -->

コンピュートとストレージを分離したモードでは、リモートストレージへのアクセスには通常、次の二種類の問題があります。

| 問題 | 説明 |
|---|---|
| アクセス遅延が大きい | オブジェクトストレージの遅延はローカルディスクより大幅に大きく、高い同時実行数で特に顕著になります |
| QPS／帯域幅の制限 | オブジェクトストレージには通常、QPS の上限と帯域幅の制約があり、同時実行数の多いクエリではボトルネックになります |
| 従量課金のコスト | オブジェクトストレージはリクエスト数とデータ転送量に応じて課金されるため、頻繁なアクセスは運用コストを増やします |

使用頻度の高いデータをローカルディスクにキャッシュすることで、Doris はクエリの遅延を大幅に減らすとともに、オブジェクトストレージへの直接リクエストを減らしてコストを抑えられます。

### キャッシュされるファイルの種類

Doris のファイルキャッシュは、主に次の二種類のファイルをキャッシュします。

- **Segment データファイル**：Doris の内部テーブルデータの基本的な格納単位です。キャッシュするとデータの読み取りが速くなり、クエリ性能が向上します。
- **転置インデックスファイル**：クエリのフィルタ処理を高速化するために使用します。キャッシュすると、条件に一致するデータをより速く特定でき、複雑なクエリの実行にも役立ちます。

## キャッシュの設定

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenarios: Pre-deployment configuration for compute-storage decoupled mode / BE parameter tuning -->

Doris は、BE 設定ファイルの次のパラメータでファイルキャッシュの動作を制御します。

### ファイルキャッシュの有効化

| パラメータ | デフォルト値 | 説明 |
|---|---|---|
| `enable_file_cache` | `true` | ファイルキャッシュ機能を有効にするかどうかを指定します。Doris 4.2 以降ではデフォルトで有効です。コンピュートとストレージを分離したモードでは、BE によって常に有効にされます |

:::caution

`file_cache_path` のデフォルトは、BE のデプロイ先パスにあるストレージディレクトリです。`total_size` を指定しない場合、ディスク使用率が 85%～88% に達するまでキャッシュが増える可能性があります。上限を設定するには `total_size` を指定してください。

:::

### インデックスのみのキャッシュ書き込みの設定

ローカルキャッシュの容量が限られ、クエリ性能がインデックスと Segment メタデータにより強く依存する場合は、インデックスのみを書き込むポリシーを有効にできます。このポリシーは、データ取り込み、Schema Change、Compaction などの書き込み経路から File Cache に**能動的に書き込む**対象を制限します。キャッシュミス後にクエリ側で行うキャッシュへの格納や、キャッシュのウォームアップには影響しません。

Doris には、グローバルポリシーが一つ、Compaction 専用のポリシーが二つあります。

| パラメータ | 型 | デフォルト値 | 適用範囲 | 説明 |
|---|---|---|---|---|
| `enable_file_cache_write_index_file_only` | Boolean | `false` | データ取り込み、Schema Change、Cumulative Compaction、Base Compaction を含む、コンピュートとストレージを分離したモードでのすべての rowset 書き込み | **Doris 4.0.8 以降の 4.0 系、および Doris 4.1.4 以降の 4.1 系でサポートされます。** `true` にすると、Segment データは能動的にキャッシュされません。Segment を閉じた後、そのフッターと内部インデックスの範囲が同期的に先読みされ、独立した転置インデックスファイルは引き続き File Cache に書き込まれます。このパラメータは、Compaction 専用の両パラメータより優先されます |
| `enable_file_cache_write_base_compaction_index_only` | Boolean | `false` | Base Compaction | 既存の Base Compaction ポリシーが出力を File Cache に書き込むと決定した場合に限り、独立した転置インデックスファイルを引き続きキャッシュしながら、Segment ファイルの能動的なキャッシュを防ぎます。本来キャッシュを経由しない Base Compaction の出力が、このパラメータによってキャッシュされることはありません |
| `enable_file_cache_write_cumu_compaction_index_only` | Boolean | `false` | Cumulative Compaction | Cumulative Compaction の出力が File Cache に書き込まれる場合に、独立した転置インデックスファイルを引き続きキャッシュしながら、Segment ファイルの能動的なキャッシュを防ぎます |

書き込み経路では、次の優先順位でキャッシュの動作を決定します。

1. `enable_file_cache=false` が最優先され、Segment フッター／内部インデックスの先読みや独立した転置インデックスの書き込みを含む、File Cache へのすべての書き込みを無効にします。
2. `enable_file_cache=true` かつ `enable_file_cache_write_index_file_only=true` の場合、グローバルなインデックスのみのポリシーが有効です。Compaction 専用の両パラメータは、最終的な動作を変更しなくなります。適応的な書き込み、Compaction の保持ポリシー、キャッシュヒット率のしきい値、リクエスト単位の `write_file_cache` 設定によって Segment データが能動的にキャッシュされることはありません。インデックス関連の内容は、上記のグローバルポリシーに従って引き続き書き込まれます。
3. グローバルなインデックスのみのポリシーが無効な場合、Base／Cumulative Compaction 専用のパラメータは、該当する種類の出力のうち**すでにキャッシュ対象として選ばれたもの**だけを追加で制限します。その他の書き込みやクエリの読み取り経路には影響しません。
4. インデックスのみの三つのパラメータがすべて `false` の場合、既存の能動的なキャッシュ書き込み、適応的な書き込み、Compaction 出力の保持動作は変わりません。

:::caution

Compaction 専用の両パラメータは、独立した転置インデックスファイルと Segment ファイルのみを区別します。グローバルなインデックスのみのポリシーで行う Segment フッター／内部インデックス範囲の先読みは実行しません。独立した転置インデックスと Segment 内部のインデックスおよびメタデータの両方を能動的に保持するには、`enable_file_cache_write_index_file_only` を使用してください。

:::

#### グローバルなインデックスのみのポリシーの有効化

すべての BE ノードの `be.conf` に、次の設定を追加します。

```properties
enable_file_cache=true
enable_file_cache_write_index_file_only=true
enable_file_cache_write_base_compaction_index_only=false
enable_file_cache_write_cumu_compaction_index_only=false
```

想定される動作は次のとおりです。

| シナリオ | File Cache に能動的に書き込まれる内容 |
|---|---|
| データ取り込み、Schema Change、Cumulative Compaction、Base Compaction | Segment データは能動的に書き込まれません。Segment フッター／内部インデックスの範囲は同期的に先読みされ、独立した転置インデックスファイルは書き込まれます |
| クエリによるデータページの読み取り | 動作は変わりません。キャッシュミス後、既存の読み取り経路のルールに従って Segment データがキャッシュに格納される場合があります |
| キャッシュのウォームアップ | 動作は変わりません |
| Packed File | パックされた小さな Segment ファイルはファイル全体としてキャッシュされません。パックされた独立した小さなインデックスファイルは、引き続きファイル全体としてキャッシュできます |

グローバルなインデックスのみのポリシーでは、Segment フッター／内部インデックスの範囲は同期読み取りによってキャッシュに書き込まれ、`enable_flush_file_cache_async` の制御を受けません。独立した転置インデックスファイルには、従来どおりの直接書き込みと非同期フラッシュが適用されます。

#### Compaction の出力のみを制限する

データ取り込みと Schema Change からの能動的なキャッシュ書き込みを変えずに、Compaction 出力によるキャッシュ負荷を減らすには、次のように設定します。

```properties
enable_file_cache=true
enable_file_cache_write_index_file_only=false
enable_file_cache_write_base_compaction_index_only=true
enable_file_cache_write_cumu_compaction_index_only=true
```

Cumulative Compaction はデフォルトで出力をキャッシュに書き込むため、対応するパラメータを有効にすると Segment ファイルを除外し、独立した転置インデックスファイルのみを保持します。Base Compaction では、まず `enable_file_cache_keep_base_compaction_output` と入力 rowset のキャッシュヒット率によって、出力をキャッシュするかどうかを決定します。Base Compaction 用のインデックスのみのパラメータは、その決定後に書き込む内容だけを制限します。

#### 推奨事項

- これら三つは BE パラメータです。同じコンピュートグループ内の BE ノードでキャッシュ書き込みポリシーが異ならないよう、すべてのノードで同じ値にしてください。
- 「インデックスのみ」は、File Cache に Segment データが一切含まれないという意味ではありません。クエリ側でキャッシュミスしたデータページを読み取ると、Segment データがキャッシュに格納される場合があります。
- このポリシーはデータ取り込みと Compaction によるキャッシュ汚染を減らせますが、書き込み直後に大量のデータをスキャンすると、リモートストレージからの読み取りが増える場合があります。本番のクエリワークロードで性能を測定し、SQL Profile の Index キューのエビクションとインデックス読み取りのメトリクスを監視してください。

### キャッシュのパスとサイズの設定

```plaintext
file_cache_path  Default: the storage directory under the BE deployment path
```

このパラメータは JSON 配列です。各要素でキャッシュのパスと属性を指定します。サポートされるフィールドは次のとおりです。

| フィールド | 説明 |
|---|---|
| `path` | キャッシュファイルを保存するパス |
| `total_size` | このパスのキャッシュ総容量（バイト） |
| `ttl_percent` | TTL キューに割り当てる領域の割合 |
| `normal_percent` | Normal キューに割り当てる領域の割合 |
| `disposable_percent` | Disposable キューに割り当てる領域の割合 |
| `index_percent` | Index キューに割り当てる領域の割合 |
| `storage` | キャッシュのストレージ種別。`disk`（デフォルト）または `memory` |

**設定例：**

- 単一パスの設定：

    ```json
    [{"path":"/path/to/file_cache","total_size":21474836480}]
    ```

- 複数パスの設定：

    ```json
    [{"path":"/path/to/file_cache","total_size":21474836480},{"path":"/path/to/file_cache2","total_size":21474836480}]
    ```

- メモリストレージの設定：

    ```json
    [{"path": "xxx", "total_size":53687091200, "storage": "memory"}]
    ```

### キャッシュの自動クリア

| パラメータ | デフォルト値 | 説明 |
|---|---|---|
| `clear_file_cache` | `false` | BE の再起動時にキャッシュデータを自動的にクリアするかどうかを指定します。`true` にすると、再起動するたびにキャッシュがクリアされます |

### 事前エビクション

事前エビクションは、キャッシュ使用率がしきい値に達したときに領域を先に解放し、クエリ実行中に受動的なエビクションが発生して性能が不安定になるのを防ぎます。

| パラメータ | デフォルト値 | 説明 |
|---|---|---|
| `enable_evict_file_cache_in_advance` | `true` | 事前エビクションを有効にするかどうか |
| `file_cache_enter_need_evict_cache_in_advance_percent` | `88` | 事前エビクションを開始する使用率のしきい値（%）。使用済みキャッシュ領域または inode 数がこの割合に達すると開始します |
| `file_cache_exit_need_evict_cache_in_advance_percent` | `85` | 事前エビクションを停止する使用率のしきい値（%）。使用済みキャッシュ領域がこの割合まで下がると停止します |

## キャッシュクォータ

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenarios: Multi-user shared cache / Preventing large-query cache thrashing -->

Doris には、クエリ単位の独立した File Cache 制御が二種類あります。クエリがすでに占有しているキャッシュ量を制限したいか、以降のキャッシュへの格納を停止したいかに応じて、パラメータを選びます。

| 制御方法 | 主なパラメータ | 制限到達後の動作 | 用途 |
|---|---|---|---|
| キャッシュ占有率で制限 | `file_cache_query_limit_percent` | 新しいキャッシュブロックを書き込むことができます。BE はまず現在のクエリに記録された解放可能なブロックをエビクトし、必要に応じて他のキャッシュキューからエビクトします | 以降のキャッシュへの格納を許可しつつ、クエリのキャッシュ占有量を制限する |
| バイト数のしきい値でリモートスキャンのキャッシュ書き込みを停止 | `file_cache_query_limit_bytes` | 次のキャッシュブロックで受け入れ済みのバイト数がしきい値を超える場合、その BE 上のクエリはキャッシュミス時にリモートのみを読むモードに移行します。以降のミスでは、File Cache に追加で書き込まずにリモートストレージから読み取ります | 大規模なリモートスキャンによるキャッシュ書き込みと入れ替わりを抑える |
| TopN 遅延実体化のフェーズ 2 でキャッシュ書き込みを停止 | `enable_topn_lazy_mat_phase2_no_write_file_cache` | TopN 遅延実体化のフェーズ 2 における検索読み取りは、キャッシュミス時にリモートのみを読み、File Cache に格納しません | 再利用率の低い TopN の検索読み取りによるキャッシュ汚染を防ぐ |

### キャッシュ占有率による制限

> この機能はバージョン 4.0.3 以降でサポートされます。

キャッシュ占有率による制限では、単一クエリが各 File Cache インスタンスで使用できる最大割合を制御します。複数ユーザーや複雑なクエリがキャッシュを共有する場合、ある大規模クエリがキャッシュを大量に占有し、他の使用頻度の高いデータをエビクトするリスクを減らします。

この機能には、BE 設定、FE 設定、セッション変数という三つの設定レベルがあります。

**BE 設定**

| パラメータ | 型 | デフォルト値 | 説明 |
|---|---|---|---|
| `enable_file_cache_query_limit` | Boolean | `false` | BE 側のクエリ単位のキャッシュ制限を有効にするマスタースイッチです。有効な場合にのみ、BE は FE から渡されたクエリ制限パラメータを処理します |

**FE 設定**

| パラメータ | 型 | デフォルト値 | 説明 |
|---|---|---|---|
| `file_cache_query_limit_max_percent` | Integer | `100` | クエリクォータの最大制約値です。セッション変数の上限を検証するために使用します |

**セッション変数**

| 変数 | 型 | デフォルト値 | 説明 |
|---|---|---|---|
| `file_cache_query_limit_percent` | Integer | `-1` | 明示的に設定する場合、値は `[1, file_cache_query_limit_max_percent]` の範囲にする必要があります。単一クエリが使用できるキャッシュの最大割合を指定します。計算されたクォータが 256 MB 未満の場合、BE はログに警告を記録します |

この制御を使用する前に、BE で `enable_file_cache` と `enable_file_cache_query_limit` の両方を有効にし、クエリのセッションで `enable_file_cache` が `true` であることを確認してください。

**使用例**

```sql
-- Limit a single query to using at most 50% of the cache
SET file_cache_query_limit_percent = 50;

-- Execute the query
SELECT * FROM large_table;
```

以降のキャッシュミスでも、File Cache への書き込みは可能です。クエリのキャッシュ占有量がクォータを超えると、BE はクエリ単位の LRU レコードと他のキャッシュキューを通じて領域を解放します。この制御によって、クエリが以降の書き込みを一切行わないモードに切り替わることはありません。

### バイト数のしきい値によるリモートスキャンのキャッシュ書き込みの停止

`file_cache_query_limit_bytes` は、単一の SELECT クエリについて、リモートスキャン時のキャッシュミスをきっかけに読み取りを通じて File Cache に書き込む際、**各 BE** で受け入れるバイト数の累計を制限します。BE で `enable_file_cache=true` のコンピュートとストレージを分離したモードでのみ有効です。`enable_file_cache_query_limit` や `file_cache_query_limit_max_percent` には依存しません。

同じクエリの並列スキャナーは単一の BE 上で同じしきい値を共有しますが、クエリ全体やクラスタ全体の合計値ではありません。たとえば、10 台の BE で 1 GiB のしきい値を設定してクエリを実行すると、各 BE はそれぞれ約 1 GiB を受け入れることができ、全 BE の合計が 1 GiB に制限されるわけではありません。

**パラメータ**

| パラメータ | 設定場所 | 型 | デフォルト値 | 必須 | 説明 |
|---|---|---|---|---|---|
| `file_cache_query_limit_bytes` | セッション変数 | BigInt | `-1` | はい | 単一のクエリについて各 BE に適用する、リモートスキャンによるキャッシュ格納のしきい値（バイト）です。`0` 未満は制御を無効にし、`0` はクエリ開始時からキャッシュへの格納を無効にします。正の値の場合、受け入れたバイト数をキャッシュブロック単位で累計します |
| `enable_file_cache_query_limit_segment_meta` | BE 設定 | Boolean | `false` | いいえ | Segment フッターと Segment メタデータのキャッシュ書き込みを同じバイト数のしきい値に算入するかどうかを指定します。動的に設定できます。この制御が有効な場合、データページと転置インデックスの書き込みには常にバイト数のしきい値が適用されます |

`file_cache_query_limit_bytes` の値による動作は次のとおりです。

| 値 | 動作 |
|---|---|
| `< 0` | この制御を無効にし、キャッシュミス時の従来のキャッシュ格納動作を維持します |
| `= 0` | 開始時からすべての BE 上でクエリをキャッシュミス時にリモートのみを読むモードにします。要求範囲の全体がローカルキャッシュにある場合はローカルから読み取れます。全体がキャッシュにない範囲は、キャッシュに格納せずリモートストレージから直接読み取ります |
| `> 0` | 受け入れ済みバイト数の累計がしきい値を超えない間、キャッシュブロックを受け入れます。次のブロックで超過する場合はそのブロックを拒否し、以降、その BE 上のクエリによるキャッシュミスではキャッシュに格納しません |

受け入れ可否はキャッシュブロック単位で判定されるため、実際の書き込み量がしきい値と一致するとは限りません。残りの容量が次のキャッシュブロックより小さい場合、ブロック全体がスキップされ、残りの容量が後続の小さなブロックに使われることもありません。BE 上でクエリがキャッシュミス時にリモートのみを読むモードに移行すると、その BE でキャッシュへの格納は再開されません。

**リモートスキャンによるキャッシュ格納の制限**

次の例は、`large_table` がコンピュートとストレージを分離したクラスタにあり、すべての BE で File Cache が有効であることを前提とします。各 BE で、リモートスキャンによる最大 1 GiB のキャッシュブロックの受け入れを許可します。

```sql
SET enable_profile = true;
SET profile_level = 2;
SET file_cache_query_limit_bytes = 1073741824;

SELECT COUNT(*) FROM large_table;
```

クエリの結果は変わりません。BE 上で次のキャッシュブロックを受け入れると累計が 1 GiB を超える場合、同じ BE 上のそのクエリによる以降のキャッシュミスでは、ローカルキャッシュに追加で書き込まずリモートデータを読み取ります。

一度だけ実行するスキャンが開始時から File Cache を満たさないようにするには、しきい値を `0` に設定し、クエリ後にデフォルト値へ戻します。

```sql
SET file_cache_query_limit_bytes = 0;
SELECT COUNT(*) FROM large_table;

SET file_cache_query_limit_bytes = -1;
```

**Segment メタデータを算入するかどうか**

デフォルトでは、データページと転置インデックスのキャッシュ書き込みはしきい値に算入されますが、Segment フッターと Segment メタデータの書き込みは算入されません。そのため、クエリがキャッシュミス時にリモートのみを読むモードに移行した後も、Segment フッターとメタデータが書き込まれる場合があり、Profile に表示される総書き込み量が `file_cache_query_limit_bytes` を超えることがあります。

Segment フッターとメタデータの格納も停止するには、同じコンピュートグループ内のすべての BE で次のように設定します。

```properties
enable_file_cache_query_limit_segment_meta=true
```

このパラメータは、BE の動的設定 API を使ってすぐに変更できます。再起動後も維持するには、`be.conf` に追加するか、永続的な動的設定を使用します。詳細は [BE の設定](../../admin-manual/config/be-config.md)を参照してください。

**Query Profile による確認**

Query Profile を有効にした後、Scanner の下にある `FileCache` メトリクスグループを確認します。

| メトリクス | 説明 |
|---|---|
| `RemoteOnlyOnMissTriggered` | 値が `1` の場合、Scanner がクエリのキャッシュミス時にリモートのみを読むモードへの移行を検出したことを示します |
| `RemoteOnlyOnMissThresholdBytes` | クエリに設定されたバイト数のしきい値 |
| `BytesWriteIntoCache` | File Cache に実際に書き込まれた総バイト数 |
| `InvertedIndexBytesWriteIntoCache` | File Cache に実際に書き込まれた転置インデックスのバイト数 |
| `SegmentFooterIndexBytesWriteIntoCache` | File Cache に実際に書き込まれた Segment フッターとメタデータのバイト数 |
| `NumSkipCacheIOTotal` | キャッシュを経由しなかった I/O 操作の回数。このメトリクスには他のキャッシュポリシーによってスキップされた I/O も含まれる場合があるため、`RemoteOnlyOnMissTriggered` と併せて評価してください |

受け入れ済みバイト数がしきい値とちょうど一致し、クエリ完了前にしきい値を超える次のキャッシュブロックの試行がない場合、`RemoteOnlyOnMissTriggered` は `0` のままになることがあります。状態が変わるのは、後続のブロックがしきい値を超えようとしたときだけです。

**推奨事項と注意点**

- 一度だけの全件スキャン、再利用率の低い ETL、アドホッククエリでは、小さな正のしきい値を使用するか、`0` を指定して開始時からキャッシュへの格納を無効にし、使用頻度の高いデータが再利用率の低いデータに置き換わるのを防ぎます。
- このパラメータは、クエリ読み取り時のキャッシュミス後に File Cache に格納する量を制限します。リモートから読み取るバイト数は制限せず、クエリを終了させることも、データ取り込み、Compaction、Schema Change、明示的なキャッシュのウォームアップによるキャッシュ書き込みに影響することもありません。
- キャッシュミス時にリモートのみを読むモードでも、要求範囲の全体がローカルキャッシュにあればローカルから読み取れます。全体がキャッシュにない範囲はリモートストレージに直接アクセスするため、オブジェクトストレージの I/O とクエリの遅延が増える場合があります。
- 以降のキャッシュミスでもキャッシュへの格納を許可しつつ、クエリが保持するキャッシュ占有量を制限するには、`file_cache_query_limit_percent` を使用します。指定量を受け入れた後に格納を停止するには、`file_cache_query_limit_bytes` を使用します。
- デフォルトで Segment フッターとメタデータを対象外にすると、再利用率の高いメタデータをキャッシュする利点を維持できます。しきい値到達後にこれらの書き込みも停止する必要がある場合に限り、`enable_file_cache_query_limit_segment_meta` を有効にし、Query Profile で結果を確認してください。

### TopN 遅延実体化のフェーズ 2 でキャッシュ書き込みを停止する

> この機能はバージョン 4.0.8 以降でサポートされます。

`ORDER BY ... LIMIT` を含むクエリでは、TopN 遅延実体化を使用します。フェーズ 1 では候補行を選ぶためにソート列のみを読み取り、フェーズ 2 では行 ID を使って残りの列を取得します。フェーズ 2 の読み取りは散発的で再利用されることが少ないため、コンピュートとストレージを分離したモードで File Cache に格納すると、使用頻度の高いデータを容易に押し出してしまいます。

| 変数 | 型 | デフォルト値 | 説明 |
|---|---|---|---|
| `enable_topn_lazy_mat_phase2_no_write_file_cache` | Boolean | `false` | 有効にすると、TopN 遅延実体化のフェーズ 2 の読み取りでは、File Cache のミス時にリモートストレージから直接読み取り、その範囲を File Cache に格納しません |

**使用例**

```sql
SET enable_topn_lazy_mat_phase2_no_write_file_cache = true;

SELECT * FROM large_table ORDER BY create_time DESC LIMIT 100;
```

**注意事項**

- この変数はコンピュートとストレージを分離したモードでのみ有効です。コンピュートとストレージを統合したモードで設定しても効果はありません。
- TopN 遅延実体化のフェーズ 2 の検索読み取りにのみ影響します。フェーズ 1 でのソート列の読み取り、他のクエリによるキャッシュへの格納、データ取り込み、Compaction、キャッシュのウォームアップによる書き込みには影響しません。
- フェーズ 2 で File Cache に見つかった範囲は引き続きローカルから読み取ります。キャッシュにない範囲はリモートストレージに直接アクセスするため、オブジェクトストレージの I/O が増える場合があります。
- TopN クエリが同じ使用頻度の高い行を繰り返し参照する場合、キャッシュへの格納を無効にするとリモート読み取りが増える可能性があります。クエリの傾向に基づいて評価してください。

## キャッシュのウォームアップ

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: New compute group going online / Fast loading of hot data -->

Doris のキャッシュウォームアップ機能を使うと、リモートストレージからローカルキャッシュにデータを事前に取り込めます。次の三つのウォームアップ方法がサポートされます。

| 方法 | 説明 |
|---|---|
| コンピュートグループ間のウォームアップ | コンピュートグループ A で使用頻度の高いデータのキャッシュを、コンピュートグループ B にウォームアップします。Doris は各コンピュートグループのテーブル／パーティションへのアクセスが集中する箇所を定期的に収集し、その情報に基づいて選択的にウォームアップします |
| テーブルデータのウォームアップ | 指定したテーブルの全データを対象コンピュートグループに取り込みます |
| パーティションデータのウォームアップ | 指定したテーブルの特定のパーティションのデータを対象コンピュートグループに取り込みます |

詳しい使い方は、[WARM-UP SQL のドキュメント](../../sql-manual/sql-statements/cluster-management/storage-management/WARM-UP.md)を参照してください。

キャッシュのウォームアップは、リモートストレージから事前にデータを取り込みます。[ピアキャッシュ読み取り](./file-cache-peer-read)は、クエリ実行時にこれを補完します。ローカルキャッシュにないブロックは、まず別の BE から読み取り、どの BE にもない場合にのみリモートストレージから読み取ります。これにより、ウォームアップで取り込まれなかったデータの初回読み取りにも対応できます。

## キャッシュのクリア

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: Insufficient cache space / Test environment reset / Troubleshooting -->

Doris は、同期と非同期の両方のキャッシュクリア方法を提供します。

| 方法 | コマンド | 説明 |
|---|---|---|
| 同期クリア | `curl 'http://BE_IP:WEB_PORT/api/file_cache?op=clear&sync=true'` | クリアの完了後にコマンドが返ります。Doris はローカルファイルシステムのキャッシュファイルを同期的に削除し、メモリ内のメタデータをクリアします。領域をすばやく解放できますが、実行中のクエリに影響する可能性があります。通常は迅速なテストに使用します |
| 非同期クリア | `curl 'http://BE_IP:WEB_PORT/api/file_cache?op=clear&sync=false'` | コマンドは直ちに返ります。クリア処理は非同期に実行され、キャッシュ領域が徐々に減る様子を確認できます。Doris はメモリ内のメタデータを走査してキャッシュファイルを順に削除し、使用中のファイルの削除を後回しにします。実行中のクエリへの影響は小さくなりますが、完全なクリアにはより長い時間がかかります |

## キャッシュの監視

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: Cache hit rate analysis / Troubleshooting / Performance tuning -->

### キャッシュブロックの詳細

Doris 4.1 以降では、[`information_schema.file_cache_info`](../../admin-manual/system-tables/information_schema/file_cache_info.md) をクエリして、ブロック単位のキャッシュエントリを確認し、tablet、BE、キャッシュパス、キャッシュ種別ごとのキャッシュ領域を集計できます。Doris 4.0.x はこのシステムテーブルをサポートしていません。

### ホットスポット情報

Doris は、コンピュートグループごとのキャッシュホットスポット情報を 10 分ごとに収集し、内部システムテーブル `__internal_schema.cloud_cache_hotspot` に書き込みます。次のクエリで使用頻度の高いデータを分析し、キャッシュ計画に役立てられます。

:::info Note
バージョン 3.0.4 より前は、`SHOW CACHE HOTSPOT` 文でキャッシュホットスポット情報を照会できました。バージョン 3.0.4 以降、この文はサポートされていません。代わりにシステムテーブル `__internal_schema.cloud_cache_hotspot` を直接クエリしてください。
:::

#### すべてのコンピュートグループで最も頻繁にアクセスされるテーブルを表示する

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

#### 特定のコンピュートグループで最も頻繁にアクセスされるテーブルを表示する

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

### キャッシュ領域とヒット率のメトリクス

<!-- Knowledge type: Configuration parameters -->

BE ノードのキャッシュ統計を取得するには、次のエンドポイントを使用します（`brpc_port` のデフォルト値は 8060）。

```bash
curl {be_ip}:{brpc_port}/vars
```

返されるメトリクス名の先頭にはディスクパスが付いています。たとえば、接頭辞 `_mnt_disk1_gavinchou_debug_doris_cloud_be0_storage_file_cache_` はパス `/mnt/disk1/gavinchou/debug/doris-cloud/be0_storage_file_cache/` に対応します。パスの接頭辞を除いた各メトリクスの意味は次のとおりです（サイズの単位はすべてバイト）。

| メトリクス名（パスの接頭辞を除く） | 説明 |
|---|---|
| `file_cache_cache_size` | ファイルキャッシュの現在の総サイズ |
| `file_cache_disposable_queue_cache_size` | Disposable キューの現在のサイズ |
| `file_cache_disposable_queue_element_count` | Disposable キューの現在の要素数 |
| `file_cache_disposable_queue_evict_size` | 起動後に Disposable キューからエビクトされたデータの累計量 |
| `file_cache_index_queue_cache_size` | Index キューの現在のサイズ |
| `file_cache_index_queue_element_count` | Index キューの現在の要素数 |
| `file_cache_index_queue_evict_size` | 起動後に Index キューからエビクトされたデータの累計量 |
| `file_cache_normal_queue_cache_size` | Normal キューの現在のサイズ |
| `file_cache_normal_queue_element_count` | Normal キューの現在の要素数 |
| `file_cache_normal_queue_evict_size` | 起動後に Normal キューからエビクトされたデータの累計量 |
| `file_cache_total_evict_size` | 起動後にファイルキャッシュ全体からエビクトされたデータの累計量 |
| `file_cache_ttl_cache_evict_size` | 起動後に TTL キューからエビクトされたデータの累計量 |
| `file_cache_ttl_cache_lru_queue_element_count` | TTL キューの現在の要素数 |
| `file_cache_ttl_cache_size` | TTL キューの現在のサイズ |
| `file_cache_evict_by_heat_[A]_to_[B]` | B 型のキャッシュデータ用に領域を空けるためにエビクトされた A 型のキャッシュデータ量（有効期限に基づくエビクション） |
| `file_cache_evict_by_size_[A]_to_[B]` | B 型のキャッシュデータ用に領域を空けるためにエビクトされた A 型のキャッシュデータ量（領域に基づくエビクション） |
| `file_cache_evict_by_self_lru_[A]` | 新しいデータを書き込むために A 型のキューが自身からエビクトした A 型のキャッシュデータ量（LRU に基づくエビクション） |

### SQL Profile のキャッシュメトリクス

SQL Profile のキャッシュ関連メトリクスは、`SegmentIterator` ノードの下にあります。

| メトリクス名 | 説明 |
|---|---|
| `BytesScannedFromCache` | ファイルキャッシュから読み取ったデータ量 |
| `BytesScannedFromRemote` | リモートストレージから読み取ったデータ量 |
| `BytesWriteIntoCache` | ファイルキャッシュに書き込んだデータ量 |
| `LocalIOUseTimer` | ファイルキャッシュからの読み取りに費やした時間 |
| `NumLocalIOTotal` | ファイルキャッシュからの読み取り回数 |
| `NumRemoteIOTotal` | リモートストレージからの読み取り回数 |
| `NumSkipCacheIOTotal` | ファイルキャッシュに書き込まれなかったリモートストレージからの読み取り回数 |
| `RemoteIOUseTimer` | リモートストレージからの読み取りに費やした時間 |
| `WriteCacheIOUseTimer` | ファイルキャッシュへの書き込みに費やした時間 |

インデックスのみのキャッシュ書き込みを有効にした後は、次の分類別メトリクスを監視し、独立した転置インデックスと Segment フッター／内部インデックスのデータがキャッシュにヒットしているかどうかを確認します。

| メトリクス | 説明 |
|---|---|
| `InvertedIndexBytesScannedFromCache` / `InvertedIndexBytesScannedFromRemote` | File Cache／リモートストレージから読み取った、独立した転置インデックスのデータ量 |
| `InvertedIndexNumLocalIOTotal` / `InvertedIndexNumRemoteIOTotal` | 独立した転置インデックスのローカル／リモート読み取り回数 |
| `InvertedIndexLocalIOUseTimer` / `InvertedIndexRemoteIOUseTimer` | 独立した転置インデックスのローカル／リモート読み取りに費やした時間 |
| `SegmentFooterIndexBytesScannedFromCache` / `SegmentFooterIndexBytesScannedFromRemote` | File Cache／リモートストレージから読み取った Segment フッターと内部インデックスのデータ量 |
| `SegmentFooterIndexNumLocalIOTotal` / `SegmentFooterIndexNumRemoteIOTotal` | Segment フッターと内部インデックスのローカル／リモート読み取り回数 |
| `SegmentFooterIndexLocalIOUseTimer` / `SegmentFooterIndexRemoteIOUseTimer` | Segment フッターと内部インデックスのローカル／リモート読み取りに費やした時間 |

クエリ性能のレポート全体は、[クエリ性能の分析](../../query-acceleration/performance-tuning-overview/analysis-tools#doris-profile)で確認できます。

`NumPeerIOTotal`、`PeerIOUseTimer`、`SameCGPeerIOTotal`、`CrossCGPeerIOTotal` および関連するカウンターは、データを別の BE のキャッシュから取得したかどうか（ピアキャッシュ読み取り）を示します。[ピアキャッシュ読み取り：Query Profile のカウンター](./file-cache-peer-read#query-profile-counters)を参照してください。

## TTL キャッシュポリシー

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: Keeping hot tables resident in cache / Preventing large queries from evicting hot data -->

TTL（Time-To-Live）キャッシュポリシーでは、特定のテーブルに属するデータのキャッシュ保持期間を設定できます。これにより、小さな使用頻度の高いテーブルや最近取り込まれたデータを十分な期間キャッシュに保持し、大規模クエリによって発生する LRU エビクションで置き換えられるのを防げます。

### テーブル作成時に TTL を設定する

`file_cache_ttl_seconds`（秒単位）を `PROPERTIES` 句で指定して `CREATE TABLE` を実行します。

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

上記のテーブルに新しく取り込まれたデータはすべて、300 秒間キャッシュに保持されます。

`file_cache_ttl_seconds` の有効範囲は `0 <= value <= 4611686018427387903`（つまり `Long.MAX_VALUE / 2`）です。バージョン 4.1.4 以降、`CREATE TABLE` と `ALTER TABLE ... SET` の両方でこの値が検証され、範囲外の値や形式が不正な値は次のエラーで拒否されます。

```text
The value <v> formats error or is out of range (0 <= integer <= 4611686018427387903). Larger values may overflow in BE and change TTL cache to normal cache; please use 4611686018427387903 or a smaller value.
```

4.1.4 より前は上限が検証されず、大きすぎる値は BE 側でオーバーフローして、TTL キャッシュが通常のキャッシュに変わっていました。

### テーブルの TTL 設定を変更する

```sql
ALTER TABLE customer SET ("file_cache_ttl_seconds" = "3000");
```

:::info Note
更新した TTL 値はすぐには反映されず、少し時間がかかります。テーブル作成時に TTL を設定していない場合も、後から `ALTER TABLE` 文で追加できます。
:::

## 実用例

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: Mixed large-and-small table scenarios / TTL policy tuning -->

**シナリオ：**

あるユーザーは、合計データ量が 3 TB を超える複数のデータテーブルを持っていますが、使用可能なキャッシュ容量は 1.2 TB しかありません。そのうち、次の二つのテーブルに頻繁にアクセスします。

| テーブル | サイズ | アクセスパターン |
|---|---|---|
| `dimension_table` | 200 MB | 頻繁にアクセスされ、データの変更は少ない |
| `fact_table` | 100 GB | 新しいデータを毎日取り込み、T+1 の基準でクエリできる必要がある |

その他の大きなテーブルへのアクセス頻度は低い状態です。

**問題：** デフォルトの LRU ポリシーでは、大きなテーブルをクエリすると `dimension_table` のデータがキャッシュからエビクトされ、ディメンションテーブルのクエリ性能が変動する可能性があります。

**解決策：** 頻繁にアクセスされる両方のテーブルに TTL を設定し、十分な期間データがキャッシュに保持されるようにします。

```sql
-- Dimension table: small data volume, infrequent changes; set a 1-year TTL to keep it resident in the cache
ALTER TABLE dimension_table SET ("file_cache_ttl_seconds" = "31536000");

-- Fact table: full load ingested daily; set a 1-day TTL aligned with the ingestion cycle
ALTER TABLE fact_table SET ("file_cache_ttl_seconds" = "86400");
```

## よくある質問

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenarios: Low cache hit rate / Cache configuration troubleshooting -->

**Q：キャッシュヒット率が低く、クエリも遅いままです。どのように調査すればよいですか？**

1. `curl {be_ip}:{brpc_port}/vars` を使い、各キューの `evict_size` メトリクスを確認して、頻繁にエビクションが発生しているかどうかを判断します。
2. SQL Profile で `BytesScannedFromRemote` と `BytesScannedFromCache` の比率を確認し、実際のヒット率を確かめます。
3. 大規模クエリが使用頻度の高いデータを頻繁にエビクトする場合、**Cache Query Limit** 機能（`enable_file_cache_query_limit`）を有効にするか、使用頻度の高いテーブルに **TTL ポリシー**を設定することを検討します。

**Q：BE を再起動するとキャッシュデータが失われます。**

`clear_file_cache` が `true` に設定されていないか確認してください。再起動時にキャッシュをクリアしたくない場合は、`false`（デフォルト値）に設定します。

**Q：新しいコンピュートグループの稼働開始後、最初のクエリが非常に遅くなります。**

クエリを受け付ける前に、**キャッシュのウォームアップ**機能を使って、使用頻度の高いテーブルまたはパーティションのデータをリモートストレージから新しいコンピュートグループのローカルキャッシュに事前に取り込んでください。詳しい使い方は、[WARM-UP SQL のドキュメント](../../sql-manual/sql-statements/cluster-management/storage-management/WARM-UP.md)を参照してください。別のコンピュートグループがすでにデータをキャッシュしている場合、デフォルトで有効な[ピアキャッシュ読み取り](./file-cache-peer-read)により、キャッシュミス時にそのグループの BE から読み取れます。

**Q：現在のキャッシュ領域が満杯かどうかは、どのように判断できますか？**

`file_cache_cache_size` メトリクスと、`total_size`（`file_cache_path` で設定）の値を比較してください。上限に近づいている場合は、容量の拡張や各キューの割り当て割合の調整が必要かどうかを確認します。
