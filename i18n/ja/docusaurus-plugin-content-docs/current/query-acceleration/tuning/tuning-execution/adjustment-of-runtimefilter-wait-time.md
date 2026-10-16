---
{
    "title": "RuntimeFilter の待機時間の調整：NOT_READY とクエリ遅延の解消",
    "sidebar_label": "RuntimeFilter のチューニング",
    "language": "ja",
    "description": "RuntimeFilter の待機タイムアウトが効かず、クエリが遅くなっていませんか？この記事では、Profile で NOT_READY 状態を特定し、runtime_filter_wait_time_ms を調整する方法を説明します。",
    "keywords": ["Doris RuntimeFilter", "runtime_filter_wait_time_ms", "RuntimeFilterState NOT_READY", "WaitForRuntimeFilter", "クエリチューニング"]
}
---

<!-- Knowledge type: Tuning guide -->
<!-- Applicable scenario: Query performance issues caused by unreasonable (too short / too long) RuntimeFilter wait time -->

**RuntimeFilter** はクエリ最適化の手法です。実行時に Join の右側のテーブルからフィルター条件を生成し、左側のテーブルのスキャン段階にプッシュダウンすることで、I/O と計算量を削減します。

RuntimeFilter の待機時間が不適切（短すぎる）場合、フィルターが生成される前に左側のテーブルのスキャンが始まり、最適化が効かずにクエリが遅くなることがあります。

この記事では、実際の Profile の事例を使って、問題を特定して解決する方法を説明します。

## 適用条件のチェックリスト

<!-- Knowledge type: Prerequisites -->
<!-- Applicable scenario: Determine whether RuntimeFilter wait time needs to be adjusted -->

待機時間を調整する前に、次の点を確認してください。

- クエリの実行が遅く、Join 操作が含まれている。
- `EXPLAIN` / `PROFILE` で実行計画と実行プロファイルを取得している。
- Profile に `WaitForRuntimeFilter` フィールドがある。
- RuntimeFilter の状態が `NOT_READY` であるか、Join の構築時間が現在の待機時間を超えている。

## 主なパラメータ

<!-- Knowledge type: Parameter configuration -->
<!-- Applicable scenario: Adjust RuntimeFilter wait time -->

| パラメータ | デフォルト値 | 説明 |
| --- | --- | --- |
| `runtime_filter_wait_time_ms` | 1000 ms | 左側のテーブルのスキャンが RuntimeFilter の生成を待つ最大時間です。この時間を過ぎると待機をやめ、直接スキャンします。 |

設定方法（セッション単位）：

```sql
SET runtime_filter_wait_time_ms = 3000;
```

## 事例：待機時間が短すぎて RuntimeFilter が準備できない

<!-- Knowledge type: Case analysis -->
<!-- Applicable scenario: Diagnose RuntimeFilter NOT_READY issues through Profile -->

### ステップ 1：ScanOperator の待機状態を確認する

次の Profile 情報を参照してください。

```sql
OLAP_SCAN_OPERATOR (id=22. nereids_id=1764. table name = test_doris(test_doris)):(ExecTime: 62.870ms)
               - RuntimeFilters: : RuntimeFilter: (id = 6, type = minmax, need_local_merge: true, is_broadcast: false, build_bf_cardinality: false, RuntimeFilter: (id = 7, type = in_or_bloomfilter, need_local_merge: true, is_broadcast: false, build_bf_cardinality: false,
               - PushDownPredicates: []
               - KeyRanges: ScanKeys:ScanKey=[null(-9223372036854775808) : 9223372036854775807]
               - TabletIds: [1732763414173, 1732763414187, 1732763414201, 1732763414215]
               - UseSpecificThreadToken: False
               - AcquireRuntimeFilterTime: 969ns
               - BlocksProduced: 1.829K (1829)
               - CloseTime: 0ns
               - ExecTime: 62.870ms
               - InitTime: 75.703us
               - KeyRangesNum: 0
               - MaxScannerThreadNum: 32
               - MemoryUsage:
                 - PeakMemoryUsage: 0.00
               - NumScanners: 32
               - OpenTime: 19.276ms
               - ProcessConjunctTime: 30.360us
               - ProjectionTime: 0ns
               - RowsProduced: 7.433056M (7433056)
               - RowsRead: 0
               - RuntimeFilterInfo:
               - ScannerWorkerWaitTime: 0ns
               - TabletNum: 4
               - TotalReadThroughput: 0
               - WaitForDependency[OLAP_SCAN_OPERATOR_DEPENDENCY]Time: 0ns
               - WaitForRuntimeFilter: 1000ms
              RuntimeFilter: (id = 6, type = minmax):
                 - Info: [IsPushDown = false, RuntimeFilterState = NOT_READY, HasRemoteTarget = true, HasLocalTarget = false, Ignored = false]
              RuntimeFilter: (id = 7, type = in_or_bloomfilter):
                 - Info: [IsPushDown = false, RuntimeFilterState = NOT_READY, HasRemoteTarget = true, HasLocalTarget = false, Ignored = false]
```

主な判断材料：

- `WaitForRuntimeFilter: 1000ms`：スキャンオペレーターが 1000ms 待機しています。
- `RuntimeFilterState = NOT_READY`：RuntimeFilter 6 と 7 はまだ準備できていません。
- `IsPushDown = false`：フィルターをスキャン段階にプッシュダウンできていません。

### ステップ 2：RuntimeFilter を生成する Join を特定する

```sql
RuntimeFilter: (id = 6, type = minmax):
                 - Info: [IsPushDown = false, RuntimeFilterState = NOT_READY, HasRemoteTarget = true, HasLocalTarget = false, Ignored = false]
RuntimeFilter: (id = 7, type = in_or_bloomfilter):
                 - Info: [IsPushDown = false, RuntimeFilterState = NOT_READY, HasRemoteTarget = true, HasLocalTarget = false, Ignored = false]
```

Profile で RuntimeFilter 6 と 7 を生成する Join オペレーターを探します。

```sql
HASH_JOIN_OPERATOR (id=26 , nereids_id=37948):
                - PlanInfo
                   - join op: RIGHT OUTER JOIN(PARTITIONED)[]
                   - equal join conjunct: (id = ID)
                   - runtime filters: RF006[min_max] <- ID(6418/8192/1048576), RF007[in_or_bloom] <- ID(6418/8192/1048576)
                   - cardinality=6,418
                   - vec output tuple id: 27
                   - output tuple id: 27
                   - vIntermediate tuple ids: 25
                   - hash output slot ids: 396 398 399 400 401 402 403 404 405 406 407 408 409 410 411 412 413 447
                   - projections: USER_ID
                   - project output tuple id: 27
                - BlocksProduced: sum 1, avg 1, max 1, min 1
                - CloseTime: avg 10.111us, max 10.111us, min 10.111us
                - ExecTime: avg 364.497us, max 364.497us, min 364.497us
                - InitTime: avg 26.653us, max 26.653us, min 26.653us
                - MemoryUsage: sum , avg , max , min
                  - PeakMemoryUsage: sum 0.00 , avg 0.00 , max 0.00 , min 0.00
                  - ProbeKeyArena: sum 0.00 , avg 0.00 , max 0.00 , min 0.00
                - OpenTime: avg 45.985us, max 45.985us, min 45.985us
                - ProbeRows: sum 0, avg 0, max 0, min 0
                - ProjectionTime: avg 211.930us, max 211.930us, min 211.930us
                - RowsProduced: sum 1, avg 1, max 1, min 1
                - WaitForDependency[HASH_JOIN_OPERATOR_DEPENDENCY]Time: avg 1sec780ms, max 1sec780ms, min 1sec780ms
```

`WaitForDependency[HASH_JOIN_OPERATOR_DEPENDENCY]Time: 1sec780ms` は、Join の構築に約 **1.78 秒**かかり、RuntimeFilter のデフォルトの待機時間である 1 秒を超えていることを示します。そのため、ScanOperator はフィルターの生成を待ちきれません。

### ステップ 3：待機時間を延ばす

- **目的**：RuntimeFilter が生成されるまでスキャンオペレーターが待機できるようにし、プッシュダウンを有効にします。
- **コマンド**：

  ```sql
  SET runtime_filter_wait_time_ms = 3000;
  ```

- **説明**：1.78 秒の Join 構築時間をカバーするため、待機時間の上限を 1000ms から 3000ms に変更します。

### ステップ 4：効果を確認する

調整後、クエリの実行時間は **5 秒から 2 秒**に短縮されました。

## 診断方法の比較

<!-- Knowledge type: Method comparison -->
<!-- Applicable scenario: Quickly select a diagnostic path -->

| 症状 | 考えられる原因 | 推奨される対応 |
| --- | --- | --- |
| `RuntimeFilterState = NOT_READY` で、`WaitForRuntimeFilter` が上限に近い | 待機時間が短すぎる、Join の構築が遅い | `runtime_filter_wait_time_ms` を増やす |
| `RuntimeFilterState = READY` で、`IsPushDown = true` | フィルターが有効になっている | 調整は不要 |
| `Ignored = true` | フィルターの選択性が低く、自動的に無視されている | Join の選択性を確認し、強制的に有効化しない |
| スキャン段階で長時間待機する | 待機時間が長すぎる、フィルターの効果が低い | `runtime_filter_wait_time_ms` を適切に減らす |

## FAQ

<!-- Knowledge type: FAQ -->
<!-- Applicable scenario: Troubleshoot RuntimeFilter-related questions -->

**Q1：`runtime_filter_wait_time_ms` は大きいほどよいですか？**

いいえ。待機時間が長すぎると、左側のテーブルのスキャンが長時間待機し、かえってクエリが遅くなります。Join の構築時間（`WaitForDependency[HASH_JOIN_OPERATOR_DEPENDENCY]Time`）に基づいて、適度に増やすことを推奨します。

**Q2：RuntimeFilter が実際に有効になっているか、どうすれば確認できますか？**

Profile にある RuntimeFilter の `RuntimeFilterState` と `IsPushDown` フィールドを確認します。`READY` かつ `IsPushDown = true` であれば、有効になっています。

**Q3：調整後も NOT_READY のままの場合はどうすればよいですか？**

Join の右側のテーブルに、データの偏りや遅い Shuffle など、より深刻なボトルネックがないか確認してください。または、SQL Hint を使って、このクエリで効果のない RuntimeFilter を無効にすることを検討してください。

**Q4：このパラメータはグローバルに設定できますか？**

はい。ただし、ほかのクエリへの影響を避けるため、セッション単位、または Hint による個別の SQL への設定を推奨します。

## まとめ

<!-- Knowledge type: Key takeaways -->
<!-- Applicable scenario: Practical recap -->

- RuntimeFilter の待機時間は、Join の構築時間を考慮して設定してください。すべてのクエリに適した単一の値はありません。
- `EXPLAIN` と `PROFILE` を使って、`NOT_READY` 状態と Join の処理時間を特定します。
- `SET runtime_filter_wait_time_ms` または SQL Hint を使って待機時間を調整します。
- Doris では適応的な最適化が継続的に進められており、将来的にはこのパラメータを手動で調整する必要性が徐々に減る見込みです。
