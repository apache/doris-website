---
{
    "title": "並列度のチューニング：parallel_pipeline_task_num の設定方法",
    "language": "ja",
    "description": "Doris のクエリ並列度（parallel_pipeline_task_num）を調整する方法を説明します。1 や 16 に設定する場合とデフォルト値を維持する場合の判断基準、および SQL、セッション、グローバルの各レベルでの設定方法とベストプラクティスを紹介します。",
    "keywords": ["Doris の並列度チューニング", "parallel_pipeline_task_num", "Pipeline 実行エンジン", "MPP 並列実行", "クエリ性能のチューニング", "BE の CPU 使用率"],
    "sidebar_label": "並列度のチューニング"
}
---

<!-- Knowledge type: Performance tuning guide -->
<!-- Applicable scenarios: High query latency, insufficient CPU utilization, stress testing, slow JOIN/aggregation -->

# 並列度のチューニング

並列度（`parallel_pipeline_task_num`）は、単一の Fragment が BE 内で実行される際に使用するワーカータスクの数を制御します。マルチコア CPU を十分に活用し、クエリのレイテンシを短縮するための重要なパラメータです。

## チューニング前の確認事項

<!-- Knowledge type: Pre-check -->
<!-- Applicable scenarios: Before adjusting parameters -->

- [ ] BE の CPU コア数（並列度の上限を決める要素）を確認した。
- [ ] Profile または監視メトリクスを使い、ボトルネックの種類（CPU 負荷、スキャン負荷、スケジューリングのオーバーヘッド）を特定した。
- [ ] 現在のクエリの用途（ポイントクエリ、JOIN／集約、負荷テスト、複雑なクエリ）を把握した。
- [ ] デフォルト値（CPU コア数の半分を意味する `0`）での性能が、実際に期待を下回っている。

## 基本概念

<!-- Knowledge type: Term definition -->
<!-- Applicable scenarios: Understanding the parallelism model -->

- **MPP 並列処理**：各クエリを複数の BE に分散して並列実行します。
- **BE 内並列処理**：単一の BE 内で、マルチスレッドによって Fragment の実行を高速化します。
- **`parallel_pipeline_task_num`**：単一の Fragment の実行時に使用するワーカータスクの数です。デフォルトの `0` は、BE の CPU コア数の半分を意味します。
- **適用対象の文**：すべてのクエリ、DML、DDL 文が並列実行をサポートします。

## チューニングの原則

<!-- Knowledge type: Decision principle -->
<!-- Applicable scenarios: Deciding whether to adjust the parameter -->

並列度は高いほどよいとは限りません。

1. 並列度を上げると、マルチコアのリソースを活用でき、単一クエリのレイテンシを短縮できます。
2. 一方で、データの Shuffle オペレーターやマルチスレッドの同期処理が追加され、リソースが余分に消費されます。
3. デフォルト値は単一クエリと同時実行の両方を考慮しているため、**通常は手動で調整する必要はありません**。
4. Doris は適応的な戦略を継続的に改善しています。グローバルな変更よりも、**SQL または用途ごとの調整を優先**してください。

## 用途別のチューニング推奨値

<!-- Knowledge type: Scenario recipe -->
<!-- Applicable scenarios: Choosing parallelism based on query type -->

以下の例では、BE の CPU が 16 コアであると仮定します。

### 用途別の一覧

| クエリの用途 | 推奨並列度 | 理由 |
|---|---|---|
| 単一テーブルへのポイントクエリ／少量のデータに対する `WHERE`／`LIMIT`／マテリアライズドビューにヒットするクエリ | **1** | Fragment は一つだけです。ボトルネックとなるスキャンスレッドはクエリ実行スレッドとは独立しており、適応的に並列化されるため、クエリ実行スレッドの並列度を上げる必要はありません。 |
| 大量のデータに対する二つのテーブルの `JOIN`／集約クエリ（CPU 負荷が高い場合） | **16** | 計算負荷が高く、CPU に余力がある場合は、並列度を上げることでコアを十分に活用できます。ただし、無制限に増やさないでください。例えば 48 に設定しても、スケジューリングのオーバーヘッドが増えるだけです。 |
| 負荷テスト | **1** | 同時実行されるクエリだけで CPU が飽和するため、過度な並列化はスレッドや実行フレームワークのスケジューリング負荷を増やすだけです。 |
| 複雑なクエリ | **デフォルト値** | Profile とマシンの負荷を見ながら柔軟に調整します。効果を確認するために、**4 -> 2 -> 1** と段階的に下げてみてください。 |

### 用途 1：単一テーブルに対する単純な操作

<!-- Applicable scenarios: Point queries, light filtering, materialized views -->

- **特徴**：Fragment は一つで、ボトルネックはスキャンスレッドにあります。スキャンスレッドはすでに適応的に並列化されます。
- **推奨値**：`parallel_pipeline_task_num = 1`。
- **理由**：スキャンスレッドとクエリ実行スレッドは独立しています。クエリ実行スレッドの並列度を上げても、スキャンがボトルネックである処理は高速化しません。

### 用途 2：大量のデータに対する JOIN／集約

<!-- Applicable scenarios: CPU-intensive analytical queries -->

- **特徴**：計算負荷が高く、CPU に余力があることが確認できるワークロードです。
- **推奨値**：例えば `parallel_pipeline_task_num = 16` のように、並列度をデフォルト値より高くします。
- **理由**：Pipeline 実行エンジンの並列処理能力を活用し、CPU を十分に使えます。ただし、無制限に増やすと、スレッドと実行フレームワークのスケジューリング負荷が効果を上回ります。

### 用途 3：負荷テスト

<!-- Applicable scenarios: High-concurrency stress testing -->

- **特徴**：多数のクエリが同時実行され、それらのクエリだけですでに CPU が飽和しています。
- **推奨値**：`parallel_pipeline_task_num = 1`。
- **理由**：高い同時実行数に単一クエリ内の並列処理を重ねたときに生じる、スケジューリングのオーバーヘッドを避けられます。

### 用途 4：複雑なクエリ

<!-- Applicable scenarios: Multi-table JOINs, complex subqueries -->

- **特徴**：実行プランが複雑で、ボトルネックを一目で特定するのが困難です。
- **推奨値**：まずデフォルト値を使用します。その後、Profile とマシンの負荷を見ながら **4 -> 2 -> 1** と段階的に調整し、効果を確認します。

## 並列度の設定方法

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: Issuing the actual tuning command -->

Doris では、SQL レベル、セッションレベル、グローバルレベルの三つの粒度で並列度を設定できます。優先順位はこの順に低くなります。

### 設定方法の比較

| 方法 | 適用範囲 | 適した場面 | リスク |
|---|---|---|---|
| SQL HINT | 単一の SQL 文 | 特定の遅い SQL のチューニング | 他のクエリへの影響がなく、最も推奨される方法 |
| セッション変数 | 現在のセッション | 同じセッション内で実行する一連のクエリ | 単一行を取得するクエリにも設定が適用され、性能が低下する可能性がある |
| グローバル変数 | クラスター全体のすべての新規接続 | クラスター全体の CPU 使用率の調整 | 影響範囲が最も広いため、慎重に使用する |

### SQL レベルでの設定

<!-- Applicable scenarios: Targeting individual slow SQL statements -->

- **目的**：HINT を使って単一の SQL 文の並列度を正確に制御します。柔軟性が最も高い方法です。
- **コマンド**：

    ```sql
    SELECT /*+SET_VAR(parallel_pipeline_task_num=8)*/ *
    FROM nation, lineitem
    WHERE lineitem.l_suppkey = nation.n_nationkey;

    SELECT /*+SET_VAR(parallel_pipeline_task_num=8,runtime_filter_mode=global)*/ *
    FROM nation, lineitem
    WHERE lineitem.l_suppkey = nation.n_nationkey;
    ```

- **補足**：同じ HINT 内に、`runtime_filter_mode` などの他のセッション変数も指定できます。

### セッションレベルでの設定

<!-- Applicable scenarios: Running a batch of similar queries in the same session -->

- **目的**：現在のセッション内のすべての SQL 文に、同じ並列度の設定を適用します。
- **コマンド**：

    ```sql
    SET parallel_pipeline_task_num = 8;
    ```

- **補足**：このセッションでは、単一行を取得するポイントクエリにもこの並列度が適用されるため、軽量なクエリが遅くなる可能性があります。

### グローバルレベルでの設定

<!-- Applicable scenarios: Cluster-wide CPU utilization adjustment -->

- **目的**：すべての新規接続に適用し、クラスター全体のデフォルトの動作を変更します。
- **コマンド**：

    ```sql
    SET GLOBAL parallel_pipeline_task_num = 8;
    ```

- **補足**：クラスター全体の CPU 使用率を調整する必要がある場合にのみ使用してください。それ以外の場合は、デフォルト値を維持してください。

## よくある質問とトラブルシューティング

<!-- Knowledge type: Frequently asked questions -->
<!-- Applicable scenarios: When tuning does not meet expectations -->

### Q1：並列度を上げた後にクエリが遅くなったのはなぜですか？

並列度を上げすぎると、Shuffle やスレッド同期のオーバーヘッドが増え、スケジューリングを行う実行フレームワーク自体の負荷もかかります。例えば並列度を 48 に設定しても、16 コアのマシンではほとんど効果がなく、スケジューリングの負荷が増えるだけです。デフォルト値から始め、**4 -> 2 -> 1** と段階的に調整してください。

### Q2：単一テーブルへのポイントクエリで推奨並列度が 1 なのはなぜですか？

単一テーブルへのポイントクエリには Fragment が一つしかなく、ボトルネックはデータのスキャンにあります。スキャンスレッドとクエリ実行スレッドは別であり、スキャンスレッドは適応的に並列化されます。そのため、`parallel_pipeline_task_num` を上げても、スキャンがボトルネックである処理は高速化しません。

### Q3：負荷テストでも並列度 1 が推奨されるのはなぜですか？

負荷テストでは多数のクエリが同時に実行され、それだけですでに CPU が飽和しています。さらに単一クエリ内の並列度を上げても、スレッドと実行フレームワークのスケジューリング負荷が増えるだけです。

### Q4：デフォルト値の `0` は何を意味しますか？

`parallel_pipeline_task_num = 0` は、BE が **CPU コア数の半分**を自動的に使用することを意味します。このデフォルト値は、単一クエリの性能と同時実行時のスループットのバランスを取るためのもので、ほとんどの用途では変更する必要はありません。

### Q5：並列度をグローバルに設定すべきですか、それとも SQL HINT を使うべきですか？

個別の遅い SQL 文をチューニングするには、SQL HINT を優先してください。`SET GLOBAL` は、クラスター全体の CPU 使用率をまとめて調整する必要があると確認できた場合にのみ使用してください。

## 関連パラメータ

<!-- Knowledge type: Parameter index -->

| パラメータ | 用途 | デフォルト値 |
|---|---|---|
| `parallel_pipeline_task_num` | BE 内で単一の Fragment に使用するワーカータスクの数 | `0`（BE の CPU コア数 / 2） |
| `runtime_filter_mode` | Runtime Filter の動作モード。並列度と合わせて調整することが多い | Runtime Filter のドキュメントを参照 |
