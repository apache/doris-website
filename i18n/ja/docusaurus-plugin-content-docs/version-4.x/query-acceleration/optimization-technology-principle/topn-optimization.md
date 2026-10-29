---
{
    "title": "TOPN クエリ最適化：ORDER BY LIMIT 高速化の仕組みと設定",
    "language": "ja",
    "description": "Doris は ORDER BY LIMIT クエリをどのように高速化するのでしょうか。この記事では、TOPN 最適化の仕組み、適用上の制限、セッション変数、実行計画の確認方法、ストレージとコンピューティングを分離した環境での遅延実体化のフェーズ2における File Cache ポリシーを説明します。",
    "keywords": ["Doris TOPN optimization", "ORDER BY LIMIT acceleration", "topn_opt_limit_threshold", "enable_topn_lazy_mat_phase2_no_write_file_cache", "two-phase read", "File Cache", "RuntimePredicate", "Zonemap filtering"]
}
---

<!-- Knowledge type: concept + configuration + troubleshooting -->
<!-- Applicable scenarios: log search, detail query, sorted pagination -->

## 一文でわかる定義 {#one-sentence-definition}

TOPN クエリ最適化は、`ORDER BY ... LIMIT n` クエリを自動的に高速化する Doris の機能です。動的フィルタリング、範囲の絞り込み、遅延実体化によって、スキャンとソートの負荷を大幅に削減します。

## 読み始める前のチェックリスト {#pre-reading-checklist}

- [ ] SQL が `SELECT ... FROM t WHERE ... ORDER BY c1, c2 ... LIMIT n` の形式である
- [ ] テーブルの種類が Duplicate テーブルまたは Unique MOW テーブルである（MOR ではない）
- [ ] `n` が小さい（`topn_opt_limit_threshold` より小さい。デフォルトは 1024）
- [ ] EXPLAIN と Profile で最適化が有効か確認したい

## 典型的な SQL パターン {#typical-sql-pattern}

TOPN クエリは、ログ検索などの詳細データを取得する場面でよく使われます。Doris はこのようなクエリを自動的に認識して最適化します。

```sql
SELECT * FROM tablex WHERE xxx ORDER BY c1, c2 ... LIMIT n
```

<!-- Knowledge type: principle -->
<!-- Applicable scenarios: understanding how Doris internally accelerates ORDER BY LIMIT -->

## 3 つの最適化ポイント {#three-optimization-points}

| 番号 | 最適化 | 仕組み | 主な効果 |
| :--- | :--- | :--- | :--- |
| 最適化 1 | 動的な範囲フィルタリング（RuntimePredicate） | ソート中にソート列の範囲条件（`c1 >= 10000` など）を動的に構築し、スキャンまでプッシュダウンする | Zonemap インデックスを使い、ファイル全体を含む大量のデータを除外できる |
| 最適化 2 | キープレフィックスによる読み取りの早期終了 | ソート列 `c1, c2` がテーブルキーの先頭部分と完全に一致する場合、データファイルの先頭または末尾の n 行だけを読み取る | ディスクからの読み取りを大幅に削減する |
| 最適化 3 | 二段階の遅延実体化 | 最初の段階ではソート列だけを読み取ってソートを完了し、行番号を取得する。次の段階で残りの列を読み取る | 読み取りとソートが必要な列の数を大幅に削減する |

<!-- Knowledge type: limitation -->
<!-- Applicable scenarios: determining whether the current query can benefit from TOPN optimization -->

## 適用上の制限 {#applicable-limitations}

1. **テーブルの種類に関する制限**：Duplicate テーブルと Unique MOW テーブルだけがサポートされます。Unique MOR テーブルでこの最適化を使用すると、誤った結果が返される可能性があります。
2. **n の値に関する制限**：`n` が大きすぎると、この最適化によるメモリ消費量が大幅に増加します。`n` がセッション変数 `topn_opt_limit_threshold` を超える場合、最適化は有効になりません。

<!-- Knowledge type: configuration -->
<!-- Applicable scenarios: tuning or disabling TOPN optimization -->

3. **二段階読み取りに関する制限**：4.1.5 以降、Doris 内部テーブルで TopN の遅延実体化を使用するには `light_schema_change` が必要です。また、Aggregate Key テーブルには対応していません。これらの条件を満たさない場合、Doris は通常の TopN 実行経路を使用し、クエリは引き続き実行できます。

## 設定パラメータ {#configuration-parameters}

以下の 4 つのパラメータは、すべてセッション変数です。単一の SQL ステートメントに対して、またはグローバルに設定できます。

| パラメータ | デフォルト値 | 効果 | 調整の目安 |
| :--- | :--- | :--- | :--- |
| `topn_opt_limit_threshold` | 1024 | LIMIT n がこの値より小さい場合にのみ TOPN 最適化が有効になる | TOPN 最適化全体を無効にするには `0` に設定する |
| `enable_two_phase_read_opt` | true | 最適化 3（二段階の遅延実体化）を有効にするかどうかを指定する | 最適化 3 だけを無効にするには `false` に設定する |
| `topn_filter_ratio` | 0.5 | テーブルの全データに対する LIMIT n の比率のしきい値 | LIMIT の件数がテーブルの全データの半分を超えると、フィルタは生成されなくなる |
| `enable_topn_lazy_mat_phase2_no_write_file_cache` | false | ストレージとコンピューティングを分離したモードで、Doris 内部テーブルの遅延実体化のフェーズ2において、File Cache にキャッシュがない場合の書き戻しを省略するかどうかを制御する | フェーズ2の読み取りデータが再利用されにくく、キャッシュを圧迫する可能性が高い場合にのみ有効にする |

<!-- Knowledge type: operation -->
<!-- Applicable scenarios: verifying whether TOPN optimization is enabled -->

## TOPN 最適化が有効か確認する {#check-whether-topn-optimization-is-enabled}

**目的**：実行計画を使い、現在の SQL でどの最適化ポイントが有効になっているかを確認します。

**コマンド**：

```sql
EXPLAIN <your_sql>;
```

**確認方法**：Query Plan で次のマーカーを探します。

- `TOPN OPT`：**最適化 1**（動的な範囲フィルタリング）が有効
- `VOlapScanNode` の下にある `SORT LIMIT`：**最適化 2**（キープレフィックスによる読み取りの早期終了）が有効
- `MaterializeNode`（古い実行計画では `OPT TWO PHASE`）：**最適化 3**（二段階の遅延実体化）が有効

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

## 遅延実体化のフェーズ2における File Cache への書き込みを制御する {#control-file-cache-writes-during-lazy-materialization-phase-2}

ストレージとコンピューティングを分離したクラスターでは、TOPN の遅延実体化のフェーズ2で、フェーズ1で選択された行 ID を使って残りの列を読み取ります。少数の結果行が多数の Segment に分散していると、このような散発的な読み取りでキャッシュに格納されたブロックは再利用されにくく、頻繁に使われるデータをキャッシュから追い出す可能性があります。この場合、`enable_topn_lazy_mat_phase2_no_write_file_cache` を有効にすると、フェーズ2で File Cache にキャッシュがないデータをリモートストレージから直接読み取り、File Cache には書き戻さなくなります。

この変数はクエリ結果を変更しません。変更するのは、フェーズ2で File Cache にキャッシュがない場合の処理だけです。

| 設定値 | フェーズ2の読み取り動作 |
| :--- | :--- |
| `false`（デフォルト） | 通常の読み取りと書き戻しのポリシーを使用する。キャッシュにデータがない場合、Doris はリモートデータを読み取り、File Cache に書き込む |
| `true` | `DOWNLOADED` 状態のキャッシュブロックが現在の読み取り範囲全体をカバーする場合にのみ、ローカルキャッシュから読み取る。範囲の一部でもキャッシュされていないか、まだダウンロード中の場合は、キャッシュブロックを作成・書き込みせずに、現在の読み取り範囲全体をリモートストレージから読み取る |

この変数を有効にする前に、次の適用範囲を確認してください。

- ストレージとコンピューティングを分離したモードでのみ有効で、Doris 内部テーブルの TOPN 遅延実体化のフェーズ2だけを制御します。現時点では、外部テーブルのフェーズ2の読み取りは制御しません。
- 行ストアが有効な Doris 内部テーブルと、無効な Doris 内部テーブルの両方に対応します。
- 既存のキャッシュエントリは削除せず、フェーズ1、他のクエリ、他のオペレーターによるキャッシュへの書き込みも変更しません。そのため、クエリ全体の File Cache への書き込み量がゼロを超える場合があります。
- File Cache が無効な場合や、実行計画に `MaterializeNode` が含まれない場合は、追加の効果はありません。

### 基本的な使い方 {#basic-usage}

以下の例を実行するには、ストレージとコンピューティングを分離したクラスター、BE で有効になっている File Cache、および対象データベースでテーブルの作成・削除とデータの挿入・クエリを実行できるユーザーが必要です。まず、Duplicate Key の内部テーブルを作成します。

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

Profile とフェーズ2の書き込みを省略するポリシーを有効にし、実行計画を確認してからクエリを実行します。

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

実行計画には `MaterializeNode` が含まれるはずです。この変数が有効かどうかにかかわらず、クエリは次の結果を返します。

```text
+----+---------+
| id | payload |
+----+---------+
|  3 | gamma   |
|  2 | beta    |
+----+---------+
2 rows in set
```

キャッシュへの書き戻しをデフォルトの動作に戻すには、次を実行します。

```sql
SET enable_topn_lazy_mat_phase2_no_write_file_cache = false;
```

### Profile でキャッシュポリシーを確認する {#verify-the-cache-policy-in-profile}

`profile_level` を `2` に設定した後、Query Profile で `MaterializeNode` に対応する実行オペレーターの下にある、次のフェーズ2固有のメトリクスを確認します。

| 項目 | 集計メトリクス | 意味 |
| :--- | :--- | :--- |
| 読み取り規模 | `TopNLazyMaterializationSecondPhaseRowsRead`、`TopNLazyMaterializationSecondPhaseSegmentsRead` | フェーズ2で読み取った行数とアクセスした Segment 数 |
| ローカルキャッシュからの読み取り | `TopNLazyMaterializationSecondPhaseLocalIOCount`、`TopNLazyMaterializationSecondPhaseLocalIOBytes`、`TopNLazyMaterializationSecondPhaseLocalIOTime` | File Cache からの読み取り回数、バイト数、所要時間 |
| リモートからの読み取り | `TopNLazyMaterializationSecondPhaseRemoteIOCount`、`TopNLazyMaterializationSecondPhaseRemoteIOBytes`、`TopNLazyMaterializationSecondPhaseRemoteIOTime` | リモートストレージからの読み取り回数、バイト数、所要時間 |
| キャッシュへの書き込みの省略 | `TopNLazyMaterializationSecondPhaseSkipCacheIOCount` | File Cache に書き込まなかったリモート読み取りの回数 |
| キャッシュへの書き込み | `TopNLazyMaterializationSecondPhaseWriteCacheBytes`、`TopNLazyMaterializationSecondPhaseWriteCacheIOTime` | File Cache に書き込んだバイト数と、その所要時間 |

書き込みを省略するポリシーが有効な場合、次のパターンで動作を確認できます。

| キャッシュの状態 | 期待されるメトリクスのパターン |
| :--- | :--- |
| 現在の読み取り範囲全体はキャッシュされていない | `RemoteIOCount`、`RemoteIOBytes`、`SkipCacheIOCount` が 0 より大きく、`WriteCacheBytes` は 0 |
| ダウンロード済みのキャッシュブロックが現在の読み取り範囲全体をカバーしている | `LocalIOCount` と `LocalIOBytes` が 0 より大きく、`RemoteIOCount`、`RemoteIOBytes`、`WriteCacheBytes` は 0 |

Profile には BE ごとのメトリクスもあります。`TopNLazyMaterializationSecondPhasePerBackend` には BE の一覧が示されます。ほかのメトリクス名には、たとえば `TopNLazyMaterializationSecondPhasePerBackendRowsRead` や `TopNLazyMaterializationSecondPhasePerBackendWriteCacheBytes` のように、`SecondPhase` の後に `PerBackend` が追加されます。配列の要素はインデックスによって BE の一覧に対応し、同じクエリ内で行われた複数回のフェーズ2の取得結果を累積します。

:::note
`TopNLazyMaterializationSecondPhaseWriteCacheBytes` が対象とするのは、遅延実体化のフェーズ2だけです。File Cache 全体のメトリクスに書き込みが記録されている場合は、まずフェーズ1または別のオペレーターによるものかを確認してください。Profile の取得方法については、[Query Profile Analysis](../query-profile.md) を参照してください。
:::

<!-- Knowledge type: operation -->
<!-- Applicable scenarios: evaluating the actual benefit of TOPN optimization -->

## TOPN 最適化の実行効果を確認する {#check-the-execution-effect-of-topn-optimization}

**目的**：実行時間と Profile のメトリクスを比較し、TOPN 最適化による実際のフィルタリング効果を確認します。

**手順**：

1. `topn_opt_limit_threshold` を `0` に設定して最適化を無効にし、実行時間を記録します。
2. デフォルト値に戻して最適化を有効にし、実行時間を記録して比較します。
3. Query Profile で `RuntimePredicate` を検索し、以下の表にある主要なメトリクスを確認します。

**主要なメトリクス**：

| メトリクス | 意味 | 期待される傾向 |
| :--- | :--- | :--- |
| `RowsZonemapRuntimePredicateFiltered` | RuntimePredicate によって除外された行数 | 大きいほどよい |
| `NumSegmentFiltered` | 除外されたデータファイル（Segment）の数 | 大きいほどよい |
| `BlockConditionsFilteredZonemapRuntimePredicateTime` | RuntimePredicate によるデータのフィルタリングにかかった時間 | 小さいほどよい |

> 注：2.0.3 より前のバージョンでは、`RuntimePredicate` のメトリクスはまだ個別に記録されません。一般的な Zonemap のメトリクスから、おおよその効果を確認できます。

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

**Q1：EXPLAIN に `TOPN OPT` が表示されません。考えられる原因は何ですか？**

- LIMIT n が `topn_opt_limit_threshold`（デフォルトは 1024）より大きい。
- テーブルの総行数に対する LIMIT n の比率が `topn_filter_ratio`（デフォルトは 0.5）を超えている。
- テーブルが Unique MOR テーブルであり、この最適化を使用できない。

**Q2：最適化を有効にすると SQL が遅くなるのはなぜですか？**

- `n` が大きすぎてメモリの負荷が増えていないか確認してください。必要に応じて `topn_opt_limit_threshold` を小さくできます。
- Profile の `RowsZonemapRuntimePredicateFiltered` でフィルタリング効果を確認してください。除外された行数が 0 の場合、この最適化による効果はありません。

**Q3：最適化 1 と 2 を維持したまま、最適化 3（二段階読み取り）だけを無効にするにはどうすればよいですか？**

`enable_two_phase_read_opt = false` を設定します。

**Q4：MOR テーブルで ORDER BY LIMIT クエリが誤った結果を返すのはなぜですか？**

MOR テーブルで TOPN 最適化が有効になっていないことを確認してください。MOR テーブルでは、MOW モデルを使用するか、この最適化の実行経路に入らないようにしてください。

**Q5：フェーズ2の書き込みを省略するポリシーを有効にしても、クエリが File Cache に書き込むのはなぜですか？**

このポリシーが制御するのは、Doris 内部テーブルに対する TOPN 遅延実体化のフェーズ2だけです。フェーズ1、ほかのオペレーター、外部テーブルの読み取りでは、引き続き File Cache に書き込まれる場合があります。クエリ全体の書き込み量だけで判断せず、`TopNLazyMaterializationSecondPhaseWriteCacheBytes` を使ってフェーズ2でキャッシュへの書き込みが行われたか確認してください。

## 関連パラメータの早見表 {#quick-reference-for-related-parameters}

| 目的 | 設定 |
| :--- | :--- |
| TOPN 最適化を完全に無効にする | `SET topn_opt_limit_threshold = 0;` |
| 二段階の遅延実体化だけを無効にする | `SET enable_two_phase_read_opt = false;` |
| LIMIT の上限を緩め、より多くのクエリを対象にする | `topn_opt_limit_threshold` を適切に増やす |
| フィルタ生成の比率しきい値を調整する | `topn_filter_ratio` を変更する |
| フェーズ2でキャッシュにないデータを File Cache に書き戻さない | `SET enable_topn_lazy_mat_phase2_no_write_file_cache = true;` |
| フェーズ2のキャッシュへの書き戻しをデフォルトの動作に戻す | `SET enable_topn_lazy_mat_phase2_no_write_file_cache = false;` |
