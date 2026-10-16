---
{
    "title": "並列度のチューニング: parallel_pipeline_task_num 設定ガイド",
    "sidebar_label": "並列度のチューニング",
    "language": "ja",
    "description": "Doris のクエリ並列度を調整する方法を説明します。parallel_pipeline_task_num の設定原則、SQL・セッション・グローバル単位の調整方法、CPU 使用率の最適化事例、FAQ を取り上げます。",
    "keywords": ["Doris の並列度チューニング", "parallel_pipeline_task_num", "Doris の CPU 使用率", "MPP 並列実行", "Pipeline 実行エンジン", "クエリ性能チューニング"],
}
---

<!-- Knowledge type: concept + operation -->
<!-- Applicable scenarios: query performance tuning, CPU resource utilization optimization, high-concurrency stress testing -->

Doris は MPP 実行フレームワークです。各クエリは複数の BE にまたがって並列に実行され、単一の BE 内でもマルチスレッドによる並列処理で実行を高速化します。すべてのステートメント（Query、DML、DDL）が並列実行をサポートします。

**一言で言うと**: `parallel_pipeline_task_num` は、単一の BE 内で単一の Fragment を実行するワーカータスクの数を制御します。

### 調整前の確認事項

チューニングを始める前に、次の点を確認してください。

- `PROFILE` ツールを使い、クエリが CPU ボトルネックであることを確認しましたか？
- 対象の BE には CPU コアがいくつありますか？
- クエリの種類は何ですか？ ポイントクエリ、JOIN／集約、負荷テスト、複雑なクエリのどれに当たりますか？
- 使用しているテーブルモデルは Duplicate と Unique Key Merge-On-Write のどちらですか？
- SQL、セッション、グローバルのどの単位で調整しますか？

> デフォルト値は `0` で、BE の CPU コア数の半分に相当します。このデフォルト値は、単一クエリと同時実行クエリのリソース使用のバランスをすでに取っているため、**通常はユーザーによる調整は不要です**。

## 並列度チューニングの原則

<!-- Knowledge type: principle -->
<!-- Applicable scenarios: scenario-based decision reference -->

`parallel_pipeline_task_num` を調整する目的は、マルチコアのリソースを十分に活用し、クエリのレイテンシーを短縮することです。ただし、マルチコアでの並列処理にはデータの Shuffle オペレーターやマルチスレッドの同期処理が伴うため、並列度を上げすぎるとリソースを浪費することがあります。

### シナリオ別の推奨並列度

> 以下の表では、BE の CPU コア数が 16 の場合を例にします。

| クエリのシナリオ | 典型的な特徴 | 推奨並列度 | 理由 |
| --- | --- | --- | --- |
| 単一テーブルの単純な操作 | 単一テーブルへのポイントクエリ、少量のデータをスキャンする `WHERE`、少量のデータを返す `LIMIT`、マテリアライズドビューへのヒット | **1** | Fragment は一つだけです。ボトルネックはクエリ実行スレッドではなく、データスキャンスレッド（適応型並列処理）にあります |
| 二つのテーブルの JOIN／集約 | データ量が多く、CPU 負荷が高い一方、CPU は飽和していない | **16** | Pipeline 実行エンジンの並列処理能力を十分に活用できます。ただし、無制限に増やしてはいけません（例えば 48 にしてもスケジューリングのオーバーヘッドが増えるだけです） |
| 高並行度の負荷テスト | 複数のクエリだけですでに CPU を使い切る | **1** | 並列度を上げすぎても、スレッドとフレームワークのスケジューリングのオーバーヘッドが増えるだけです |
| 複雑なクエリ | ボトルネックをすぐには特定しにくい | **デフォルト値** | Profile とマシンの負荷に応じて柔軟に調整します。4-2-1 と段階的に下げる方法を試してください |

> Doris は適応型の処理戦略を継続的に改善しています。通常、調整は**特定のシナリオまたは SQL 単位**に限ることを推奨します。

---

## クエリ並列度の調整方法

<!-- Knowledge type: operation -->
<!-- Applicable scenarios: actual configuration -->

Doris では、SQL、セッション、グローバルの三つの単位でクエリ並列度を手動で指定できます。

### 方法 1: SQL 単位（推奨）

-   **目的**: 単一の SQL ステートメントだけに適用し、柔軟かつ正確に制御します。
-   **コマンド**: SQL HINT を使用します。
-   **説明**: 他のクエリに影響を与えずに、特定の SQL ステートメントを細かく調整する場合に適しています。

```sql
SELECT /*+SET_VAR(parallel_pipeline_task_num=8)*/ *
FROM nation, lineitem
WHERE lineitem.l_suppkey = nation.n_nationkey;

SELECT /*+SET_VAR(parallel_pipeline_task_num=8,runtime_filter_mode=global)*/ *
FROM nation, lineitem
WHERE lineitem.l_suppkey = nation.n_nationkey;
```

### 方法 2: セッション単位

-   **目的**: 現在のセッション内のすべてのクエリに適用します。
-   **コマンド**: セッション変数で設定します。
-   **説明**: セッション内のすべての SQL ステートメントにこの並列度が適用されます。単一行を取得するクエリも対象となり、一部の小規模なクエリでは性能が低下する可能性があります。

```sql
SET parallel_pipeline_task_num = 8;
```

### 方法 3: グローバル単位

-   **目的**: クラスター全体のデフォルト動作に適用します。
-   **コマンド**: `SET GLOBAL` を使用します。
-   **説明**: 通常、クラスター全体の CPU 使用率を調整する際に使用します。`global` 設定の適用後、現在の接続と新しく作成された接続には反映されますが、その他の既存の接続には反映されません。すべてに直ちに反映するには、FE を再起動します。

```sql
SET GLOBAL parallel_pipeline_task_num = 8;
```

### 三つの調整方法の比較

| 調整方法 | 適用範囲 | 反映タイミング | 推奨シナリオ |
| --- | --- | --- | --- |
| SQL HINT | 単一の SQL ステートメント | 即時 | 単一の SQL を細かく調整する場合（**最も安全**） |
| セッション | 現在のセッション | 即時 | 関連するクエリ群を調整する場合 |
| グローバル | クラスター全体 | 新しい接続から反映 | クラスター全体の CPU 使用率を最適化する場合 |

---

## データのシャーディングと並列度

<!-- Knowledge type: version feature -->
<!-- Applicable scenarios: understanding version differences, table model selection -->

バージョン **2.1** 以降、Doris は並列度をデータシャード数から切り離すことをサポートしています。

### バージョン別の比較

| バージョン | 動作 | 制限 |
| --- | --- | --- |
| 2.1 より前 | 並列度 ≤ クエリに関係するシャード数 | シャードが 5 個なら最大でも 5-way の並列実行です。大きなシャードを並列に読み取ることはできません |
| 2.1 以降 | シャード内の並列読み取りをサポート（自動的に有効） | Duplicate および Unique Key Merge-On-Write のテーブルモデルにのみ対応します |

> **注**: Aggregate モデルと Unique Key Merge-On-Read モデルは対象外です。これらのモデルでは、クエリの並列度は引き続きシャード数に制限されます。

---

## ベストプラクティスの事例

<!-- Knowledge type: case study -->
<!-- Applicable scenarios: real production tuning reference -->

### 事例 1: CPU 使用率が高すぎる場合は並列度を下げる

**問題**: 本番クラスターの CPU 使用率が高すぎて、低レイテンシーのクエリの性能に影響しています。

**原因分析**: デフォルトでは、Doris はより多くのリソースを使ってできるだけ早くクエリ結果を得ることを優先します。本番環境でリソースが逼迫している場合、クラスター全体の安定性に影響することがあります。

**解決策**: 並列度をデフォルトの `0`（CPU コア数の半分）から `4` に下げます。

```sql
SET GLOBAL parallel_pipeline_task_num = 4;
```

**結果**: CPU 使用率は元のピーク値の **60%** まで低下し、低レイテンシーのクエリへの影響が軽減されました。

> `GLOBAL` 設定は現在の接続と新しく作成された接続に反映されますが、その他の既存の接続には反映されません。すべてに直ちに反映するには、FE を再起動します。

### 事例 2: CPU 使用率が低い場合は並列度を上げる

**問題**: 計算負荷の高いクエリの実行に 28 秒かかっていますが、CPU 使用率は 60% にとどまっています。

**SQL の例**（左テーブルの行数は十億の 2 倍、右テーブルの行数は百万の 5 倍）:

```sql
SELECT
    sum(if(t2.value IS NULL, 0, 1)) AS exist_value,
    sum(if(t2.value IS NULL, 1, 0)) AS no_exist_value
FROM t1
LEFT JOIN t2 ON t1.key = t2.key;
```

**主な Profile 指標**:

```text
HASH_JOIN_OPERATOR (id=3 , nereids_id=448):
  - PlanInfo
      - join op: LEFT OUTER JOIN(BROADCAST)[]
      - equal join conjunct: (value = value)
      - cardinality=2,462,330,332
      - vec output tuple id: 5
      - output tuple id: 5
      - vIntermediate tuple ids: 4
      - hash output slot ids: 16
      - projections: value
      - project output tuple id: 5
  - BlocksProduced: sum 360.099K (360099), avg 45.012K (45012), max 45.014K (45014), min 45.011K (45011)
  - CloseTime: avg 8.44us, max 13.327us, min 5.574us
  - ExecTime: avg 26sec153ms, max 26sec261ms, min 26sec33ms
  - InitTime: avg 7.122us, max 13.395us, min 4.541us
  - MemoryUsage: sum , avg , max , min
    - PeakMemoryUsage: sum 1.16 MB, avg 148.00 KB, max 148.00 KB, min 148.00 KB
    - ProbeKeyArena: sum 1.16 MB, avg 148.00 KB, max 148.00 KB, min 148.00 KB
  - OpenTime: avg 2.967us, max 4.120us, min 1.562us
  - ProbeRows: sum 1.462330332B (1462330332), avg 182.791291M (182791291), max 182.811875M (182811875), min 182.782658M (182782658)
  - ProjectionTime: avg 165.392ms, max 169.762ms, min 161.727ms
  - RowsProduced: sum 1.462330332B (1462330332), avg 182.791291M (182791291), max 182.811875M (182811875), min 182.782658M (182782658)
```

**原因分析**:

-   主な処理時間（`ExecTime: avg 26sec153ms`）は Join オペレーターに集中しています。
-   処理されたデータの総量（`ProbeRows: 1.466 billion`）は非常に多く、典型的な CPU 負荷の高いワークロードです。
-   監視では CPU 使用率が 60% にとどまっており、高速化の余地があります。

**解決策**: 並列度を上げます。

```sql
SET parallel_pipeline_task_num = 16;
```

**結果の比較**:

| 指標 | 調整前 | 調整後 |
| --- | --- | --- |
| クエリの実行時間 | 28 秒 | **19 秒** |
| CPU 使用率 | 60% | **90%** |

---

## FAQ

<!-- Knowledge type: FAQ -->
<!-- Applicable scenarios: quick troubleshooting -->

**Q1: デフォルトの並列度はいくつですか？**
デフォルト値は `0` で、実行時には BE の CPU コア数の半分に相当します。

**Q2: 並列度は高いほどよいのですか？**
いいえ。並列度を上げすぎると、スレッドとフレームワークのスケジューリングのオーバーヘッドが増え、かえって性能が低下することがあります。例えば、並列度を 48 に設定しても、16-core の BE では効果はありません。

**Q3: `SET GLOBAL` が既存の接続に反映されないのはなぜですか？**
`GLOBAL` は現在の接続と新しく作成された接続にのみ反映され、その他の既存の接続には反映されません。すべてに直ちに反映するには、FE を再起動します。

**Q4: すべてのテーブルモデルでシャード内の並列読み取りを利用できますか？**
Duplicate モデルと Unique Key Merge-On-Write モデルでのみ利用できます。Aggregate モデルと Unique Key Merge-On-Read モデルでは、クエリの並列度は引き続きシャード数に制限されます。

**Q5: クエリが CPU ボトルネックかどうかは、どう判断しますか？**
`PROFILE` を使って `ExecTime` がどのオペレーターに集中しているかを確認し、同時にマシンの CPU 使用率も確認します。CPU が飽和していなければ、並列度を上げることを検討してください。

---

## トラブルシューティング

<!-- Knowledge type: troubleshooting -->
<!-- Applicable scenarios: performance anomalies after tuning -->

| 症状 | 考えられる原因 | 調査・対処方法 |
| --- | --- | --- |
| 並列度を上げた後、クエリが遅くなる | スレッドのスケジューリングのオーバーヘッドが並列処理による利点を上回る | Profile でオペレーターの処理時間を確認し、4-2-1 と段階的に下げてください |
| CPU 使用率が飽和しているのにクエリが遅くなる | 並列度が高すぎてコンテキストスイッチが増えている | 並列度を下げてください。高並行度のシナリオでは 1 に設定します |
| グローバル設定の変更が反映されない | 既存の接続には新しい設定が反映されていない | FE を再起動するか、クライアントを再接続してください |
| 大きなシャードの読み取りが遅い | バージョンが 2.1 より前で、並列度がシャード数に制限されている | 2.1 以降にアップグレードし、テーブルモデルが Duplicate または MoW であることを確認してください |

## まとめ

<!-- Knowledge type: summary -->

通常、クエリの並列度を調整する必要はありません。調整が必要な場合は、次の原則に従ってください。

1.  **CPU 使用率から判断する**: `PROFILE` ツールを使ってクエリが CPU ボトルネックかどうかを確認し、調整するかどうかを判断します。
2.  **SQL 単位の調整を優先する**: 単一の SQL に HINT を指定する方法が最も安全です。グローバル設定の大幅な変更は避けてください。
3.  **シナリオに応じて判断する**: [シナリオ別の推奨並列度](#scenario-and-recommended-parallelism-reference-table)を参照して適切な値を選びます。
4.  **段階的に下げて試す**: 複雑なクエリでは、4-2-1 と段階的に並列度を下げ、クエリ性能とマシンの負荷を観察します。
