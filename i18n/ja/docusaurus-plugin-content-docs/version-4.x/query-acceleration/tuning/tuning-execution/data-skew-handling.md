---
{
    "title": "データスキューへの対処：Doris の MPP クエリにおける局所的なボトルネックの特定と最適化",
    "sidebar_label": "データスキューへの対処",
    "language": "ja",
    "description": "Doris の MPP クエリでデータスキューを検出し、単一スレッドでの実行がボトルネックになる問題に対処する方法を説明します。Profile のメトリクス、Broadcast、Leading Hint を使った原因の特定とチューニングを取り上げます。",
    "keywords": ["Doris のデータスキュー", "MPP クエリ最適化", "Join Shuffle", "Broadcast Join", "Leading Hint", "データスキューへの対処", "Profile のチューニング"]
}
---

<!-- Knowledge type: concept + operation + case -->
<!-- Applicable scenario: Doris MPP query exhibits single-point slowness, unbalanced Join, or abnormal plan ordering -->

データスキューとは、Shuffle 後のデータが BE インスタンス間で均等に分散されず、単一のスレッドがクエリ全体のボトルネックになる現象です。Doris は MPP データベースであり、データの Shuffle を利用して並列計算を高速化します。Join Key やフィルター対象の列に偏りがあると、単一スレッドでの実行がボトルネックとなり、クエリ全体が遅くなります。

この記事では、このような問題を検出する方法と、一般的なチューニング方法を説明します。

## トラブルシューティングのチェックリスト

<!-- Knowledge type: operation checklist -->
<!-- Applicable scenario: quickly locating skew issues -->

最適化を始める前に、次の手順で調査してください。

- `EXPLAIN` で実行計画を確認し、Join の順序と Shuffle の方法を把握します。
- `PROFILE` でオペレーターのメトリクスの `max / avg / min` を確認します。対象となるメトリクスには `ExecTime` や `ProbeRows` があります。
- `max` と `avg` に桁違いの差があるかを調べます。これはスキューの典型的な兆候です。
- スキューの原因が Join Key の不均等な分布か、フィルタリング後の行数の推定誤差かを特定します。
- 原因に応じて、Broadcast Hint または Leading Hint を選択します。

## スキューが発生する状況の比較

<!-- Knowledge type: comparison table -->
<!-- Applicable scenario: quickly selecting an optimization method -->

| 状況 | 発生原因 | 典型的な兆候 | 推奨される方法 |
|---|---|---|---|
| バケットのデータスキュー | Join Key のデータ分布が不均等で、Shuffle 後に単一のパーティションが大きくなりすぎる | `ProbeRows.max` が `avg` より大幅に大きく、`ExecTime.max` に異常が見られる | Broadcast Join Hint |
| 列のデータスキューによって左右のテーブルが逆になる | オプティマイザーが均等な分布を仮定するため、フィルタリング後の行数の推定に大きな誤差が生じる | 不適切な Join 順序が選択され、左側のテーブルの行数が推定値より大幅に多くなる | Leading Hint |

## ケース 1：バケットのデータスキューにより Shuffle の方法が最適でなくなる

<!-- Knowledge type: case + operation -->
<!-- Applicable scenario: uneven Join Key distribution causes single-thread execution time to be significantly higher than the average -->

### 兆候

テーブルの Join Key にデータスキューがあると、データが BE インスタンス間で不均等に分散されます。その結果、局所的な実行のボトルネックが生じ、クエリ全体の実行時間が長くなります。

### Profile による特定

Hash Join オペレーターの Profile を確認します。

```SQL
HASH_JOIN_OPERATOR  (id=27): 
      -  PlanInfo 
            -  join  op: INNER  JOIN(PARTITIONED)[] 
            -  equal  join  conjunct:  (customer_number  =  customer_number) 
            -  runtime  filters:  RF001[bloom]  <-  customer_number(200/256/2048) 
            -  cardinality=200         
            -  vec  output  tuple  id:  28 
            -  output  tuple  id:  28  
            -  vIntermediate  tuple  ids:  27 
            -  hash  output  slot  ids:  192  193  194  195  196  197  198  199  200  201  174  175  240  176  177  178  179  180  181  182  183  184  185  186  187  188  189  190  191 
            -  project  output  tuple  id:  28 
      -  BlocksProduced:  sum  4.883K  (4883),  avg  33,  max  39,  min  29 
      -  CloseTime:  avg  37.28us,  max  132.653us,  min  13.945us  
      -  ExecTime:  avg  166.206ms,  max  10s947.344ms,  min  8.845ms 
      -  InitTime:  avg  0ns,  max  0ns,  min  0ns  
      -  MemoryUsage:  sum  ,  avg  ,  max  ,  min 
          -  PeakMemoryUsage:  sum  11.81  MB,  avg  84.00  KB,  max  84.00  KB,  min  84.00  KB 
          -  ProbeKeyArena:  sum  11.81  MB,  avg  84.00  KB,  max  84.00  KB,  min  84.00  KB 
      -  OpenTime:  avg  194.970us,  max  497.685us,  min  93.738us  
      -  ProbeRows:  sum  23.884018M  (23884018),  avg  165.861K  (165861),  max  219.346276M  (219346276),  min  1984  (1984) 
      -  ProjectionTime:  avg  7.336ms,  max  33.540ms,  min  3.760ms 
      -  RowsProduced:  sum  28.8K  (28800),  avg  200,  max  200,  min  200 
```

Join の Profile で `max` の値を見ると、実行時間と ProbeRows に明らかな偏りがあります。

```Bash
ExecTime:  avg  166.206ms,  max  10s947.344ms,  min  8.845ms 
ProbeRows:  sum  23.884018M  (23884018),  avg  165.861K  (165861),  max  219.346276M  (219346276),  min  1984  (1984) 
```

Join Key による Shuffle 後のデータ分布が不均等なため、あるスレッドは 200 百万行を処理する一方、別のスレッドは数千行しか処理していません。

### スキューの兆候の早見表

| メトリクス | 正常な状態 | スキューがある状態 |
|---|---|---|
| `ExecTime` | `max` が `avg` に近い | `max` が `avg` より大幅に大きい（例：10s と 166ms） |
| `ProbeRows` | すべてのスレッドが同じ桁の範囲に収まる | `max` が `avg` より数桁大きい |
| `RowsProduced` | 均等に分散している | 少数のスレッドに集中している |

### 最適化：Broadcast Join Hint を使用する

各スレッドが処理するデータ量は、できるだけ同程度であることが理想です。「Hint を使って Join の Shuffle 方法を制御する」セクションを参照し、Broadcast Join Hint を指定して左側のテーブルが Shuffle されないようにします。これにより、Join 列のデータスキューによるパフォーマンスのボトルネックを回避できます。

- **目的**：大きなテーブルを Join Key で Shuffle せず、単一のパーティションが大きくなりすぎるのを防ぎます。
- **コマンド**：

  ```SQL
  SELECT COUNT(*) FROM orders o JOIN [broadcast] customer c ON o.customer_number = c.customer_number;
  ```

- **説明**：`[broadcast]` により、右側のテーブル `customer` がすべてのノードにブロードキャストされ、左側のテーブル `orders` は Shuffle されなくなります。これにより、Join Key のスキューによる局所的な負荷の集中を解消します。

## ケース 2：列のデータスキューにより Join の左右のテーブルが逆になる

<!-- Knowledge type: case + operation -->
<!-- Applicable scenario: inaccurate filter row-count estimation leads to an unreasonable Join order -->

### 兆候

Doris のオプティマイザーは、均等な分布を仮定して選択率を推定します。フィルタリング後の行数の推定に大きな誤差があると、オペレーターの実行計画の選択に影響します。次の SQL を例に説明します。

```SQL
select count(*) 
from orders, customer 
where o_custkey = c_custkey
and o_orderdate < '1920-01-02';
```

### 原因の分析

均等な分布を仮定すると、オプティマイザーは、フィルター `o_orderdate < '1920-01-02'` の適用後に出力される行数が `customer` テーブルの行数より少ないと判断し、Join 順序に `customer` join `orders` を選択する可能性があります。

しかし、実際のデータに偏りがあり、条件を満たす `orders` の行数が `customer` より多い場合は、`orders` join `customer` のほうが適切な Join 順序です。

### 最適化：Leading Hint を使用する

- **目的**：行数の推定誤差を回避するため、より適切な Join 順序を強制します。
- **コマンド**：

  ```SQL
  select /*+leading(orders customer)*/ count(*) 
  from orders, customer 
  where o_custkey = c_custkey
  and o_orderdate < '1920-01-02'
  ```

- **説明**：「Leading Hint を使って Join 順序を制御する」セクションを参照してください。Leading Hint は、`customer` join `orders` という Join 順序の生成を強制します。

## FAQ

<!-- Knowledge type: FAQ -->
<!-- Applicable scenario: common questions and misconceptions -->

**Q1：クエリにデータスキューがあるかどうかをすばやく判断するには？**

Profile で主要なオペレーターの `ExecTime` と `ProbeRows` を確認します。`max` が `avg` より大幅に大きい場合（桁違いの差がある場合）は、スキューが発生しています。

**Q2：Broadcast Join を使えば、スキューは必ず解消されますか？**

必ずしもそうではありません。Broadcast が適しているのは、右側のテーブル（ブロードキャストされるテーブル）が十分に小さい場合です。右側のテーブルが大きいと、ブロードキャストによってメモリとネットワークに大きな負荷がかかり、かえってパフォーマンスが低下する可能性があります。

**Q3：Leading Hint と Broadcast Hint は併用できますか？**

はい。Leading Hint は Join 順序を制御し、Broadcast Hint は Shuffle の方法を制御します。目的が異なるため、組み合わせて複雑な状況に対処できます。

**Q4：オプティマイザーが最適な実行計画を自動的に選択できないのはなぜですか？**

オプティマイザーは統計情報と均等な分布の仮定に基づいて推定します。列のデータに大きな偏りがあると、推定が不正確になります。この場合は Hint を使った調整が必要です。

## トラブルシューティング

<!-- Knowledge type: troubleshooting -->
<!-- Applicable scenario: issue persists after tuning -->

| 問題 | 考えられる原因 | 推奨される対処方法 |
|---|---|---|
| Broadcast Hint を追加した後に OOM が発生する | 右側のテーブルが大きすぎて、ブロードキャストによるメモリ使用量が上限を超えている | 別の Shuffle 方法に切り替えるか、右側のテーブルのサイズを小さくする |
| Leading Hint を追加しても効果がない | Hint の構文に誤りがあるか、オプティマイザーが Hint を無視している | `EXPLAIN` で Hint が有効か確認する |
| Profile の `max` が依然として `avg` より大幅に大きい | スキューの原因が Join ではなく、集約またはスキャンにある | Aggregate / Scan オペレーターのメトリクスを確認する |
| 実行ごとに結果が安定しない | 統計情報が古い | `ANALYZE TABLE` を実行して統計情報を更新する |

## まとめ

<!-- Knowledge type: summary -->
<!-- Applicable scenario: methodology recap -->

データスキューは、本番環境でよく見られるパフォーマンス上の問題です。次の三つの手順で対処できます。

1. **観察**：`EXPLAIN` と `PROFILE` の出力を使い、実行計画とボトルネックを確認します。
2. **特定**：`max / avg / min` の差からスキューの原因を特定します。
3. **調整**：Broadcast Hint または Leading Hint で実行計画を調整し、データスキューによるパフォーマンスへの影響を回避します。
