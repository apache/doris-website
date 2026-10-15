---
{
    "title": "Leading Hint による JOIN 順序の制御: JOIN 順序を手動で指定してクエリを最適化する",
    "sidebar_label": "Leading Hint による JOIN 順序の制御",
    "language": "ja",
    "description": "Doris で Leading Hint を使って JOIN 順序を手動で指定する方法を説明します。左右のテーブルの入れ替え、左深木、右深木、Bushy ツリー、Distribute Hint との併用を例で示します。",
    "keywords": ["Doris Leading Hint", "JOIN 順序", "左深木", "右深木", "Bushy ツリー", "Distribute Hint", "Nereids Planner", "クエリチューニング"]
}
---

<!-- Knowledge type: concept + operation -->
<!-- Applicable scenarios: complex multi-table Join tuning, manual intervention when CBO selection is suboptimal -->

**Leading Hint** は、SQL で複数のテーブルの JOIN 順序を手動で指定するためのヒント構文です。特定のシナリオで複雑なクエリの実行計画を最適化するために使用します。構文の詳細は [Leading Hint](../../../query-acceleration/hints/leading-hint.md) のドキュメントを参照してください。

### このページを読む前に

- Doris の Nereids オプティマイザと `EXPLAIN SHAPE PLAN` の出力を理解していること
- 対象のクエリが複数テーブルの JOIN であり、オプティマイザが自動選択した順序が期待どおりでないこと
- JOIN の形状を左深木、右深木、または Bushy ツリーとして制御する必要があること
- JOIN 順序とデータ分散方式（Shuffle / Broadcast）を同時に制御する必要があること

:::caution 注意
Doris は標準で高度な最適化機能を備えています。ほとんどの場合、オプティマイザが状況に応じて性能を最適化するため、**ユーザーがヒントを使って手動でチューニングする必要はありません**。この章は主に専門のチューニング担当者を対象としています。業務ユーザーは概要を把握しておくだけで十分です。
:::

## 適用シナリオのクイックリファレンス

<!-- Knowledge type: reference -->
<!-- Applicable scenarios: quickly determine which Hint form to use -->

| シナリオ | 推奨されるヒント構文 | 結果の JOIN 形状 |
| --- | --- | --- |
| 二つのテーブルの左右の JOIN 順序を入れ替える | `leading(t2 t1)` | 左右を入れ替える |
| 複数のテーブルを左深木にする | `leading(t1 t2 t3)` | 左深木 |
| 複数のテーブルを右深木にする | `leading(t1 {t2 t3})` | 右深木 |
| 複数のテーブルを Bushy ツリーにする | `leading({t1 t2} {t3 t4})` | Bushy ツリー |
| サブクエリまたはビューを一つのまとまりとして JOIN に参加させる | `leading(alias t1)` | エイリアスを単一の JOIN ノードとして扱う |
| 順序と分散方式の両方を制御する | `leading(a shuffle b broadcast c)` | 指定した順序と Shuffle / Broadcast |

> 一言でいうと、Leading Hint は「どのテーブルを先に JOIN し、次にどのテーブルを JOIN するか、またどのような形状にするか」をオプティマイザに手動で指示するものです。

## ケース 1: 左右のテーブルの順序を調整する

<!-- Knowledge type: operation -->
<!-- Applicable scenarios: swap the left and right tables in a two-table Join -->

**目的**: デフォルトの `t1 join t2` の順序を `t2 join t1` に変更します。

**元の実行計画**:

```sql
mysql> explain shape plan select * from t1 join t2 on t1.c1 = t2.c2;
+------------------------------------------------------------------------------+
| _Explain_ String(Nereids Planner)                                            |
+------------------------------------------------------------------------------+
| PhysicalResultSink                                                           |
| --PhysicalDistribute[DistributionSpecGather]                                 |
| ----PhysicalProject                                                          |
| ------hashJoin[INNER_JOIN] hashCondition=((t1.c1 = t2.c2)) otherCondition=() |
| --------PhysicalOlapScan[t1]                                                 |
| --------PhysicalDistribute[DistributionSpecHash]                             |
| ----------PhysicalOlapScan[t2]                                               |
+------------------------------------------------------------------------------+
```

**Leading Hint を適用**:

```sql
mysql> explain shape plan select /*+ leading(t2 t1) */ * from t1 join t2 on t1.c1 = t2.c2;
+------------------------------------------------------------------------------+
| _Explain_ String(Nereids Planner)                                            |
+------------------------------------------------------------------------------+
| PhysicalResultSink                                                           |
| --PhysicalDistribute[DistributionSpecGather]                                 |
| ----PhysicalProject                                                          |
| ------hashJoin[INNER_JOIN] hashCondition=((t1.c1 = t2.c2)) otherCondition=() |
| --------PhysicalOlapScan[t2]                                                 |
| --------PhysicalDistribute[DistributionSpecHash]                             |
| ----------PhysicalOlapScan[t1]                                               |
|                                                                              |
| Hint log:                                                                    |
| Used: leading(t2 t1)                                                         |
| UnUsed:                                                                      |
| SyntaxError:                                                                 |
+------------------------------------------------------------------------------+
```

**説明**: ヒントログの `Used: leading(t2 t1)` は、ヒントが有効になり、左右のテーブルの順序が入れ替わったことを示します。

## ケース 2: 左深木を強制する

<!-- Knowledge type: operation -->
<!-- Applicable scenarios: join multiple tables in a linear, sequential manner -->

**目的**: `t1`、`t2`、`t3` を `((t1 ⨝ t2) ⨝ t3)` という左深木の形で実行します。

```sql
mysql> explain shape plan select /*+ leading(t1 t2 t3) */ * from t1 join t2 on t1.c1 = t2.c2 join t3 on t2.c2 = t3.c3;
+--------------------------------------------------------------------------------+
| _Explain_ String(Nereids Planner)                                              |
+--------------------------------------------------------------------------------+
| PhysicalResultSink                                                             |
| --PhysicalDistribute[DistributionSpecGather]                                   |
| ----PhysicalProject                                                            |
| ------hashJoin[INNER_JOIN] hashCondition=((t2.c2 = t3.c3)) otherCondition=()   |
| --------hashJoin[INNER_JOIN] hashCondition=((t1.c1 = t2.c2)) otherCondition=() |
| ----------PhysicalOlapScan[t1]                                                 |
| ----------PhysicalDistribute[DistributionSpecHash]                             |
| ------------PhysicalOlapScan[t2]                                               |
| --------PhysicalDistribute[DistributionSpecHash]                               |
| ----------PhysicalOlapScan[t3]                                                 |
|                                                                                |
| Hint log:                                                                      |
| Used: leading(t1 t2 t3)                                                        |
| UnUsed:                                                                        |
| SyntaxError:                                                                   |
+--------------------------------------------------------------------------------+
```

**説明**: ヒントログの `Used: leading(t1 t2 t3)` は、ヒントが有効になり、実行計画が左深木になったことを示します。

## ケース 3: 右深木を強制する

<!-- Knowledge type: operation -->
<!-- Applicable scenarios: have the right subtree carry the main Join chain -->

**目的**: 波括弧 `{}` で右側のサブ JOIN を囲み、`(t1 ⨝ (t2 ⨝ t3))` という右深木を構築します。

```sql
mysql> explain shape plan select /*+ leading(t1 {t2 t3}) */ * from t1 join t2 on t1.c1 = t2.c2 join t3 on t2.c2 = t3.c3;
+----------------------------------------------------------------------------------+
| _Explain_ String(Nereids Planner)                                                |
+----------------------------------------------------------------------------------+
| PhysicalResultSink                                                               |
| --PhysicalDistribute[DistributionSpecGather]                                     |
| ----PhysicalProject                                                              |
| ------hashJoin[INNER_JOIN] hashCondition=((t1.c1 = t2.c2)) otherCondition=()     |
| --------PhysicalOlapScan[t1]                                                     |
| --------PhysicalDistribute[DistributionSpecHash]                                 |
| ----------hashJoin[INNER_JOIN] hashCondition=((t2.c2 = t3.c3)) otherCondition=() |
| ------------PhysicalOlapScan[t2]                                                 |
| ------------PhysicalDistribute[DistributionSpecHash]                             |
| --------------PhysicalOlapScan[t3]                                               |
|                                                                                  |
| Hint log:                                                                        |
| Used: leading(t1 { t2 t3 })                                                      |
| UnUsed:                                                                          |
| SyntaxError:                                                                     |
+----------------------------------------------------------------------------------+
```

**説明**: ヒントログの `Used: leading(t1 { t2 t3 })` は、ヒントが有効になり、実行計画が右深木になったことを示します。

## ケース 4: Bushy ツリーを強制する

<!-- Knowledge type: operation -->
<!-- Applicable scenarios: four or more tables, where the left and right subtrees should each Join first before being combined -->

**目的**: 二組の `{}` で左右の部分木をそれぞれ囲み、`((t1 ⨝ t2) ⨝ (t3 ⨝ t4))` という Bushy ツリーを構築します。

```sql
mysql> explain shape plan select /*+ leading({t1 t2} {t3 t4}) */ * from t1 join t2 on t1.c1 = t2.c2 join t3 on t2.c2 = t3.c3 join t4 on t3.c3 = t4.c4;
+-----------------------------------------------+
| _Explain_ String                              |
+-----------------------------------------------+
| PhysicalResultSink                            |
| --PhysicalDistribute                          |
| ----PhysicalProject                           |
| ------hashJoin[INNER_JOIN](t2.c2 = t3.c3)     |
| --------hashJoin[INNER_JOIN](t1.c1 = t2.c2)   |
| ----------PhysicalOlapScan[t1]                |
| ----------PhysicalDistribute                  |
| ------------PhysicalOlapScan[t2]              |
| --------PhysicalDistribute                    |
| ----------hashJoin[INNER_JOIN](t3.c3 = t4.c4) |
| ------------PhysicalOlapScan[t3]              |
| ------------PhysicalDistribute                |
| --------------PhysicalOlapScan[t4]            |
|                                               |
| Used: leading({ t1 t2 } { t3 t4 })            |
| UnUsed:                                       |
| SyntaxError:                                  |
+-----------------------------------------------+
```

**説明**: ヒントログの `Used: leading({ t1 t2 } { t3 t4 })` は、ヒントが有効になり、実行計画が Bushy ツリーになったことを示します。

## ケース 5: ビューまたはサブクエリを一つのまとまりとして JOIN に参加させる {#case-5-view--subquery-participating-in-the-join-as-a-whole}

<!-- Knowledge type: operation -->
<!-- Applicable scenarios: a subquery or view has an alias and needs to participate in ordering as a single Join node -->

**目的**: サブクエリのエイリアス `alias` と外側のテーブル `t1` を指定した順序で JOIN します。

```sql
mysql>  explain shape plan select /*+ leading(alias t1) */ count(*) from t1 join (select c2 from t2 join t3 on t2.c2 = t3.c3) as alias on t1.c1 = alias.c2;
+--------------------------------------------------------------------------------------+
| _Explain_ String(Nereids Planner)                                                    |
+--------------------------------------------------------------------------------------+
| PhysicalResultSink                                                                   |
| --hashAgg[GLOBAL]                                                                    |
| ----PhysicalDistribute[DistributionSpecGather]                                       |
| ------hashAgg[LOCAL]                                                                 |
| --------PhysicalProject                                                              |
| ----------hashJoin[INNER_JOIN] hashCondition=((t1.c1 = alias.c2)) otherCondition=()  |
| ------------PhysicalProject                                                          |
| --------------hashJoin[INNER_JOIN] hashCondition=((t2.c2 = t3.c3)) otherCondition=() |
| ----------------PhysicalProject                                                      |
| ------------------PhysicalOlapScan[t2]                                               |
| ----------------PhysicalDistribute[DistributionSpecHash]                             |
| ------------------PhysicalProject                                                    |
| --------------------PhysicalOlapScan[t3]                                             |
| ------------PhysicalDistribute[DistributionSpecHash]                                 |
| --------------PhysicalProject                                                        |
| ----------------PhysicalOlapScan[t1]                                                 |
|                                                                                      |
| Hint log:                                                                            |
| Used: leading(alias t1)                                                              |
| UnUsed:                                                                              |
| SyntaxError:                                                                         |
+--------------------------------------------------------------------------------------+
```

**説明**: ヒントログの `Used: leading(alias t1)` は、ヒントが有効になり、サブクエリ `alias` が一つのノードとして扱われていることを示します。

## ケース 6: Distribute Hint と Leading Hint を組み合わせる {#case-6-mixing-distribute-hint-with-leading-hint}

<!-- Knowledge type: operation -->
<!-- Applicable scenarios: complex multi-table queries that need to control both Join order and distribution method -->

**目的**: JOIN 順序の指定と同時に、各 JOIN の組に対して `shuffle` または `broadcast` の分散方式を指定します。

```sql
explain shape plan
    select 
        nation,
        o_year,
        sum(amount) as sum_profit
    from
        (
            select
                /*+ leading(orders shuffle {lineitem shuffle part} shuffle {supplier broadcast nation} shuffle partsupp) */
                n_name as nation,
                extract(year from o_orderdate) as o_year,
                l_extendedprice * (1 - l_discount) - ps_supplycost * l_quantity as amount
            from
                part,
                supplier,
                lineitem,
                partsupp,
                orders,
                nation
            where
                s_suppkey = l_suppkey
                and ps_suppkey = l_suppkey
                and ps_partkey = l_partkey
                and p_partkey = l_partkey
                and o_orderkey = l_orderkey
                and s_nationkey = n_nationkey
                and p_name like '%green%'
        ) as profit
    group by
        nation,
        o_year
    order by
        nation,
        o_year desc;
```

**キーワードの意味**:

| キーワード | 役割 |
| --- | --- |
| `leading(...)` | テーブル間の相対的な JOIN 順序と全体の形状を制御する |
| `shuffle` | この JOIN で Shuffle 分散を使用するよう指定する |
| `broadcast` | この JOIN で Broadcast 分散を使用するよう指定する |
| `{ ... }` | 複数のテーブルを部分木にまとめ、JOIN の形状を決める |

**説明**: 二種類のヒントを組み合わせることで、JOIN 順序と JOIN 方式の両方を柔軟に制御でき、目的の実行計画を手動で指定しやすくなります。

:::caution 使用上の推奨事項
- `EXPLAIN` で実行計画を慎重に分析し、Leading Hint が期待どおりに機能していることを確認してください。
- Doris のバージョンアップ後や業務データの変化後には、Leading Hint の効果を再評価し、適宜記録して調整してください。
:::

## よくある質問

<!-- Knowledge type: troubleshooting -->
<!-- Applicable scenarios: the Hint does not take effect or behavior does not meet expectations -->

### Q1: ヒントが有効にならず、ヒントログの `UnUsed` または `SyntaxError` に内容が表示されるのはなぜですか？

- **よくある原因**: ヒント内のテーブル名やエイリアスのスペルミス、ヒントと SQL のテーブル数の不一致、または括弧の対応漏れです。
- **調査方法**: `Hint log` セクションを確認してください。このセクションは `EXPLAIN SHAPE PLAN` の出力末尾にあります。`UnUsed` または `SyntaxError` の行に表示された具体的なメッセージを調べてください。

### Q2: Leading Hint と Distribute Hint はどのような関係にありますか？

- `leading` は **どのテーブルを先に JOIN するか、および結果の形状**を決め、`shuffle` / `broadcast` は **各 JOIN の組で使用するデータ分散方式**を決めます。
- それぞれ単独でも、[ケース 6](#case-6-mixing-distribute-hint-with-leading-hint) のように組み合わせても使用できます。

### Q3: Leading Hint でサブクエリを分割できないのはなぜですか？

- サブクエリまたはビューは、エイリアスを通じて **一つのノード**として `leading` の順序指定に参加します。[ケース 5](#case-5-view--subquery-participating-in-the-join-as-a-whole) を参照してください。
- サブクエリ内のテーブルの順序も指定する必要がある場合は、そのサブクエリ内に別の `leading` ヒントを記述してください。

### Q4: Leading Hint を使用すべきでないのはどのような場合ですか？

- オプティマイザが自動選択した実行計画がすでに最適な場合。
- 業務データが頻繁に変化して統計情報が安定しない場合。ヒントで計画を固定すると、かえって性能が低下することがあります。

## まとめ

<!-- Knowledge type: concept -->
<!-- Applicable scenarios: deciding whether to adopt Leading Hint -->

- **Leading Hint** は、JOIN の順序と形状（左深木 / 右深木 / Bushy ツリー）を手動で制御するために使用します。
- **Shuffle / Broadcast ヒントと組み合わせることもでき**、順序と分散方式を同時に制御できます。
- **慎重に使用してください**: クエリの特性とデータ分布を十分に理解したうえで適用し、バージョンやデータの変化に応じて定期的に見直してください。
