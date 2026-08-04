---
{
  "title": "TOPNクエリ最適化",
  "language": "ja",
  "description": "TOPN クエリとは、ORDER BY LIMIT 操作を含むクエリを指し、ログ検索やその他の詳細なクエリシナリオで一般的に使用されます。本ページでは、TOPN最適化の仕組み、設定、およびストレージ・コンピュート分離環境における遅延マテリアライゼーション第2フェーズのFile Cacheポリシーを説明します。"
}
---
TOPN クエリは、ORDER BY LIMIT 操作を含むクエリを指し、ログ検索やその他の詳細なクエリシナリオで一般的です。Doris はこのタイプのクエリを自動的に最適化します。

```sql
SELECT * FROM tablex WHERE xxx ORDER BY c1,c2 ... LIMIT n
```
## TOPNの利点

1. 実行中に、ソート列に対して動的範囲フィルタが構築され（例：c1 >= 1000）、データ読み取り時に前の条件が自動的に適用され、zonemapインデックスを活用して一部の行やファイル全体をフィルタリングします。

2. ソートフィールドc1、c2がテーブルキーのプレフィックスと完全に一致する場合、さらなる最適化が適用されます。データ読み取り時に、データファイルのヘッダまたはテイル部分のみが読み取られ、読み取りデータ量が必要なn行のみに削減されます。

3. SELECT * 遅延マテリアライゼーション。データ読み取りおよびソート処理中は、ソート列のみが読み取られ、他の列は読み取られません。条件を満たす行番号を取得後、必要なn行の全データが読み取られ、読み取りおよびソートするデータ量が大幅に削減されます。

## 制限事項

1. DUPおよびMOWテーブルにのみ適用され、MORおよびAGGテーブルには適用されません。

2. 非常に大きな`n`でのメモリ消費が高いため、nが`topn_opt_limit_threshold`を超える場合は有効になりません。

## 設定とクエリ分析

以下の4つのパラメータは、特定のSQLまたはグローバルに設定できるセッション変数です。

1. `topn_opt_limit_threshold`：このセッション変数は、TOPN最適化を適用するかどうかを決定します。デフォルトは1024で、0に設定すると最適化が無効になります。

2. `enable_two_phase_read_optimization`：このセッション変数は、この最適化を有効にするかどうかを決定します。デフォルトはtrueで、falseに設定すると最適化が無効になります。

3. `topn_filter_ratio`、LIMIT nとテーブル内の総データとの比率で、デフォルト値は0.5です。これは、LIMITの数がテーブル内のデータの半分を超える場合、フィルタが生成されないことを意味します。

4. `enable_topn_lazy_mat_phase2_no_write_file_cache`：ストレージ・コンピュート分離モードで、Doris内部テーブルのTOPN遅延マテリアライゼーション第2フェーズがFile Cacheミス時にキャッシュへの書き戻しをスキップするかを制御します。デフォルトはfalseです。

### TOPNクエリ最適化が有効かどうかの確認

特定のSQLに対してTOPNクエリ最適化が有効かどうかを確認するには、`EXPLAIN`文を使用してクエリプランを取得できます。例は以下の通りです：

- `TOPN OPT`は最適化ポイント1が適用されていることを示します。

- `SORT LIMIT`付きの`VOlapScanNode`は最適化ポイント2が適用されていることを示します。

- `MaterializeNode`（または旧実行プランの`OPT TWO PHASE`）は最適化ポイント3が適用されていることを示します。

```sql
   1:VTOP-N(137)
   |   order by: @timestamp18 DESC
   |   TOPN OPT
   |   OPT TWO PHASE
   |   offset: 0
   |   limit: 10
   |   distribute expr lists: applicationName5
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

## 遅延マテリアライゼーション第2フェーズのFile Cache書き込みを制御する

ストレージ・コンピュート分離クラスタでは、TOPN遅延マテリアライゼーションの第2フェーズが、第1フェーズで選択した行IDを使って残りの列を読み取ります。少数の結果行が多数のSegmentに分散している場合、このような離散読み取りによって格納されたキャッシュブロックは再利用されにくく、ホットデータを追い出す可能性があります。この場合は`enable_topn_lazy_mat_phase2_no_write_file_cache`を有効にすると、第2フェーズはFile Cacheミスをリモートストレージから直接読み取り、File Cacheへ書き戻しません。

この変数はクエリ結果を変更せず、第2フェーズでFile Cacheミスが発生したときの処理だけを変更します。

| 設定 | 第2フェーズの読み取り動作 |
| :--- | :--- |
| `false`（デフォルト） | 通常のリードスルーおよび書き戻しポリシーを使用します。キャッシュミス時にリモートデータを読み取り、そのデータをFile Cacheへ書き込みます |
| `true` | `DOWNLOADED`状態のキャッシュブロックが今回の読み取り範囲全体をカバーしている場合のみ、ローカルキャッシュから読み取ります。未キャッシュまたはダウンロード中の範囲が一部でもある場合は、今回の読み取り範囲全体をリモートストレージから読み取り、キャッシュブロックを作成または書き込みません |

この変数を有効にする前に、次の適用範囲を確認してください。

- ストレージ・コンピュート分離モードでのみ有効で、Doris内部テーブルのTOPN遅延マテリアライゼーション第2フェーズだけを制御します。現時点では、外部テーブルの第2フェーズ読み取りは制御しません。
- 行ストアの有効・無効にかかわらず、Doris内部テーブルをサポートします。
- 既存のキャッシュを削除せず、第1フェーズ、他のクエリ、他のオペレータによるキャッシュ書き込みも変更しません。このため、クエリ全体のFile Cache書き込み量が0より大きい場合があります。
- File Cacheが無効な場合、または実行プランに`MaterializeNode`がない場合は、追加の効果はありません。

### 基本的な使用方法

次の例では、ストレージ・コンピュート分離クラスタを使用し、BEでFile Cacheが有効になっている必要があります。また、対象データベースでテーブルの作成と削除、およびデータの書き込みとクエリを実行できるユーザーで実行してください。まず、Duplicate Keyの内部テーブルを作成します。

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

Profileと第2フェーズの書き戻し抑制ポリシーを有効にし、実行プランを確認してクエリを実行します。

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

実行プランには`MaterializeNode`が含まれている必要があります。変数の有効・無効にかかわらず、クエリ結果は次のようになります。

```text
+----+---------+
| id | payload |
+----+---------+
|  3 | gamma   |
|  2 | beta    |
+----+---------+
2 rows in set
```

デフォルトのキャッシュ書き戻し動作へ戻すには、次を実行します。

```sql
SET enable_topn_lazy_mat_phase2_no_write_file_cache = false;
```

### Profileでキャッシュポリシーを確認する

`profile_level`を`2`に設定した後、Query Profileの`MaterializeNode`に対応する実行オペレータで、次の第2フェーズ専用メトリクスを確認します。

| 観測項目 | 集約メトリクス | 意味 |
| :--- | :--- | :--- |
| 読み取り規模 | `TopNLazyMaterializationSecondPhaseRowsRead`、`TopNLazyMaterializationSecondPhaseSegmentsRead` | 第2フェーズで読み取った行数とアクセスしたSegment数 |
| ローカルキャッシュ読み取り | `TopNLazyMaterializationSecondPhaseLocalIOCount`、`TopNLazyMaterializationSecondPhaseLocalIOBytes`、`TopNLazyMaterializationSecondPhaseLocalIOTime` | File Cacheから読み取った回数、バイト数、所要時間 |
| リモート読み取り | `TopNLazyMaterializationSecondPhaseRemoteIOCount`、`TopNLazyMaterializationSecondPhaseRemoteIOBytes`、`TopNLazyMaterializationSecondPhaseRemoteIOTime` | リモートストレージから読み取った回数、バイト数、所要時間 |
| キャッシュのスキップ | `TopNLazyMaterializationSecondPhaseSkipCacheIOCount` | リモートから読み取り、File Cacheへ書き込まなかった回数 |
| キャッシュ書き込み | `TopNLazyMaterializationSecondPhaseWriteCacheBytes`、`TopNLazyMaterializationSecondPhaseWriteCacheIOTime` | File Cacheへ書き込んだバイト数と所要時間 |

書き戻し抑制ポリシーを有効にした場合は、次のパターンで動作を確認できます。

| キャッシュ状態 | 期待されるメトリクス |
| :--- | :--- |
| 今回の読み取り範囲が完全にはキャッシュされていない | `RemoteIOCount`、`RemoteIOBytes`、`SkipCacheIOCount`が0より大きく、`WriteCacheBytes`は0 |
| 今回の読み取り範囲全体がダウンロード済みキャッシュブロックでカバーされている | `LocalIOCount`と`LocalIOBytes`が0より大きく、`RemoteIOCount`、`RemoteIOBytes`、`WriteCacheBytes`は0 |

ProfileにはBE別メトリクスもあります。`TopNLazyMaterializationSecondPhasePerBackend`にはBEの一覧が表示され、他のメトリクス名には`SecondPhase`の後に`PerBackend`が追加されます。たとえば、`TopNLazyMaterializationSecondPhasePerBackendRowsRead`と`TopNLazyMaterializationSecondPhasePerBackendWriteCacheBytes`です。各配列要素はインデックスによってBE一覧と対応し、同じクエリ内で複数回実行された第2フェーズFetchのデータを累積します。

:::note
`TopNLazyMaterializationSecondPhaseWriteCacheBytes`は遅延マテリアライゼーション第2フェーズだけを集計します。一般的なFile Cacheメトリクスに書き込みが残っている場合は、まず第1フェーズまたは他のオペレータによる書き込みかどうかを確認してください。Profileの取得方法については、[Query Profile分析](../query-profile.md)を参照してください。
:::

### 実行中のTOPNクエリ最適化の効果を確認する

まず、`topn_opt_limit_threshold`を0に設定してTOPNクエリ最適化を無効にし、最適化を有効にした場合と無効にした場合のSQLの実行時間を比較します。

TOPNクエリ最適化を有効にした後、クエリプロファイルで`RuntimePredicate`を検索し、以下のメトリクスに注目してください：

- `RowsZonemapRuntimePredicateFiltered`: フィルタリングされた行数、値が高いほど良い。

- `NumSegmentFiltered`: フィルタリングされたデータファイル数、値が高いほど良い。

- `BlockConditionsFilteredZonemapRuntimePredicateTime`: データのフィルタリングにかかった時間、値が低いほど良い。

バージョン2.0.3より前では、`RuntimePredicate`メトリクスは分離されておらず、`Zonemap`メトリクスを大まかな指針として使用できます。

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
