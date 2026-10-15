---
{
    "title": "Lance クエリ Profile リファレンス",
    "sidebar_label": "Lance クエリ Profile",
    "language": "ja",
    "description": "Apache Doris の Lance クエリ Profile における FE のメタデータ処理とプランニング、BE のインデックスとスキャンのメトリクス、キャッシュ統計、計測時間の範囲、第二段階の行 ID 取得について説明します。",
    "keywords": [
        "Lance",
        "クエリ Profile",
        "性能分析",
        "ベクトル検索",
        "インデックスキャッシュ"
    ]
}
---

このリファレンスでは、通常の Lance スキャン、ベクトル検索、全文検索、第二段階の行 ID 取得に関する Profile メトリクスを説明します。Profile の収集と表示、および一般的なオペレーター分析については、[Query Profile 分析ガイド](../../query-acceleration/query-profile.md)を参照してください。Lance へのアクセスは [Lance Catalog](../catalogs/lance-catalog.mdx) で設定します。

:::note
Lance Catalog は実験的な機能で、Apache Doris 4.2 以降でサポートされます。以下のメトリクスは、稼働中の FE/BE と同梱されている Lance のバージョンによって異なります。
:::

Lance クエリを実行する前に、クエリの Profile 収集を有効にします。

```sql
SET enable_profile = true;
```

以下の名前は、現在の Lance の計測項目を表します。

## FE のメタデータ処理とプランニング

通常のスキャン、`COUNT`、ベクトル検索、全文検索を含む Catalog クエリでは、`Lance Metadata Metrics`（`Execution Summary` 内） を確認します。

| タイマー | 意味 |
|---|---|
| `MetadataReadTime` | Catalog メタデータ読み取りの合計時間。テーブルアクセスの解決、Dataset へのアクセス、リソースのクリーンアップを含みます。 |
| `TableAccessResolveTime` | テーブルアクセスを解決する時間。Namespace へのアクセス、認証情報、ストレージオプションを含みます。 |
| `DatasetOpenTime` | FE で Dataset を開く時間。過去のスナップショットを参照するクエリでは、複数回開く場合があります。 |
| `VersionResolveTime` | 必要に応じて、指定された過去のスナップショットを解決する時間。 |
| `SchemaReadTime` | Arrow スキーマを読み取る時間。 |
| `FragmentMetadataReadTime` | Fragment のメタデータを読み取り、行数の記述情報を構築する時間。 |
| `FieldIdsReadTime` | Lance のフィールド ID を読み取り、対応付ける時間。 |
| `IndexMetadataReadTime` | 論理インデックスを検出し、インデックスセグメントのメタデータを読み取る時間。 |
| `SplitPlanningTime` | 通常のスキャン、メタデータを使う件数取得、ベクトル検索、全文検索のスキャン split を計画する時間。 |

実行された操作やステップには、`Calls` カウンター（`DatasetOpenCalls` など）もあります。`MetadataReadFailures` と `SplitPlanningFailures` は失敗した操作を数え、その操作にかかった時間も計測に含まれます。失敗した SQL 文の件数ではありません。実行されなかったメタデータ処理ステップにはカウンターが作成されません。このグループは、SQL 文の中で複数のテーブルや繰り返しの読み取りにまたがる Catalog 処理を累積します。単独のファイル TVF と `SHOW INDEX` は、このグループを設定しません。

`MetadataReadTime` には、そのメタデータ処理の各ステップが含まれます。`SplitPlanningTime` は別に計測されます。汎用メトリクスの `External Table Get Table Meta Time`、`External Table Get File Scan Tasks Time`、`External Table Meta Time` には対応する処理が含まれます。そのため、これらを Lance の詳細タイマーや、その外側の分析・プランニング時間に再度加算しないでください。FE の `DatasetOpenTime` と BE の `LanceDatasetOpenTime` は別のプロセスを表します。

## BE のグループと統計の計測範囲

スキャン Profile の `TableReader` → `LanceReader` を確認します。そこにあるグループ名はラベルであり、タイマーではありません。階層構造から、子項目の時間を加算できるとは判断できません。

| グループ | 内容 |
|---|---|
| `LanceTiming` | Dataset のオープン、Scanner の設定と読み取り、Runtime Filter の変換、Arrow からの変換、行 ID の取得。 |
| `LanceIO` | 計測対象の実行ストリームによる読み取り操作、リクエスト、バイト数。 |
| `LanceIndex` | インデックスのオブジェクトと構成要素の読み込み、キャッシュ参照、比較、インデックスのオープン、検索したパーティション。 |
| `LanceVectorIndex` | IVF パーティションの選択、ベクトルインデックスの delta、ANN の各段階、ベクトル距離の計算。 |
| `LanceScalarIndex` | スカラーインデックスの評価、セグメント検索、候補、フォールバック、結果のシリアライズ。 |
| `LanceExecutionPlan` | Lance 実行プランのソート、マージ、Take 処理。 |
| `LanceScan` | Fragment、範囲、行のスキャン、スキャンタスクの待機、行 ID Prefilter の構築。 |
| `LanceSearchPlan` | リーダーに割り当てられた検索セグメントと Fragment の数。 |
| `LanceDataCache` | Dataset ハンドルに対するデータファイルのキャッシュと、元のストレージから読み取ったリクエストのバイト数。 |

Doris のタイマーは、計測対象の呼び出しの前後で更新されます。Lance の実行カウンターは、ストリームが EOF に達した後の統計コールバックから累積されます。失敗、キャンセル、早期終了の場合、実行統計が不完全になることがあります。Scanner のメトリクスは、任意のネイティブメトリクスも含めて事前登録されます。値がゼロでも、ネイティブ側がそのメトリクスを報告しなかっただけの場合があります。メトリクスが存在しない、またはゼロであるというだけで、インデックス、フィルター、I/O の経路が使われなかったとは判断できません。メタデータのみを使う `COUNT` と行 ID の取得では、通常の Scanner 統計コールバック経路を使いません。

時間は呼び出しや並列タスクをまたいで累積されるため、SQL の経過時間を超えることがあります。最も遅い Scanner を、スケジューリング、依存関係の待機、FE の結果処理、クライアントのレイテンシーと併せて確認してください。全 Scanner の時間や入れ子になったタイマーを合算して、クエリのレイテンシーを再構成しないでください。

## リーダーの処理時間

| タイマー | 意味 |
|---|---|
| `LanceDatasetOpenTime` | BE の共有 Session を通じて Dataset を開く時間。必要なメタデータアクセスを含みます。リーダーが開いた Dataset を再利用する場合、オープン回数は増えません。 |
| `LanceScannerConfigureTime` | Scanner、projection、filter、callback、split や検索のオプションを設定する時間。読み取りまで遅延された処理は後で計測されます。 |
| `LanceRuntimeFilterSqlTranslationTime` | Doris Runtime Filter を Lance SQL に変換・結合する時間。変換キャッシュの参照を含みます。フィルターの実行時間ではありません。 |
| `LanceScannerNextTime` | バッチ読み取り呼び出しの累積時間。初期準備、インデックス計算、I/O、デコード、待機を含みます。その後の Arrow から Doris への変換は含みません。 |
| `LanceArrowToDorisBlockTime` | スキャンと行 ID 取得の両方で、返された Arrow バッチを Doris Block に変換する時間。 |

`LanceScannerNextTime` は、後述する内部のインデックス、スキャン、実行プランの各タイマーと重なります。この値が大きいだけでは、ストレージがボトルネックとは判断できません。

## I/O、インデックスの読み込み、キャッシュ参照

| カウンター | 意味 |
|---|---|
| `LanceIOReadOps` | 計測対象の読み取り操作数。秒あたりの操作数でも HTTP リクエスト数でもありません。 |
| `LanceIOReadRequests` | 計測対象のストレージ読み取りリクエスト数。範囲の結合や分割によって、`LanceIOReadOps` とは異なる場合があります。 |
| `LanceIOReadBytes` | 実行プランが報告する読み取りバイト数。計測対象のデータやインデックスの経路を含みます。キャッシュから返された読み取りを含む場合もあります。実測したリモート通信量や、デコード後のメモリサイズではありません。 |
| `LanceIndexObjectLoads` | 読み込まれた最上位のインデックスオブジェクト数。セグメント数や内部ページの読み込み数ではありません。 |
| `LanceIndexComponentsLoaded` | ページ、パーティション、posting など、読み込まれた内部構成要素の数。インデックスキャッシュのミス数ではありません。読み込みやマージの処理と計測方法によって、異なる数値になります。 |
| `LanceIndexCacheHits`, `LanceIndexCacheMisses` | この実行で、計測対象のインデックス経路が報告したキャッシュ参照数。BE 全体の Session のヒット・ミス合計とは異なります。ストリーミング経路の一部は読み込んだ内容を保持しません。そのため、継続的なミスだけでキャッシュ容量不足とは判断できません。 |
| `LanceIndexComparisons` | 各インデックス実装が定義する比較・参照処理の数。候補行数ではなく、インデックス種別をまたいで共通の CPU コスト単位でもありません。 |

これらのカウンターは、計測対象のベクトル、スカラー、全文検索のインデックス経路に適用されます。インデックスオブジェクトがキャッシュに残っていても、そのページやパーティションの読み込みが必要な場合があります。容量を増やす前に、キャッシュ使用量、再現可能なコールド・ウォーム両条件のワークロード、I/O を併せて確認してください。別のディスクデータキャッシュと BE 全体のメトリクスについては、[キャッシュの有効性の確認](../catalogs/lance-catalog.mdx#checking-cache-effectiveness)を参照してください。

## 行 ID Prefilter とスカラーインデックスの処理

行 ID Prefilter のメトリクスは、行 ID を受け取り、許可された行を示すマスクを作るローダーを表します。すべての TVF の `filter`、すべてのスカラーインデックス参照、最終的な ANN/FTS の結果件数を計測するものではありません。

| カウンターまたはタイマー | 意味 |
|---|---|
| `RowIdPrefilterLoads` | 行 ID ローダーが実際に実行された回数。クエリ内でノードが繰り返されると、読み込みも繰り返される場合があります。 |
| `RowIdPrefilterInputRows`, `RowIdPrefilterInputBatches` | ローダーが受け取った NULL ではない行 ID とバッチの数。 |
| `RowIdPrefilterIds` | 構築したマスクに保持された許可済み行 ID の数。クエリ全体で重複を除いた値ではなく、ローダー間で累積された値です。 |
| `RowIdPrefilterLoadTime` | 入力のポーリングとマスク構築を含む、ローダー処理の合計時間。 |
| `RowIdPrefilterInputTime`, `RowIdPrefilterBuildTime` | 入力ストリームの待機・読み取り時間と、マスクの構築時間。どちらも `RowIdPrefilterLoadTime` に含まれるため、合計に再加算しないでください。 |
| `LanceScalarIndexQueryTime` | スカラーインデックスの式を評価する時間。複数のインデックス検索や集合演算を含む場合があります。 |
| `LanceScalarIndexResultSerializationTime` | 後続の Lance ノード向けにスカラーインデックスの結果をシリアライズする時間。ネットワーク転送用のシリアライズや Arrow から Doris への変換ではありません。 |
| `LanceScalarIndexSegmentsRequested`, `LanceScalarIndexSegmentsSearched` | 明示的なスカラーセグメント経路に対するリクエスト数と、完了したセグメント評価数。実行回数であり、異なるテーブルセグメントの数ではありません。 |
| `LanceScalarIndexSegmentFallbacks` | 明示的なスカラーセグメント高速化が、割り当てられた Fragment の範囲内で、全体をフィルターでスキャンする処理にフォールバックした回数。検索済みのセグメントもフォールバックする場合があります。 |
| `LanceScalarIndexCandidateRows` | 判明している場合の候補マスクのサイズ。リーダーが Fragment の範囲と完全な述語を適用する前の値です。SQL の結果件数ではなく、ゼロは件数を取得できないことを示す場合もあります。 |
| `LanceScalarIndexCandidateEvaluationTime` | スカラーセグメントの候補を準備、評価、設定する時間。インデックスのオープン・検索とフォールバックの準備を含み、その後のデータスキャンは含みません。 |
| `LanceScalarIndexSegmentSearchTime` | 選択されたセグメントのインデックス式を評価する時間。読み込みと集合演算を含みます。`LanceScalarIndexCandidateEvaluationTime` に含まれます。 |

一つのセグメントが、一つのタスクの読み取り対象より多くの Fragment を含むことがあります。また、複数のタスクで同じ候補を重複して数えることがあります。`CandidateRows` をタスク内で一致した行数として解釈しないでください。通常のスカラー式経路と明示的なセグメント経路ではタイマーが異なるため、同じ値になるとは限りません。キャッシュが温まっていても、大きなマスクや繰り返しのセグメント評価によって CPU とメモリが消費される場合があります。

## ベクトルと実行プランの処理

| カウンターまたはタイマー | 意味 |
|---|---|
| `LanceIVFPartitionsConsidered` | 選択時に検討した IVF パーティションの母数。選ばれたインデックス delta にわたって累積されます。実行された probe の数ではありません。 |
| `LanceIVFPartitionSelectionTime` | クエリに使う IVF パーティションを選ぶ時間。前後のインデックスオープン処理は含みません。 |
| `LanceIndexPartitionsSearched` | インデックスの実行時に実際に報告されたパーティション検索数。FTS もこのメトリクスを報告するため、`LanceSearchType` と併せて解釈してください。クエリ全体で重複を除いたパーティション数ではありません。 |
| `LanceVectorIndexDeltasSearched` | ANN パーティション経路に投入されたベクトルインデックス delta の数。すべての delta が検索を完了した証拠にはなりません。 |
| `LanceIndexOpenTime` | インデックスハンドルを開く時間。キャッシュ参照とメタデータアクセスを含みます。 |
| `LanceIndexPartitionLoadTime`, `LanceIndexPartitionPrepareTime` | パーティションの読み込みには、キャッシュ参照、キャッシュ充填の待機、ミス時の読み込み・デコードが含まれます。パーティションの準備には読み込みとフィルターの準備が含まれます。これらのタイマーは重なります。 |
| `LanceIndexPrefilterWaitTime` | インデックスの Prefilter が準備できるまで待つ時間。行 ID マスクの構築時間とは異なります。 |
| `LanceIndexCpuQueueWaitTime` | パーティション検索タスクの投入から CPU 処理の開始までの待ち時間。 |
| `LanceIndexSearchTime` | 準備済みパーティションの CPU 検索時間。クエリの準備と結果の構築を含みます。 |
| `LanceIndexQueryPrepareTime` | 距離計算器とクエリ参照テーブルを構築する時間。 |
| `LanceIndexDistanceTopKTime` | 候補のフィルタリング、距離の評価、Top-K ヒープの更新を一体で行う時間。距離計算のみ、または結果の再精査のみの時間ではありません。 |
| `LanceIndexResultMaterializeTime` | 検索結果のヒープを Arrow の配列やバッチに変換する時間。Doris の第二段階の出力取得ではありません。 |
| `LanceANNPartitionExecTime`, `LanceANNSubIndexExecTime`, `LanceANNBatchExecTime` | 計測対象の ANN 実行ノードの計算時間。詳細なインデックスタイマーと重なる場合があります。 |
| `LanceVectorDistanceComputeTime` | ベクトル距離の実行ノードが報告する計算時間。インデックスを使うすべての距離計算を網羅するものではありません。 |
| `LanceSortComputeTime`, `LanceSortMergeComputeTime`, `LanceTakeExecTime` | Lance 実行ノードのソート、マージ、Take の計算時間。Doris の TopN や第二段階の取得全体を表すものではありません。 |

パーティションの処理は並列に実行され、タイマーが入れ子になったり重なったりする場合があります。`LanceIndexSearchTime` に、クエリ準備、距離計算・Top-K、結果構築の内訳を加算しないでください。`nprobes`、`ef`、`refine_factor` を変更する前に、probe 数、CPU キューの待機、Prefilter の待機、I/O を比較してください。レイテンシーだけでなく再現率も計測してください。

## 計画された処理、スキャン行数、出力の取得

| カウンターまたはタイマー | 意味 |
|---|---|
| `LancePlannedIndexSegmentCount` | リーダーに割り当てられた検索インデックスセグメントの数。split の設定時に累積されます。検索が完了した証拠にはなりません。 |
| `LancePlannedIndexedFragmentCount` | インデックスを使うベクトル検索と全文検索の split に割り当てられた Fragment の数。 |
| `LancePlannedFlatSearchFragmentCount` | ベクトル Flat Search の split に割り当てられた Fragment の数。FTS ではこのカウンターは登録されません。 |
| `LanceFragmentsScanned`, `LanceRowOffsetRangesScanned`, `LanceRowsScanned` | FilteredRead 経路が報告する Fragment、行オフセット範囲、行の数。すべての読み取り経路がこれらを設定するわけではありません。テーブル全体で重複を除いた数や、最終的な SQL の行数ではありません。 |
| `LanceScanTaskWaitTime` | FilteredRead のコンシューマーが読み取りタスクを待つ時間。Doris Scanner のスケジューリング時間や、I/O 待機時間の合計ではありません。 |
| `LanceRowIdFetchCalls`, `LanceRowIdFetchRows` | 第二段階の `take_rows` 呼び出し回数と、取得した行数。 |
| `LanceRowIdTakeReadTime` | 行 ID を指定した Take ストリームの作成と読み取りにかかる時間。遅延した読み取りを含み、Arrow から Doris への変換は含みません。 |
| `LanceRowIdFetchTotalTime` | 空でない行 ID 取得処理の合計時間。Dataset のオープン、Take の読み取り、変換、結果の確認を含みます。上記の各ステップを内包しますが、端から端までの RPC/Materialization のオーバーヘッドは含みません。 |

検索プランニングでは、`EXPLAIN` の `lanceSearchIndexSegments`、`lanceSearchIndexFragments`、`lanceSearchUnindexedFragments` を `LanceSearchPlan` のカウンターと比較してください。通常のスカラーセグメントスキャンでは、`lanceGroupingIndexSegments`、`lanceGroupingIndexedFragments`、`lanceGroupingUnindexedFragments` を使います。これらは FE のプランフィールドであり、BE の Profile カウンターではありません。Fragment の数はタスク単位で累積され、重複が除かれるとは限りません。

二段階取得では別のリーダーが使われ、Scanner の実行統計コールバックは登録されません。取得時間、取得件数、`LanceDataCacheBytesReadFromCache`/`LanceDataCacheBytesReadFromRemote` は、Row ID Fetch/Materialization の Profile 情報にも報告されます。そこに `LanceIOReadBytes` がなくても、I/O が発生しなかったわけではありません。スキャンと取得の計測範囲を分けて扱い、エクスポートされた同じ取得統計を二重に数えないでください。

実行されたスナップショットの識別には `LanceDatasetVersion` と `LanceDatasetUri` を使い、ベクトル検索と全文検索の区別には `LanceSearchType` を使います。`LanceTopK`、`LanceOffset`、`LanceFtsCoverageMode`、`LanceFtsQueryType`、`LanceFtsMatchOperator`、`LanceFtsMaxFuzzyDistance`、`LanceFtsPhraseSlop`、`LancePushdownFormat`、Runtime Filter ID の項目は、設定や pushdown の状態を示します。加算できるカウンターではなく、情報を表す文字列です。`LanceTopK` と `LanceOffset` は split ごとのリクエストを示します。`top_k=K` と `offset=n` を指定した TVF クエリでは、検索 split がリクエストする候補は最大 `K+n` 件で、ローカルオフセットは `0` です。最後に Doris の TopN がユーザー指定のオフセットを適用します。
