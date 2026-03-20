---
{
  "title": "多次元分析",
  "language": "ja",
  "description": "データベースにおいて、ROLLUP、CUBE、およびGROUPING SETSは多次元データ集計に使用される高度なSQL文です。"
}
---
データベースにおいて、ROLLUP、CUBE、およびGROUPING SETSは、多次元データ集計に使用される高度なSQL文です。これらの機能は、GROUP BY句の機能を大幅に拡張し、ユーザーが単一のクエリで複数レベルの要約結果を取得できるようにします。これは、UNION ALLを使用して複数の集計文を接続することと意味的に同等です。

- **ROLLUP**: ROLLUPは、階層的な要約を生成するために使用される操作です。指定された列の順序に従ってデータを集計し、最も細かい粒度から最高レベルまで段階的に要約します。例えば、売上データにおいて、ROLLUPは地域と時間で要約するために使用でき、月ごとの各地域の売上、各地域の総売上、および全体の総売上を提供します。ROLLUPは段階的な要約を必要とするシナリオに適しています。

- **CUBE**: CUBEは、すべての可能な要約の組み合わせを生成する、より強力な集計操作です。ROLLUPとは異なり、CUBEはすべての次元のサブセットを計算します。例えば、製品と地域で集計された売上データの場合、CUBEは各地域の各製品の売上、各製品の総売上、各地域の総売上、および全体の総売上を計算します。CUBEは、ビジネス分析や市場調査などの包括的な多次元分析を必要とするシナリオに適用できます。

- **GROUPING SETS**: GROUPING SETSは、特定のグループ化セットを集計する柔軟性を提供します。ROLLUPやCUBEのようにすべての可能な組み合わせを生成するのではなく、ユーザーが独立した集計のための列の組み合わせのセットを指定できます。例えば、各次元のすべての組み合わせを必要とせずに、地域と時間の特定の組み合わせの要約を定義できます。GROUPING SETSは、カスタマイズされた要約を必要とするシナリオに適しており、柔軟な集計制御を提供します。

ROLLUP、CUBE、およびGROUPING SETSは、強力な多次元データ要約機能を提供し、様々なデータ分析とレポートのニーズに対応し、複雑な集計計算をより簡単で効率的にします。以下のセクションでは、これらの機能の使用シナリオ、構文、および例について詳しく説明します。

## ROLLUP

### 使用例

ROLLUPは、時間、地理、カテゴリなどの階層的な次元に沿ってデータを要約するのに特に有用です。例えば、クエリは`ROLLUP(year, month, day)`や`(country, Province, city)`を指定できます。

### 構文と例

ROLLUPの構文は以下の通りです：

```sql
SELECT … GROUP BY ROLLUP(grouping_column_reference_list)
```
年と月ごとの売上合計を分析するクエリの例を以下に示します：

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
このクエリは時間でデータを要約し、年別の売上、各年内の月別売上、および売上の総合計の小計を計算します。クエリ結果は以下の通りです：

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

CUBEは、単一次元の異なるレベルを表す列ではなく、複数の独立した次元の列を含むクエリに最適です。たとえば、一般的な使用シナリオは、月、地域、および製品のすべての組み合わせを要約することです。これらは3つの独立した次元であり、すべての可能な小計の組み合わせを分析することは一般的です。対照的に、年、月、および日のすべての可能な組み合わせをクロス集計すると、時間次元の自然な階層により、いくつかの不要な値が含まれます。ほとんどの分析では、月と日で計算された利益などの小計は不要です。「年間を通じて各月の16日の総売上はいくらですか？」と問う必要があるユーザーは比較的少数です。

### 構文と例

CUBEの構文は以下の通りです：

```sql
SELECT … GROUP BY CUBE(grouping_column_reference_list)
```
使用例：

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
クエリ結果は以下の通りで、次を計算しています：

- 総売上合計；

- 年別、商品カテゴリ別、州別の売上小計；

- 各年内の商品カテゴリ別売上小計、各商品の州別売上小計、各年内の州別売上小計、および各州と年内の商品カテゴリ別売上小計。

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
## GROUPING関数

このセクションでは、ROLLUPとCUBEを使用する際の2つの課題に対処する方法を紹介します：

1. 結果セットのどの行が小計を表すかをプログラム的に識別し、特定の小計に対応する集計レベルを正確に判断する方法。小計は総計に対する割合などの計算でよく必要になるため、これらの小計行を識別する便利な方法が必要です。

2. クエリ結果に実際に格納されているNULL値とROLLUPまたはCUBE操作によって生成された「NULL」値の両方が含まれている場合、別の問題が生じます：これら2つの種類のNULL値を区別する方法。

GROUPING、GROUPING_ID、およびGROUPING SETSは、前述の課題を効果的に解決できます。

### GROUPING

**1. 原理**

GROUPINGは単一の列をパラメータとして使用し、ROLLUPまたはCUBE操作によって作成されたNULL値に遭遇した場合は1を返し、その行が小計であることを示します。その他の種類の値（テーブルデータに本来存在するNULLを含む）の場合は0を返します。

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

- ()グループのGROUPING関数の結果は、総計の集計の場合(1,1)です。

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
HAVING句でGROUPING関数を使用すると、総売上、年別に集計された売上、および地域別に集計された売上のみが保持されます。クエリ結果：

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
クエリ結果:

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

データベースにおいて、GROUPING_IDとGROUPING関数は両方とも、ROLLUPやCUBEなどの多次元データ集約クエリを処理するための補助関数として機能し、ユーザーが異なるレベルの集約結果を区別するのに役立ちます。特定の行の集約レベルを決定したい場合は、GROUPING関数を使用してすべてのGROUP BY列を計算する必要があります。単一列だけの計算結果では不十分だからです。

GROUPING_ID関数は、複数の列を同時に検出できるため、GROUPINGよりも強力です。GROUPING_ID関数は複数の列をパラメータとして受け取り、これらの列の集約状態をバイナリビットで表す整数を返します。テーブルやマテリアライズドビューを使用して計算結果を格納する場合、GROUPINGを使用して異なるレベルの集約を表現すると、かなりのストレージ容量を消費する可能性があります。そのようなシナリオでは、GROUPING_IDの方が適しています。

CUBE(a, b)を例に取ると、そのGROUPING_IDは以下のように表すことができます：

| 集約レベル | ビットベクトル | GROUPING_ID | GROUPING(a) | GROUPING(b) |
| ---------- | -------------- | ----------- | ----------- | ----------- |
| a,b        | 0 0            | 0           | 0           | 0           |
| a          | 0 1            | 1           | 0           | 1           |
| b          | 1 0            | 2           | 1           | 0           |
| Grand Total| 1 1            | 3           | 1           | 1           |

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

CUBEクエリは通常、大量のリソースを消費するため、少数の次元のみが対象となる場合、`GROUPING SETS`を使用することでクエリ実行効率を向上させることができます。

**2. 構文と例**

`GROUPING SETS`の構文は以下の通りです：

```sql
SELECT … GROUP BY GROUPING SETS(grouping_column_reference_list)
```
以下が必要な場合：

- 各商品カテゴリーの年間売上小計

- 各州の年間売上小計

- 各州の各商品の年間売上小計

これらの次元を指定して集約を実行するために`GROUPING SETS`を使用できます。以下に例を示します：

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

`CUBE`を使用すると、可能なすべての集約レベル（この場合は8つ）が計算されますが、実際にはそのうちのいくつかにのみ関心がある場合があります。

:::

**3. セマンティック等価**

- GROUPING SETS vs. GROUP BY UNION ALL

  `GROUPING SETS`ステートメント：

  ```sql
  SELECT k1, k2, SUM(k3) FROM t GROUP BY GROUPING SETS ((k1, k2), (k1), (k2), ());
  ```
クエリ結果において、`UNION ALL`で接続された複数の`GROUP BY`クエリと同等です：

  ```sql
  SELECT k1, k2, SUM(k3) FROM t GROUP BY k1, k2  
  UNION ALL  
  SELECT k1, NULL, SUM(k3) FROM t GROUP BY k1  
  UNION ALL  
  SELECT NULL, k2, SUM(k3) FROM t GROUP BY k2  
  UNION ALL  
  SELECT NULL, NULL, SUM(k3) FROM t;
  ```
`UNION ALL`を使用すると、クエリが長くなり、ベーステーブルの複数回のスキャンが必要になるため、記述と実行の両方において効率が劣ります。

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

  `CUBE(a, b, c)`は以下の`GROUPING SETS`と等価です：

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

テーブル作成文とデータファイルについては、[Window Function](window-function.md)の付録を参照してください。
