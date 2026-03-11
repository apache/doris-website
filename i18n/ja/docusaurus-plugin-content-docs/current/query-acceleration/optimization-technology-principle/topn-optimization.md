---
{
  "title": "TOPNクエリ最適化",
  "language": "ja",
  "description": "TOPN クエリとは、ORDER BY LIMIT 操作を含むクエリを指し、ログ検索やその他の詳細なクエリシナリオで一般的に使用されます。"
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

以下の2つのパラメータは、特定のSQLまたはグローバルに設定できるセッション変数です。

1. `topn_opt_limit_threshold`：このセッション変数は、TOPN最適化を適用するかどうかを決定します。デフォルトは1024で、0に設定すると最適化が無効になります。

2. `enable_two_phase_read_optimization`：このセッション変数は、この最適化を有効にするかどうかを決定します。デフォルトはtrueで、falseに設定すると最適化が無効になります。

3. `topn_filter_ratio`、LIMIT nとテーブル内の総データとの比率で、デフォルト値は0.5です。これは、LIMITの数がテーブル内のデータの半分を超える場合、フィルタが生成されないことを意味します。

### TOPNクエリ最適化が有効かどうかの確認

特定のSQLに対してTOPNクエリ最適化が有効かどうかを確認するには、`EXPLAIN`文を使用してクエリプランを取得できます。例は以下の通りです：

- `TOPN OPT`は最適化ポイント1が適用されていることを示します。

- `SORT LIMIT`付きの`VOlapScanNode`は最適化ポイント2が適用されていることを示します。

- `OPT TWO PHASE`は最適化ポイント3が適用されていることを示します。

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
