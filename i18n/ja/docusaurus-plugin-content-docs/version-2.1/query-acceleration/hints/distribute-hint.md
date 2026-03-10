---
{
  "title": "ヒントを配布する",
  "language": "ja",
  "description": "Distributeヒントは、結合のシャッフル方法を制御するために使用されます。"
}
---
<!-- 
Apache Software Foundation (ASF) の下で一つまたは複数の貢献者ライセンス契約に基づいてライセンスされています。著作権所有権に関する追加情報については、この作品と一緒に配布される NOTICE ファイルを参照してください。ASF は、Apache License, Version 2.0 (「ライセンス」) の下でこのファイルをあなたにライセンスします。ライセンスに準拠する場合を除き、このファイルを使用することはできません。ライセンスのコピーは以下で入手できます

  http://www.apache.org/licenses/LICENSE-2.0

適用される法律で要求されるか書面で同意されない限り、ライセンスの下で配布されるソフトウェアは「現状のまま」ベースで配布され、明示的または黙示的を問わず、いかなる種類の保証または条件もありません。ライセンスの下での特定の言語による権限と制限については、ライセンスを参照してください。
-->

## 概要

Distribute hintはJoinのshuffle方法を制御するために使用されます。

## 構文

- 右側のテーブルに対してDistribute Typeの指定をサポートしており、`[shuffle]`または`[broadcast]`のいずれかを指定できます。Joinの右側のテーブルの前に記述する必要があります。
- 任意の数のDistribute Hintsをサポートします。
- 正しくプランを生成できないDistribute Hintに遭遇した場合、システムはエラーを表示しません。hintを適用するために最善の努力を行い、最終的なDistribute方法はEXPLAIN出力に表示されます。

## 例

**Ordered Hintとの組み合わせで使用**

Join順序をテキストの順序に固定し、その後Joinに期待するDistribute方法を指定します。例：

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
Explain Shape Planは、Distributeオペレータに関連する情報を表示します。具体的には：

- `DistributionSpecReplicated`は、対応するデータがすべてのBEノードに複製されることを示します。
- `DistributionSpecGather`は、データがFEノードに収集されることを示します。
- `DistributionSpecHash`は、特定のhashKeyとアルゴリズムに基づいてデータが異なるBEノードに分散されることを示します。
**Leading Hintとの組み合わせ使用**

SQLクエリを記述する際、`LEADING`ヒントを使用しながら、各`JOIN`操作に対して対応する`DISTRIBUTE`メソッドを指定できます。以下は、SQLクエリで`Distribute Hint`と`Leading Hint`を組み合わせる方法を示す具体的な例です。

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

Distributeヒントは、join shuffleメソッドを制御するために一般的に使用されるヒントで、shuffleまたはbroadcast distributionメソッドを手動で指定することができます。Distributeヒントを適切に使用することで、join shuffleメソッドの現場でのチューニングニーズを満たし、システム制御の柔軟性を高めることができます。
