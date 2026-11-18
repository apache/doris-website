---
{
    "title": "Lance クエリ Profile リファレンス",
    "sidebar_label": "Lance クエリ Profile",
    "language": "ja",
    "description": "Apache Doris の Lance クエリ Profile を読み解くためのリファレンス。FE のメタデータとプランニング、BE のインデックスとスキャンの指標、キャッシュ統計、計測時間の範囲、第二段階の Row ID による行取得を説明します。",
    "keywords": [
        "Lance",
        "Query Profile",
        "パフォーマンス分析",
        "ベクトル検索",
        "インデックスキャッシュ"
    ]
}
---

このリファレンスでは、通常の Lance スキャン、ベクトル検索、全文検索、第二段階の Row ID による行取得に関する Profile 指標を説明します。Profile の収集と表示、および一般的なオペレーターの分析については、[Query Profile 分析ガイド](../../query-acceleration/query-profile.md)を参照してください。Lance へのアクセスは、[Lance Catalog](../catalogs/lance-catalog.mdx)を使用して設定します。

:::note
Lance Catalog は実験的な機能で、Apache Doris 4.2 以降でサポートされます。以下の指標は、稼働中の FE/BE とバンドルされている Lance のバージョンによって異なります。
:::

Lance クエリを実行する前に、クエリの Profile を有効にします。

```sql
SET enable_profile = true;
```

以下の名前は、現在の Lance の計測項目を表します。

## FE のメタデータとプランニング {#fe-metadata-and-planning}

通常のスキャン、`COUNT`、ベクトル検索、全文検索を含む Catalog クエリでは、`Lance Metadata Metrics` を `Execution Summary` の下で確認します。

| タイマー | 意味 |
|---|---|
| `MetadataReadTime` | Catalog のメタデータ読み取りにかかった合計時間。テーブルアクセスの解決、Dataset へのアクセス、リソースのクリーンアップを含みます。 |
| `TableAccessResolveTime` | Namespace へのアクセス、認証情報、ストレージオプションを含む、テーブルアクセスの解決にかかった時間。 |
| `DatasetOpenTime` | FE で Dataset を開く時間。過去のスナップショットを参照するクエリでは、複数回開くことがあります。 |
| `VersionResolveTime` | 必要に応じて、指定された過去のスナップショットを解決する時間。 |
| `SchemaReadTime` | Arrow スキーマを読み取る時間。 |
| `FragmentMetadataReadTime` | Fragment のメタデータを読み取り、行数の記述情報を作成する時間。 |
| `FieldIdsReadTime` | Lance のフィールド ID を読み取り、対応付ける時間。 |
| `IndexMetadataReadTime` | 論理インデックスを検出し、インデックスセグメントのメタデータを読み取る時間。 |
| `SplitPlanningTime` | 通常のスキャン、メタデータを使った行数カウント、ベクトル検索、全文検索の Split を計画する時間。 |

実行された操作やステップには、`Calls` に対応するカウンターもあり、たとえば `DatasetOpenCalls` が該当します。`MetadataReadFailures` と `SplitPlanningFailures` は、失敗した操作を、その経過時間も含めて計測します。失敗した SQL ステートメントの数ではありません。実行されなかったメタデータ処理にはカウンターが作成されません。このグループには、同じ SQL ステートメント内での複数テーブルに対する処理や繰り返しの読み取りを含む Catalog の処理が累積されます。単独のファイル TVF と `SHOW INDEX` は、このグループの指標を記録しません。

`MetadataReadTime` にはメタデータ処理の各ステップが含まれます。`SplitPlanningTime` は別に計測されます。汎用指標の `External Table Get Table Meta Time`、`External Table Get File Scan Tasks Time`、`External Table Meta Time` には対応する処理が含まれているため、それらを Lance の詳細タイマーや、それらを包含する分析・プランニング時間に重ねて加算しないでください。FE の `DatasetOpenTime` と BE の `LanceDatasetOpenTime` は、異なるプロセスでの処理を表します。

## BE のグループと統計の計測範囲 {#be-groups-and-statistics-boundaries}

スキャンの Profile では、`TableReader` → `LanceReader` を確認します。その配下のグループはラベルであり、タイマーではありません。階層構造は、子項目の時間を加算できることを意味しません。

| グループ | 内容 |
|---|---|
| `LanceTiming` | Dataset を開く処理、Scanner の設定と読み取り、Runtime Filter の変換、Arrow の変換、Row ID による行取得。 |
| `LanceIO` | 計測対象の実行ストリームにおける読み取り操作数、リクエスト数、バイト数。 |
| `LanceIndex` | インデックスオブジェクトとコンポーネントの読み込み、キャッシュの参照、比較、インデックスを開く処理、検索したパーティション。 |
| `LanceVectorIndex` | IVF パーティションの選択、ベクトルインデックスの delta、ANN の各段階、ベクトル距離の計算。 |
| `LanceScalarIndex` | スカラーインデックスの評価、セグメント検索、候補、フォールバック、結果のシリアライズ。 |
| `LanceExecutionPlan` | Lance 実行プランにおけるソート、マージ、Take の処理。 |
| `LanceScan` | Fragment、行範囲、行のスキャン、スキャンタスクの待機、Row ID Prefilter の構築。 |
| `LanceSearchPlan` | リーダーに割り当てられた検索セグメントと Fragment の数。 |
| `LanceDataCache` | Dataset ハンドルに対するデータファイルのキャッシュと、元のストレージへのリクエストのバイト数。 |

Doris のタイマーは、対象の呼び出しを計測する際に更新されます。Lance の実行カウンターは、ストリームが EOF に達した後、統計コールバックから累積されます。失敗、キャンセル、早期終了が発生すると、実行統計が不完全になる場合があります。Scanner の指標は、オプションのネイティブ指標を含めて事前登録されます。値がゼロでも、ネイティブの処理経路からその指標が報告されなかっただけの場合があります。指標が存在しない、またはゼロであることだけでは、インデックス、フィルター、I/O の処理経路が使われなかったとは判断できません。メタデータのみを使用する `COUNT` と Row ID による行取得は、通常の Scanner コールバック経路を使用しません。

時間は呼び出しと並列タスクにわたって累積されるため、SQL の実経過時間を超えることがあります。最も遅い Scanner を、スケジューリング、依存処理の待機、FE での結果処理、クライアント側の遅延と合わせて確認してください。クエリのレイテンシーを再現するために、すべての Scanner や入れ子になったタイマーを合算しないでください。

## リーダーの処理時間 {#reader-timing}

| タイマー | 意味 |
|---|---|
| `LanceDatasetOpenTime` | BE の共有 Session を通じて Dataset を開く時間。必要なメタデータへのアクセスを含みます。リーダーですでに開いている Dataset を再利用する場合、開く処理は追加で計測されません。 |
| `LanceScannerConfigureTime` | Scanner、プロジェクション、フィルター、コールバック、Split や検索のオプションを設定する時間。読み取りまで延期される処理は、後で計測されます。 |
| `LanceRuntimeFilterSqlTranslationTime` | 変換キャッシュの参照を含め、Doris の Runtime Filter を Lance SQL に変換・結合する時間。フィルターの実行時間ではありません。 |
| `LanceScannerNextTime` | バッチ読み取りの呼び出しにかかった累積時間。初期準備、インデックス計算、I/O、デコード、待機を含みます。後続の Arrow から Doris への変換は含みません。 |
| `LanceArrowToDorisBlockTime` | 返された Arrow バッチを Doris Block に変換する時間。スキャンと Row ID による行取得の両方に適用されます。 |

`LanceScannerNextTime` は、以下に示す内部のインデックス、スキャン、実行プランのタイマーと重複します。この値が大きいだけでは、ストレージがボトルネックだとは判断できません。

## I/O、インデックスの読み込み、キャッシュの参照 {#io-index-loading-and-cache-lookups}

| カウンター | 意味 |
|---|---|
| `LanceIOReadOps` | 計測対象の読み取り操作数。秒あたりの操作数でも、HTTP リクエスト数でもありません。 |
| `LanceIOReadRequests` | 計測対象のストレージ読み取りリクエスト数。範囲の結合や分割により、`LanceIOReadOps` とは異なる場合があります。 |
| `LanceIOReadBytes` | 実行プランが報告する読み取りバイト数。計測対象のデータとインデックスの処理経路を含みます。キャッシュから提供された読み取りが含まれる場合もあり、実測したリモート通信量やデコード後のメモリサイズではありません。 |
| `LanceIndexObjectLoads` | 読み込まれた最上位のインデックスオブジェクト数。セグメント数でも、内部ページの読み込み回数でもありません。 |
| `LanceIndexComponentsLoaded` | ページ、パーティション、ポスティングなど、読み込まれたインデックス内部のコンポーネント数。インデックスキャッシュのミス数ではありません。読み込みやマージの動作、および計測方法によって、両者の数は異なる場合があります。 |
| `LanceIndexCacheHits`, `LanceIndexCacheMisses` | 計測対象のインデックス処理経路が、この実行について報告するキャッシュ参照の結果。BE 全体の Session のヒット数・ミス数とは異なります。ストリーミング処理経路の中には、読み込んだ内容を保持しないものがあるため、ミスが続くだけではキャッシュ容量の不足を証明できません。 |
| `LanceIndexComparisons` | 各インデックス実装が定義する比較や参照の処理量。候補行数でも、インデックスの種類をまたいで共通の CPU コスト単位でもありません。 |

これらのカウンターは、計測対象のベクトル、スカラー、全文の各インデックス処理経路に適用されます。インデックスオブジェクトがキャッシュに残っていても、そのページやパーティションの読み込みが必要な場合があります。容量を増やす前に、キャッシュ使用量、再現可能なコールドキャッシュとウォームキャッシュのワークロード、I/O を合わせて確認してください。別系統のディスクデータキャッシュと BE 全体の指標については、[キャッシュの効果を確認する](../catalogs/lance-catalog.mdx#checking-cache-effectiveness)を参照してください。

## Row ID Prefilter とスカラーインデックスの処理 {#row-id-prefilter-and-scalar-index-work}

Row ID Prefilter の指標は、Row ID を取り込み、許可する行のマスクを構築するローダーについてのものです。すべての TVF `filter` やスカラーインデックスの参照を計測するものでも、最終的な ANN/FTS の結果数を表すものでもありません。

| カウンターまたはタイマー | 意味 |
|---|---|
| `RowIdPrefilterLoads` | Row ID ローダーが実際に実行された回数。クエリノードが繰り返されると、読み込みも繰り返される場合があります。 |
| `RowIdPrefilterInputRows`, `RowIdPrefilterInputBatches` | ローダーが取り込んだ、null でない Row ID の数とバッチ数。 |
| `RowIdPrefilterIds` | 構築されたマスクに保持された、許可される Row ID の数。ローダー間で累積され、クエリ全体で重複排除された数ではありません。 |
| `RowIdPrefilterLoadTime` | 入力のポーリングとマスクの構築を含む、ローダーの合計時間。 |
| `RowIdPrefilterInputTime`, `RowIdPrefilterBuildTime` | 入力ストリームの待機・読み取り時間と、マスクの構築時間。どちらも `RowIdPrefilterLoadTime` に含まれるため、合計値と内訳を足し合わせないでください。 |
| `LanceScalarIndexQueryTime` | スカラーインデックス式の評価時間。複数回のインデックス検索や集合演算を含む場合があります。 |
| `LanceScalarIndexResultSerializationTime` | スカラーインデックスの結果を後続の Lance ノード向けにシリアライズする時間。ネットワーク向けのシリアライズや、Arrow から Doris への変換ではありません。 |
| `LanceScalarIndexSegmentsRequested`, `LanceScalarIndexSegmentsSearched` | 明示的なスカラーセグメント経路へのリクエスト数と、完了したセグメント評価の回数。実行回数であり、テーブル内の異なるセグメントの数ではありません。 |
| `LanceScalarIndexSegmentFallbacks` | 明示的なスカラーセグメントの高速化処理が、割り当てられた Fragment の範囲内で完全なフィルタースキャンにフォールバックした回数。検索済みのセグメントでもフォールバックする場合があります。 |
| `LanceScalarIndexCandidateRows` | 行数が分かる場合の候補マスクのサイズ。リーダーが Fragment の範囲と完全な述語を適用する前の値です。SQL の結果行数ではなく、ゼロは行数を取得できなかったことを示す場合もあります。 |
| `LanceScalarIndexCandidateEvaluationTime` | スカラーセグメントの候補を準備、評価、設定する時間。インデックスを開く処理や検索、フォールバックの準備を含みます。後続のデータスキャンは含みません。 |
| `LanceScalarIndexSegmentSearchTime` | 選択されたセグメントのインデックス式を評価する時間。読み込みと集合演算を含み、`LanceScalarIndexCandidateEvaluationTime` に含まれます。 |

セグメントは、単一タスクが読み取る範囲より多くの Fragment をカバーする場合があり、繰り返し実行されるタスクが同じ候補を再度数えることもあります。`CandidateRows` をタスク内で一致した行数として解釈しないでください。通常のスカラー式の処理経路と明示的なセグメントの処理経路ではタイマーが異なり、同じ値を報告するとは限りません。キャッシュがウォーム状態でも、大きなマスクや繰り返しのセグメント評価は CPU とメモリを消費する場合があります。

## ベクトルと実行プランの処理 {#vector-and-execution-plan-work}

| カウンターまたはタイマー | 意味 |
|---|---|
| `LanceIVFPartitionsConsidered` | 選択時に検討された IVF パーティションの総数。選択されたインデックス delta にわたって累積されます。実行されたプローブの数ではありません。 |
| `LanceIVFPartitionSelectionTime` | クエリに使用する IVF パーティションを選択する時間。その外側でインデックスを開く処理は含みません。 |
| `LanceIndexPartitionsSearched` | インデックスの実行によって実際に報告されたパーティション検索数。FTS もこの指標を報告するため、`LanceSearchType` と合わせて解釈してください。クエリ全体で重複排除されたパーティション数ではありません。 |
| `LanceVectorIndexDeltasSearched` | ANN のパーティション処理経路に投入されたベクトルインデックス delta の数。すべての delta で検索が完了したことを示すものではありません。 |
| `LanceIndexOpenTime` | キャッシュ参照とメタデータアクセスを含め、インデックスハンドルを開く時間。 |
| `LanceIndexPartitionLoadTime`, `LanceIndexPartitionPrepareTime` | パーティションの読み込みには、キャッシュ参照、キャッシュへの格納を待つ時間、ミス時の読み込みとデコードが含まれます。パーティションの準備には、読み込みとフィルターの準備が含まれます。これらのタイマーは重複します。 |
| `LanceIndexPrefilterWaitTime` | インデックスの Prefilter の準備が整うまで待つ時間。Row ID マスクを構築する時間とは異なります。 |
| `LanceIndexCpuQueueWaitTime` | パーティション検索タスクの投入から、その CPU 処理の開始までの待機時間。 |
| `LanceIndexSearchTime` | 準備済みパーティションの CPU 検索時間。クエリの準備と結果の構築を含みます。 |
| `LanceIndexQueryPrepareTime` | 距離計算器とクエリ用のルックアップテーブルを構築する時間。 |
| `LanceIndexDistanceTopKTime` | 候補のフィルタリング、距離の評価、Top-K ヒープの更新を一体で行う時間。純粋な距離計算や再評価だけの時間ではありません。 |
| `LanceIndexResultMaterializeTime` | 検索結果のヒープを Arrow 配列やバッチに変換する時間。Doris による第二段階の出力行取得ではありません。 |
| `LanceANNPartitionExecTime`, `LanceANNSubIndexExecTime`, `LanceANNBatchExecTime` | 計測対象の ANN 実行ノードにおける計算時間。詳細なインデックスタイマーと重複する場合があります。 |
| `LanceVectorDistanceComputeTime` | ベクトル距離の実行ノードが報告する計算時間。インデックス内のすべての距離計算を含むわけではありません。 |
| `LanceSortComputeTime`, `LanceSortMergeComputeTime`, `LanceTakeExecTime` | Lance 実行ノードでのソート、マージ、Take の計算時間。Doris TopN の時間でも、第二段階の行取得全体の時間でもありません。 |

パーティションの処理は並行して実行され、タイマーは入れ子になったり重複したりします。`LanceIndexSearchTime` に、その内訳であるクエリ準備、距離計算・Top-K、結果構築の時間を加算しないでください。`nprobes`、`ef`、`refine_factor` を変更する前に、プローブ数、CPU キューでの待機、Prefilter の待機、I/O を比較し、レイテンシーとともに再現率も測定してください。

## 計画された処理、スキャン行数、出力行の取得 {#planned-work-scanned-rows-and-output-fetch}

| カウンターまたはタイマー | 意味 |
|---|---|
| `LancePlannedIndexSegmentCount` | リーダーに割り当てられた検索インデックスセグメントの数。Split の設定時に累積されます。検索が完了したことを示すものではありません。 |
| `LancePlannedIndexedFragmentCount` | インデックスを使用するベクトル検索または全文検索の Split に割り当てられた Fragment の数。 |
| `LancePlannedFlatSearchFragmentCount` | ベクトルの Flat Search Split に割り当てられた Fragment の数。FTS ではこのカウンターは登録されません。 |
| `LanceFragmentsScanned`, `LanceRowOffsetRangesScanned`, `LanceRowsScanned` | FilteredRead の処理経路が報告する Fragment、行オフセット範囲、行の数。すべての読み取り経路で記録されるわけではなく、テーブル全体で重複排除された数や最終的な SQL の結果行数ではありません。 |
| `LanceScanTaskWaitTime` | FilteredRead のコンシューマーが読み取りタスクを待つ時間。Doris Scanner のスケジューリング時間でも、I/O 待機時間の全体でもありません。 |
| `LanceRowIdFetchCalls`, `LanceRowIdFetchRows` | 第二段階の `take_rows` の呼び出し回数と取得された行数。 |
| `LanceRowIdTakeReadTime` | Row ID の Take ストリームを作成して消費する時間。遅延して実行される読み取りを含み、Arrow から Doris への変換は含みません。 |
| `LanceRowIdFetchTotalTime` | 空でない Row ID による行取得の合計処理時間。Dataset を開く処理、Take の読み取り、変換、結果の確認を含みます。前述の各処理が含まれますが、RPC/Materialization の処理全体に伴うオーバーヘッドは含みません。 |

検索のプランニングについては、`EXPLAIN` のフィールドである `lanceSearchIndexSegments`、`lanceSearchIndexFragments`、`lanceSearchUnindexedFragments` と、`LanceSearchPlan` のカウンターを比較してください。通常のスカラーセグメントスキャンでは、`lanceGroupingIndexSegments`、`lanceGroupingIndexedFragments`、`lanceGroupingUnindexedFragments` を使用します。これらは FE のプランフィールドであり、BE の Profile カウンターではありません。Fragment の数はタスクごとに累積され、重複排除されるとは限りません。

二段階の行取得では別のリーダーを使用し、Scanner の実行統計コールバックは登録されません。その行取得のタイマーとカウンター、および `LanceDataCacheBytesReadFromCache`/`LanceDataCacheBytesReadFromRemote` は、Row ID Fetch/Materialization の Profile 情報にも報告されます。そこで `LanceIOReadBytes` が見当たらなくても、I/O が発生しなかったとは限りません。スキャンと行取得の計測範囲を分けて扱い、エクスポートされた同じ行取得統計を二重に数えないでください。

実際に実行されたスナップショットの特定には `LanceDatasetVersion` と `LanceDatasetUri` を使用し、ベクトル検索と全文検索の区別には `LanceSearchType` を使用します。`LanceTopK`、`LanceOffset`、`LanceFtsCoverageMode`、`LanceFtsQueryType`、`LanceFtsMatchOperator`、`LanceFtsMaxFuzzyDistance`、`LanceFtsPhraseSlop`、`LancePushdownFormat`、および Runtime Filter ID の項目は、設定やプッシュダウンの状態を表します。これらは情報を示す文字列であり、加算できるカウンターではありません。`LanceTopK` と `LanceOffset` は Split ごとのリクエストを表します。`top_k=K` と `offset=n` を指定した TVF クエリでは、検索 Split は最大 `K+n` 件の候補をローカルの offset `0` でリクエストし、最後に Doris TopN がユーザー指定の offset を適用します。
