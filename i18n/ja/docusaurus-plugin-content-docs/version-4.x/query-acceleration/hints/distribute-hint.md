---
title: Join のシャッフル方法を制御する Distribute Hint
language: ja
description: Distribute Hint を使用して Join のシャッフルまたはブロードキャストによる分散方法を指定し、クエリ性能を調整する方法。
keywords:
    - Distribute Hint
    - Join シャッフル
    - ブロードキャスト Join
    - Doris Hint
    - Join チューニング
    - 分散方法
---

<!-- Knowledge type: Feature description / Operation steps -->
<!-- Applicable scenarios: Join performance tuning / Forcing the distribution method -->

## 概要

Distribute Hint は、Join 操作における右側テーブルのデータの分散方法（シャッフル方法）を制御し、Join の実行プランを手動で調整する際によく使用します。分散方法を明示的に指定すると、オプティマイザによる自動選択が適切でない場合に、クエリの実行プランを柔軟に調整できます。

**主な機能:**

- Join の右側テーブルの分散方法として `shuffle` または `broadcast` を指定できます。
- Ordered Hint や Leading Hint と組み合わせることで、Join をさらに細かく調整できます。
- Hint を適用できない場合も、システムはベストエフォートで処理し、エラーを返しません。

## クイックナビゲーション

- [構文規則](#syntax-rules)
- [分散方法の説明](#distribution-method-description)
- [ユースケース](#use-cases)
    - [Ordered Hint との組み合わせ](#combined-with-ordered-hint)
    - [Leading Hint との組み合わせ](#combined-with-leading-hint)
- [よくある質問](#faq)

## 構文規則 {#syntax-rules}

| 規則 | 説明 |
| --- | --- |
| 記述位置 | Distribute Hint は Join の右側テーブルの前に記述します |
| 指定できる種類 | `[shuffle]` または `[broadcast]` |
| 指定数の上限 | Distribute Hint の指定数に制限はありません |
| 適用できない場合 | 対応するプランを生成できなくてもエラーは発生しません。Hint はベストエフォートで適用され、最終的な分散方法は EXPLAIN に表示された方法に従います |

## 分散方法の説明 {#distribution-method-description}

EXPLAIN Shape Plan には、Distribute オペレーターの分散タイプが表示されます。それぞれの意味は次のとおりです。

| 分散タイプ | 意味 |
| --- | --- |
| `DistributionSpecReplicated` | 対応するデータをすべての BE ノードに複製します（ブロードキャスト分散） |
| `DistributionSpecGather` | データを FE ノードに集約します |
| `DistributionSpecHash` | 特定の hashKey とアルゴリズムを使用し、データを異なる BE ノードに分散します（シャッフル分散） |

## ユースケース {#use-cases}

### Ordered Hint との組み合わせ {#combined-with-ordered-hint}

**利用場面**: まず Ordered Hint で Join の順序をクエリに記述された順序に固定し、次に Distribute Hint で各 Join の分散方法を指定します。

**適用前**（デフォルトのプラン）:

```sql
mysql> explain shape plan select count(*) from t1 join t2 on t1.c1 = t2.c2;
  +----------------------------------------------------------------------------------+
  | Explain String(Nereids Planner)                                                  |
  +----------------------------------------------------------------------------------+
  | PhysicalResultSink                                                               |
  | --hashAgg[GLOBAL]                                                                |
  | ----PhysicalDistribute[DistributionSpecGather]                                   |
  | ------hashAgg[LOCAL]                                                             |
  | --------PhysicalProject                                                          |
  | ----------hashJoin[INNER_JOIN] hashCondition=((t1.c1 = t2.c2)) otherCondition=() |
  | ------------PhysicalProject                                                      |
  | --------------PhysicalOlapScan[t1]                                               |
  | ------------PhysicalDistribute[DistributionSpecHash]                             |
  | --------------PhysicalProject                                                    |
  | ----------------PhysicalOlapScan[t2]                                             |
  +----------------------------------------------------------------------------------+
```

**適用後**（ブロードキャスト分散を指定）:

```sql
mysql> explain shape plan select /*+ ordered */ count(*) from t2 join[broadcast] t1 on t1.c1 = t2.c2;
+----------------------------------------------------------------------------------+
| Explain String(Nereids Planner)                                                  |
+----------------------------------------------------------------------------------+
| PhysicalResultSink                                                               |
| --hashAgg[GLOBAL]                                                                |
| ----PhysicalDistribute[DistributionSpecGather]                                   |
| ------hashAgg[LOCAL]                                                             |
| --------PhysicalProject                                                          |
| ----------hashJoin[INNER_JOIN] hashCondition=((t1.c1 = t2.c2)) otherCondition=() |
| ------------PhysicalProject                                                      |
| --------------PhysicalOlapScan[t2]                                               |
| ------------PhysicalDistribute[DistributionSpecReplicated]                       |
| --------------PhysicalProject                                                    |
| ----------------PhysicalOlapScan[t1]                                             |
|                                                                                  |
| Hint log:                                                                        |
| Used: ORDERED                                                                    |
| UnUsed:                                                                          |
| SyntaxError:                                                                     |
+----------------------------------------------------------------------------------+
```

`t1` の分散方法が `DistributionSpecHash` から `DistributionSpecReplicated` に変わっており、ブロードキャスト分散が適用されたことを示しています。

### Leading Hint との組み合わせ {#combined-with-leading-hint}

**利用場面**: `LEADING` Hint で Join の順序を固定しながら、対応する `DISTRIBUTE` 方法を各 `JOIN` 操作に指定し、実行プラン全体を制御します。

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

## よくある質問 {#faq}

**Q1: Distribute Hint の記述が誤っている場合や、対応するプランを生成できない場合はどうなりますか？**

システムはエラーを返さず、ベストエフォートで Hint の適用を試みます。最終的に Hint が適用されたかどうかは、`EXPLAIN` の出力に表示される Distribute オペレーターのタイプで判断します。

**Q2: `shuffle` と `broadcast` は、それぞれどのような場合に使用しますか？**

- `broadcast`: 右側テーブルのデータ量が少なく、すべての BE ノードに複製するコストがシャッフルのコストより低い場合に使用します。
- `shuffle`: 両方のテーブルのデータ量が多く、hashKey による再分散のほうが効率的な場合に使用します。

**Q3: 複数の Join の分散方法をまとめて指定できますか？**

はい。Distribute Hint の指定数に制限はありません。Ordered Hint や Leading Hint と組み合わせて、各 Join の分散方法を個別に指定できます。

## まとめ

Distribute Hint は、Join のシャッフル方法を制御するための一般的な Hint で、`shuffle` または `broadcast` による分散方法を手動で指定できます。適切に使用することで、Join のシャッフル方法を調整する要件に対応し、実行プランの制御をより柔軟に行えます。
