---
{
    "title": "TOPN クエリ最適化：ORDER BY LIMIT の高速化原理と設定",
    "language": "ja",
    "description": "Doris は ORDER BY LIMIT クエリをどのように高速化するのでしょうか。この記事では、TOPN 最適化の原理、適用上の制約、セッションパラメータ、実行計画の確認方法、ストレージとコンピューティングを分離した環境における遅延マテリアライゼーションの第 2 フェーズ向け File Cache ポリシーを説明します。",
    "keywords": ["Doris TOPN optimization", "ORDER BY LIMIT acceleration", "topn_opt_limit_threshold", "enable_topn_lazy_mat_phase2_no_write_file_cache", "two-phase read", "File Cache", "RuntimePredicate", "Zonemap filtering"]
}
---

<!-- Knowledge type: concept + configuration + troubleshooting -->
<!-- Applicable scenarios: log search, detail query, sorted pagination -->

## 一言でいうと {#one-sentence-definition}

TOPN クエリ最適化は、`ORDER BY ... LIMIT n` クエリを自動的に高速化する Doris の機能です。動的フィルタリング、範囲の枝刈り、遅延マテリアライゼーションによって、スキャンとソートの負荷を大幅に削減します。

## 読む前のチェックリスト {#pre-reading-checklist}

- [ ] SQL が `SELECT ... FROM t WHERE ... ORDER BY c1, c2 ... LIMIT n` の形式である
- [ ] テーブルの種類が Duplicate テーブルまたは Unique MOW テーブルである（MOR ではない）
- [ ] `n` が小さい（`topn_opt_limit_threshold` 未満。デフォルトは 1024）
- [ ] EXPLAIN と Profile で最適化が有効か確認したい

## 典型的な SQL パターン {#typical-sql-pattern}

TOPN クエリは、ログ検索などの詳細データを取得する場面でよく使われます。Doris は次のようなクエリを自動的に認識して最適化します。

```sql
SELECT * FROM tablex WHERE xxx ORDER BY c1, c2 ... LIMIT n
```

<!-- Knowledge type: principle -->
<!-- Applicable scenarios: understanding how Doris internally accelerates ORDER BY LIMIT -->

## 3 つの最適化ポイント {#three-optimization-points}

| 番号 | 最適化 | 原理 | 主な効果 |
| :--- | :--- | :--- | :--- |
| 最適化 1 | 動的な範囲フィルタリング（RuntimePredicate） | ソート中にソート列の範囲条件（`c1 >= 10000` など）を動的に生成し、スキャンにプッシュダウンする | Zonemap インデックスを使い、ファイル全体を含む大量のデータを除外できる |
| 最適化 2 | キープレフィックスによる短絡読み取り | ソート列 `c1, c2` がテーブルキーの先頭部分と完全に一致する場合、データファイルの先頭または末尾の n 行だけを読み取る | ディスクからの読み取りを大幅に削減できる |
| 最適化 3 | 2 フェーズの遅延マテリアライゼーション | 第 1 フェーズではソート列のみを読み取ってソートし、行番号を取得する。第 2 フェーズでその他の列を読み取る | 読み取りとソートが必要な列の数を大幅に削減できる |

<!-- Knowledge type: limitation -->
<!-- Applicable scenarios: determining whether the current query can benefit from TOPN optimization -->

## 適用上の制約 {#applicable-limitations}

1. **テーブルの種類に関する制約**：Duplicate テーブルと Unique MOW テーブルのみをサポートします。Unique MOR テーブルでこの最適化を使用すると、誤った結果が返される可能性があります。
2. **n の値に関する制約**：`n` が大きすぎると、この最適化によるメモリ消費量が大幅に増加します。`n` がセッション変数 `topn_opt_limit_threshold` を超える場合、最適化は有効になりません。

<!-- Knowledge type: configuration -->
<!-- Applicable scenarios: tuning or disabling TOPN optimization -->

3. **2 フェーズ読み取りに関する制約**：4.1.5 以降、Doris 内部テーブルの TopN 遅延マテリアライゼーションには `light_schema_change` が必要で、Aggregate Key テーブルはサポートされません。条件を満たさない場合、Doris は通常の TopN 実行パスを使用し、クエリは引き続き実行できます。

## 設定パラメータ {#configuration-parameters}

以下の 4 つはすべてセッション変数です。個々の SQL 文に対して、またはグローバルに設定できます。

| パラメータ | デフォルト値 | 作用 | 調整の目安 |
| :--- | :--- | :--- | :--- |
| `topn_opt_limit_threshold` | 1024 | LIMIT n がこの値未満の場合にのみ TOPN 最適化を有効にする | `0` に設定すると TOPN 最適化全体を無効にできる |
| `enable_two_phase_read_opt` | true | 最適化 3（2 フェーズの遅延マテリアライゼーション）を有効にするかどうかを指定する | `false` に設定すると最適化 3 のみを無効にできる |
| `topn_filter_ratio` | 0.5 | LIMIT n とテーブルの総データ量の比率に対するしきい値 | LIMIT 件数がテーブルデータの半分を超えると、フィルタは生成されなくなる |
| `enable_topn_lazy_mat_phase2_no_write_file_cache` | false | ストレージとコンピューティングを分離したモードで、Doris 内部テーブルの遅延マテリアライゼーションの第 2 フェーズにおいて、File Cache のミス時にキャッシュへの書き戻しを省略するかどうかを制御する | 第 2 フェーズの読み取りデータが再利用されにくく、キャッシュを圧迫する可能性がある場合にのみ有効にする |

<!-- Knowledge type: operation -->
<!-- Applicable scenarios: verifying whether TOPN optimization is enabled -->

## TOPN 最適化が有効か確認する {#check-whether-topn-optimization-is-enabled}

**目的**：実行計画を使って、現在の SQL でどの最適化ポイントが有効になっているかを判定します。

**コマンド**：

```sql
EXPLAIN <your_sql>;
```

**説明**：Query Plan で次のマーカーを確認します。

- `TOPN OPT`：**最適化 1**（動的な範囲フィルタリング）が有効
- `VOlapScanNode` の下の `SORT LIMIT`：**最適化 2**（キープレフィックスによる短絡読み取り）が有効
- `MaterializeNode`（古い実行計画では `OPT TWO PHASE`）：**最適化 3**（2 フェーズの遅延マテリアライゼーション）が有効

**例**：

```sql
  1:VTOP-N(137)
  |  order by: @timestamp18 DESC
  |  TOPN OPT
  |  OPT TWO PHASE
  |  offset: 0
  |  limit: 10
  |  distribute expr lists: applicationName5
  |
  0:VOlapScanNode(106)
     TABLE: log_db.log_core_all_no_index(log_core_all_no_index), PREAGGREGATION: ON
     SORT INFO:
          @timestamp18
     SORT LIMIT: 10
     TOPN OPT:1
     PREDICATES: ZYCFC-TRACE-ID4 like '%flowId-1720055220933%'
     partitions=1/8 (p20240704), tablets=250/250, tabletList=1727094,1727096,1727098 ...
     cardinality=345472780, avgRowSize=0.0, numNodes=1
     pushAggOp=NONE
```

<!-- Knowledge type: configuration + operation + troubleshooting -->
<!-- Applicable scenarios: controlling File Cache writes during TOPN lazy materialization phase 2 in clusters with storage-compute separation -->

## 遅延マテリアライゼーションの第 2 フェーズにおける File Cache への書き込みを制御する {#control-file-cache-writes-during-lazy-materialization-phase-2}

ストレージとコンピューティングを分離したクラスターでは、TOPN 遅延マテリアライゼーションの第 2 フェーズで、第 1 フェーズが選択した行 ID を使って残りの列を読み取ります。少数の結果行が多数の Segment に散在している場合、これらの分散した読み取りによって取り込まれたキャッシュブロックは再利用されにくく、頻繁に使われるデータをキャッシュから追い出す可能性があります。その場合は `enable_topn_lazy_mat_phase2_no_write_file_cache` を有効にすると、第 2 フェーズはキャッシュミス時にリモートストレージから直接読み取り、File Cache に書き戻さなくなります。

この変数はクエリ結果を変更しません。変更するのは、第 2 フェーズにおける File Cache ミスの処理方法だけです。

| 設定 | 第 2 フェーズの読み取り動作 |
| :--- | :--- |
| `false`（デフォルト） | 通常の読み取りと書き戻しのポリシーを使用する。キャッシュミス時には Doris がリモートデータを読み取り、File Cache に書き込む |
| `true` | `DOWNLOADED` 状態のキャッシュブロックが現在の読み取り範囲全体を覆っている場合にのみ、ローカルキャッシュから読み取る。一部でも未キャッシュ、またはダウンロード中の場合は、現在の読み取り範囲全体をリモートストレージから読み取り、キャッシュブロックの作成も書き込みも行わない |

この変数を有効にする前に、次の適用範囲を確認してください。

- ストレージとコンピューティングを分離したモードでのみ有効で、Doris 内部テーブルの TOPN 遅延マテリアライゼーションの第 2 フェーズだけを制御します。現在、外部テーブルの第 2 フェーズの読み取りは制御しません。
- 行ストアが有効な Doris 内部テーブルと、無効な Doris 内部テーブルの両方をサポートします。
- 既存のキャッシュエントリは削除せず、第 1 フェーズ、他のクエリ、他のオペレーターによるキャッシュへの書き込みも変更しません。そのため、クエリ全体の File Cache への書き込み量は 0 を超える場合があります。
- File Cache が無効な場合、または実行計画に `MaterializeNode` が含まれない場合、追加の効果はありません。

### 基本的な使い方 {#basic-usage}

次の例には、ストレージとコンピューティングを分離したクラスター、BE で有効になっている File Cache、および対象データベースでテーブルの作成と削除、データの挿入とクエリを実行できるユーザーが必要です。まず、Duplicate Key の内部テーブルを作成します。

```sql
DROP TABLE IF EXISTS topn_file_cache_demo;

CREATE TABLE topn_file_cache_demo (
    id BIGINT NOT NULL,
    event_time DATETIME NOT NULL,
    payload VARCHAR(128) NOT NULL
)
ENGINE=OLAP
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES (
    "replication_num" = "1",
    "light_schema_change" = "true"
);

INSERT INTO topn_file_cache_demo VALUES
    (1, '2026-01-01 10:00:00', 'alpha'),
    (2, '2026-01-02 10:00:00', 'beta'),
    (3, '2026-01-03 10:00:00', 'gamma');
```

Profile と第 2 フェーズの書き戻しを行わないポリシーを有効にし、実行計画を確認してからクエリを実行します。

```sql
SET enable_profile = true;
SET profile_level = 2;
SET enable_sql_cache = false;
SET enable_query_cache = false;
SET enable_topn_lazy_mat_phase2_no_write_file_cache = true;

EXPLAIN SELECT id, payload
FROM topn_file_cache_demo
ORDER BY event_time DESC
LIMIT 2;

SELECT id, payload
FROM topn_file_cache_demo
ORDER BY event_time DESC
LIMIT 2;
```

実行計画には `MaterializeNode` が含まれるはずです。変数が有効かどうかにかかわらず、クエリは次の結果を返します。

```text
+----+---------+
| id | payload |
+----+---------+
|  3 | gamma   |
|  2 | beta    |
+----+---------+
2 rows in set
```

デフォルトのキャッシュ書き戻し動作に戻すには、次を実行します。

```sql
SET enable_topn_lazy_mat_phase2_no_write_file_cache = false;
```

### Profile でキャッシュポリシーを確認する {#verify-the-cache-policy-in-profile}

`profile_level` を `2` に設定した後、Query Profile で `MaterializeNode` に対応する実行オペレーターの下にある、次の第 2 フェーズ固有の指標を確認します。

| 観点 | 集計指標 | 意味 |
| :--- | :--- | :--- |
| 読み取り規模 | `TopNLazyMaterializationSecondPhaseRowsRead`、`TopNLazyMaterializationSecondPhaseSegmentsRead` | 第 2 フェーズで読み取った行数とアクセスした Segment 数 |
| ローカルキャッシュからの読み取り | `TopNLazyMaterializationSecondPhaseLocalIOCount`、`TopNLazyMaterializationSecondPhaseLocalIOBytes`、`TopNLazyMaterializationSecondPhaseLocalIOTime` | File Cache からの読み取り回数、バイト数、所要時間 |
| リモートからの読み取り | `TopNLazyMaterializationSecondPhaseRemoteIOCount`、`TopNLazyMaterializationSecondPhaseRemoteIOBytes`、`TopNLazyMaterializationSecondPhaseRemoteIOTime` | リモートストレージからの読み取り回数、バイト数、所要時間 |
| キャッシュへの書き込みの省略 | `TopNLazyMaterializationSecondPhaseSkipCacheIOCount` | File Cache に書き込まれなかったリモート読み取りの回数 |
| キャッシュへの書き込み | `TopNLazyMaterializationSecondPhaseWriteCacheBytes`、`TopNLazyMaterializationSecondPhaseWriteCacheIOTime` | File Cache に書き込んだバイト数と所要時間 |

書き戻しを行わないポリシーが有効な場合は、次の指標パターンで動作を確認できます。

| キャッシュの状態 | 予想される指標のパターン |
| :--- | :--- |
| 現在の読み取り範囲が完全にはキャッシュされていない | `RemoteIOCount`、`RemoteIOBytes`、`SkipCacheIOCount` が 0 を超え、`WriteCacheBytes` は 0 |
| ダウンロード済みのキャッシュブロックが現在の読み取り範囲全体を覆っている | `LocalIOCount` と `LocalIOBytes` が 0 を超え、`RemoteIOCount`、`RemoteIOBytes`、`WriteCacheBytes` は 0 |

Profile には BE ごとの指標もあります。`TopNLazyMaterializationSecondPhasePerBackend` には BE の一覧が表示されます。その他の指標名には、`SecondPhase` の後に `PerBackend` が追加されます。たとえば、`TopNLazyMaterializationSecondPhasePerBackendRowsRead` や `TopNLazyMaterializationSecondPhasePerBackendWriteCacheBytes` です。配列の要素はインデックスによって BE の一覧に対応し、同じクエリ内で行われた複数の第 2 フェーズのフェッチ結果が累積されます。

:::note
`TopNLazyMaterializationSecondPhaseWriteCacheBytes` が対象とするのは、遅延マテリアライゼーションの第 2 フェーズのみです。一般的な File Cache 指標に引き続き書き込みが表示される場合は、まず第 1 フェーズまたは別のオペレーターによるものか確認してください。Profile の取得方法については、[Query Profile の分析](../query-profile.md)を参照してください。
:::

<!-- Knowledge type: operation -->
<!-- Applicable scenarios: evaluating the actual benefit of TOPN optimization -->

## TOPN 最適化の実行効果を確認する {#check-the-execution-effect-of-topn-optimization}

**目的**：実行時間と Profile 指標を比較し、TOPN 最適化による実際のフィルタリング効果を確認します。

**手順**：

1. `topn_opt_limit_threshold` を `0` に設定して最適化を無効にし、実行時間を記録します。
2. デフォルト値に戻して最適化を有効にし、実行時間を記録して比較します。
3. Query Profile で `RuntimePredicate` を検索し、次の表の主な指標を確認します。

**主な指標**：

| 指標 | 意味 | 望ましい傾向 |
| :--- | :--- | :--- |
| `RowsZonemapRuntimePredicateFiltered` | RuntimePredicate によって除外された行数 | 大きいほどよい |
| `NumSegmentFiltered` | 除外されたデータファイル（Segment）の数 | 大きいほどよい |
| `BlockConditionsFilteredZonemapRuntimePredicateTime` | RuntimePredicate によるデータのフィルタリングに要した時間 | 小さいほどよい |

> 注意：2.0.3 より前のバージョンでは、`RuntimePredicate` の指標はまだ個別に集計されません。一般的な Zonemap 指標からおおよその効果を確認できます。

**Profile の例**：

```sql
    SegmentIterator:
          -  BitmapIndexFilterTimer:  46.54us
          -  BlockConditionsFilteredBloomFilterTime:  10.352us
          -  BlockConditionsFilteredDictTime:  7.299us
          -  BlockConditionsFilteredTime:  202.23ms
          -  BlockConditionsFilteredZonemapRuntimePredicateTime:  0ns
          -  BlockConditionsFilteredZonemapTime:  402.917ms
          -  BlockInitSeekCount:  399
          -  BlockInitSeekTime:  11.309ms
          -  BlockInitTime:  215.59ms
          -  BlockLoadTime:  7s567ms
          -  BlocksLoad:  392.97K  (392970)
          -  CachedPagesNum:  0
          -  CollectIteratorMergeTime:  0ns
          -  CollectIteratorNormalTime:  0ns
          -  CompressedBytesRead:  29.76  MB
          -  DecompressorTimer:  427.713ms
          -  ExprFilterEvalTime:  3s930ms
          -  FirstReadSeekCount:  392.921K  (392921)
          -  FirstReadSeekTime:  528.287ms
          -  FirstReadTime:  1s134ms
          -  IOTimer:  51.286ms
          -  InvertedIndexFilterTime:  49.457us
          -  InvertedIndexQueryBitmapCopyTime:  0ns
          -  InvertedIndexQueryBitmapOpTime:  0ns
          -  InvertedIndexQueryCacheHit:  0
          -  InvertedIndexQueryCacheMiss:  0
          -  InvertedIndexQueryTime:  0ns
          -  InvertedIndexSearcherOpenTime:  0ns
          -  InvertedIndexSearcherSearchTime:  0ns
          -  LazyReadSeekCount:  0
          -  LazyReadSeekTime:  0ns
          -  LazyReadTime:  106.952us
          -  NumSegmentFiltered:  0
          -  NumSegmentTotal:  50
          -  OutputColumnTime:  61.987ms
          -  OutputIndexResultColumnTimer:  12.345ms
          -  RawRowsRead:  3.929151M  (3929151)
          -  RowsBitmapIndexFiltered:  0
          -  RowsBloomFilterFiltered:  0
          -  RowsConditionsFiltered:  6.38976M  (6389760)
          -  RowsDictFiltered:  0
          -  RowsInvertedIndexFiltered:  0
          -  RowsKeyRangeFiltered:  0
          -  RowsShortCircuitPredFiltered:  0
          -  RowsShortCircuitPredInput:  0
          -  RowsStatsFiltered:  6.38976M  (6389760)
          -  RowsVectorPredFiltered:  0
          -  RowsVectorPredInput:  0
          -  RowsZonemapRuntimePredicateFiltered:  6.38976M  (6389760)
          -  SecondReadTime:  0ns
          -  ShortPredEvalTime:  0ns
          -  TotalPagesNum:  2.301K  (2301)
          -  UncompressedBytesRead:  137.99  MB
          -  VectorPredEvalTime:  0ns
```

<!-- Knowledge type: FAQ -->
<!-- Applicable scenarios: common questions and troubleshooting -->

## よくある質問（FAQ／トラブルシューティング） {#frequently-asked-questions-faq--troubleshooting}

**Q1：EXPLAIN に `TOPN OPT` が表示されません。どのような原因が考えられますか？**

- LIMIT n が `topn_opt_limit_threshold`（デフォルトは 1024）より大きい。
- LIMIT n とテーブルの総行数の比率が `topn_filter_ratio`（デフォルトは 0.5）を超えている。
- テーブルが Unique MOR テーブルであり、この最適化を使用できない。

**Q2：最適化を有効にした後、SQL が遅くなりました。なぜですか？**

- `n` が大きすぎてメモリ負荷が増加していないか確認してください。必要に応じて `topn_opt_limit_threshold` を下げられます。
- Profile の `RowsZonemapRuntimePredicateFiltered` でフィルタリング効果を確認してください。除外された行数が 0 なら、この最適化による効果はありません。

**Q3：最適化 1 と 2 を維持しながら、最適化 3（2 フェーズ読み取り）だけを無効にするにはどうすればよいですか？**

`enable_two_phase_read_opt = false` を設定します。

**Q4：MOR テーブルで ORDER BY LIMIT クエリを実行すると、誤った結果が返されます。なぜですか？**

MOR テーブルで TOPN 最適化が有効になっていないか確認してください。MOR テーブルでは、MOW モデルを使用するか、この最適化パスが実行されないようにしてください。

**Q5：第 2 フェーズの書き戻しを行わないポリシーを有効にしても、File Cache への書き込みが発生するのはなぜですか？**

このポリシーが制御するのは、Doris 内部テーブルの TOPN 遅延マテリアライゼーションの第 2 フェーズだけです。第 1 フェーズ、他のオペレーター、外部テーブルの読み取りでは、File Cache への書き込みが引き続き発生する可能性があります。クエリ全体の書き込み量ではなく、`TopNLazyMaterializationSecondPhaseWriteCacheBytes` を使って第 2 フェーズでキャッシュへの書き込みが行われたか確認してください。

### LIMIT の大きなクエリ向けに 1024 のしきい値を上げられますか？ {#larger-topn-limits}

はい。`topn_opt_limit_threshold` のデフォルトは 1024 で、複数の TopN 最適化パスを制御します。これは SQL の `LIMIT` で指定できる最大値ではなく、しきい値ちょうどの値を含むかどうかもパスによって異なります。`LIMIT 5000` のクエリを評価するには、まず現在のセッションでしきい値を上げます。

```sql
SET topn_opt_limit_threshold = 10000;
```

変更前後で同じクエリの `EXPLAIN` と Profile を比較してください。候補行が増えると、ソートの CPU 使用量、ピーク時のメモリ使用量、2 フェーズのマテリアライゼーションで取得する行数が増える可能性があります。ストレージとコンピューティングを分離したモードでは、第 2 フェーズで読み取りが分散すると、リモート I/O も増える可能性があります。テーブルの種類、ソートキー、選択性、その他の最適化条件も引き続き適用されます。しきい値を上げても、すべての TopN 最適化が強制的に有効になるわけではありません。

実際の負荷を代表する同時実行条件で、クエリのレイテンシ、スキャンした行数、ピーク時のメモリ使用量を確認してください。利用できる場合は、第 2 フェーズの読み取り時間とリモートから読み取ったバイト数も確認します。実験後は `SET topn_opt_limit_threshold = 1024;` でデフォルトに戻してください。実際のワークロードで効果を測定するまでは、グローバル値を上げないでください。

## 関連パラメータの早見表 {#quick-reference-for-related-parameters}

| 目的 | 設定 |
| :--- | :--- |
| TOPN 最適化を完全に無効にする | `SET topn_opt_limit_threshold = 0;` |
| 2 フェーズの遅延マテリアライゼーションのみを無効にする | `SET enable_two_phase_read_opt = false;` |
| LIMIT の上限を緩和して対象クエリを増やす | `topn_opt_limit_threshold` を適切に上げる |
| フィルタ生成の比率しきい値を調整する | `topn_filter_ratio` を変更する |
| 第 2 フェーズのキャッシュミス時に File Cache へ書き戻さない | `SET enable_topn_lazy_mat_phase2_no_write_file_cache = true;` |
| 第 2 フェーズのデフォルトのキャッシュ書き戻し動作に戻す | `SET enable_topn_lazy_mat_phase2_no_write_file_cache = false;` |
