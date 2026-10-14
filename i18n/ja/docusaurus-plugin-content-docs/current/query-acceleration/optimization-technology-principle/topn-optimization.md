---
{
    "title": "TOPN クエリ最適化：ORDER BY LIMIT の高速化原理と設定",
    "language": "ja",
    "description": "Doris は ORDER BY LIMIT クエリをどのように高速化するのでしょうか。この記事では、TOPN 最適化の原理、適用上の制約、セッションパラメータ、実行計画の確認方法、およびストレージとコンピュートを分離した環境での遅延実体化フェーズ 2 に対する File Cache ポリシーを説明します。",
    "keywords": ["Doris TOPN 最適化", "ORDER BY LIMIT 高速化", "topn_opt_limit_threshold", "enable_topn_lazy_mat_phase2_no_write_file_cache", "二段階読み取り", "File Cache", "RuntimePredicate", "Zonemap フィルタリング"]
}
---

<!-- Knowledge type: concept + configuration + troubleshooting -->
<!-- Applicable scenarios: log search, detail query, sorted pagination -->

## 一文で表すと

TOPN クエリ最適化は、`ORDER BY ... LIMIT n` クエリを Doris が自動的に高速化する機能です。動的フィルタリング、範囲の絞り込み、遅延実体化によって、スキャンとソートの負荷を大幅に削減します。

## 事前確認チェックリスト

- [ ] SQL が `SELECT ... FROM t WHERE ... ORDER BY c1, c2 ... LIMIT n` の形式である
- [ ] テーブルの種類が Duplicate テーブルまたは Unique MOW テーブルである（MOR ではない）
- [ ] `n` が小さい（`topn_opt_limit_threshold` 未満。デフォルトは 1024）
- [ ] EXPLAIN と Profile を使って最適化が有効かどうかを確認したい

## 典型的な SQL パターン

TOPN クエリは、ログ検索などの詳細データを取得する場面でよく使われます。Doris はこのパターンを自動的に認識して最適化します。

```sql
SELECT * FROM tablex WHERE xxx ORDER BY c1, c2 ... LIMIT n
```

<!-- Knowledge type: principle -->
<!-- Applicable scenarios: understanding how Doris internally accelerates ORDER BY LIMIT -->

## 三つの最適化ポイント

| 番号 | 最適化 | 原理 | 主な効果 |
| :--- | :--- | :--- | :--- |
| 最適化 1 | 動的な範囲フィルタリング（RuntimePredicate） | ソート中にソート列に対する範囲条件（`c1 >= 10000` など）を動的に構築し、スキャンまでプッシュダウンする | Zonemap インデックスを使用して、ファイル全体を含む大量のデータを除外する |
| 最適化 2 | キープレフィックスによる読み取りの早期終了 | ソート列 `c1, c2` がテーブルキーの先頭部分と完全に一致する場合、データファイルの先頭または末尾の n 行だけを読み取る | ディスク読み取りを大幅に削減する |
| 最適化 3 | 二段階の遅延実体化 | 最初の段階ではソート列だけを読み取ってソートを完了し、行番号を取得する。次の段階では残りの列を読み取る | 読み取りとソートが必要な列の数を大幅に減らす |

<!-- Knowledge type: limitation -->
<!-- Applicable scenarios: determining whether the current query can benefit from TOPN optimization -->

## 適用上の制約

1. **テーブルの種類に関する制約**：Duplicate テーブルと Unique MOW テーブルのみをサポートします。Unique MOR テーブルでこの最適化を使用すると、誤った結果になる可能性があります。
2. **n の値に関する制約**：`n` が大きすぎると、この最適化によるメモリ消費が大幅に増加します。`n` がセッション変数 `topn_opt_limit_threshold` を超える場合、最適化は有効になりません。

<!-- Knowledge type: configuration -->
<!-- Applicable scenarios: tuning or disabling TOPN optimization -->

## 設定パラメータ

以下の四つのパラメータはすべてセッション変数です。単一の SQL 文に対して、またはグローバルに設定できます。

| パラメータ | デフォルト値 | 効果 | 調整の目安 |
| :--- | :--- | :--- | :--- |
| `topn_opt_limit_threshold` | 1024 | LIMIT n がこの値未満の場合にのみ TOPN 最適化が有効になる | `0` に設定すると、TOPN 最適化全体を無効にできる |
| `enable_two_phase_read_opt` | true | 最適化 3（二段階の遅延実体化）を有効にするかどうかを指定する | `false` に設定すると、最適化 3 のみを無効にできる |
| `topn_filter_ratio` | 0.5 | LIMIT n とテーブルの総データ量との比率のしきい値 | LIMIT の件数がテーブルデータの半分を超えると、フィルタは生成されなくなる |
| `enable_topn_lazy_mat_phase2_no_write_file_cache` | false | ストレージとコンピュートを分離したモードで、Doris 内部テーブルの遅延実体化フェーズ 2 において、File Cache ミス時のキャッシュへの書き戻しをスキップするかどうかを制御する | フェーズ 2 の読み取り結果の再利用が少なく、キャッシュを汚染する可能性が高い場合にのみ有効にする |

<!-- Knowledge type: operation -->
<!-- Applicable scenarios: verifying whether TOPN optimization is enabled -->

## TOPN 最適化が有効かどうかを確認する

**目的**：実行計画を使用して、現在の SQL で有効になっている最適化ポイントを確認します。

**コマンド**：

```sql
EXPLAIN <your_sql>;
```

**確認方法**：Query Plan で次の表示を探します。

- `TOPN OPT`：**最適化 1**（動的な範囲フィルタリング）が有効
- `SORT LIMIT` が `VOlapScanNode` の下に表示される場合：**最適化 2**（キープレフィックスによる読み取りの早期終了）が有効
- `MaterializeNode`（または古い実行計画の `OPT TWO PHASE`）：**最適化 3**（二段階の遅延実体化）が有効

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

## 遅延実体化フェーズ 2 での File Cache への書き込みを制御する

ストレージとコンピュートを分離したクラスタでは、TOPN 遅延実体化のフェーズ 2 で、フェーズ 1 が選択した行 ID を使って残りの列を読み取ります。少数の結果行が多数の Segment に分散している場合、このようなまばらな読み取りで作られたキャッシュブロックは再利用されにくく、頻繁に使うデータをキャッシュから追い出す可能性があります。この場合、`enable_topn_lazy_mat_phase2_no_write_file_cache` を有効にすると、フェーズ 2 の読み取りでは File Cache ミス時にリモートストレージから直接データを読み取り、File Cache には書き戻しません。

この変数はクエリ結果を変更しません。フェーズ 2 での File Cache ミスの処理方法のみを変更します。

| 設定値 | フェーズ 2 の読み取り動作 |
| :--- | :--- |
| `false`（デフォルト） | 通常の読み取り時キャッシュ登録と書き戻しのポリシーを使用する。キャッシュミス時に Doris はリモートデータを読み取り、そのデータを File Cache に書き込む |
| `true` | `DOWNLOADED` 状態のキャッシュブロックが現在の読み取り範囲全体を覆っている場合にのみ、ローカルキャッシュを読み取る。一部でもキャッシュされていないかダウンロード中であれば、キャッシュブロックを作成・書き込みせずに、現在の読み取り範囲全体をリモートストレージから読み取る |

この変数を有効にする前に、次の適用範囲を確認してください。

- ストレージとコンピュートを分離したモードでのみ有効であり、Doris 内部テーブルの TOPN 遅延実体化フェーズ 2 のみを制御します。現時点では外部テーブルのフェーズ 2 の読み取りは制御しません。
- 行ストアが有効かどうかにかかわらず、Doris 内部テーブルをサポートします。
- 既存のキャッシュエントリは削除しません。また、フェーズ 1、他のクエリ、他のオペレータによるキャッシュ書き込みも変更しません。そのため、クエリ全体の File Cache 書き込み量がゼロより大きい場合があります。
- File Cache が無効な場合や、実行計画に `MaterializeNode` がない場合は、追加の効果はありません。

### 基本的な使い方

以下の例には、ストレージとコンピュートを分離したクラスタ、BE で有効になっている File Cache、および対象データベースでテーブルの作成・削除とデータの挿入・照会を実行できるユーザーが必要です。まず、Duplicate Key の内部テーブルを作成します。

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

Profile とフェーズ 2 の書き戻しを行わないポリシーを有効にし、実行計画を確認してからクエリを実行します。

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

デフォルトのキャッシュ書き戻し動作に戻すには、次を実行します。

```sql
SET enable_topn_lazy_mat_phase2_no_write_file_cache = false;
```

### Profile でキャッシュポリシーを確認する

`profile_level` を `2` に設定した後、Query Profile で `MaterializeNode` に対応する実行オペレータの下にある、次のフェーズ 2 固有のメトリクスを確認します。

| 項目 | 集計メトリクス | 意味 |
| :--- | :--- | :--- |
| 読み取り規模 | `TopNLazyMaterializationSecondPhaseRowsRead`, `TopNLazyMaterializationSecondPhaseSegmentsRead` | フェーズ 2 で読み取った行数とアクセスした Segment 数 |
| ローカルキャッシュからの読み取り | `TopNLazyMaterializationSecondPhaseLocalIOCount`, `TopNLazyMaterializationSecondPhaseLocalIOBytes`, `TopNLazyMaterializationSecondPhaseLocalIOTime` | File Cache からの読み取り回数、バイト数、所要時間 |
| リモートからの読み取り | `TopNLazyMaterializationSecondPhaseRemoteIOCount`, `TopNLazyMaterializationSecondPhaseRemoteIOBytes`, `TopNLazyMaterializationSecondPhaseRemoteIOTime` | リモートストレージからの読み取り回数、バイト数、所要時間 |
| キャッシュのバイパス | `TopNLazyMaterializationSecondPhaseSkipCacheIOCount` | File Cache に書き込まなかったリモート読み取りの回数 |
| キャッシュへの書き込み | `TopNLazyMaterializationSecondPhaseWriteCacheBytes`, `TopNLazyMaterializationSecondPhaseWriteCacheIOTime` | File Cache に書き込んだバイト数と書き込みに要した時間 |

書き戻しを行わないポリシーを有効にした場合は、次のパターンで動作を確認します。

| キャッシュの状態 | 期待されるメトリクスのパターン |
| :--- | :--- |
| 現在の読み取り範囲の一部がキャッシュされていない | `RemoteIOCount`、`RemoteIOBytes`、`SkipCacheIOCount` が 0 より大きく、`WriteCacheBytes` は 0 |
| 現在の読み取り範囲全体がダウンロード済みのキャッシュブロックで覆われている | `LocalIOCount` と `LocalIOBytes` が 0 より大きく、`RemoteIOCount`、`RemoteIOBytes`、`WriteCacheBytes` は 0 |

Profile には BE ごとのメトリクスもあります。`TopNLazyMaterializationSecondPhasePerBackend` には BE の一覧が入ります。その他のメトリクス名では、`PerBackend` が `SecondPhase` の後に追加されます。例えば、`TopNLazyMaterializationSecondPhasePerBackendRowsRead` や `TopNLazyMaterializationSecondPhasePerBackendWriteCacheBytes` です。配列要素はインデックス順で BE の一覧に対応し、同じクエリ内の複数回のフェーズ 2 のフェッチから得たデータを累積します。

:::note
`TopNLazyMaterializationSecondPhaseWriteCacheBytes` が対象とするのは、遅延実体化のフェーズ 2 のみです。File Cache 全体のメトリクスで書き込みが報告される場合は、まずフェーズ 1 または別のオペレータによるものかどうかを確認してください。Profile の取得方法については、[Query Profile Analysis](../query-profile.md) を参照してください。
:::

<!-- Knowledge type: operation -->
<!-- Applicable scenarios: evaluating the actual benefit of TOPN optimization -->

## TOPN 最適化の実行効果を確認する

**目的**：実行時間と Profile メトリクスを比較して、TOPN 最適化による実際のフィルタリング効果を確認します。

**手順**：

1. `topn_opt_limit_threshold` を `0` に設定して最適化を無効にし、実行時間を記録します。
2. デフォルト値に戻して最適化を有効にし、実行時間を記録して比較します。
3. Query Profile で `RuntimePredicate` を検索し、下表の主なメトリクスを確認します。

**主なメトリクス**：

| メトリクス | 意味 | 期待される傾向 |
| :--- | :--- | :--- |
| `RowsZonemapRuntimePredicateFiltered` | RuntimePredicate によって除外された行数 | 多いほどよい |
| `NumSegmentFiltered` | 除外されたデータファイル（Segment）の数 | 多いほどよい |
| `BlockConditionsFilteredZonemapRuntimePredicateTime` | RuntimePredicate がデータのフィルタリングに要した時間 | 短いほどよい |

> 注：2.0.3 より前のバージョンでは、`RuntimePredicate` のメトリクスはまだ個別に記録されません。一般的な Zonemap メトリクスからおおよその効果を確認できます。

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

## よくある質問（FAQ / トラブルシューティング）

**Q1：EXPLAIN に `TOPN OPT` が表示されません。考えられる理由は何ですか？**

- LIMIT n が `topn_opt_limit_threshold`（デフォルトは 1024）を超えている。
- LIMIT n とテーブルの総行数との比率が `topn_filter_ratio`（デフォルトは 0.5）を超えている。
- テーブルが Unique MOR テーブルであり、この最適化を使用できない。

**Q2：最適化を有効にした後、SQL が遅くなりました。なぜですか？**

- `n` が大きすぎてメモリ負荷が増えていないか確認します。必要に応じて `topn_opt_limit_threshold` を下げられます。
- Profile の `RowsZonemapRuntimePredicateFiltered` でフィルタリング効果を確認します。除外された行数が 0 なら、この最適化による効果はありません。

**Q3：最適化 1 と 2 を維持したまま、最適化 3（二段階読み取り）だけを無効にするにはどうすればよいですか？**

`enable_two_phase_read_opt = false` を設定します。

**Q4：MOR テーブルに対する ORDER BY LIMIT クエリが誤った結果を返します。なぜですか？**

MOR テーブルで TOPN 最適化が有効になっていないことを確認してください。MOR テーブルでは、MOW モデルを使用するか、この最適化経路が適用されないようにしてください。

**Q5：フェーズ 2 で書き戻しを行わないポリシーを有効にした後も、クエリが File Cache に書き込むのはなぜですか？**

このポリシーが制御するのは、Doris 内部テーブルの TOPN 遅延実体化フェーズ 2 のみです。フェーズ 1、他のオペレータ、外部テーブルの読み取りでは、引き続き File Cache に書き込まれる可能性があります。クエリ全体の書き込み量ではなく、`TopNLazyMaterializationSecondPhaseWriteCacheBytes` を使って、フェーズ 2 でキャッシュへの書き込みが行われたかどうかを確認してください。

## 関連パラメータのクイックリファレンス

| 目的 | 設定 |
| :--- | :--- |
| TOPN 最適化を完全に無効にする | `SET topn_opt_limit_threshold = 0;` |
| 二段階の遅延実体化だけを無効にする | `SET enable_two_phase_read_opt = false;` |
| LIMIT の上限を緩和して、より多くのクエリを対象にする | `topn_opt_limit_threshold` を適切に引き上げる |
| フィルタを生成する比率のしきい値を調整する | `topn_filter_ratio` を変更する |
| フェーズ 2 のキャッシュミス時に File Cache へ書き戻さない | `SET enable_topn_lazy_mat_phase2_no_write_file_cache = true;` |
| フェーズ 2 のキャッシュ書き戻しをデフォルトの動作に戻す | `SET enable_topn_lazy_mat_phase2_no_write_file_cache = false;` |
