---
title: Query Cache ユーザーガイド
description: Apache Doris の Query Cache で繰り返し実行する集約クエリを高速化する方法を説明します。仕組み、設定パラメータ、キャッシュのヒット条件、無効化の仕組み、一般的なトラブルシューティングを扱います。
keywords:
    - Doris Query Cache
    - クエリキャッシュ
    - 集約クエリの高速化
    - タブレットキャッシュ
    - LRU-K
    - キャッシュヒット率
    - パイプライン実行エンジン
language: ja
---

<!-- Knowledge type: concept + operation + troubleshooting -->
<!-- Applicable scenario: accelerating repeated aggregation queries in dashboards/BI/T+1 reports -->

# Query Cache

Query Cache は、Apache Doris のパイプライン実行エンジンで集約の中間結果をタブレット単位でキャッシュし、繰り返し実行する集約クエリを高速化する仕組みです。

## 利用前のチェックリスト

<!-- Knowledge type: prerequisite check -->
<!-- Applicable scenario: determining whether the current query can use the Query Cache -->

Query Cache を使用する前に、以下を確認してください。

-   [ ] クエリの対象が **内部 OLAP テーブル**である（Hive/JDBC/Iceberg/Hudi/Paimon などの外部テーブルではない）
-   [ ] クエリが **集約クエリ**である（`GROUP BY` または集約関数を含む）
-   [ ] クエリプランが `AggregationNode → OlapScanNode` のパターンに一致する
-   [ ] クエリに `JOIN`、`SORT`、`UNION`、`WINDOW` ノードが含まれない
-   [ ] クエリが `now()`、`rand()`、`uuid()` などの非決定的関数に依存しない
-   [ ] `enable_query_cache = true` が設定されている

## 一文での定義

<!-- Knowledge type: concept definition -->

Query Cache は、パイプライン実行エンジンで集約結果をタブレット単位でキャッシュします。後続のクエリの実行コンテキストが同じ場合、キャッシュされたデータを直接返し、スキャンと計算の繰り返しを避けます。

## Query Cache が必要な理由

<!-- Knowledge type: background -->
<!-- Applicable scenario: dashboards/reports that repeatedly execute the same aggregation SQL -->

分析用途では、元データが変わらない間に同じ集約クエリを繰り返し実行することがよくあります。次に例を示します。

```sql
SELECT region, SUM(revenue) FROM orders WHERE dt = '2024-01-01' GROUP BY region;
SELECT region, SUM(revenue) FROM orders WHERE dt = '2024-01-01' GROUP BY region;
```

実行のたびに同じタブレットを再スキャンして結果を再計算するため、CPU と I/O が浪費されます。Query Cache は集約の中間結果をキャッシュし、ヒット時にはその結果を直接返すことで、レイテンシーを大幅に短縮します。

:::caution 重要な制約
-   この機能は **内部 OLAP テーブルに対する集約クエリ**にのみ適用されます。単純なスキャン、JOIN、ソートなどの処理では Query Cache を使用しません。
-   **外部テーブルはサポートされません**（Hive、JDBC、Iceberg、Hudi、Paimon など）。
:::

## 仕組み

<!-- Knowledge type: principle -->
<!-- Applicable scenario: understanding hit conditions and the invalidation mechanism -->

### サポートされるクエリパターン

実行プランのツリーが次のいずれかのパターンに一致するフラグメントのみ、キャッシュを使用できます。

-   `AggregationNode → OlapScanNode`: スキャンの直上で行う単段の集約。
-   `AggregationNode → AggregationNode → OlapScanNode`: スキャンの上で行う二段の集約。

集約ノードとスキャンノードの間には、`FilterNode` や `ProjectNode` などの中間ノードを配置できます。ただし、キャッシュ対象のサブツリーに `JoinNode`、`SortNode`、`UnionNode`、`WindowNode`、`ExchangeNode` を含めることは**できません**。

### キャッシュキーの三つの構成要素

| 構成要素 | 説明 |
| --- | --- |
| SQL ダイジェスト | 正規化された実行プランのツリー（集約関数、グループ化式、パーティション以外のフィルター条件、射影列、結果に影響するセッション変数）から計算される SHA-256 ハッシュです。意味的に等価なクエリは同じダイジェストになります。 |
| タブレット ID リスト | 現在のパイプラインインスタンスに割り当てられたタブレット ID をソートしたリストです。 |
| タブレット範囲 | パーティション条件から導出される各タブレットの有効なスキャン範囲です（[パーティションとフィルターの動作](#partition-and-filter-behavior)を参照）。 |

### キャッシュの無効化条件

| トリガー条件 | 説明 |
| --- | --- |
| データの変更 | INSERT、DELETE、UPDATE、またはコンパクションによってタブレットのバージョン番号が増加します。後続のクエリではバージョンを比較し、一致しなければキャッシュミスになります。 |
| スキーマの変更 | ALTER TABLE によってテーブル構造が変わると、実行プランとダイジェストも変わります。 |
| LRU による削除 | キャッシュのメモリ使用量が上限を超えると、LRU-K（K=2）に従ってエントリが削除されます。新しいエントリは、登録されるまでに少なくとも二回アクセスされる必要があります。 |
| 有効期限による削除 | 作成から 24 時間を超えたエントリは、定期的なクリーンアップタスクによって自動的に削除されます。 |
| 強制リフレッシュ | `query_cache_force_refresh = true` を設定すると、キャッシュを無視してクエリを再実行します。 |

### 実行フロー

**初回実行（キャッシュミス）:**

1.  スキャンオペレーターが通常どおりタブレットからデータを読み取ります。
2.  集約オペレーターが結果を計算します。
3.  結果を後続のコンシューマーに送り、キャッシュへの書き込みに備えて蓄積します。
4.  実行完了後、蓄積した結果がエントリごとのサイズ上限と行数上限を超えていなければ、結果をキャッシュに書き込みます。

**後続の実行（キャッシュヒット）:**

1.  スキャンオペレーターがキャッシュヒットを検出し、スキャン範囲をスキップします。タブレットのデータは読み取りません。
2.  集約オペレーターには入力がなく、出力も生成しません。
3.  キャッシュソースオペレーターがキャッシュ済みデータブロックを直接提供します。
4.  列の順序がキャッシュエントリと異なる場合（たとえば `SELECT a, b` と `SELECT b, a` が同じダイジェストになる場合）、列は自動的に並べ替えられます。

## パーティションとフィルターの動作 {#partition-and-filter-behavior}

<!-- Knowledge type: principle -->
<!-- Applicable scenario: understanding how to improve cache hit rates across queries -->

パーティション条件とフィルター式が Query Cache とどのように相互作用するかを理解することは、高いヒット率を得るうえで重要です。

### 単一列の RANGE パーティション条件

**単一列の RANGE パーティション**を持つテーブルでは、パーティション条件を特別に処理します。

-   パーティション条件はダイジェストから**抽出**されます。システムは、条件の範囲と各パーティションの実際の境界範囲との共通部分を計算し、タブレット範囲の文字列としてキャッシュキーに追加します。
-   パーティションのフィルター範囲だけが異なる二つのクエリは、共通するタブレットについて**キャッシュを共有**できます。

**例**: テーブル `orders` が `dt` 列で日単位にパーティション分割されているとします。

```sql
-- Query A
SELECT region, SUM(revenue) FROM orders
WHERE dt >= '2024-01-01' AND dt < '2024-01-03' GROUP BY region;

-- Query B
SELECT region, SUM(revenue) FROM orders
WHERE dt >= '2024-01-02' AND dt < '2024-01-04' GROUP BY region;
```

-   クエリ A はパーティション `2024-01-01` と `2024-01-02` をスキャンします。
-   クエリ B はパーティション `2024-01-02` と `2024-01-03` をスキャンします。
-   パーティション `2024-01-02` のタブレットダイジェストと範囲は同一なので、**クエリ B は `2024-01-02` についてクエリ A のキャッシュを再利用**し、`2024-01-03` のパーティションだけを再計算します。

### 複数列の RANGE / LIST / 非パーティションテーブル

**複数列の RANGE パーティション**、**LIST パーティション**、または**パーティションのないテーブル**では、パーティション条件を抽出できないため、ダイジェストに直接含めます。パーティション条件が少しでも異なるとダイジェストが変わり、キャッシュミスになります。

### パーティション以外のフィルター式

パーティション以外のフィルター式（`WHERE status = 'active'` など）は、正規化された実行プランのダイジェストに含まれます。二つのクエリがキャッシュを共有できるのは、正規化後のフィルター式が意味的に同一の場合だけです。

| クエリ 1 | クエリ 2 | キャッシュの共有 |
| --- | --- | --- |
| `WHERE status = 'active'` | `WHERE status = 'active'` | 可（同じダイジェスト） |
| `WHERE status = 'active'` | `WHERE status = 'inactive'` | 不可（異なるダイジェスト） |
| `WHERE status = 'active' AND region = 'ASIA'` | `WHERE region = 'ASIA' AND status = 'active'` | 可（正規化後は順序に依存しない） |

### セッション変数

クエリ結果に影響するセッション変数（`time_zone`、`sql_mode`、`sql_select_limit` など）はダイジェストに含まれます。二つのクエリの間でこれらの変数のいずれかを変更すると、キャッシュキーが変わり、キャッシュミスになります。

### Query Cache が無効になる条件

<!-- Knowledge type: troubleshooting -->
<!-- Applicable scenario: investigating why the cache is not effective -->

| 条件 | 理由 |
| --- | --- |
| フラグメントがランタイムフィルターの適用対象である | 計画時にはランタイムフィルターの値が不明であり、キャッシュすると誤った結果になる可能性があります。 |
| 非決定的な式（`rand()`、`now()`、`uuid()`、UDF など）を含む | 入力が同じでも、実行ごとに結果が変わります。 |
| キャッシュ対象のサブツリーに JOIN、SORT、UNION、WINDOW ノードを含む | 「集約とスキャン」のパターンのみがサポートされます。 |
| スキャンノードが `OlapScanNode` ではない（外部テーブルのスキャンなど） | キャッシュは、外部テーブルには存在しないタブレット ID とバージョンに依存します。 |

## Query Cache が外部テーブルをサポートしない理由

<!-- Knowledge type: FAQ -->
<!-- Applicable scenario: users who want to use the cache with Hive/Iceberg and similar tables -->

Query Cache は、内部 OLAP テーブルに固有の次の三つの特性に依存します。

1.  **タブレット単位のデータ構成**: キャッシュキーには、タブレット ID と各タブレットのスキャン範囲が含まれます。外部テーブルは HDFS、S3、JDBC などの外部システムに格納され、タブレットという概念がありません。
2.  **バージョンに基づく無効化**: 各内部タブレットには単調増加するバージョン番号があり、キャッシュはそれを使用してデータの古さを検出します。外部テーブルは、このバージョン管理の仕組みを Doris に公開しません。
3.  **OlapScanNode の要件**: 実行プランの正規化ロジックは、集約のキャッシュポイントの下にある有効なスキャンノードとして `OlapScanNode` のみを認識します。

外部テーブルでキャッシュが必要な場合は、代わりに [SQL Cache](./sql-cache-manual.md) を使用してください。

## 設定パラメータ

<!-- Knowledge type: parameter reference -->
<!-- Applicable scenario: tuning cache size and per-entry limits -->

### セッション変数（FE）

| パラメータ | 説明 | デフォルト値 |
| --- | --- | --- |
| `enable_query_cache` | Query Cache の有効と無効を切り替えるマスタースイッチです。 | `false` |
| `query_cache_force_refresh` | `true` に設定すると、キャッシュ済みの結果を無視してクエリを再実行します。新しい結果は引き続きキャッシュに書き込まれます。 | `false` |
| `query_cache_entry_max_bytes` | 単一のキャッシュエントリの最大サイズ（バイト）です。この上限を超えるフラグメントの結果はキャッシュされません。 | `5242880`（5 MB） |
| `query_cache_entry_max_rows` | 単一のキャッシュエントリの最大行数です。この上限を超えるフラグメントの結果はキャッシュされません。 | `500000` |

### BE 設定（be.conf）

| パラメータ | 説明 | デフォルト値 |
| --- | --- | --- |
| `query_cache_size` | 各 BE 上の Query Cache の総メモリ容量（MB）です。 | `512` |

:::note
`query_cache_max_size_mb` と `query_cache_elasticity_size_mb` は、`be.conf` で従来の SQL Result Cache を制御する設定です。この記事で説明するパイプラインレベルの Query Cache の設定では**ありません**。混同しないでください。
:::

## 使用例

<!-- Knowledge type: operation -->
<!-- Applicable scenario: enabling, verifying, and forcibly refreshing the cache -->

### ステップ 1: Query Cache を有効にする

**目的**: Query Cache のマスタースイッチをオンにします。

```sql
SET enable_query_cache = true;
```

**説明**: この変数はセッション単位で適用されるため、接続ごとに有効にする必要があります。グローバル FE 変数としてデフォルト値を設定することもできます。

### ステップ 2: 一般的な集約クエリを実行する

**目的**: キャッシュへの書き込みとキャッシュからの読み取りを発生させます。

```sql
-- First execution: cache miss, compute the result and write it to the cache
SELECT region, SUM(revenue), COUNT(*)
FROM orders
WHERE dt = '2024-01-15' AND status = 'completed'
GROUP BY region;

-- Second execution: cache hit, return the result directly from the cache
SELECT region, SUM(revenue), COUNT(*)
FROM orders
WHERE dt = '2024-01-15' AND status = 'completed'
GROUP BY region;
```

**説明**: 再実行時には SQL ダイジェスト、タブレット ID リスト、タブレット範囲が初回実行時と同じなので、キャッシュにヒットします。

### ステップ 3: Profile でヒットを確認する

**目的**: クエリが実際にキャッシュを使用したか確認します。

クエリの実行後、Profile を確認し、`CacheSourceOperator` セクションを探します。

| Profile のフィールド | 意味 |
| --- | --- |
| `HitCache: true` | クエリがキャッシュから結果を取得しました。 |
| `HitCache: false`, `InsertCache: true` | キャッシュミスですが、結果はキャッシュに正常に書き込まれました。 |
| `HitCache: false`, `InsertCache: false` | キャッシュミスであり、結果が大きすぎてキャッシュできませんでした。 |
| `CacheTabletId` | キャッシュエントリの対象となるタブレット ID です。 |

### ステップ 4: キャッシュを強制的にリフレッシュする

**目的**: 既存のキャッシュを無視して結果を再計算します（キャッシュ済みデータが正しくないと疑われる場合など）。

```sql
-- Force the next query to skip the cache and recompute the result
SET query_cache_force_refresh = true;

SELECT region, SUM(revenue) FROM orders WHERE dt = '2024-01-15' GROUP BY region;

-- Reset
SET query_cache_force_refresh = false;
```

**説明**: 強制リフレッシュ後も、新しい結果はキャッシュに書き込まれます。

## ユースケースの比較

<!-- Knowledge type: decision -->
<!-- Applicable scenario: deciding whether the Query Cache is worth enabling -->

| シナリオ | 適用可能 | 理由 |
| --- | --- | --- |
| 同じ集約 SQL を繰り返し実行するダッシュボードや BI ツール | はい | ダイジェストとタブレットが完全に一致し、高いヒット率を得られます。 |
| T+1 レポート（データを一日に一回ロード） | はい | 同じ日の後続クエリはキャッシュにヒットできます。 |
| 日付範囲が重なる集約クエリ | はい | 単一列の RANGE パーティションでは、タブレット単位でエントリを共有できます。 |
| 単純な SELECT スキャン、JOIN、ソート、ウィンドウ関数 | いいえ | 「集約とスキャン」のパターンのみがサポートされます。 |
| 外部テーブル（Hive、JDBC、Iceberg、Hudi、Paimon） | いいえ | タブレットやバージョン管理の仕組みがありません。代わりに SQL Cache を使用してください。 |
| 頻繁に更新されるテーブル | いいえ | タブレットのバージョンが頻繁に変わるため、ヒット率が低くなります。 |
| `now()`、`rand()`、`uuid()`、UDF を含むクエリ | いいえ | 非決定的な結果になるため、キャッシュは無効になります。 |
| ランタイムフィルターに依存するクエリ | いいえ | 計画時にはランタイムフィルターの値が不明です。 |

## 注意事項

<!-- Knowledge type: limitation -->

-   **キャッシュは永続化されません**: Query Cache は BE のメモリ上にあり、BE の再起動時に消去されます。
-   **メモリ消費**: キャッシュされたデータブロックは BE のメモリを消費します。メモリ使用量を監視し、必要に応じて `query_cache_size` を調整してください。
-   **LRU-K の登録条件**: キャッシュが満杯の場合、新しいエントリが登録されるには少なくとも二回（K=2）のアクセスが必要です。これにより、アクセス頻度の低いクエリによるキャッシュの占有を防ぎます。

## トラブルシューティング

<!-- Knowledge type: troubleshooting -->
<!-- Applicable scenario: common reasons for cache misses or write failures -->

| 症状 | 考えられる原因 | 対処方法 |
| --- | --- | --- |
| `HitCache: false` が繰り返し表示される | `enable_query_cache` が有効になっていません。 | `SET enable_query_cache = true` を実行してください。 |
| `HitCache: false`, `InsertCache: false` | 単一エントリの結果が大きすぎて、`query_cache_entry_max_bytes` または `_max_rows` の上限を超えています。 | 対応する上限値を引き上げるか、フィルターを追加して結果を小さくしてください。 |
| プランに `CacheSourceOperator` がない | プランに JOIN/SORT/UNION/WINDOW が含まれているか、フラグメントがランタイムフィルターの適用対象です。 | 「集約とスキャン」のパターンに一致するよう SQL を書き換えてください。 |
| テーブルが外部テーブルである | Query Cache は外部テーブルをサポートしていません。 | [SQL Cache](./sql-cache-manual.md) を使用してください。 |
| データは変わっていないのにキャッシュミスになる | スキーマの変更、セッション変数の変更、または `query_cache_force_refresh = true` が原因です。 | ALTER の履歴を確認し、セッション変数を比較して、`query_cache_force_refresh` をリセットしてください。 |
| キャッシュヒット率が非常に低い | タブレットが頻繁に更新またはコンパクションされています。 | 書き込み頻度を下げるか、更新頻度の低いテーブルだけでキャッシュを有効にしてください。 |
| BE のメモリ負荷が増加する | `query_cache_size` の設定が大きすぎます。 | `query_cache_size` を下げて BE を再起動してください。 |

## FAQ

<!-- Knowledge type: FAQ -->

**Q1: Query Cache と SQL Cache はどう違いますか？**

| 比較項目 | Query Cache | SQL Cache |
| --- | --- | --- |
| キャッシュの粒度 | タブレット単位の集約の中間結果。 | SQL 文全体の最終結果。 |
| 対象クエリ | 内部 OLAP テーブルに対する集約クエリのみ。 | 外部テーブルに対するクエリを含む、あらゆるクエリ。 |
| 共有方法 | 異なる SQL 文でも、タブレット単位でキャッシュエントリを共有できます。 | SQL テキストが完全に一致する場合のみヒットします。 |
| 無効化 | タブレットのバージョンが変わると直ちに無効になります。 | パーティションのバージョンまたは時間に基づきます。 |

**Q2: 有効にした直後からキャッシュにヒットしますか？**

いいえ。初回実行は「キャッシュミスとキャッシュへの書き込み」になり、ヒットできるのは次回以降の実行だけです。さらに、LRU-K（K=2）では、新しいエントリが実際に登録されるまでに少なくとも二回アクセスされる必要があります。

**Q3: JOIN を含む集約はキャッシュできますか？**

いいえ。キャッシュ対象のサブツリーに `JoinNode` があると、そのフラグメントでは Query Cache が無効になります。先に集約してから JOIN するようクエリを書き換えるか、マテリアライズドビューの使用を検討してください。

**Q4: BE の再起動後にキャッシュのウォームアップは必要ですか？**

はい。Query Cache はインメモリキャッシュであり、再起動時に消去されます。利用の少ない時間帯に主要な集約 SQL を実行して、キャッシュをウォームアップできます。

**Q5: 実際にキャッシュにヒットしたかどうかを確認するには？**

SQL の実行後、Profile の `HitCache` フィールドを `CacheSourceOperator` で確認してください。

## まとめ

<!-- Knowledge type: summary -->

Query Cache は、集約の中間結果をタブレット単位でキャッシュする、Doris のパイプラインレベルの最適化機構です。主な特徴は次のとおりです。

-   内部 OLAP テーブルに対する**集約クエリにのみ適用**されます。
-   タブレットのバージョンに基づいてキャッシュを自動的に無効化します。
-   パーティション条件をダイジェストから分離し、パーティション範囲が重なるクエリ間でキャッシュを共有できます。
-   エントリごとのサイズと行数に上限を設け、大きすぎる結果によるキャッシュメモリの消費を防ぎます。
-   LRU-K（K=2）の削除ポリシーを使用して、キャッシュの品質を維持します。
