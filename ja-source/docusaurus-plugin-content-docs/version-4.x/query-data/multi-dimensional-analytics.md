---
{
  "title": "多次元分析",
  "description": "データベースにおいて、ROLLUP、CUBE、およびGROUPING SETSは、多次元データ集約に使用される高度なSQL文です。",
  "language": "ja"
}
---
データベースにおいて、ROLLUP、CUBE、GROUPING SETSは多次元データ集約に使用される高度なSQL文です。これらの機能はGROUP BY句の機能を大幅に拡張し、単一のクエリで複数レベルの集計結果を取得することを可能にします。これは、UNION ALLを使用して複数の集約文を接続することと意味的に等価です。

- **ROLLUP**: ROLLUPは階層的な集計を生成するために使用される操作です。指定された列の順序に従ってデータを集約し、最も細かい粒度から最高レベルまで段階的に集計します。例えば、売上データにおいて、ROLLUPを使用して地域と時間で集計することで、月ごとの各地域の売上、各地域の合計売上、全体の合計売上を提供できます。ROLLUPは段階的な集計が必要なシナリオに適しています。

- **CUBE**: CUBEはより強力な集約操作で、可能なすべての集計の組み合わせを生成します。ROLLUPとは異なり、CUBEはすべての次元のサブセットを計算します。例えば、製品と地域で集約された売上データの場合、CUBEは各地域の各製品の売上、各製品の合計売上、各地域の合計売上、全体の合計売上を計算します。CUBEは、ビジネス分析や市場調査など、包括的な多次元分析が必要なシナリオに適用できます。

- **GROUPING SETS**: GROUPING SETSは特定のグループ化セットを集約する柔軟性を提供します。ROLLUPやCUBEのようにすべての可能な組み合わせを生成するのではなく、ユーザーが独立した集約のための列の組み合わせセットを指定することを可能にします。例えば、各次元のすべての組み合わせを必要とせず、地域と時間の特定の組み合わせに対する集計を定義できます。GROUPING SETSはカスタマイズされた集計が必要なシナリオに適しており、柔軟な集約制御を提供します。

ROLLUP、CUBE、GROUPING SETSは強力な多次元データ集計機能を提供し、様々なデータ分析とレポート作成のニーズに対応し、複雑な集約計算をより簡単かつ効率的にします。以下のセクションでは、これらの機能の使用シナリオ、構文、例について詳しく説明します。

## ROLLUP

### 使用例

ROLLUPは時間、地理、カテゴリなどの階層次元に沿ってデータを集計する場合に特に有用です。例えば、クエリでは`ROLLUP(year, month, day)`や`(country, Province, city)`を指定できます。

### 構文と例

ROLLUPの構文は以下の通りです：

```sql
SELECT … GROUP BY ROLLUP(grouping_column_reference_list)
```
年月別の売上合計を分析するクエリの例を以下に示します：

```sql
SELECT  
        YEAR(d_date),  
        MONTH(d_date),  
        SUM(ss_net_paid) AS total_sum  
FROM  
        store_sales,  
        date_dim d1  
WHERE  
        d1.d_date_sk = ss_sold_date_sk  
        AND YEAR(d_date) IN (2001, 2002)  
        AND MONTH(d_date) IN (1, 2, 3)  
GROUP BY  
        ROLLUP(YEAR(d_date), MONTH(d_date))  
ORDER BY  
        YEAR(d_date), MONTH(d_date);
```
このクエリは時間別にデータを集計し、年別の売上小計、各年内の月別売上、および売上総計を算出します。クエリ結果は以下の通りです：

```sql
+--------------+---------------+-------------+  
| YEAR(d_date) | MONTH(d_date) | total_sum   |  
+--------------+---------------+-------------+  
|         NULL |          NULL | 54262669.17 |  
|         2001 |          NULL | 26640320.46 |  
|         2001 |             1 |  9982165.83 |  
|         2001 |             2 |  8454915.34 |  
|         2001 |             3 |  8203239.29 |  
|         2002 |          NULL | 27622348.71 |  
|         2002 |             1 | 11260654.35 |  
|         2002 |             2 |  7722750.61 |  
|         2002 |             3 |  8638943.75 |  
+--------------+---------------+-------------+  
9 rows in set (0.08 sec)
```
## CUBE

### 使用例

CUBEは、単一次元の異なるレベルを表す列ではなく、複数の独立した次元からの列を含むクエリに最も適しています。例えば、一般的な使用シナリオは、月、地域、商品のすべての組み合わせを要約することです。これらは3つの独立した次元であり、可能なすべての小計の組み合わせを分析することは一般的です。対照的に、年、月、日のすべての可能な組み合わせをクロス集計すると、時間次元の自然な階層のため、いくつかの不要な値が含まれることになります。ほとんどの分析では、月と日で計算される利益などの小計は不要です。「年間を通じて各月の16日の売上合計はいくらですか？」と質問する必要があるユーザーは比較的少数です。

### 構文と例

CUBEの構文は以下のとおりです：

```sql
SELECT … GROUP BY CUBE(grouping_column_reference_list)
```
使用例:

```sql
SELECT  
        YEAR(d_date),  
        i_category,  
        ca_state,  
        SUM(ss_net_paid) AS total_sum  
FROM  
        store_sales,  
        date_dim d1,  
        item,  
        customer_address ca   
WHERE  
        d1.d_date_sk = ss_sold_date_sk  
        AND i_item_sk = ss_item_sk  
        AND ss_addr_sk = ca_address_sk  
        AND i_category IN ("Books", "Electronics")  
        AND YEAR(d_date) IN (1998, 1999)  
        AND ca_state IN ("LA", "AK")  
GROUP BY CUBE(YEAR(d_date), i_category, ca_state)  
ORDER BY YEAR(d_date), i_category, ca_state;
```
クエリ結果は以下の通りで、次の計算を行います：

- 売上の総合計；

- 年別、商品カテゴリ別、州別の売上小計；

- 各年内での商品カテゴリ別売上小計、各商品の州別売上小計、各年内での州別売上小計、および各州と年内での商品カテゴリ別売上小計。

```sql
+--------------+-------------+----------+------------+  
| YEAR(d_date) | i_category  | ca_state | total_sum  |  
+--------------+-------------+----------+------------+  
|         NULL | NULL        | NULL     | 8690374.60 |  
|         NULL | NULL        | AK       | 2675198.33 |  
|         NULL | NULL        | LA       | 6015176.27 |  
|         NULL | Books       | NULL     | 4238177.69 |  
|         NULL | Books       | AK       | 1310791.36 |  
|         NULL | Books       | LA       | 2927386.33 |  
|         NULL | Electronics | NULL     | 4452196.91 |  
|         NULL | Electronics | AK       | 1364406.97 |  
|         NULL | Electronics | LA       | 3087789.94 |  
|         1998 | NULL        | NULL     | 4369656.14 |  
|         1998 | NULL        | AK       | 1402539.19 |  
|         1998 | NULL        | LA       | 2967116.95 |  
|         1998 | Books       | NULL     | 2213703.82 |  
|         1998 | Books       | AK       |  719911.29 |  
|         1998 | Books       | LA       | 1493792.53 |  
|         1998 | Electronics | NULL     | 2155952.32 |  
|         1998 | Electronics | AK       |  682627.90 |  
|         1998 | Electronics | LA       | 1473324.42 |  
|         1999 | NULL        | NULL     | 4320718.46 |  
|         1999 | NULL        | AK       | 1272659.14 |  
|         1999 | NULL        | LA       | 3048059.32 |  
|         1999 | Books       | NULL     | 2024473.87 |  
|         1999 | Books       | AK       |  590880.07 |  
|         1999 | Books       | LA       | 1433593.80 |  
|         1999 | Electronics | NULL     | 2296244.59 |  
|         1999 | Electronics | AK       |  681779.07 |  
|         1999 | Electronics | LA       | 1614465.52 |  
+--------------+-------------+----------+------------+  
27 rows in set (0.21 sec)
```
## GROUPING FUNCTION

このセクションでは、ROLLUPとCUBEを使用する際の2つの課題に対処する方法を紹介します：

1. 結果セット内のどの行が小計を表すかをプログラム的に識別し、特定の小計に対応する集約レベルを正確に決定する方法。小計は総計に対する割合などの計算でよく必要になるため、これらの小計行を識別する便利な方法が必要です。

2. クエリ結果に実際に格納されたNULL値とROLLUPまたはCUBE操作によって生成された「NULL」値の両方が含まれる場合、別の問題が発生します：これら2種類のNULL値をどのように区別するかです。

GROUPING、GROUPING_ID、およびGROUPING SETSは、前述の課題を効果的に解決できます。

### GROUPING

**1. 原理**

GROUPINGは単一の列をパラメータとして使用し、ROLLUPまたはCUBE操作によって作成されたNULL値に遭遇した場合は1を返し、その行が小計であることを示します。その他の種類の値（Tableデータに本来存在するNULLを含む）は0を返します。

例：

```sql
select  
        year(d_date),  
        month(d_date),  
        sum(ss_net_paid) as total_sum,  
        grouping(year(d_date)),  
        grouping(month(d_date))  
from  
        store_sales,  
        date_dim d1  
where  
        d1.d_date_sk = ss_sold_date_sk  
        and year(d_date) in (2001, 2002)  
        and month(d_date) in (1, 2, 3)  
group by  
        rollup(year(d_date), month(d_date))  
order by  
        year(d_date), month(d_date);
```
- (YEAR(d_date), MONTH(d_date))グループのGROUPING関数の結果は、年と月による集計の場合(0,0)です。

- (YEAR(d_date))グループのGROUPING関数の結果は、年による集計の場合(0,1)です。

- ()グループのGROUPING関数の結果は、全体集計の場合(1,1)です。

クエリ結果:

```Plain
+--------------+---------------+-------------+------------------------+-------------------------+  
| year(d_date) | month(d_date) | total_sum   | Grouping(year(d_date)) | Grouping(month(d_date)) |  
+--------------+---------------+-------------+------------------------+-------------------------+  
|         NULL |          NULL | 54262669.17 |                      1 |                       1 |  
|         2001 |          NULL | 26640320.46 |                      0 |                       1 |  
|         2001 |             1 |  9982165.83 |                      0 |                       0 |  
|         2001 |             2 |  8454915.34 |                      0 |                       0 |  
|         2001 |             3 |  8203239.29 |                      0 |                       0 |  
|         2002 |          NULL | 27622348.71 |                      0 |                       1 |  
|         2002 |             1 | 11260654.35 |                      0 |                       0 |  
|         2002 |             2 |  7722750.61 |                      0 |                       0 |  
|         2002 |             3 |  8638943.75 |                      0 |                       0 |  
+--------------+---------------+-------------+------------------------+-------------------------+  
9 rows in set (0.06 sec)
```
**2. 使用シナリオ、構文、および例**

GROUPING関数は結果をフィルタリングするために使用できます。例：

```sql
select
        year(d_date),
        i_category,
        ca_state,
        sum(ss_net_paid) as total_sum
from
        store_sales,
        date_dim d1,
        item,
        customer_address ca 
where
        d1.d_date_sk = ss_sold_date_sk
        and i_item_sk = ss_item_sk
        and ss_addr_sk=ca_address_sk
        and i_category in ("Books", "Electronics")
        and year(d_date) in(1998, 1999)
        and ca_state in ("LA", "AK")
group by cube(year(d_date), i_category, ca_state)
having grouping(year(d_date))=1 and grouping(i_category)=1 and grouping(ca_state)=1
or grouping(year(d_date))=0 and grouping(i_category)=1 and grouping(ca_state)=1
or grouping(year(d_date))=1 and grouping(i_category)=1 and grouping(ca_state)=0
order by year(d_date), i_category, ca_state;   
```
HAVING句でGROUPING関数を使用することで、総売上、年別に集計された売上、および地域別に集計された売上のみが保持されます。クエリ結果:

```Plain
+---------------------+------------+----------+------------+  
| year(`d1`.`d_date`) | i_category | ca_state | total_sum  |  
+---------------------+------------+----------+------------+  
|                NULL | NULL       | NULL     | 8690374.60 |  
|                NULL | NULL       | AK       | 2675198.33 |  
|                NULL | NULL       | LA       | 6015176.27 |  
|                1998 | NULL       | NULL     | 4369656.14 |  
|                1999 | NULL       | NULL     | 4320718.46 |  
+---------------------+------------+----------+------------+  
5 rows in set (0.13 sec)
```
GROUPING関数をIF関数と組み合わせて使用することで、クエリの可読性を向上させることもできます。例：

```sql
select  
        if(grouping(year(d_date)) = 1, "Multi-year sum", year(d_date)) as year,  
        if(grouping(i_category) = 1, "Multi-category sum", i_category) as category,  
        sum(ss_net_paid) as total_sum  
from  
        store_sales,  
        date_dim d1,  
        item,  
        customer_address ca  
where  
        d1.d_date_sk = ss_sold_date_sk  
        and i_item_sk = ss_item_sk  
        and ss_addr_sk = ca_address_sk  
        and i_category in ("Books", "Electronics")  
        and year(d_date) in (1998, 1999)  
        and ca_state in ("LA", "AK")  
group by cube(year(d_date), i_category)
```
クエリ結果：

```sql
+----------------+--------------------+------------+  
| year           | category           | total_sum  |  
+----------------+--------------------+------------+  
| 1998           | Books              | 2213703.82 |  
| 1998           | Electronics        | 2155952.32 |  
| 1999           | Electronics        | 2296244.59 |  
| 1999           | Books              | 2024473.87 |  
| 1998           | Multi-category sum | 4369656.14 |  
| 1999           | Multi-category sum | 4320718.46 |  
| Multi-year sum | Books              | 4238177.69 |  
| Multi-year sum | Electronics        | 4452196.91 |  
| Multi-year sum | Multi-category sum | 8690374.60 |  
+----------------+--------------------+------------+  
9 rows in set (0.09 sec)
```
### GROUPING_ID

**1. 使用シナリオ**

データベースにおいて、GROUPING_IDとGROUPING関数は両方とも、ROLLUPやCUBEなどの多次元データ集約クエリを処理するための補助関数として機能し、ユーザーが異なるレベルの集約結果を区別するのに役立ちます。特定の行の集約レベルを判定したい場合は、GROUPING関数を使用してすべてのGROUP BY列を計算する必要があります。単一列の計算結果だけでは不十分だからです。

GROUPING_ID関数は、複数の列を同時に検出できるため、GROUPINGよりも強力です。GROUPING_ID関数は複数の列をパラメータとして受け取り、バイナリビットを通じてこれらの列の集約状態を表す整数を返します。Tableやマテリアライズドビューを使用して計算結果を格納する場合、GROUPINGを使用して異なるレベルの集約を表すと、相当なストレージ容量を消費する可能性があります。このようなシナリオでは、GROUPING_IDの方が適切です。

CUBE(a, b)を例に取ると、そのGROUPING_IDは以下のように表現できます：

| Aggregation Level | Bit Vector | GROUPING_ID | GROUPING(a) | GROUPING(b) |
| ----------------- | ---------- | ----------- | ----------- | ----------- |
| a,b               | 0 0        | 0           | 0           | 0           |
| a                 | 0 1        | 1           | 0           | 1           |
| b                 | 1 0        | 2           | 1           | 0           |
| Grand Total       | 1 1        | 3           | 1           | 1           |

**2. 構文と例**

以下はSQLクエリの例です：

```sql
SELECT    
    year(d_date),    
    i_category,    
    SUM(ss_net_paid) AS total_sum,    
    GROUPING(year(d_date)),    
    GROUPING(i_category),    
    GROUPING_ID(year(d_date), i_category)    
FROM    
    store_sales,    
    date_dim d1,    
    item,    
    customer_address ca     
WHERE    
    d1.d_date_sk = ss_sold_date_sk    
    AND i_item_sk = ss_item_sk    
    AND ss_addr_sk = ca_address_sk    
    AND i_category IN ('Books', 'Electronics')    
    AND year(d_date) IN (1998, 1999)    
    AND ca_state IN ('LA', 'AK')    
GROUP BY CUBE(year(d_date), i_category);
```
クエリ結果は以下の通りです：

```sql
+--------------+-------------+------------+------------------------+----------------------+---------------------------------------+    
| year(d_date) | i_category  | total_sum  | GROUPING(year(d_date)) | GROUPING(i_category) | GROUPING_ID(year(d_date), i_category) |    
+--------------+-------------+------------+------------------------+----------------------+---------------------------------------+    
| 1998         | Electronics | 2155952.32 | 0                      | 0                    | 0                                     |    
| 1998         | Books       | 2213703.82 | 0                      | 0                    | 0                                     |    
| 1999         | Electronics | 2296244.59 | 0                      | 0                    | 0                                     |    
| 1999         | Books       | 2024473.87 | 0                      | 0                    | 0                                     |    
| 1998         | NULL        | 4369656.14 | 0                      | 1                    | 1                                     |    
| 1999         | NULL        | 4320718.46 | 0                      | 1                    | 1                                     |    
| NULL         | Electronics | 4452196.91 | 1                      | 0                    | 2                                     |    
| NULL         | Books       | 4238177.69 | 1                      | 0                    | 2                                     |    
| NULL         | NULL        | 8690374.60 | 1                      | 1                    | 3                                     |    
+--------------+-------------+------------+------------------------+----------------------+---------------------------------------+    
9 rows in set (0.12 sec)
```
### GROUPING SETS

**1. 使用シナリオ**

作成するグループセットを選択的に指定する必要がある場合、`GROUP BY`句で`GROUPING SETS`式を使用できます。この方法により、ユーザーは完全なCUBEを計算することなく、複数の次元にわたって正確に指定することができます。

CUBEクエリは通常大きなリソースを消費するため、少数の次元のみが対象の場合、`GROUPING SETS`を使用することでクエリ実行効率を向上させることができます。

**2. 構文と例**

`GROUPING SETS`の構文は以下の通りです：

```sql
SELECT … GROUP BY GROUPING SETS(grouping_column_reference_list)
```
以下が必要な場合：

- 年ごとの各製品カテゴリの売上小計

- 年ごとの各州の売上小計

- 年ごとの各州における各製品の売上小計

`GROUPING SETS`を使用してこれらのディメンションを指定し、集計を実行できます。以下に例を示します：

```sql
SELECT  
    YEAR(d_date),  
    i_category,  
    ca_state,  
    SUM(ss_net_paid) AS total_sum  
FROM  
    store_sales,  
    date_dim d1,  
    item,  
    customer_address ca   
WHERE  
    d1.d_date_sk = ss_sold_date_sk  
    AND i_item_sk = ss_item_sk  
    AND ss_addr_sk = ca_address_sk  
    AND i_category IN ('Books', 'Electronics')  
    AND YEAR(d_date) IN (1998, 1999)  
    AND ca_state IN ('LA', 'AK')  
GROUP BY GROUPING SETS(  
    (YEAR(d_date), i_category),   
    (YEAR(d_date), ca_state),   
    (YEAR(d_date), ca_state, i_category)  
)  
ORDER BY YEAR(d_date), i_category, ca_state;
```
クエリ結果:

```sql
+--------------+-------------+----------+------------+  
| YEAR(d_date) | i_category  | ca_state | total_sum  |  
+--------------+-------------+----------+------------+  
| 1998         | NULL        | AK       | 1402539.19 |  
| 1998         | NULL        | LA       | 2967116.95 |  
| 1998         | Books       | NULL     | 2213703.82 |  
| 1998         | Books       | AK       |  719911.29 |  
| 1998         | Books       | LA       | 1493792.53 |  
| 1998         | Electronics | NULL     | 2155952.32 |  
| 1998         | Electronics | AK       |  682627.90 |  
| 1998         | Electronics | LA       | 1473324.42 |  
| 1999         | NULL        | AK       | 1272659.14 |  
| 1999         | NULL        | LA       | 3048059.32 |  
| 1999         | Books       | NULL     | 2024473.87 |  
| 1999         | Books       | AK       |  590880.07 |  
| 1999         | Books       | LA       | 1433593.80 |  
| 1999         | Electronics | NULL     | 2296244.59 |  
| 1999         | Electronics | AK       |  681779.07 |  
| 1999         | Electronics | LA       | 1614465.52 |  
+--------------+-------------+----------+------------+  
16 rows in set (0.11 sec)
```
上記のアプローチはCUBEを使用することと同等ですが、具体的な`grouping_id`を指定することで、不要な計算を削減します：

```sql
SELECT  
    SUM(ss_net_paid) AS total_sum,  
    YEAR(d_date),  
    i_category,  
    ca_state  
FROM  
    store_sales,  
    date_dim d1,  
    item,  
    customer_address ca   
WHERE  
    d1.d_date_sk = ss_sold_date_sk  
    AND i_item_sk = ss_item_sk  
    AND ss_addr_sk = ca_address_sk  
    AND i_category IN ('Books', 'Electronics')  
    AND YEAR(d_date) IN (1998, 1999)  
    AND ca_state IN ('LA', 'AK')  
GROUP BY CUBE(YEAR(d_date), ca_state, i_category)  
HAVING grouping_id(YEAR(d_date), ca_state, i_category) = 0  
    OR grouping_id(YEAR(d_date), ca_state, i_category) = 2   
    OR grouping_id(YEAR(d_date), ca_state, i_category) = 1;
```
:::info Note

`CUBE`を使用すると、すべての可能な集約レベル（この場合は8つ）が計算されますが、実際には、それらのうちいくつかにのみ興味がある場合があります。

:::

**3. セマンティック等価性**

- GROUPING SETS vs. GROUP BY UNION ALL

  `GROUPING SETS`ステートメント：

  ```sql
  SELECT k1, k2, SUM(k3) FROM t GROUP BY GROUPING SETS ((k1, k2), (k1), (k2), ());
  ```
クエリ結果において、`UNION ALL` で接続された複数の `GROUP BY` クエリと同等です：

  ```sql
  SELECT k1, k2, SUM(k3) FROM t GROUP BY k1, k2  
  UNION ALL  
  SELECT k1, NULL, SUM(k3) FROM t GROUP BY k1  
  UNION ALL  
  SELECT NULL, k2, SUM(k3) FROM t GROUP BY k2  
  UNION ALL  
  SELECT NULL, NULL, SUM(k3) FROM t;
  ```
`UNION ALL`を使用すると、より長いクエリになり、ベースTableの複数回のスキャンが必要になるため、記述と実行の両方において効率が劣ります。

- GROUPING SETS vs. ROLLUP

  `ROLLUP`は`GROUPING SETS`の拡張です。例えば：

  ```sql
  SELECT a, b, c, SUM(d) FROM tab1 GROUP BY ROLLUP(a, b, c);
  ```
この`ROLLUP`は以下の`GROUPING SETS`と同等です：

  ```sql
  GROUPING SETS (  
      (a, b, c),  
      (a, b),  
      (a),  
      ()  
  );
  ```
- GROUPING SETS vs. CUBE

  `CUBE(a, b, c)` は以下の `GROUPING SETS` と同等です：

  ```sql
  GROUPING SETS (  
      (a, b, c),  
      (a, b),  
      (a, c),  
      (a),  
      (b, c),  
      (b),  
      (c),  
      ()  
  );
  ```
## 付録

Table作成文とデータファイルについては、[Window ファンクション](window-function.md)の付録を参照してください。
