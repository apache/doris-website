---
{
  "title": "ディストリビュートヒント",
  "language": "ja",
  "description": "Distributeヒントは、結合におけるシャッフル方法を制御するために使用されます。"
}
---
## 概要

Distributeヒントは、結合のシャッフル方法を制御するために使用されます。

## 構文

- 右テーブルのDistribute タイプの指定をサポートしており、`[shuffle]`または`[broadcast]`のいずれかを指定でき、Joinの右テーブルの前に記述する必要があります。
- 任意の数のDistributeヒントをサポートしています。
- 正しくプランを生成できないDistributeヒントに遭遇した場合、システムはエラーを表示しません。ヒントの適用を最善の努力で行い、最終的なDistribute方法はEXPLAIN出力に表示されます。

## 例

**Orderedヒントとの組み合わせでの使用**

Join順序をテキストの順序に固定し、その後Joinに対して期待されるDistribute方法を指定します。例えば：

使用前：

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
使用後:

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
Explain Shape Planは、Distributeオペレーターに関連する情報を表示します。具体的には：

- `DistributionSpecReplicated`は、対応するデータがすべてのBEノードにレプリケートされることを示します。
- `DistributionSpecGather`は、データがFEノードに収集されることを示します。
- `DistributionSpecHash`は、特定のhashKeyとアルゴリズムに基づいて、データが異なるBEノードに分散されることを示します。

**Leading Hintとの組み合わせでの使用**

SQLクエリを記述する際、`LEADING`ヒントを使用しながら、各`JOIN`操作に対応する`DISTRIBUTE`メソッドを指定できます。以下は、SQLクエリで`Distribute Hint`と`Leading Hint`を組み合わせる方法を示す具体的な例です。

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
## 概要

Distributeヒントは、結合シャッフル方法を制御するために一般的に使用されるヒントであり、シャッフルまたはブロードキャスト配信方法の手動指定を可能にします。Distributeヒントの適切な使用により、結合シャッフル方法の現場チューニングニーズを満たすことができ、システム制御の柔軟性が向上します。
