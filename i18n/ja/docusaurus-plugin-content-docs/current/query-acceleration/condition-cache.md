---
title: Condition Cache による繰り返しフィルタークエリの高速化
sidebar_label: Condition Cache
description: Doris の Condition Cache は、Segment のフィルター結果をキャッシュして、繰り返し実行される条件付きクエリをどのように高速化するのでしょうか。この記事では、仕組み、設定、ヒット率の監視方法を詳しく説明します。
keywords:
    - Doris Condition Cache
    - 条件キャッシュ
    - クエリ高速化
    - 繰り返しフィルターの最適化
    - Segment フィルターキャッシュ
    - LRU キャッシュ
    - OLAP の高並行クエリ
    - enable_condition_cache
language: ja
---

<!-- Knowledge type: capability definition / configuration parameter / performance tuning -->
<!-- Applicable scenario: high-frequency repeated condition queries / query performance optimization -->

**Condition Cache** は、Apache Doris で繰り返し実行される条件付きクエリのための高速化機能です。特定の Segment に対するフィルター条件の結果を、圧縮されたビットベクトルとしてキャッシュします。後続のクエリがキャッシュにヒットすると、その結果を直接再利用できるため、スキャンとフィルタリングを繰り返す必要がなくなります。これにより、CPU と IO の負荷が減り、クエリのレイテンシが短縮されます。

大規模な分析では、次のように同じフィルター条件を含むクエリが繰り返し実行されることがあります。

```sql
SELECT * FROM orders WHERE region = 'ASIA';
SELECT count(*) FROM orders WHERE region = 'ASIA';
```

このようなクエリは、同じデータの分割単位（Segment）に対して同じフィルター処理を繰り返すため、**余分な CPU と IO の負荷**が発生します。Condition Cache はフィルター結果を再利用して**不要なスキャンとフィルタリングを減らし**、クエリのレイテンシを大幅に短縮します。

## 動作原理

<!-- Knowledge type: architectural principle -->

Condition Cache の基本的な考え方は、**同じデータの分割単位に同じフィルター条件を適用すると、同じ結果が得られる**というものです。

1. Doris は「フィルター式 + Key Range」から **64 ビットのダイジェスト**を生成し、キャッシュの一意な識別子として使用します。
2. 各 Segment は、このダイジェストを使って、既存のフィルター結果をキャッシュから検索できます。
3. キャッシュされた結果は、圧縮された**ビットベクトル（`std::vector<bool>`）**として保存されます。

ビットベクトルの値には、次の意味があります。

| ビット値 | 意味 |
| --------- | ------------------------------------------------------------- |
| `0`       | 行の範囲は条件を満たさないため、スキップできる |
| `1`       | 行の範囲に条件を満たす行が含まれる可能性があり、さらにスキャンする必要がある |

これにより、Doris は粗い粒度で対象外のデータブロックをすばやく除外し、必要な場合にだけ精密なフィルタリングを行えます。

## 適用シナリオ

<!-- Knowledge type: architecture selection decision -->

### 推奨されるシナリオ

Condition Cache は、次のシナリオで特に効果的です。

| シナリオ | 説明 |
| -------------------- | -------------------------------------------------------------------------------------- |
| **繰り返される条件** | 同じ、または類似したフィルター条件が頻繁に使用される |
| **比較的安定したデータ** | Segment 内のデータは通常変更されない（INSERT や Compaction によって新しい Segment が生成され、古いキャッシュは自然に削除される） |
| **高い選択性** | フィルタリング後に残る行が少なく、スキャンの削減効果が最大になる |

### Condition Cache が適用されないシナリオ

Condition Cache は、次の場合には機能しません。

- クエリに **Delete 条件**が含まれる場合（削除マーカーの正確性を保証する必要があるため、キャッシュが無効になる）。
- 実行時に生成される **TopN Runtime Filter** がある場合（まだサポートされていない）。

## 設定と管理

<!-- Knowledge type: configuration parameter -->

### 有効化と無効化

- **目的**: セッション単位で Condition Cache を有効にします。
- **コマンド**:

    ```sql
    set enable_condition_cache = true;
    ```

- **説明**: このパラメータは、現在のセッションで Condition Cache を使用するかどうかを制御します。

### メモリ管理

Condition Cache のメモリ使用量には、次のルールが適用されます。

| 項目 | 説明 |
| ----------------- | -------------------------------------------------------------------- |
| 削除ポリシー | **LRU（Least Recently Used）**。容量の上限を超えると、使用されてから最も時間が経過したエントリが自動的に削除される |
| 容量パラメータ | `condition_cache_limit`。単位は MB、デフォルト値は `1024` |
| 設定ファイル | `be.conf` |
| 自然な期限切れ | Segment に Compaction が実行された後、古いキャッシュエントリは LRU によって自然に削除される |

容量の上限を変更する例:

```properties
# be.conf
condition_cache_limit = 1024
```

## キャッシュの統計と監視

<!-- Knowledge type: operational steps -->

Doris には、Condition Cache の効果を確認するための統計メトリクスがあります。これらを使って、キャッシュの効果とヒット率を評価できます。

### Profile レベルのメトリクス

次のメトリクスは、クエリ実行計画（Profile）で確認できます。

| メトリクス名 | 意味 |
| ------------------------------ | -------------------------------- |
| `ConditionCacheSegmentHit`     | キャッシュにヒットした Segment の数 |
| `ConditionCacheFilteredRows`   | キャッシュによって直接除外された行の数 |

### システムメトリクス

次のメトリクスは、監視システムまたは `metrics` インターフェースで確認できます。

| メトリクス名 | 意味 |
| ------------------------------- | ----------------- |
| `condition_cache_search_count`  | キャッシュの検索回数 |
| `condition_cache_hit_count`     | キャッシュのヒット回数 |

## 使用例

### 典型的なシナリオ

次のクエリを例に説明します。

```sql
SELECT order_id, amount
FROM orders
WHERE region = 'ASIA' AND order_date >= '2023-01-01';
```

実行の流れは次のとおりです。

1. **初回の実行**: 全体のスキャンと条件の評価が必要です。Condition Cache は結果を LRU キャッシュに保存します。
2. **以降の同一クエリ**: キャッシュを直接利用して、条件を満たさない行の範囲の大部分をスキップし、条件を満たす可能性がある部分だけをスキャンします。

複数のクエリで同じフィルター条件（たとえば `region = 'ASIA' AND order_date >= '2023-01-01'`）を使用する場合も、Condition Cache を相互に再利用できるため、全体の負荷を減らせます。

## 注意事項

- **キャッシュは永続化されません**: Doris の再起動後、Condition Cache はクリアされます。
- **削除操作ではキャッシュが無効になります**: 削除マーカーが関係する Segment では強い整合性を保証する必要があるため、Condition Cache は使用されません。

## FAQ

**Q1: Condition Cache と Query Cache はどう違いますか？**

Condition Cache は、「Segment に対するフィルター条件のヒット状態」（ビットベクトル）をキャッシュします。粒度が細かく、異なるクエリ間でも再利用できます。これはクエリ実行層の最適化機能です。

**Q2: Condition Cache を有効にしても、クエリが速くならないのはなぜですか？**

次の点を確認してください。

- クエリ条件に Delete マーカーまたは TopN Runtime Filter が含まれているため、キャッシュが機能していない。
- データが頻繁に書き込まれている。Compaction の後、古い Segment が新しい Segment に置き換えられ、キャッシュが削除される。
- 条件の選択性が低く、フィルタリング後も多くの行が残るため、効果が限定的である。
- `condition_cache_hit_count` / `condition_cache_search_count` を使って、ヒット率が低いかどうかを確認する。

**Q3: クエリが Condition Cache にヒットしたかどうかを確認するには、どうすればよいですか？**

Profile の `ConditionCacheSegmentHit` と `ConditionCacheFilteredRows` を確認します。値が 0 より大きければ、キャッシュにヒットし、フィルタリングによる効果が得られています。

**Q4: `condition_cache_limit` を変更した後、再起動は必要ですか？**

`condition_cache_limit` は `be.conf` で設定します。変更を有効にするには、BE を再起動する必要があります。

## まとめ

Condition Cache は、Doris で**繰り返し実行される条件付きクエリ**を最適化する機能です。次の利点があります。

- 重複する計算を避け、CPU と IO の消費を減らす。
- ユーザーによる操作を必要とせず、透過的かつ自動的に動作する。
- メモリ使用量が少なく、ヒット率とフィルタリング率が高い場合に大きな効果がある。

Condition Cache を活用すると、OLAP クエリを高頻度で実行するシナリオで、応答時間を短縮できます。
