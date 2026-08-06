---
{
  "title": "ファイルキャッシュ",
  "language": "ja",
  "description": "ストレージ・コンピューティング分離モードにおけるDorisファイルキャッシュの設定、インデックスのみの書き込み、クエリ単位のキャッシュ制限、ウォームアップ、監視、およびTTL戦略について説明します。"
}
---
分離アーキテクチャでは、データはリモートストレージに保存されます。Dorisデータベースは、ローカルディスク上のキャッシュを利用してデータアクセスを高速化し、高度なマルチキューLRU（Least Recently Used）戦略を採用してキャッシュスペースを効率的に管理します。この戦略は特にインデックスとメタデータのアクセスパスを最適化し、頻繁にアクセスされるユーザーデータのキャッシュを最大化することを目的としています。マルチCompute Group（Compute Group）シナリオでは、Dorisは新しいcompute groupが確立された際に特定のデータ（テーブルやパーティションなど）をキャッシュに素早くロードするキャッシュウォーミング機能も提供し、それによりクエリパフォーマンスを向上させます。

## キャッシュの役割

分離アーキテクチャでは、データは通常、オブジェクトストレージS3、HDFSなどのリモートストレージシステムに保存されます。このシナリオでは、Dorisデータベースはローカルディスクスペースをキャッシュとして活用して一部のデータをローカルに保存することで、リモートストレージへのアクセス頻度を削減し、データアクセス効率を向上させ、運用コストを削減できます。

リモートストレージ（オブジェクトストレージなど）は通常、より高いアクセス待機時間を持ち、QPS（queries per second）や帯域幅制限の制約を受ける可能性があります。例えば、オブジェクトストレージのQPS制限は高並行クエリ時のボトルネックを引き起こす可能性があり、ネットワーク帯域幅制限はデータ転送速度に影響を与える可能性があります。ローカルファイルキャッシングを使用することで、Dorisはホットデータをローカルディスクに保存でき、それによりクエリ待機時間を大幅に削減し、クエリパフォーマンスを向上させることができます。

一方で、オブジェクトストレージサービスは通常、リクエスト数と転送されるデータ量に基づいて課金されます。頻繁なアクセスと大量のデータダウンロードはクエリコストを増加させる可能性があります。キャッシングメカニズムにより、オブジェクトストレージへのアクセス数と転送されるデータ量を削減でき、それによりコストを削減できます。

Dorisのファイルキャッシュは、分離アーキテクチャにおいて通常以下の2種類のファイルをキャッシュします：

- Segmentデータファイル：Dorisの内部テーブルにおけるデータストレージの基本単位。これらのファイルをキャッシュすることで、データ読み取り操作を高速化し、クエリパフォーマンスを向上させることができます。

- 転置インデックスファイル：クエリでのフィルタリング操作を高速化するために使用されます。これらのファイルをキャッシュすることで、クエリ条件を満たすデータをより迅速に特定でき、クエリ効率をさらに向上させ、複雑なクエリシナリオをサポートします。

## キャッシュ設定

Dorisは、ユーザーがファイルキャッシングを柔軟に管理するのに役立つ幅広い設定オプションを提供します。これらの設定オプションには、キャッシュの有効化/無効化、キャッシュパスとサイズの設定、キャッシュブロックサイズの設定、自動クリーンアップの有効化/無効化、事前退避メカニズムなどが含まれます。詳細な設定手順は以下の通りです：

1. ファイルキャッシュの有効化

```plaintext
enable_file_cache Default: "false"
```
パラメータの説明：この設定項目は、ファイルキャッシュ機能が有効かどうかを制御します。`true`に設定すると、ファイルキャッシュが有効になります。`false`に設定すると、ファイルキャッシュが無効になります。

### 書き込みパスでインデックスのみをキャッシュする

ローカルキャッシュ領域が限られており、クエリ性能がインデックスとSegmentメタデータにより強く依存する場合は、インデックス優先（index-only）書き込みポリシーを有効にできます。このポリシーは、データインポート、Schema Change、Compactionなどの書き込みパスがFile Cacheへ**能動的に書き込む**内容を制限します。クエリ時のキャッシュミス後のキャッシュ投入やキャッシュウォームアップには影響しません。

Dorisは、1つのグローバルポリシーと2つのCompaction専用ポリシーを提供します。

| パラメータ | 型 | デフォルト | 適用範囲 | 説明 |
|---|---|---|---|---|
| `enable_file_cache_write_index_file_only` | Boolean | `false` | データインポート、Schema Change、Cumulative Compaction、Base Compactionを含む、ストレージ・コンピューティング分離モードのすべてのRowset書き込み | `true`に設定すると、Segmentデータは能動的にキャッシュされません。Segmentを閉じた後、そのフッターと内部インデックス範囲が同期的にプリロードされ、独立した転置インデックスファイルは引き続きFile Cacheへ書き込まれます。このパラメータは2つのCompaction専用パラメータより優先されます |
| `enable_file_cache_write_base_compaction_index_only` | Boolean | `false` | Base Compaction | 既存のBase CompactionポリシーがFile Cacheへの出力書き込みを決定した場合にのみ、Segmentファイルの能動的なキャッシュを停止し、独立した転置インデックスファイルをキャッシュします。このパラメータによって、本来キャッシュに書き込まれないBase Compaction出力が新たにキャッシュされることはありません |
| `enable_file_cache_write_cumu_compaction_index_only` | Boolean | `false` | Cumulative Compaction | Cumulative Compaction出力がFile Cacheへ書き込まれる場合、Segmentファイルの能動的なキャッシュを停止し、独立した転置インデックスファイルをキャッシュします |

書き込みパスは、次の優先順位でキャッシュ動作を決定します。

1. `enable_file_cache=false`が最優先されます。Segmentフッター/内部インデックスのプリロードや独立した転置インデックスファイルの書き込みを含め、すべてのFile Cache書き込みが無効になります。
2. `enable_file_cache=true`かつ`enable_file_cache_write_index_file_only=true`の場合、グローバルなインデックス優先書き込みが有効になります。このとき、2つのCompaction専用パラメータは最終的な動作を変更しません。適応型書き込み、Compaction出力保持ポリシー、キャッシュヒット率の閾値、リクエストレベルの`write_file_cache`設定によってSegmentデータが能動的にキャッシュされることはなく、インデックス関連コンテンツは前述のグローバルポリシーに従って書き込まれます。
3. グローバルなインデックス優先書き込みが無効な場合、Base/Cumulative Compaction専用パラメータは、該当する種類で**すでにキャッシュ書き込み対象と判断された**出力だけをさらに制限します。他の書き込みシナリオやクエリ読み取りパスには影響しません。
4. 3つのインデックス優先パラメータがすべて`false`の場合、既存の能動的なキャッシュ書き込み、適応型書き込み、およびCompaction出力保持動作が維持されます。

:::caution 注意

2つのCompaction専用パラメータが区別するのは、独立した転置インデックスファイルとSegmentファイルだけです。グローバルなインデックス優先モードで行われるSegmentフッター/内部インデックス範囲のプリロードは実行されません。独立した転置インデックスとSegment内部のインデックスおよびメタデータの両方を能動的に保持するには、`enable_file_cache_write_index_file_only`を使用してください。

:::

#### グローバルなインデックス優先書き込みを有効にする

すべてのBEノードの`be.conf`に次の設定を追加します。

```properties
enable_file_cache=true
enable_file_cache_write_index_file_only=true
enable_file_cache_write_base_compaction_index_only=false
enable_file_cache_write_cumu_compaction_index_only=false
```

期待される動作は次のとおりです。

| シナリオ | File Cacheへ能動的に書き込まれる内容 |
|---|---|
| データインポート、Schema Change、Cumulative Compaction、Base Compaction | Segmentデータは能動的に書き込まれません。Segmentフッター/内部インデックス範囲が同期的にプリロードされ、独立した転置インデックスファイルが書き込まれます |
| クエリによるデータページ読み取り | 動作は変わりません。キャッシュミス後も、既存の読み取りパスのルールに従ってSegmentデータがキャッシュへ投入される場合があります |
| キャッシュウォームアップ | 動作は変わりません |
| Packed File | パックされた小さなSegmentファイルはファイル全体としてキャッシュされません。パックされた独立した小さなインデックスファイルは、引き続きファイル全体としてキャッシュできます |

グローバルなインデックス優先モードでは、Segmentフッター/内部インデックス範囲は同期読み取りによってキャッシュへ書き込まれるため、`enable_flush_file_cache_async`の制御対象ではありません。独立した転置インデックスファイルは、既存の直接書き込みと非同期flushの動作を引き続き使用します。

#### Compaction出力だけを制限する

データインポートとSchema Changeの能動的なキャッシュ書き込みを変更せず、Compaction出力によるキャッシュ負荷だけを減らす場合は、次のように設定します。

```properties
enable_file_cache=true
enable_file_cache_write_index_file_only=false
enable_file_cache_write_base_compaction_index_only=true
enable_file_cache_write_cumu_compaction_index_only=true
```

Cumulative Compactionはデフォルトで出力をキャッシュへ書き込むため、対応するパラメータを有効にするとSegmentファイルをスキップし、独立した転置インデックスファイルだけを保持します。Base Compactionは、最初に`enable_file_cache_keep_base_compaction_output`と入力Rowsetのキャッシュヒット率に基づいて、出力をキャッシュするかどうかを決定します。Base Compaction用のインデックス優先パラメータは、その決定後にのみ書き込み内容を制限します。

#### 推奨事項

- 3つのパラメータはいずれもBEパラメータです。同じCompute Group内のすべてのBEノードで設定を統一し、ノードごとに異なるキャッシュ書き込みポリシーが適用されないようにしてください。
- 「インデックスのみ」は、File CacheにSegmentデータが一切存在しないことを意味しません。クエリがキャッシュミスしたデータページを読み取ると、Segmentデータがキャッシュへ投入される場合があります。
- このポリシーはデータインポートとCompactionによるキャッシュ汚染を抑制できますが、書き込み直後に大規模なデータスキャンを行うと、リモートストレージからの読み取りが増える可能性があります。実際のクエリ負荷で性能を検証し、Indexキューの退避量とSQL Profileのインデックス読み取りメトリクスを継続的に監視してください。

2. ファイルキャッシュのパスとサイズの設定

```plaintext
file_cache_path Default: storage directory under the BE deployment path
```
パラメータ説明: この設定項目は、ファイルキャッシュのパスとサイズを指定します。形式はJSON配列で、各要素は以下のフィールドを含むJSONオブジェクトです：

- `path`: キャッシュファイルが保存されるパス。
- `total_size`: このパス下でのキャッシュの総サイズ（バイト単位）。
- `ttl_percent`: TTLキューの割合（パーセンテージ）。
- `normal_percent`: Normalキューの割合（パーセンテージ）。
- `disposable_percent`: Disposableキューの割合（パーセンテージ）。
- `index_percent`: Indexキューの割合（パーセンテージ）。
- `storage`: キャッシュストレージのタイプ。`disk`または`memory`を指定可能。デフォルト値は`disk`です。

例：
- 単一パス設定：

```json
[{"path":"/path/to/file_cache","total_size":21474836480}]
```
- マルチパス設定:

```json
[{"path":"/path/to/file_cache","total_size":21474836480},{"path":"/path/to/file_cache2","total_size":21474836480}]
```
- メモリストレージ設定:

```json
[{"path": "xxx", "total_size":53687091200, "storage": "memory"}]
```
3. 自動キャッシュクリーンアップ

```plaintext
clear_file_cache Default: "false"
```
パラメータの説明: この設定項目はBE再起動時にキャッシュされたデータを自動的にクリアするかどうかを制御します。`true`に設定すると、BE再起動のたびにキャッシュが自動的にクリアされます。`false`に設定すると、キャッシュは自動的にクリアされません。

4. Pre-eviction Mechanism

```plaintext
enable_evict_file_cache_in_advance Default: "true"
```
- パラメータ説明：この設定項目は、事前削除メカニズムが有効になっているかどうかを制御します。`true`に設定された場合、キャッシュ領域が特定の閾値に達すると、システムは将来のクエリのための領域を解放するために積極的に事前削除を実行します。`false`に設定された場合、事前削除は実行されません。

```plaintext
file_cache_enter_need_evict_cache_in_advance_percent Default: "88"
```
- パラメータの説明：この設定項目は、事前削除をトリガーするしきい値の割合を設定します。キャッシュ領域/inode数がこの割合に達すると、システムは事前削除を開始します。

```plaintext
file_cache_exit_need_evict_cache_in_advance_percent Default: "85"
```
- パラメータ説明: この設定項目は、事前退避を停止する閾値パーセンテージを設定します。キャッシュ容量がこのパーセンテージまで低下すると、システムは事前退避を停止します。

## Cache Query Limit

Doris には、クエリ単位で File Cache を制御する独立した2つの方式があります。クエリがすでに占有しているキャッシュ容量を制限するのか、後続のキャッシュ書き込みを停止するのかに応じてパラメータを選択してください。

| 制御方式 | 主なパラメータ | 制限到達後の動作 | 適用シナリオ |
|---|---|---|---|
| キャッシュ占有率による制限 | `file_cache_query_limit_percent` | 新しいキャッシュブロックの書き込みは継続できます。BE はまず現在のクエリに記録された解放可能なブロックを削除し、必要に応じて他のキャッシュキューからも削除します | 後続のキャッシュ書き込みを許可しながら、単一クエリのキャッシュ占有量を制限する |
| リモートスキャンの書き込みをバイト閾値で停止 | `file_cache_query_limit_bytes` | 次のキャッシュブロックによって許可済みバイト数が閾値を超える場合、その BE 上でクエリは remote-only-on-miss 状態になります。以降のキャッシュミスはリモートストレージから読み取られ、File Cache には書き込まれません | 大規模なリモートスキャンによるキャッシュ書き込みとキャッシュの入れ替わりを抑制する |

### キャッシュ占有率による制限

> この機能はバージョン4.0.3以降でサポートされています。

キャッシュ占有率による制限は、単一クエリが各 File Cache インスタンスで使用できる最大割合を制御します。複数のユーザーや複雑なクエリがキャッシュリソースを共有する場合に、1つの大規模クエリが過剰なキャッシュを保持して他のホットデータを削除するリスクを軽減します。

この機能には、BE設定、FE設定、およびセッション変数の3つの設定が関係します。

**BE設定**

| パラメータ | 型 | デフォルト値 | 説明 |
|---|---|---|---|
| `enable_file_cache_query_limit` | Boolean | `false` | BE側のキャッシュクエリ制限のマスタースイッチです。有効な場合のみ、BEはFEから渡されたクエリ制限パラメータを処理します |

**FE設定**

| パラメータ | 型 | デフォルト値 | 説明 |
|---|---|---|---|
| `file_cache_query_limit_max_percent` | Integer | `100` | クエリクォータの最大値です。セッション変数の上限を検証するために使用されます |

**セッション変数**

| 変数 | 型 | デフォルト値 | 説明 |
|---|---|---|---|
| `file_cache_query_limit_percent` | Integer | `-1` | 明示的に設定する場合、値は `[1, file_cache_query_limit_max_percent]` の範囲内である必要があります。単一クエリが使用できるキャッシュの最大割合を指定します。算出されたキャッシュクォータは256 MB以上を推奨します。これより小さい場合、BEはログに警告を出力します |

この制御を使用する前に、BEで `enable_file_cache` と `enable_file_cache_query_limit` の両方を有効にし、クエリセッションの `enable_file_cache` が `true` であることを確認してください。

**使用例**

```sql
-- 単一クエリが使用できるキャッシュを最大50%に制限する
SET file_cache_query_limit_percent = 50;

-- クエリを実行する
SELECT * FROM large_table;
```

後続のキャッシュミスも File Cache に書き込むことができます。クエリのキャッシュ占有量がクォータを超えると、BEはクエリ単位のLRU記録と他のキャッシュキューを使用して領域を解放します。この制御によって、クエリが「以降はキャッシュへ書き込まない」モードに切り替わることはありません。

### リモートスキャンのキャッシュ書き込みをバイト閾値で停止する

`file_cache_query_limit_bytes` は、単一の SELECT クエリについて、リモートスキャンのキャッシュミスにより read-through で File Cache へ書き込むことを許可された累積バイト数を、**各 BE** で制限します。この機能は、ストレージ・コンピューティング分離モードでBEの `enable_file_cache=true` の場合にのみ有効です。`enable_file_cache_query_limit` または `file_cache_query_limit_max_percent` には依存しません。

同一クエリの並列Scannerは、1つのBE上で同じ閾値を共有します。ただし、この閾値はクエリ全体またはクラスタ全体の合計値ではありません。たとえば、10台のBEで実行するクエリに1 GiBを設定した場合、全BEの合計が1 GiBになるのではなく、各BEがそれぞれ約1 GiBまで許可できます。

**パラメータ**

| パラメータ | 設定場所 | 型 | デフォルト値 | 必須 | 説明 |
|---|---|---|---|---|---|
| `file_cache_query_limit_bytes` | セッション変数 | BigInt | `-1` | はい | 単一クエリについて、各BEで許可するリモートスキャンのキャッシュ書き込み閾値です。単位はバイトです。`0`未満では無効、`0`ではクエリ開始時からキャッシュへ書き込まず、正の値ではキャッシュブロック単位で許可済みバイト数を累積します |
| `enable_file_cache_query_limit_segment_meta` | BE設定 | Boolean | `false` | いいえ | Segment footerとSegmentメタデータのキャッシュ書き込みを同じバイト閾値に含めるかどうかを指定します。このパラメータは動的に変更できます。この制御が有効な場合、データページと転置インデックスの書き込みは常にバイト閾値の対象です |

`file_cache_query_limit_bytes` の値による動作は次のとおりです。

| 値 | 動作 |
|---|---|
| `< 0` | この制御を無効にし、従来のキャッシュミス時の書き込み動作を維持します |
| `= 0` | クエリ開始時から各BEでremote-only-on-miss状態になります。要求範囲がローカルキャッシュで完全にカバーされている場合はローカルから読み取れます。完全にカバーされていない範囲はリモートストレージから直接読み取り、キャッシュへ書き込みません |
| `> 0` | 累積の許可済みバイト数が閾値を超えないキャッシュブロックの書き込みを許可します。次のブロックで閾値を超える場合、そのブロックを拒否し、そのBE上の同一クエリによる後続のキャッシュミスはキャッシュへ書き込みません |

許可判定はキャッシュブロック単位で行われるため、実際の書き込み量が閾値と完全に一致するとは限りません。残りの容量が次のキャッシュブロックより小さい場合、そのブロック全体がスキップされ、残りの容量が後続の小さいブロックに使用されることはありません。クエリがBE上でremote-only-on-miss状態になると、そのBEではキャッシュ書き込みを再開しません。

**リモートスキャンのキャッシュ書き込み量を制限する**

次の例では、`large_table` がストレージ・コンピューティング分離クラスタにあり、すべてのBEでFile Cacheが有効であることを前提とします。各BEで最大1 GiBのリモートスキャンキャッシュブロックを許可します。

```sql
SET enable_profile = true;
SET profile_level = 2;
SET file_cache_query_limit_bytes = 1073741824;

SELECT COUNT(*) FROM large_table;
```

クエリ結果は変わりません。あるBEで次のキャッシュブロックによって許可済みバイト数が1 GiBを超える場合、そのBE上の同一クエリによる後続のキャッシュミスはリモートデータを読み取り、ローカルキャッシュへ追加で書き込みません。

一時的なスキャンで最初からFile Cacheへ書き込みたくない場合は閾値を `0` に設定し、クエリ終了後にデフォルト値へ戻します。

```sql
SET file_cache_query_limit_bytes = 0;
SELECT COUNT(*) FROM large_table;

SET file_cache_query_limit_bytes = -1;
```

**Segmentメタデータを含めるかどうか**

デフォルトでは、データページと転置インデックスのキャッシュ書き込みは閾値に含まれますが、Segment footerとSegmentメタデータは含まれません。そのため、クエリがremote-only-on-miss状態になった後もSegment footerとメタデータがFile Cacheへ書き込まれる可能性があり、Profileに表示される合計書き込み量が `file_cache_query_limit_bytes` を超えることがあります。

Segment footerとメタデータの書き込みも停止するには、同じCompute GroupのすべてのBEで次を設定します。

```properties
enable_file_cache_query_limit_segment_meta=true
```

このパラメータはBEの動的設定APIから即時に変更できます。再起動後も維持するには、`be.conf` に追加するか、永続化オプション付きの動的設定を使用します。詳細は[BE設定](../../admin-manual/config/be-config.md)を参照してください。

**Query Profileで確認する**

Query Profileを有効にした後、Scanner配下の `FileCache` メトリックグループを確認します。

| メトリック | 説明 |
|---|---|
| `RemoteOnlyOnMissTriggered` | 値が `1` の場合、そのScannerがクエリのremote-only-on-miss状態への移行を確認したことを示します |
| `RemoteOnlyOnMissThresholdBytes` | クエリに設定されたバイト閾値 |
| `BytesWriteIntoCache` | File Cacheへ実際に書き込まれた合計バイト数 |
| `InvertedIndexBytesWriteIntoCache` | File Cacheへ実際に書き込まれた転置インデックスのバイト数 |
| `SegmentFooterIndexBytesWriteIntoCache` | File Cacheへ実際に書き込まれたSegment footerとメタデータのバイト数 |
| `NumSkipCacheIOTotal` | キャッシュをスキップしたI/O回数です。他のキャッシュポリシーによってスキップされたI/Oも含まれるため、`RemoteOnlyOnMissTriggered` と合わせて判断してください |

許可済みバイト数が閾値と完全に一致し、クエリ終了までに閾値を超える新しいキャッシュブロックがない場合、`RemoteOnlyOnMissTriggered` は `0` のままになることがあります。状態は、後続のブロックによって閾値を超える場合にのみ切り替わります。

**推奨事項と注意事項**

- 一時的なフルスキャン、再利用率の低いETL、またはアドホッククエリでは、小さい正の閾値または `0` を使用してクエリ開始時からキャッシュへの書き込みを停止し、コールドデータによるホットデータの置き換えを防ぎます。
- このパラメータが制限するのは、クエリ読み取り時のキャッシュミス後に行われるFile Cacheへの書き込みです。リモート読み取り量を制限したり、クエリを終了したりするものではなく、ロード、Compaction、Schema Change、または明示的なキャッシュウォームアップによる書き込みにも影響しません。
- remote-only-on-miss状態でも、要求範囲がローカルキャッシュで完全にカバーされている場合はローカルから読み取れます。完全にカバーされていない範囲はリモートストレージへ直接アクセスするため、オブジェクトストレージI/Oとクエリレイテンシが増加する可能性があります。
- クエリが保持するキャッシュ占有率を制限しながら、後続のキャッシュミスによる書き込みを許可する場合は `file_cache_query_limit_percent` を使用します。一定量を許可した後の書き込みを停止する場合は `file_cache_query_limit_bytes` を使用します。
- Segment footerとメタデータをデフォルトで対象外にすることで、再利用率の高いメタデータのキャッシュ効果を維持できます。閾値到達後にこれらの書き込みも停止する必要がある場合のみ `enable_file_cache_query_limit_segment_meta` を有効にし、Query Profileで結果を確認してください。

## Cache Warm Up

Dorisは、ユーザーがリモートストレージからローカルキャッシュにデータを積極的に取得できるキャッシュウォームアップ機能を提供しています。この機能は以下の3つのモードをサポートしています：

- **Inter-Compute Group Warming**: Compute Group AのキャッシュデータをCompute Group Bにウォームアップします。Dorisは定期的に各compute group内で一定期間にアクセスされたテーブル/パーティションのホットスポット情報を収集し、この情報に基づいて特定のテーブル/パーティションを選択的にウォームアップします。
- **Table Data Warming**: Table Aのデータを新しいcompute groupにウォームアップするよう指定します。
- **Partition Data Warming**: Table Aのパーティション`p1`のデータを新しいcompute groupにウォームアップするよう指定します。

具体的な使用方法については、[WARM-UP SQLドキュメント](#)を参照してください。

## Cache Cleanup

Dorisは同期と非同期の両方のクリーンアップ方法を提供しています：

- 同期クリーンアップ：コマンドは`curl 'http://BE_IP:WEB_PORT/api/file_cache?op=clear&sync=true'`です。コマンドが戻ると、クリーンアップが完了したことを示します。Dorisがキャッシュを即座にクリアする必要がある場合、ローカルファイルシステムディレクトリ内のキャッシュファイルを同期的に削除し、メモリ内の管理メタデータをクリーンアップします。この方法はスペースを素早く解放できますが、進行中のクエリの効率やシステムの安定性にも一定の影響を与える可能性があります。通常は迅速なテスト用途で使用されます。
- 非同期クリーンアップ：コマンドは`curl 'http://BE_IP:WEB_PORT/api/file_cache?op=clear&sync=false'`です。コマンドは即座に戻り、クリーンアップ手順は非同期で実行されます。非同期クリーンアップ中、Dorisはメモリ内の管理メタデータを走査し、対応するキャッシュファイルを1つずつ削除します。一部のキャッシュファイルがクエリで使用されていることを発見した場合、Dorisはそれらのファイルがもはや使用されなくなるまで削除を遅延させます。この方法は進行中のクエリへの影響を軽減できますが、通常は同期クリーンアップと比較してキャッシュを完全にクリーンアップするのにより長い時間がかかります。

## Cache Observation

### ホットスポット情報

Dorisは各compute groupのキャッシュホットスポット情報を10分ごとに収集し、内部システムテーブルに保存します。このホットスポット情報はクエリステートメントを使用して表示できます。ユーザーはこの情報に基づいてキャッシュ使用をより適切に計画できます。

:::info 注意
バージョン3.0.4以前では、`SHOW CACHE HOTSPOT`ステートメントを使用してキャッシュホットスポット情報の統計をクエリできました。バージョン3.0.4以降、`SHOW CACHE HOTSPOT`ステートメントはキャッシュホットスポット情報統計のクエリをサポートしなくなりました。システムテーブル`__internal_schema.cloud_cache_hotspot`を直接クエリしてください。
:::

ユーザーは通常、compute groupとデータベーステーブルの2つのレベルでキャッシュ使用情報に注目します。以下では、よく使用されるクエリステートメントと例を提供します。

#### 全Compute Groupで最も頻繁にアクセスされるテーブルの表示

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
#### 特定のコンピュートグループ下で最も頻繁にアクセスされるテーブルの表示

コンピュートグループ`compute_group_name0`下で最も頻繁にアクセスされるテーブルを表示します。

注意：条件`cluster_name = "compute_group_name0"`を実際のコンピュートグループ名に置き換えてください。

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
  WHERE cluster_name = "compute_group_name0" -- Replace with the actual compute group name, e.g., "default_compute_group"
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
#### 特定のCompute Groupとテーブルで最もアクセス頻度の高いパーティションの表示

compute group `compute_group_name0`配下のテーブル`regression_test_cloud_load_copy_into_tpch_sf1_p1.customer`で最もアクセス頻度の高いパーティションを表示します。

注意: 条件`cluster_name = "compute_group_name0"`と`table_name = "regression_test_cloud_load_copy_into_tpch_sf1_p1.customer"`を実際のcompute group名とデータベーステーブル名に置き換えてください。

```sql
-- Equivalent to SHOW CACHE HOTSPOT '/compute_group_name0/regression_test_cloud_load_copy_into_tpch_sf1_p1.customer' before version 3.0.4
SELECT
  partition_id AS PartitionId,
  partition_name AS PartitionName
FROM __internal_schema.cloud_cache_hotspot
WHERE
  cluster_name = "compute_group_name0" -- Replace with the actual compute group name, e.g., "default_compute_group"
  AND table_name = "regression_test_cloud_load_copy_into_tpch_sf1_p1.customer" -- Replace with the actual database table name, e.g., "db1.t1"
GROUP BY
  cluster_id,
  cluster_name,
  table_id,
  table_name,
  partition_id,
  partition_name;
```
### キャッシュ容量とヒット率

Doris BEノードは、`curl {be_ip}:{brpc_port}/vars`（brpc_portはデフォルトで8060）を使用してキャッシュ統計を取得でき、メトリック名はディスクパスで始まります。

上記の例では、File Cacheのメトリックプレフィックスはパスです。例えば、プレフィックス「_mnt_disk1_gavinchou_debug_doris_cloud_be0_storage_file_cache_」は「/mnt/disk1/gavinchou/debug/doris-cloud/be0_storage_file_cache/」を示します。
プレフィックスの後の部分は統計メトリックです。例えば、「file_cache_cache_size」は、このパスでのFile Cacheの現在のサイズが26111バイトであることを示します。

以下の表は、すべてのメトリックの意味を示しています（すべてのサイズ単位はバイト）：

| メトリック名（パスプレフィックスを除く）          | 意味                                                      |
| -------------------------------------------- | ------------------------------------------------------------ |
| file_cache_cache_size                        | File Cacheの現在の総サイズ                         |
| file_cache_disposable_queue_cache_size       | disposableキューの現在のサイズ                         |
| file_cache_disposable_queue_element_count    | disposableキュー内の現在の要素数           |
| file_cache_disposable_queue_evict_size       | 起動以降にdisposableキューから削除されたデータの総量 |
| file_cache_index_queue_cache_size            | indexキューの現在のサイズ                              |
| file_cache_index_queue_element_count         | indexキュー内の現在の要素数                |
| file_cache_index_queue_evict_size            | 起動以降にindexキューから削除されたデータの総量 |
| file_cache_normal_queue_cache_size           | normalキューの現在のサイズ                             |
| file_cache_normal_queue_element_count        | normalキュー内の現在の要素数               |
| file_cache_normal_queue_evict_size           | 起動以降にnormalキューから削除されたデータの総量 |
| file_cache_total_evict_size                  | 起動以降にFile Cache全体から削除されたデータの総量 |
| file_cache_ttl_cache_evict_size              | 起動以降にTTLキューから削除されたデータの総量 |
| file_cache_ttl_cache_lru_queue_element_count | TTLキュー内の現在の要素数                  |
| file_cache_ttl_cache_size                    | TTLキューの現在のサイズ                                |
| file_cache_evict_by_heat\_[A]\_to\_[B]       | キャッシュタイプBによってキャッシュタイプAから削除されたデータ（時間ベースの期限切れ） |
| file_cache_evict_by_size\_[A]\_to\_[B]       | キャッシュタイプBによってキャッシュタイプAから削除されたデータ（容量ベースの期限切れ） |
| file_cache_evict_by_self_lru\_[A]            | 新しいデータのためにキャッシュタイプAが自身のLRUポリシーによって削除したデータ |

### SQL Profile

SQLプロファイル内のキャッシュ関連メトリックは、SegmentIterator配下にあります：

| メトリック名            | 意味                                                      |
| ---------------------- | ------------------------------------------------------------ |
| BytesScannedFromCache  | File Cacheから読み取られたデータ量                      |
| BytesScannedFromRemote | リモートストレージから読み取られたデータ量                      |
| BytesWriteIntoCache    | File Cacheに書き込まれたデータ量                   |
| LocalIOUseTimer        | File Cacheからの読み取りにかかった時間                       |
| NumLocalIOTotal        | File Cacheが読み取られた回数                      |
| NumRemoteIOTotal       | リモートストレージが読み取られた回数                      |
| NumSkipCacheIOTotal    | リモートストレージから読み取られたデータがFile Cacheに入らなかった回数 |
| RemoteIOUseTimer       | リモートストレージからの読み取りにかかった時間                       |
| WriteCacheIOUseTimer   | File Cacheへの書き込みにかかった時間                        |

インデックス優先書き込みを有効にした後は、次の分類メトリクスを確認し、独立した転置インデックスとSegmentフッター/内部インデックスがキャッシュにヒットしているかを判断できます。

| メトリクス名 | 意味 |
|---|---|
| `InvertedIndexBytesScannedFromCache` / `InvertedIndexBytesScannedFromRemote` | File Cache / リモートストレージから読み取った独立した転置インデックスのデータ量 |
| `InvertedIndexNumLocalIOTotal` / `InvertedIndexNumRemoteIOTotal` | 独立した転置インデックスのローカル / リモート読み取り回数 |
| `InvertedIndexLocalIOUseTimer` / `InvertedIndexRemoteIOUseTimer` | 独立した転置インデックスのローカル / リモート読み取り時間 |
| `SegmentFooterIndexBytesScannedFromCache` / `SegmentFooterIndexBytesScannedFromRemote` | File Cache / リモートストレージから読み取ったSegmentフッターおよび内部インデックスのデータ量 |
| `SegmentFooterIndexNumLocalIOTotal` / `SegmentFooterIndexNumRemoteIOTotal` | Segmentフッターおよび内部インデックスのローカル / リモート読み取り回数 |
| `SegmentFooterIndexLocalIOUseTimer` / `SegmentFooterIndexRemoteIOUseTimer` | Segmentフッターおよび内部インデックスのローカル / リモート読み取り時間 |

[Query Performance Analysis](../../query-acceleration/performance-tuning-overview/analysis-tools#doris-profile)でクエリパフォーマンス分析を表示できます。



## TTL使用方法

テーブル作成時に、対応するPROPERTYを設定して、そのテーブルのデータのキャッシュにTTL戦略を使用します。

- `file_cache_ttl_seconds`：新しくインポートされたデータがキャッシュに残ることが期待される時間（秒）。

```shell
CREATE TABLE IF NOT EXISTS customer (
  C_CUSTKEY     INTEGER NOT NULL,
  C_NAME        VARCHAR(25) NOT NULL,
  C_ADDRESS     VARCHAR(40) NOT NULL,
  C_NATIONKEY   INTEGER NOT NULL,
  C_PHONE       CHAR(15) NOT NULL,
  C_ACCTBAL     DECIMAL(15,2)   NOT NULL,
  C_MKTSEGMENT  CHAR(10) NOT NULL,
  C_COMMENT     VARCHAR(117) NOT NULL
)
DUPLICATE KEY(C_CUSTKEY, C_NAME)
DISTRIBUTED BY HASH(C_CUSTKEY) BUCKETS 32
PROPERTIES(
    "file_cache_ttl_seconds"="300"
)
```
上記のテーブルでは、新しくインポートされたすべてのデータが300秒間キャッシュに保持されます。システムは現在、テーブルのTTL時間の変更をサポートしており、ユーザーは実際のニーズに基づいてTTL時間を延長または短縮できます。

```SQL
ALTER TABLE customer set ("file_cache_ttl_seconds"="3000");
```
:::info Note

変更されたTTL値はすぐには有効にならず、一定の遅延があります。

テーブル作成時にTTLが設定されていない場合でも、ユーザーはALTER文を実行することでテーブルのTTL属性を変更できます。
:::


## 実用例

あるユーザーが一連のデータテーブルを持っており、総データ量は3TBを超えているものの、利用可能なキャッシュ容量は1.2TBのみです。その中で、アクセス頻度の高いテーブルが2つあります。1つは200MBのサイズのディメンションテーブル（`dimension_table`）で、もう1つは100GBのサイズのファクトテーブル（`fact_table`）です。このファクトテーブルには毎日新しいデータがインポートされ、T+1クエリ操作が必要です。さらに、その他の大きなテーブルはアクセス頻度が低くなっています。

LRUキャッシュ戦略の下では、大きなテーブルのデータがクエリされると、キャッシュに残る必要がある小さなテーブルのデータが置き換えられ、パフォーマンスの変動を引き起こす可能性があります。この問題を解決するために、ユーザーはTTLキャッシュ戦略を採用し、2つのテーブルのTTL時間をそれぞれ1年と1日に設定します。

```shell
ALTER TABLE dimension_table set ("file_cache_ttl_seconds"="31536000");

ALTER TABLE fact_table set ("file_cache_ttl_seconds"="86400");
```
ディメンションテーブルについては、サイズが小さく変動も少ないため、ユーザーは1年間のデータに素早くアクセスできるようにTTL時間を1年に設定します。ファクトテーブルについては、ユーザーは毎日テーブルバックアップを実行してからフルインポートを行う必要があるため、TTL時間を1日に設定します。
