---
{
  "title": "サブクエリ",
  "language": "ja",
  "description": "サブクエリは、別のクエリ（通常はSELECT文）内にネストされたSQLクエリです。SELECT、FROM、WHERE内で使用できます。"
}
---
Subqueryは、別のクエリ（通常はSELECT文）内にネストされたSQLクエリです。外部クエリにデータや条件を提供するために、SELECT、FROM、WHERE、またはHAVING句で使用できます。Subqueryの使用により、SQLクエリはより柔軟で強力になり、単一のクエリ内でより複雑な問題を解決できるようになります。

Subqueryの重要な特徴は以下の通りです：

1. Subqueryの位置：SubqueryはWHERE句、HAVING句、FROM句などの複数のSQL句に配置できます。SELECT、UPDATE、INSERT、DELETE文、および式演算子（比較演算子=、>、<、<=、およびIN、EXISTSなど）と組み合わせて使用できます。

2. メインクエリとSubqueryの関係：Subqueryは別のクエリ内にネストされたクエリです。外側のクエリはメインクエリと呼ばれ、内側のクエリはSubqueryと呼ばれます。

3. 実行順序：Subqueryとメインクエリの間に相関関係がない場合、通常Subqueryが最初に実行されます。相関関係がある場合、パーサーは必要に応じてリアルタイムでどちらのクエリを最初に実行するかを決定し、それに応じてSubqueryの出力を使用します。

4. 括弧の使用：Subqueryは別のクエリ内にネストされていることを区別するために、括弧で囲む必要があります。

以下では、テーブルt1とt2および関連するSQLを使用して、Subqueryの基本的な特徴と使用方法を紹介します。テーブル作成文は以下の通りです：

```sql
create table t1
(
    c1 bigint, 
    c2 bigint
)
DISTRIBUTED BY HASH(c1) BUCKETS 3
PROPERTIES ("replication_num" = "1");

create table t2
(
    c1 bigint, 
    c2 bigint
)
DISTRIBUTED BY HASH(c1) BUCKETS 3
PROPERTIES ("replication_num" = "1");
```
## Subqueryの分類

### Subqueryが返すデータの特性に基づく分類

Subqueryは、返すデータの特性に基づいてスカラーSubqueryと非スカラーSubqueryに分類できます：

**1. スカラーSubquery**

常に単一の値を返すSubquery（本質的に1行1列のRelationと同等）。Subqueryがデータを返さない場合、NULL値を返します。スカラーSubqueryは理論的には、単一値式が許可される任意の場所に出現できます。

**2. 非スカラーSubquery**

Relationを返すSubquery（スカラーSubqueryの戻り値とは異なり、このRelationは複数の行と列を含むことができます）。Subqueryがデータを返さない場合、空のセット（0行）を返します。非スカラーSubqueryは理論的には、relation（集合）が許可される任意の場所に出現できます。

以下の例は、スカラーSubqueryと非スカラーSubqueryを示しています（括弧内の2つのSubqueryについて、t2が空のテーブルの場合、2つのSubqueryが返す結果は異なります）：

```sql
-- Scalar subquery, when t2 is an empty table, the subquery returns the scalar value null    
select * from t1 where t1.c1 > (select sum(t2.c1) from t2);    
    
-- Non-scalar subquery, when t2 is an empty table, the subquery returns an empty set (0 rows)    
select * from t1 where t1.c1 in (select t2.c1 from t2);
```
### サブクエリが外部クエリの列を参照するかどうかに基づく分類

サブクエリは、外部クエリの列を参照するかどうかに基づいて、相関サブクエリと非相関サブクエリに分類できます：

**1. 非相関サブクエリ**

外部クエリの列を一切参照しないサブクエリ。非相関サブクエリは多くの場合、独立して計算でき、外部クエリが使用するために対応する結果を一度返します。

**2. 相関サブクエリ**

メインクエリ（外部クエリとも呼ばれる）の1つ以上の列を参照するサブクエリ（参照される外部列は、多くの場合サブクエリのWHERE条件にあります）。相関サブクエリは、外部に関連付けられたテーブルに対するフィルタリング操作として見なすことができます。外部テーブルの各行のデータに対して、サブクエリが計算され、対応する結果を返すためです。

以下の例は、相関サブクエリと非相関サブクエリを説明しています：

```sql
-- Correlated subquery, the subquery internally uses the column t1.c2 from the outer table    
select * from t1 where t1.c1 in (select t2.c1 from t2 where t2.c2 = t1.c2);    
    
-- Non-correlated subquery, the subquery internally does not use any columns from the outer table t1    
select * from t1 where t1.c1 in (select t2.c1 from tt2);
```
## Dorisがサポートするサブクエリ

Dorisはすべての非相関サブクエリをサポートし、以下のように相関サブクエリを部分的にサポートしています：

- `WHERE`句と`HAVING`句での相関スカラーサブクエリをサポートします。

- `WHERE`句と`HAVING`句での相関`IN`、`NOT IN`、`EXISTS`、`NOT EXISTS`非スカラーサブクエリをサポートします。

- `SELECT`リストでの相関スカラーサブクエリをサポートします。

- ネストしたサブクエリについて、Dorisは直接の親クエリに相関するサブクエリのみをサポートし、親を超えた外側のクエリへのレベル間相関はサポートしていません。

## 相関サブクエリの制限

### 相関スカラーサブクエリの制限

- 相関条件は等価条件である必要があります。

- サブクエリの出力は、GROUP BY句を持たない単一の集約関数の結果である必要があります。

```sql
-- Single aggregate function without GROUP BY, supported    
select * from t1 where t1.c1 < (select max(t2.c1) from t2 where t1.c2 = t2.c2);    
    
-- Equivalent rewritten SQL as follows:    
select t1.* from t1 inner join (select t2.c2 as c2, max(t2.c1) as c1 from t2 group by t2.c2) tx on t1.c1 < tx.c1 and t1.c2 = tx.c2;    
    
-- Non-equality condition, not supported    
select * from t1 where t1.c1 = (select max(t2.c1) from t2 where t1.c2 > t2.c2);    
    
-- No aggregate function, not supported    
select * from t1 where t1.c1 = (select t2.c1 from t2 where t1.c2 = t2.c2);    
    
-- With aggregate function but includes GROUP BY, not supported    
select * from t1 where t1.c1 = (select max(t2.c1) from t2 where t1.c2 = t2.c2 group by t2.c2);
```
### 相関(NOT) EXISTSサブクエリの制限事項

- サブクエリにOFFSETとLIMITの両方を含めることはできません。

```sql
-- With LIMIT but no OFFSET, supported    
select * from t1 where exists (select t2.c1 from t2 where t1.c2 = t2.c2 limit 2);    
    
-- Equivalent rewritten SQL as follows:    
select * from t1 left semi join t2 on t1.c2 = t2.c2;    
    
-- With OFFSET and LIMIT, not supported    
select * from t1 where exists (select t2.c1 from t2 where t1.c2 = t2.c2 limit 2, 3);
```
### 相関(NOT) INサブクエリの制限事項

- サブクエリの出力は単一列である必要があります。

- サブクエリにLIMITを含めることはできません。

- サブクエリに集計関数やGROUP BY句を含めることはできません。

```sql
-- Supported subquery    
select * from t1 where t1.c1 in (select t2.c1 from t2 where t1.c2 = t2.c2);    
    
-- Equivalent rewritten SQL as follows:    
select * from t1 left semi join t2 on t1.c1 = t2.c1 and t1.c2 = t2.c2;    
    
-- Subquery output is multiple columns, not supported    
select * from t1 where (t1.a, t1.c) in (select t2.c1, t2.c from t2 where t1.c2 = t2.c2);    
    
-- Subquery with LIMIT, not supported    
select * from t1 where t1.c1 in (select t2.c1 from t2 where t1.c2 = t2.c2 limit 3);    
    
-- With GROUP BY clause, not supported    
select * from t1 where t1.c1 in (select t2.c1 from t2 where t1.c2 = t2.c2 group by t2.c1);    
    
-- With aggregate function, not supported    
select * from t1 where t1.c1 in (select sum(t2.c1) from t2 where t1.c2 = t2.c2);
```
### ネストしたサブクエリの制限事項

現在、直接の親クエリと直接関連するサブクエリのみがサポートされています。親クエリの外側の層との関連はサポートされていません。

以下の作成文を持つ別のテーブル `t3` があると仮定します：

```sql
create table t3  
(  
    c1 bigint,   
    c2 bigint  
)  
DISTRIBUTED BY HASH(c1) BUCKETS 3  
PROPERTIES ("replication_num" = "1");
```
- サブクエリが直接の親クエリからの列のみを使用する場合にサポートされます：

  ```sql
  select   
      t1.c1   
  from   
      t1   
  where not exists (  
      select   
          t2.c1   
      from   
          t2   
      where not exists (  
          select   
              t3.c1   
          from   
              t3   
          where   
              t3.c2 = t2.c2  
      ) and t2.c2 = t1.c2  
  );
  ```
- 最内部のサブクエリが直接の親クエリからのカラム `t2.c2` と最外部クエリからのカラム `t1.c1` の両方を使用する場合はサポートされません：

  ```sql
    select   
        t1.c1   
    from   
        t1   
    where not exists (  
        select   
            t2.c1   
        from   
            t2   
        where not exists (  
            select   
                t3.c1   
            from   
                t3   
            where   
                t3.c2 = t2.c2 and t3.c1 = t1.c1  
        )  
    );
    ```
## Mark Join

`where`条件において、`(not) in`や`(not) exists`を使用したサブクエリと他のフィルタリング条件で構成される`or`関係の句は、正しい結果を生成するために特別な処理が必要です。以下に例を示します：

```sql
select 
    t1.c1, 
    t1.c2 
from t1 
where exists (
    select 
        t2.c1 
    from t2 
    where 
        t1.c2 = t2.c2
    ) or t1.c1 > 0;
```
このSQLの`exists`句を`left semi join`を使って直接実装する場合、`left semi join`のセマンティクスに従って、`t1.c2 = t2.c2`を満たす`t1`の行のみが出力されます。しかし、実際には`t1.c1 > 0`という条件を満たす行も出力されるべきです。これを実現するために、`Mark Join`のメカニズムが導入されています。

:::info Note

`right semi join`も同様ですが、左右のテーブルが異なります。ここでは、`left semi join`を例として使用します。

:::

SQLの例は以下の通りです：

```sql
-- This SQL cannot be executed and is only for demonstration purposes    
select     
    tx.c1,     
    tx.c2     
from     
    (    
        select     
            t1.c1,     
            t1.c2,     
            mark_join_flag     
        from     
            t1 left (mark) semi join t2 on t1.c2 = t2.c2    
    ) tx    
where     
    tx.mark_join_flag or tx.c1 > 0;
```
`Mark Join`と通常の`left semi join`の違いは、通常の`left semi join`は条件を満たす左テーブルの行を直接出力するのに対し、`Mark Join`は元の左テーブルに追加のフラグ列（例では`mark_join_flag`）を付けて出力する点です。このフラグ列は`true`、`false`、または`null`の値を取ることができます。フラグの値は`join`条件式`t1.c2 = t2.c2`によって決定され、各行がフラグ値に対応します。フラグ値の計算は以下のテーブルに示されています：

| t1.c1 | t2.c1 | mark_join_flag |
| ----- | ----- | -------------- |
| 1     | 1     | TRUE           |
| 1     | 2     | FALSE          |
| 1     | NULL  | NULL           |
| NULL  | 1     | NULL           |
| NULL  | NULL  | NULL           |

このフラグを使用することで、`where`フィルタリング条件を`where mark_join_flag or t1.c1 > 0`として書き換えて、正しい結果を得ることができます。

## 使用上の注意

スカラーサブクエリの出力は単一の値である必要があるため、サブクエリが複数行のデータを返す場合、ランタイムエラーが報告されます。

### 相関スカラーサブクエリについて

相関量詞サブクエリを使用する際、相関条件を満たすサブクエリが複数行のデータを返す場合、ランタイムエラーが報告されます。

以下のSQL例を参照してください：

```sql
-- If there are more than 1 row in the t2 table that satisfies t1.c2 = t2.c2 in the associated scalar subquery, a runtime error will be reported
select t1.*, (select t2.c1 from t2 where t1.c2 = t2.c2) from t1;

-- Example error message
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT][E33] correlate scalar subquery must return only 1 row
```
### 非相関スカラサブクエリの場合

Dorisは実行時に`assert num rows`演算子を追加します。サブクエリが複数行のデータを返す場合、実行時エラーが報告されます。

以下のSQLの例を参照してください：

```sql
-- Non-correlated scalar subquery, will report an error if table t2 has more than 1 row of data    
select t1.*, (select t2.c1 from t2) from t1;    
  
-- Example error message    
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[CANCELLED]Expected EQ 1 to be returned by expression
```
