---
{
    "title": "TOPNクエリの最適化：ORDER BY LIMITを高速化する仕組みと設定",
    "language": "ja",
    "description": "DorisはORDER BY LIMITクエリをどのように高速化するのでしょうか。この記事では、TOPN最適化の仕組み、適用上の制限、セッションパラメータ、実行計画の確認方法、ストレージとコンピュートを分離した構成における遅延マテリアライズのフェーズ2向けFile Cacheポリシーを説明します。",
    "keywords": ["Doris TOPN optimization", "ORDER BY LIMIT acceleration", "topn_opt_limit_threshold", "enable_topn_lazy_mat_phase2_no_write_file_cache", "two-phase read", "File Cache", "RuntimePredicate", "Zonemap filtering"]
}
---

<!-- Knowledge type: concept + configuration + troubleshooting -->
<!-- Applicable scenarios: log search, detail query, sorted pagination -->

## 一文での定義 {#one-sentence-definition}

TOPNクエリ最適化は、`ORDER BY ... LIMIT n`クエリを自動的に高速化するDorisの機能です。動的フィルタリング、範囲の絞り込み、遅延マテリアライズによって、スキャンとソートの負荷を大幅に削減します。

## 事前確認のチェックリスト {#pre-reading-checklist}

- [ ] SQLが`SELECT ... FROM t WHERE ... ORDER BY c1, c2 ... LIMIT n`の形式である
- [ ] テーブルの種類がDuplicateテーブルまたはUnique MOWテーブルである（MORではない）
- [ ] `n`が小さい（`topn_opt_limit_threshold`未満。デフォルトは1024）
- [ ] EXPLAINとProfileで最適化が有効かどうかを確認したい

## 典型的なSQLパターン {#typical-sql-pattern}

TOPNクエリは、ログ検索などの詳細クエリでよく使われます。Dorisは次のようなクエリを自動的に認識して最適化します。

```sql
SELECT * FROM tablex WHERE xxx ORDER BY c1, c2 ... LIMIT n
```

<!-- Knowledge type: principle -->
<!-- Applicable scenarios: understanding how Doris internally accelerates ORDER BY LIMIT -->

## 三つの最適化ポイント {#three-optimization-points}

| 番号 | 最適化 | 仕組み | 主な効果 |
| :--- | :--- | :--- | :--- |
| 最適化 1 | 動的範囲フィルタリング（RuntimePredicate） | ソート中に、ソート列に対する範囲条件（`c1 >= 10000`など）を動的に構築し、スキャン処理にプッシュダウンする | Zonemapインデックスを使い、ファイル全体を含む大量のデータを除外できる |
| 最適化 2 | キープレフィックスによるショートサーキット読み取り | ソートに使う`c1, c2`がテーブルのキーのプレフィックスと完全に一致する場合、データファイルの先頭または末尾のn行だけを読み取る | ディスクからの読み取りを大幅に削減する |
| 最適化 3 | 二段階の遅延マテリアライズ | 第1フェーズではソート列だけを読み取ってソートを完了し、行番号を取得する。第2フェーズでその他の列を読み取る | 読み取りとソートが必要な列の数を大幅に削減する |

<!-- Knowledge type: limitation -->
<!-- Applicable scenarios: determining whether the current query can benefit from TOPN optimization -->

## 適用上の制限 {#applicable-limitations}

1. **テーブルの種類に関する制限**：DuplicateテーブルとUnique MOWテーブルのみをサポートします。Unique MORテーブルでこの最適化を使用すると、誤った結果が返される可能性があります。
2. **nの値に関する制限**：`n`が大きすぎると、この最適化によるメモリ使用量が大幅に増えます。`n`がセッション変数`topn_opt_limit_threshold`を超える場合、最適化は有効になりません。

<!-- Knowledge type: configuration -->
<!-- Applicable scenarios: tuning or disabling TOPN optimization -->

3. **二段階読み取りに関する制限**：4.1.5以降、Doris内部テーブルでTopN遅延マテリアライズを使用するには`light_schema_change`が必要で、Aggregate Keyテーブルはサポートされません。開発版では、シーケンス列のマッピングがあるテーブルもこの最適化の対象外です。これらの条件を満たさない場合、Dorisは通常のTopN実行経路を使用し、クエリは引き続き実行できます。

## 設定パラメータ {#configuration-parameters}

以下の四つのパラメータは、いずれもセッション変数です。単一のSQL文に対して、またはグローバルに設定できます。

| パラメータ | デフォルト値 | 効果 | 調整の目安 |
| :--- | :--- | :--- | :--- |
| `topn_opt_limit_threshold` | 1024 | LIMIT nがこの値未満の場合にのみTOPN最適化を有効にする | `0`に設定すると、TOPN最適化全体を無効にできる |
| `enable_two_phase_read_opt` | true | 最適化 3（二段階の遅延マテリアライズ）を有効にするかどうか | `false`に設定すると、最適化 3だけを無効にできる |
| `topn_filter_ratio` | 0.5 | LIMIT nとテーブルの全データ量の比率に対するしきい値 | LIMITの件数がテーブルのデータ量の半分を超えると、フィルタは生成されなくなる |
| `enable_topn_lazy_mat_phase2_no_write_file_cache` | false | ストレージとコンピュートを分離したモードで、Doris内部テーブルの遅延マテリアライズのフェーズ2において、File Cacheのミス時にキャッシュへの書き戻しをスキップするかどうかを制御する | フェーズ2で読み取ったデータが再利用されにくく、キャッシュを圧迫する可能性が高い場合にのみ有効にする |

<!-- Knowledge type: operation -->
<!-- Applicable scenarios: verifying whether TOPN optimization is enabled -->

## TOPN最適化が有効かどうかを確認する {#check-whether-topn-optimization-is-enabled}

**目的**：実行計画を使用して、現在のSQLでどの最適化ポイントが有効かを判断します。

**コマンド**：

```sql
EXPLAIN <your_sql>;
```

**確認方法**：Query Planで次の表示を探します。

- `TOPN OPT`：**最適化 1**（動的範囲フィルタリング）が有効
- `VOlapScanNode`の下にある`SORT LIMIT`：**最適化 2**（キープレフィックスによるショートサーキット読み取り）が有効
- `MaterializeNode`（古い実行計画では`OPT TWO PHASE`）：**最適化 3**（二段階の遅延マテリアライズ）が有効

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

## 遅延マテリアライズのフェーズ2におけるFile Cacheへの書き込みを制御する {#control-file-cache-writes-during-lazy-materialization-phase-2}

ストレージとコンピュートを分離したクラスターでは、TOPN遅延マテリアライズのフェーズ2で、フェーズ1が選択した行IDを使って残りの列を読み取ります。少数の結果行が多数のSegmentに分散している場合、このような散発的な読み取りによって作られたキャッシュブロックは再利用されにくく、頻繁に使うデータをキャッシュから追い出す可能性があります。その場合は`enable_topn_lazy_mat_phase2_no_write_file_cache`を有効にします。これにより、フェーズ2ではキャッシュミスしたデータをリモートストレージから直接読み取り、File Cacheに書き戻しません。

この変数はクエリ結果を変えません。フェーズ2でFile Cacheのミスを処理する方法だけが変わります。

| 設定値 | フェーズ2での読み取り動作 |
| :--- | :--- |
| `false`（デフォルト） | 通常のリードスルーと書き戻しのポリシーを使用する。キャッシュミス時には、Dorisがリモートデータを読み取り、File Cacheに書き込む |
| `true` | `DOWNLOADED`状態のキャッシュブロックが現在の読み取り範囲全体を覆っている場合にのみ、ローカルキャッシュから読み取る。一部でもキャッシュされていないかダウンロード中であれば、現在の範囲全体をリモートストレージから読み取り、キャッシュブロックの作成や書き込みは行わない |

この変数を有効にする前に、次の適用範囲を確認してください。

- ストレージとコンピュートを分離したモードでのみ有効で、Doris内部テーブルに対するTOPN遅延マテリアライズのフェーズ2だけを制御します。現時点では、外部テーブルのフェーズ2での読み取りは制御しません。
- 行ストアを有効にしたDoris内部テーブルと、有効にしていないDoris内部テーブルの両方をサポートします。
- 既存のキャッシュエントリは削除せず、フェーズ1、ほかのクエリ、ほかのオペレーターによるキャッシュへの書き込みも変更しません。そのため、クエリ全体のFile Cacheへの書き込み量はゼロより大きいままの場合があります。
- File Cacheが無効な場合、または実行計画に`MaterializeNode`が含まれない場合は、追加の効果はありません。

### 基本的な使い方 {#basic-usage}

次の例を実行するには、ストレージとコンピュートを分離したクラスター、BEで有効なFile Cache、対象データベースでテーブルの作成と削除、およびデータの挿入とクエリを実行できるユーザーが必要です。まず、Duplicate Keyの内部テーブルを作成します。

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

Profileとフェーズ2の書き込みを行わないポリシーを有効にし、実行計画を確認してからクエリを実行します。

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

実行計画には`MaterializeNode`が含まれるはずです。この変数が有効かどうかにかかわらず、クエリは次の結果を返します。

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

### Profileでキャッシュポリシーを確認する {#verify-the-cache-policy-in-profile}

`profile_level`を`2`に設定した後、Query Profileで`MaterializeNode`に対応する実行オペレーターの下にある、次のフェーズ2固有のメトリクスを確認します。

| 観点 | 集計メトリクス | 意味 |
| :--- | :--- | :--- |
| 読み取り規模 | `TopNLazyMaterializationSecondPhaseRowsRead`、`TopNLazyMaterializationSecondPhaseSegmentsRead` | フェーズ2で読み取った行数とアクセスしたSegment数 |
| ローカルキャッシュからの読み取り | `TopNLazyMaterializationSecondPhaseLocalIOCount`、`TopNLazyMaterializationSecondPhaseLocalIOBytes`、`TopNLazyMaterializationSecondPhaseLocalIOTime` | File Cacheからの読み取り回数、バイト数、所要時間 |
| リモートからの読み取り | `TopNLazyMaterializationSecondPhaseRemoteIOCount`、`TopNLazyMaterializationSecondPhaseRemoteIOBytes`、`TopNLazyMaterializationSecondPhaseRemoteIOTime` | リモートストレージからの読み取り回数、バイト数、所要時間 |
| キャッシュのバイパス | `TopNLazyMaterializationSecondPhaseSkipCacheIOCount` | File Cacheに書き込まなかったリモート読み取りの回数 |
| キャッシュへの書き込み | `TopNLazyMaterializationSecondPhaseWriteCacheBytes`、`TopNLazyMaterializationSecondPhaseWriteCacheIOTime` | File Cacheに書き込んだバイト数と書き込みにかかった時間 |

書き込みを行わないポリシーが有効な場合は、次のメトリクスの傾向で動作を確認します。

| キャッシュの状態 | 予想されるメトリクスの傾向 |
| :--- | :--- |
| 現在の読み取り範囲全体はキャッシュされていない | `RemoteIOCount`、`RemoteIOBytes`、`SkipCacheIOCount`が0より大きく、`WriteCacheBytes`は0 |
| ダウンロード済みのキャッシュブロックが現在の読み取り範囲全体を覆っている | `LocalIOCount`と`LocalIOBytes`が0より大きく、`RemoteIOCount`、`RemoteIOBytes`、`WriteCacheBytes`は0 |

ProfileにはBEごとのメトリクスも表示されます。`TopNLazyMaterializationSecondPhasePerBackend`はBEの一覧です。ほかのメトリクス名では、`TopNLazyMaterializationSecondPhasePerBackendRowsRead`や`TopNLazyMaterializationSecondPhasePerBackendWriteCacheBytes`のように、`SecondPhase`の後に`PerBackend`が入ります。配列の各要素はインデックスによってBEの一覧に対応し、同じクエリ内で複数回行われたフェーズ2の取得結果を累積します。

:::note
`TopNLazyMaterializationSecondPhaseWriteCacheBytes`が対象とするのは、遅延マテリアライズのフェーズ2だけです。File Cache全体のメトリクスで書き込みが報告されている場合は、まずフェーズ1または別のオペレーターによるものかを確認してください。Profileの取得方法については、[Query Profileの分析](../query-profile.md)を参照してください。
:::

<!-- Knowledge type: operation -->
<!-- Applicable scenarios: evaluating the actual benefit of TOPN optimization -->

## TOPN最適化の実行効果を確認する {#check-the-execution-effect-of-topn-optimization}

**目的**：実行時間とProfileのメトリクスを比較して、TOPN最適化による実際のフィルタリング効果を確認します。

**手順**：

1. `topn_opt_limit_threshold`を`0`に設定して最適化を無効にし、実行時間を記録します。
2. デフォルト値に戻して最適化を有効にし、実行時間を記録して比較します。
3. Query Profileで`RuntimePredicate`を検索し、次の表にある主要なメトリクスに注目します。

**主要なメトリクス**：

| メトリクス | 意味 | 望ましい傾向 |
| :--- | :--- | :--- |
| `RowsZonemapRuntimePredicateFiltered` | RuntimePredicateによって除外された行数 | 大きいほどよい |
| `NumSegmentFiltered` | 除外されたデータファイル（Segment）の数 | 大きいほどよい |
| `BlockConditionsFilteredZonemapRuntimePredicateTime` | RuntimePredicateによるデータのフィルタリングにかかった時間 | 小さいほどよい |

> 注：2.0.3より前のバージョンでは、`RuntimePredicate`のメトリクスはまだ個別に記録されていません。Zonemap全体のメトリクスから、おおよその効果を確認できます。

**Profileの例**：

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

**Q1：EXPLAINに`TOPN OPT`が表示されません。考えられる理由は何ですか？**

- LIMIT nが`topn_opt_limit_threshold`（デフォルトは1024）より大きい。
- LIMIT nとテーブルの総行数の比率が`topn_filter_ratio`（デフォルトは0.5）を超えている。
- テーブルが、この最適化を使用できないUnique MORテーブルである。

**Q2：最適化を有効にした後、SQLが遅くなりました。なぜですか？**

- `n`が大きすぎてメモリの負荷が増えていないか確認してください。必要に応じて`topn_opt_limit_threshold`を下げられます。
- Profileの`RowsZonemapRuntimePredicateFiltered`でフィルタリング効果を確認してください。除外された行数が0なら、最適化による効果はありません。

**Q3：最適化 1と最適化 2を維持したまま、最適化 3（二段階読み取り）だけを無効にするにはどうすればよいですか？**

`enable_two_phase_read_opt = false`を設定します。

**Q4：MORテーブルに対するORDER BY LIMITクエリで誤った結果が返されます。なぜですか？**

MORテーブルでTOPN最適化が有効になっていないことを確認してください。MORテーブルでは、MOWモデルを使用するか、この最適化の実行経路が選ばれないようにしてください。

**Q5：フェーズ2の書き込みを行わないポリシーを有効にしても、クエリがFile Cacheに書き込むのはなぜですか？**

このポリシーが制御するのは、Doris内部テーブルに対するTOPN遅延マテリアライズのフェーズ2だけです。フェーズ1、ほかのオペレーター、外部テーブルからの読み取りでは、引き続きFile Cacheに書き込む場合があります。クエリ全体の書き込み量だけで判断せず、`TopNLazyMaterializationSecondPhaseWriteCacheBytes`を使ってフェーズ2でキャッシュへの書き込みが行われたか確認してください。

## 関連パラメータのクイックリファレンス {#quick-reference-for-related-parameters}

| 目的 | 設定 |
| :--- | :--- |
| TOPN最適化を完全に無効にする | `SET topn_opt_limit_threshold = 0;` |
| 二段階の遅延マテリアライズだけを無効にする | `SET enable_two_phase_read_opt = false;` |
| LIMITの上限を緩和して、より多くのクエリを対象にする | `topn_opt_limit_threshold`を適切に増やす |
| フィルタ生成に使う比率のしきい値を調整する | `topn_filter_ratio`を変更する |
| フェーズ2でキャッシュミスしたデータをFile Cacheに書き戻さない | `SET enable_topn_lazy_mat_phase2_no_write_file_cache = true;` |
| デフォルトのフェーズ2でのキャッシュ書き戻し動作に戻す | `SET enable_topn_lazy_mat_phase2_no_write_file_cache = false;` |
