---
{
  "title": "スタースキーマベンチマーク",
  "language": "ja",
  "description": "Star Schema Benchmark（SSB）は、データウェアハウスシナリオにおける軽量なパフォーマンステストセットです。"
}
---
# Star Schema Benchmark

[Star Schema Benchmark(SSB)](https://www.cs.umb.edu/~poneil/StarSchemaB.PDF)は、データウェアハウスシナリオにおける軽量なパフォーマンステストセットです。SSBは[TPC-H](http://www.tpc.org/tpch/)に基づく簡素化されたスタースキーマデータを提供し、主にスタースキーマにおけるマルチテーブルJOINクエリのパフォーマンステストに使用されます。また、業界では通常SSBをワイドテーブルモデル（SSB flatと呼ばれる）に平坦化し、クエリエンジンのパフォーマンステストに使用しています。

本ドキュメントでは主に、SSB 1000Gテストセットにおけるのパフォーマンスを紹介します。

Apache Dorisバージョン2.0.15.1に基づき、SSB標準テストデータセットで13のクエリをテストしました。

## 1. ハードウェア環境

| ハードウェア | 構成説明 |
|--------------------|------------------------------------------|
| マシン数 | 4台のAliyun仮想マシン（1FE、3BEs） |
| CPU                | Intel Xeon (Ice Lake) Platinum 8369B 32C |
| メモリ             | 128G                                     |
| ディスク               | Enterprise SSD (PL0)                     |

## 2. ソフトウェア環境

- Doris 3BEsと1FEをデプロイ
- カーネルバージョン：Linux version 5.15.0-101-generic 
- OSバージョン：Ubuntu 20.04 LTS (Focal Fossa)
- Dorisソフトウェアバージョン：Apache Doris 2.0.15.1
- JDK：openjdk version "1.8.0_352-352"

## 3. テストデータ量

| SSBテーブル名 | 行数          | 注釈                       |
|:---------------|:--------------|:---------------------------------|
| lineorder      | 5,999,989,709 | 商品注文詳細          |
| customer       | 30,000,000    | 顧客情報             |
| part           | 2,000,000     | 部品情報                |
| supplier       | 2,000,000     | サプライヤー情報             |
| dates          | 2,556         | 日付                             |
| lineorder_flat | 5,999,989,709 | データ平坦化後のワイドテーブル |

## 4. SSB Flatテスト結果

ここではApache Doris 2.0.15.1を比較テストに使用します。テストでは、Query Time(ms)を主要なパフォーマンス指標として使用します。テスト結果は以下の通りです：

| Query     | Doris 2.0.15.1 (ms) |
|-----------|---------------------|
| q1.1      | 80                  |
| q1.2      | 10                  |
| q1.3      | 110                 |
| q2.1      | 1680                |
| q2.2      | 1210                |
| q2.3      | 1060                |
| q3.1      | 2010                |
| q3.2      | 1560                |
| q3.3      | 600                 |
| q3.4      | 10                  |
| q4.1      | 2380                |
| q4.2      | 190                 |
| q4.3      | 120                 |
| **合計** | **11020**           |


## 5. 標準SSBテスト結果

ここではApache Doris 2.0.15.1を比較テストに使用します。テストでは、Query Time(ms)を主要なパフォーマンス指標として使用します。テスト結果は以下の通りです：

| Query     | Doris 2.0.15.1 (ms) |
|-----------|---------------------|
| q1.1      | 330                 |
| q1.2      | 80                  |
| q1.3      | 80                  |
| q2.1      | 1780                |
| q2.2      | 1970                |
| q2.3      | 1510                |
| q3.1      | 4000                |
| q3.2      | 1720                |
| q3.3      | 1510                |
| q3.4      | 160                 |
| q4.1      | 4010                |
| q4.2      | 840                 |
| q4.3      | 400                 |
| **合計** | **19390**           |

## 6. 環境準備

まず[公式ドキュメント](../install/deploy-manually/separating-storage-compute-deploy-manually)を参照してApache Dorisをインストール・デプロイし、正常に動作するDorisクラスター（少なくとも1 FE 1 BEを含む、1 FE 3 BEsが推奨）を取得してください。

## 7. データ準備

### 7.1 SSBデータ生成ツールのダウンロードとインストール

以下のスクリプトを実行して、[ssb-tools](https://github.com/apache/doris/tree/master/tools/ssb-tools)ツールをダウンロードし、コンパイルします。

```shell
sh bin/build-ssb-dbgen.sh
```
インストールが成功すると、`dbgen`バイナリが`ssb-dbgen/`ディレクトリ下に生成されます。

### 7.2 SSBテストセットの生成

以下のスクリプトを実行してSSBデータセットを生成します：

```shell
sh bin/gen-ssb-data.sh -s 1000
```
> 注意1: `sh gen-ssb-data.sh -h`でスクリプトのヘルプを確認してください。
>
> 注意2: データは`ssb-data/`ディレクトリ配下に`.tbl`という拡張子で生成されます。合計ファイルサイズは約600GBで、生成には数分から1時間程度かかる場合があります。
>
> 注意3: デフォルトでは100Gの標準テストデータセットが生成されます。

### 7.3 テーブルの作成

#### 7.3.1 `doris-cluster.conf`ファイルの準備

スクリプトをインポートする前に、`doris-cluster.conf`ファイルにFEのIPポートやその他の情報を記述する必要があります。

ファイルは`${DORIS_HOME}/tools/ssb-tools/conf/`配下に配置されています。

ファイルの内容には、FEのIP、HTTPポート、ユーザー名、パスワード、およびインポートするデータのDB名が含まれます：

```shell
# Any of FE host
export FE_HOST='127.0.0.1'
# http_port in fe.conf
export FE_HTTP_PORT=8030
# query_port in fe.conf
export FE_QUERY_PORT=9030
# Doris username
export USER='root'
# Doris password
export PASSWORD=''
# The database where SSB tables located
export DB='ssb'
```
#### 7.3.2 以下のスクリプトを実行してSSBテーブルを生成・作成する:

```shell
sh bin/create-ssb-tables.sh -s 1000
```
または、[create-ssb-tables.sql](https://github.com/apache/doris/blob/master/tools/ssb-tools/ddl/create-ssb-tables-sf1000.sql) と [create-ssb-flat-table.sql](https://github.com/apache/doris/blob/master/tools/ssb-tools/ddl/create-ssb-flat-tables-sf1000.sql) のテーブル作成文をコピーして、MySQLクライアントで実行してください。

### 7.4 データのインポート

以下のコマンドを使用して、SSBテストセットの全データインポートとSSB FLATワイドテーブルデータの合成を完了し、テーブルにインポートします。

```shell
 sh bin/load-ssb-data.sh
```
### 7.5 インポートされたデータの確認

```sql
select count(*) from part;
select count(*) from customer;
select count(*) from supplier;
select count(*) from dates;
select count(*) from lineorder;
select count(*) from lineorder_flat;
```
### 7.6 Query Test

- SSB-Flat Query Statement: [ ssb-flat-queries](https://github.com/apache/doris/tree/master/tools/ssb-tools/ssb-flat-queries)
- Standard SSB Queries: [ ssb-queries](https://github.com/apache/doris/tree/master/tools/ssb-tools/ssb-queries)

#### 7.6.1 SQLのSSB FLATテスト

```sql
--Q1.1
SELECT SUM(LO_EXTENDEDPRICE * LO_DISCOUNT) AS revenue
FROM lineorder_flat
WHERE
    LO_ORDERDATE >= 19930101
    AND LO_ORDERDATE <= 19931231
    AND LO_DISCOUNT BETWEEN 1 AND 3
    AND LO_QUANTITY < 25;

--Q1.2
SELECT SUM(LO_EXTENDEDPRICE * LO_DISCOUNT) AS revenue
FROM lineorder_flat
WHERE
    LO_ORDERDATE >= 19940101
  AND LO_ORDERDATE <= 19940131
  AND LO_DISCOUNT BETWEEN 4 AND 6
  AND LO_QUANTITY BETWEEN 26 AND 35;

--Q1.3
SELECT SUM(LO_EXTENDEDPRICE * LO_DISCOUNT) AS revenue
FROM lineorder_flat
WHERE
    weekofyear(LO_ORDERDATE) = 6
  AND LO_ORDERDATE >= 19940101
  AND LO_ORDERDATE <= 19941231
  AND LO_DISCOUNT BETWEEN 5 AND 7
  AND LO_QUANTITY BETWEEN 26 AND 35;

--Q2.1
SELECT
    SUM(LO_REVENUE), (LO_ORDERDATE DIV 10000) AS YEAR,
    P_BRAND
FROM lineorder_flat
WHERE P_CATEGORY = 'MFGR#12' AND S_REGION = 'AMERICA'
GROUP BY YEAR, P_BRAND
ORDER BY YEAR, P_BRAND;

--Q2.2
SELECT
    SUM(LO_REVENUE), (LO_ORDERDATE DIV 10000) AS YEAR,
    P_BRAND
FROM lineorder_flat
WHERE
    P_BRAND >= 'MFGR#2221'
  AND P_BRAND <= 'MFGR#2228'
  AND S_REGION = 'ASIA'
GROUP BY YEAR, P_BRAND
ORDER BY YEAR, P_BRAND;

--Q2.3
SELECT
    SUM(LO_REVENUE), (LO_ORDERDATE DIV 10000) AS YEAR,
    P_BRAND
FROM lineorder_flat
WHERE
    P_BRAND = 'MFGR#2239'
  AND S_REGION = 'EUROPE'
GROUP BY YEAR, P_BRAND
ORDER BY YEAR, P_BRAND;

--Q3.1
SELECT
    C_NATION,
    S_NATION, (LO_ORDERDATE DIV 10000) AS YEAR,
    SUM(LO_REVENUE) AS revenue
FROM lineorder_flat
WHERE
    C_REGION = 'ASIA'
  AND S_REGION = 'ASIA'
  AND LO_ORDERDATE >= 19920101
  AND LO_ORDERDATE <= 19971231
GROUP BY C_NATION, S_NATION, YEAR
ORDER BY YEAR ASC, revenue DESC;

--Q3.2
SELECT
    C_CITY,
    S_CITY, (LO_ORDERDATE DIV 10000) AS YEAR,
    SUM(LO_REVENUE) AS revenue
FROM lineorder_flat
WHERE
    C_NATION = 'UNITED STATES'
  AND S_NATION = 'UNITED STATES'
  AND LO_ORDERDATE >= 19920101
  AND LO_ORDERDATE <= 19971231
GROUP BY C_CITY, S_CITY, YEAR
ORDER BY YEAR ASC, revenue DESC;

--Q3.3
SELECT
    C_CITY,
    S_CITY, (LO_ORDERDATE DIV 10000) AS YEAR,
    SUM(LO_REVENUE) AS revenue
FROM lineorder_flat
WHERE
    C_CITY IN ('UNITED KI1', 'UNITED KI5')
  AND S_CITY IN ('UNITED KI1', 'UNITED KI5')
  AND LO_ORDERDATE >= 19920101
  AND LO_ORDERDATE <= 19971231
GROUP BY C_CITY, S_CITY, YEAR
ORDER BY YEAR ASC, revenue DESC;

--Q3.4
SELECT
    C_CITY,
    S_CITY, (LO_ORDERDATE DIV 10000) AS YEAR,
    SUM(LO_REVENUE) AS revenue
FROM lineorder_flat
WHERE
    C_CITY IN ('UNITED KI1', 'UNITED KI5')
  AND S_CITY IN ('UNITED KI1', 'UNITED KI5')
  AND LO_ORDERDATE >= 19971201
  AND LO_ORDERDATE <= 19971231
GROUP BY C_CITY, S_CITY, YEAR
ORDER BY YEAR ASC, revenue DESC;

--Q4.1
SELECT (LO_ORDERDATE DIV 10000) AS YEAR,
    C_NATION,
    SUM(LO_REVENUE - LO_SUPPLYCOST) AS profit
FROM lineorder_flat
WHERE
    C_REGION = 'AMERICA'
  AND S_REGION = 'AMERICA'
  AND P_MFGR IN ('MFGR#1', 'MFGR#2')
GROUP BY YEAR, C_NATION
ORDER BY YEAR ASC, C_NATION ASC;

--Q4.2
SELECT (LO_ORDERDATE DIV 10000) AS YEAR,
    S_NATION,
    P_CATEGORY,
    SUM(LO_REVENUE - LO_SUPPLYCOST) AS profit
FROM lineorder_flat
WHERE
    C_REGION = 'AMERICA'
  AND S_REGION = 'AMERICA'
  AND LO_ORDERDATE >= 19970101
  AND LO_ORDERDATE <= 19981231
  AND P_MFGR IN ('MFGR#1', 'MFGR#2')
GROUP BY YEAR, S_NATION, P_CATEGORY
ORDER BY
    YEAR ASC,
    S_NATION ASC,
    P_CATEGORY ASC;

--Q4.3
SELECT (LO_ORDERDATE DIV 10000) AS YEAR,
    S_CITY,
    P_BRAND,
    SUM(LO_REVENUE - LO_SUPPLYCOST) AS profit
FROM lineorder_flat
WHERE
    S_NATION = 'UNITED STATES'
  AND LO_ORDERDATE >= 19970101
  AND LO_ORDERDATE <= 19981231
  AND P_CATEGORY = 'MFGR#14'
GROUP BY YEAR, S_CITY, P_BRAND
ORDER BY YEAR ASC, S_CITY ASC, P_BRAND ASC;
```
#### 7.6.2 SQL用SSB標準テスト

```sql
--Q1.1
SELECT SUM(lo_extendedprice * lo_discount) AS REVENUE
FROM lineorder, dates
WHERE
    lo_orderdate = d_datekey
  AND d_year = 1993
  AND lo_discount BETWEEN 1 AND 3
  AND lo_quantity < 25;

--Q1.2
SELECT SUM(lo_extendedprice * lo_discount) AS REVENUE
FROM lineorder, dates
WHERE
    lo_orderdate = d_datekey
  AND d_yearmonth = 'Jan1994'
  AND lo_discount BETWEEN 4 AND 6
  AND lo_quantity BETWEEN 26 AND 35;
    
--Q1.3
SELECT
    SUM(lo_extendedprice * lo_discount) AS REVENUE
FROM lineorder, dates
WHERE
    lo_orderdate = d_datekey
  AND d_weeknuminyear = 6
  AND d_year = 1994
  AND lo_discount BETWEEN 5 AND 7
  AND lo_quantity BETWEEN 26 AND 35;
    
--Q2.1
SELECT SUM(lo_revenue), d_year, p_brand
FROM lineorder, dates, part, supplier
WHERE
    lo_orderdate = d_datekey
  AND lo_partkey = p_partkey
  AND lo_suppkey = s_suppkey
  AND p_category = 'MFGR#12'
  AND s_region = 'AMERICA'
GROUP BY d_year, p_brand
ORDER BY p_brand;

--Q2.2
SELECT SUM(lo_revenue), d_year, p_brand
FROM lineorder, dates, part, supplier
WHERE
    lo_orderdate = d_datekey
  AND lo_partkey = p_partkey
  AND lo_suppkey = s_suppkey
  AND p_brand BETWEEN 'MFGR#2221' AND 'MFGR#2228'
  AND s_region = 'ASIA'
GROUP BY d_year, p_brand
ORDER BY d_year, p_brand;

--Q2.3
SELECT SUM(lo_revenue), d_year, p_brand
FROM lineorder, dates, part, supplier
WHERE
    lo_orderdate = d_datekey
  AND lo_partkey = p_partkey
  AND lo_suppkey = s_suppkey
  AND p_brand = 'MFGR#2239'
  AND s_region = 'EUROPE'
GROUP BY d_year, p_brand
ORDER BY d_year, p_brand;

--Q3.1
SELECT
    c_nation,
    s_nation,
    d_year,
    SUM(lo_revenue) AS REVENUE
FROM customer, lineorder, supplier, dates
WHERE
    lo_custkey = c_custkey
  AND lo_suppkey = s_suppkey
  AND lo_orderdate = d_datekey
  AND c_region = 'ASIA'
  AND s_region = 'ASIA'
  AND d_year >= 1992
  AND d_year <= 1997
GROUP BY c_nation, s_nation, d_year
ORDER BY d_year ASC, REVENUE DESC;

--Q3.2
SELECT
    c_city,
    s_city,
    d_year,
    SUM(lo_revenue) AS REVENUE
FROM customer, lineorder, supplier, dates
WHERE
    lo_custkey = c_custkey
  AND lo_suppkey = s_suppkey
  AND lo_orderdate = d_datekey
  AND c_nation = 'UNITED STATES'
  AND s_nation = 'UNITED STATES'
  AND d_year >= 1992
  AND d_year <= 1997
GROUP BY c_city, s_city, d_year
ORDER BY d_year ASC, REVENUE DESC;

--Q3.3
SELECT
    c_city,
    s_city,
    d_year,
    SUM(lo_revenue) AS REVENUE
FROM customer, lineorder, supplier, dates
WHERE
    lo_custkey = c_custkey
  AND lo_suppkey = s_suppkey
  AND lo_orderdate = d_datekey
  AND (
            c_city = 'UNITED KI1'
        OR c_city = 'UNITED KI5'
    )
  AND (
            s_city = 'UNITED KI1'
        OR s_city = 'UNITED KI5'
    )
  AND d_year >= 1992
  AND d_year <= 1997
GROUP BY c_city, s_city, d_year
ORDER BY d_year ASC, REVENUE DESC;

--Q3.4
SELECT
    c_city,
    s_city,
    d_year,
    SUM(lo_revenue) AS REVENUE
FROM customer, lineorder, supplier, dates
WHERE
    lo_custkey = c_custkey
  AND lo_suppkey = s_suppkey
  AND lo_orderdate = d_datekey
  AND (
            c_city = 'UNITED KI1'
        OR c_city = 'UNITED KI5'
    )
  AND (
            s_city = 'UNITED KI1'
        OR s_city = 'UNITED KI5'
    )
  AND d_yearmonth = 'Dec1997'
GROUP BY c_city, s_city, d_year
ORDER BY d_year ASC, REVENUE DESC;

--Q4.1
SELECT
    d_year,
    c_nation,
    SUM(lo_revenue - lo_supplycost) AS PROFIT
FROM dates, customer, supplier, part, lineorder
WHERE
    lo_custkey = c_custkey
  AND lo_suppkey = s_suppkey
  AND lo_partkey = p_partkey
  AND lo_orderdate = d_datekey
  AND c_region = 'AMERICA'
  AND s_region = 'AMERICA'
  AND (
            p_mfgr = 'MFGR#1'
        OR p_mfgr = 'MFGR#2'
    )
GROUP BY d_year, c_nation
ORDER BY d_year, c_nation;

--Q4.2
SELECT
    d_year,
    s_nation,
    p_category,
    SUM(lo_revenue - lo_supplycost) AS PROFIT
FROM dates, customer, supplier, part, lineorder
WHERE
    lo_custkey = c_custkey
  AND lo_suppkey = s_suppkey
  AND lo_partkey = p_partkey
  AND lo_orderdate = d_datekey
  AND c_region = 'AMERICA'
  AND s_region = 'AMERICA'
  AND (
            d_year = 1997
        OR d_year = 1998
    )
  AND (
            p_mfgr = 'MFGR#1'
        OR p_mfgr = 'MFGR#2'
    )
GROUP BY d_year, s_nation, p_category
ORDER BY d_year, s_nation, p_category;

--Q4.3
SELECT
    d_year,
    s_city,
    p_brand,
    SUM(lo_revenue - lo_supplycost) AS PROFIT
FROM dates, customer, supplier, part, lineorder
WHERE
    lo_custkey = c_custkey
  AND lo_suppkey = s_suppkey
  AND lo_partkey = p_partkey
  AND lo_orderdate = d_datekey
  AND s_nation = 'UNITED STATES'
  AND (
            d_year = 1997
        OR d_year = 1998
    )
  AND p_category = 'MFGR#14'
GROUP BY d_year, s_city, p_brand
ORDER BY d_year, s_city, p_brand;

```
