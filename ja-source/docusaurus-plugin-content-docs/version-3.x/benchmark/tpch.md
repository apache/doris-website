---
{
  "title": "TPC-Hベンチマーク",
  "language": "ja",
  "description": "TPC-Hは意思決定支援ベンチマーク（Decision Support Benchmark）です。"
}
---
# TPC-H Benchmark

TPC-Hは決定支援ベンチマーク（Decision Support Benchmark）であり、ビジネス指向の特別なクエリと同時データ修正のセットで構成されています。クエリされ、データベースに格納されるデータは、幅広い業界関連性を持っています。このベンチマークは、大量のデータを検査し、高度に複雑なクエリを実行し、主要なビジネス上の質問に回答する決定支援システムを実証します。TPC-Hによって報告されるパフォーマンス指標はTPC-H複合クエリパフォーマンス指標毎時（QphH@Size）と呼ばれ、システムのクエリ処理能力の複数の側面を反映しています。これらの側面には、クエリ実行時に選択されるデータベースサイズ、単一ストリームによってクエリが送信された際のクエリ処理能力、および多くの同時ユーザーによってクエリが送信された際のクエリスループットが含まれます。

このドキュメントでは主にTPC-H 1000Gテストセットにおけるパフォーマンスを紹介します。

TPC-H標準テストデータセットの22のクエリにおいて、compute-storage decoupledモードのApache Doris 3.0.3-rc03とintegrated storage-computeモードのApache Doris 2.1.7-rc03の比較テストを実施しました。3.xシリーズのintegrated storage-computeアーキテクチャのパフォーマンスは、Apache Doris 2.1.x（integratedモード）をベースラインとして使用しています。

![TPCH_1000G](/images/tpch_3.0.png)

## 1. ハードウェア環境

| Hardware           | 設定 Instructions               |
|--------------------|------------------------------------------|
| Number of Machines | 4 Aliyun Virtual Machine (1FE，3BEs)      |
| CPU                | Intel Xeon (Ice Lake) Platinum 8369B 32C |
| Memory             | 128G                                     |
| Disk               | Enterprise SSD (PL0)                     |


## 2. ソフトウェア環境

- DorisはBE3台とFE1台をデプロイ
- Kernelバージョン: Linux version 5.15.0-101-generic
- OSバージョン: Ubuntu 20.04 LTS (Focal Fossa)
- Dorisソフトウェアバージョン: Apache Doris 3.0.3-rc03 (Compute-Storage Decoupled Mode)、Apache Doris 2.1.7-rc03
- JDK: openjdk version "17.0.2"

## 3. テストデータ量

テスト全体のシミュレーションによって生成されたTPC-H 1000Gデータを、それぞれApache Doris 3.0.3-rc03 (Compute-Storage Decoupled Mode)とApache Doris 2.1.7-rc03にインポートしてテストしました。以下はテーブルの関連する説明とデータ量です。

| TPC-H table Name | Rows          | Annotation    |
|:-----------------|:--------------|:--------------|
| REGION           | 5             | Region        |
| NATION           | 25            | Nation        |
| SUPPLIER         | 10,000,000    | Supplier      |
| PART             | 200,000,000   | Parts         |
| PARTSUPP         | 800,000,000   | Parts Supply  |
| CUSTOMER         | 150,000,000   | Customer      |
| ORDERS           | 1,500,000,000 | Orders        |
| LINEITEM         | 5,999,989,709 | Order Details |

## 4. テストSQL

TPC-H 22テストクエリステートメント : [TPCH-Query-SQL](https://github.com/apache/doris/tree/master/tools/tpch-tools/queries)


## 5. テスト結果

ここでは、Apache Doris 3.0.3-rc03 (Compute-Storage Decoupled Mode)とApache Doris 2.1.7-rc03を用いて比較テストを行います。テストでは、Query Time(ms)を主要なパフォーマンス指標として使用します。テスト結果は以下の通りです：

| Query     | Apache Doris 3.0.3-rc03 Compute-Storage Decoupled Mode (ms) | Apache Doris 2.1.7-rc03 (ms) |
|-----------|-----------------------------------------------------------|------------------------------|
| q01       | 13390                                                     | 11880                        |
| q02       | 250                                                       | 280                          |
| q03       | 4800                                                      | 3890                         |
| q04       | 2870                                                      | 2570                         |
| q05       | 6780                                                      | 6630                         |
| q06       | 200                                                       | 170                          |
| q07       | 2350                                                      | 2420                         |
| q08       | 4300                                                      | 3730                         |
| q09       | 15160                                                     | 15910                        |
| q10       | 5000                                                      | 7880                         |
| q11       | 650                                                       | 560                          |
| q12       | 530                                                       | 500                          |
| q13       | 9440                                                      | 9540                         |
| q14       | 570                                                       | 590                          |
| q15       | 1210                                                      | 1170                         |
| q16       | 1070                                                      | 910                          |
| q17       | 2000                                                      | 1920                         |
| q18       | 17950                                                     | 17700                        |
| q19       | 2550                                                      | 2370                         |
| q20       | 490                                                       | 560                          |
| q21       | 7830                                                      | 9150                         |
| q22       | 2890                                                      | 1130                         |
| **Total** | **102280**                                                | **101460**                   |



## 6. 環境準備

[公式ドキュメント](../../../docs/install/deploy-manually/integrated-storage-compute-deploy-manually)を参照してDorisをインストール・デプロイし、正常に動作するDorisクラスター（最低1 FE 1 BE、推奨は1 FE 3 BE）を取得してください。

## 7. データ準備

### 7.1 TPC-Hデータ生成ツールのダウンロードとインストール

以下のスクリプトを実行して[tpch-tools](https://github.com/apache/doris/tree/master/tools/tpch-tools)ツールをダウンロード・コンパイルします。

```shell
sh bin/build-tpch-dbgen.sh
```
インストールが正常に完了すると、`dbgen` バイナリが `TPC-H_Tools_v3.0.0/` ディレクトリ下に生成されます。

### 7.2 TPC-H テストセットの生成

以下のスクリプトを実行して TPC-H データセットを生成します：

```shell
sh bin/gen-tpch-data.sh -s 1000
```
> 注意 1: `sh gen-tpch-data.sh -h` でスクリプトのヘルプを確認してください。
>
> 注意 2: データは `tpch-data/` ディレクトリ下に `.tbl` 拡張子で生成されます。総ファイルサイズは約1000GBで、生成に数分から1時間程度かかる場合があります。
>
> 注意 3: デフォルトでは100Gの標準テストデータセットが生成されます。

### 7.3 テーブルの作成

#### 7.3.1 `doris-cluster.conf` ファイルの準備

スクリプトをインポートする前に、`doris-cluster.conf` ファイルにFEのIPポートやその他の情報を記述する必要があります。

このファイルは `${DORIS_HOME}/tools/tpch-tools/conf/` にあります。

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
# The database where TPC-H tables located
export DB='tpch'
```
#### TPC-Hテーブルを生成・作成するために以下のスクリプトを実行する

```shell
sh bin/create-tpch-tables.sh -s 1000
```
または、[create-tpch-tables.sql](https://github.com/apache/doris/blob/master/tools/tpch-tools/ddl/create-tpch-tables-sf1000.sql) のテーブル作成文をコピーして、Doris で実行してください。

### 7.4 データのインポート

以下のコマンドでデータインポートを実行してください：

```shell
sh bin/load-tpch-data.sh
```
### 7.5 インポートしたデータの確認

以下のSQL文を実行して、インポートしたデータが上記のデータと一致していることを確認します。

```sql
select count(*)  from  lineitem;
select count(*)  from  orders;
select count(*)  from  partsupp;
select count(*)  from  part;
select count(*)  from  customer;
select count(*)  from  supplier;
select count(*)  from  nation;
select count(*)  from  region;
select count(*)  from  revenue0;
```
### 7.6 クエリテスト

#### 7.6.1 クエリスクリプトの実行

上記のテストSQLを実行するか、以下のコマンドを実行してください

```
sh bin/run-tpch-queries.sh -s 1000
```
#### 7.6.2 単一SQL実行

以下は、テストで使用されるSQL文です。最新のSQLはコードベースから取得することもできます。

```sql
--Q1
select
    l_returnflag,
    l_linestatus,
    sum(l_quantity) as sum_qty,
    sum(l_extendedprice) as sum_base_price,
    sum(l_extendedprice * (1 - l_discount)) as sum_disc_price,
    sum(l_extendedprice * (1 - l_discount) * (1 + l_tax)) as sum_charge,
    avg(l_quantity) as avg_qty,
    avg(l_extendedprice) as avg_price,
    avg(l_discount) as avg_disc,
    count(*) as count_order
from
    lineitem
where
    l_shipdate <= date '1998-12-01' - interval '90' day
group by
    l_returnflag,
    l_linestatus
order by
    l_returnflag,
    l_linestatus;

--Q2
select
    s_acctbal,
    s_name,
    n_name,
    p_partkey,
    p_mfgr,
    s_address,
    s_phone,
    s_comment
from
    part,
    supplier,
    partsupp,
    nation,
    region
where
    p_partkey = ps_partkey
    and s_suppkey = ps_suppkey
    and p_size = 15
    and p_type like '%BRASS'
    and s_nationkey = n_nationkey
    and n_regionkey = r_regionkey
    and r_name = 'EUROPE'
    and ps_supplycost = (
        select
            min(ps_supplycost)
        from
            partsupp,
            supplier,
            nation,
            region
        where
        p_partkey = ps_partkey
        and s_suppkey = ps_suppkey
        and s_nationkey = n_nationkey
        and n_regionkey = r_regionkey
        and r_name = 'EUROPE'
)
order by
    s_acctbal desc,
    n_name,
    s_name,
    p_partkey
limit 100;

--Q3
select
    l_orderkey,
    sum(l_extendedprice * (1 - l_discount)) as revenue,
    o_orderdate,
    o_shippriority
from
    customer,
    orders,
    lineitem
where
    c_mktsegment = 'BUILDING'
    and c_custkey = o_custkey
    and l_orderkey = o_orderkey
    and o_orderdate < date '1995-03-15'
    and l_shipdate > date '1995-03-15'
group by
    l_orderkey,
    o_orderdate,
    o_shippriority
order by
    revenue desc,
    o_orderdate
limit 10;

--Q4
select
    o_orderpriority,
    count(*) as order_count
from
    orders
where
    o_orderdate >= date '1993-07-01'
    and o_orderdate < date '1993-07-01' + interval '3' month
    and exists (
        select
            *
        from
            lineitem
        where
                l_orderkey = o_orderkey
          and l_commitdate < l_receiptdate
    )
group by
    o_orderpriority
order by
    o_orderpriority;

--Q5
select
    n_name,
    sum(l_extendedprice * (1 - l_discount)) as revenue
from
    customer,
    orders,
    lineitem,
    supplier,
    nation,
    region
where
    c_custkey = o_custkey
    and l_orderkey = o_orderkey
    and l_suppkey = s_suppkey
    and c_nationkey = s_nationkey
    and s_nationkey = n_nationkey
    and n_regionkey = r_regionkey
    and r_name = 'ASIA'
    and o_orderdate >= date '1994-01-01'
    and o_orderdate < date '1994-01-01' + interval '1' year
group by
    n_name
order by
    revenue desc;

--Q6
select
    sum(l_extendedprice * l_discount) as revenue
from
    lineitem
where
    l_shipdate >= date '1994-01-01'
    and l_shipdate < date '1994-01-01' + interval '1' year
    and l_discount between .06 - 0.01 and .06 + 0.01
    and l_quantity < 24;

--Q7
select
    supp_nation,
    cust_nation,
    l_year,
    sum(volume) as revenue
from
    (
        select
            n1.n_name as supp_nation,
            n2.n_name as cust_nation,
            extract(year from l_shipdate) as l_year,
            l_extendedprice * (1 - l_discount) as volume
        from
            supplier,
            lineitem,
            orders,
            customer,
            nation n1,
            nation n2
        where
            s_suppkey = l_suppkey
            and o_orderkey = l_orderkey
            and c_custkey = o_custkey
            and s_nationkey = n1.n_nationkey
            and c_nationkey = n2.n_nationkey
            and (
                (n1.n_name = 'FRANCE' and n2.n_name = 'GERMANY')
                or (n1.n_name = 'GERMANY' and n2.n_name = 'FRANCE')
            )
            and l_shipdate between date '1995-01-01' and date '1996-12-31'
    ) as shipping
group by
    supp_nation,
    cust_nation,
    l_year
order by
    supp_nation,
    cust_nation,
    l_year;

--Q8

select
    o_year,
    sum(case
        when nation = 'BRAZIL' then volume
        else 0
    end) / sum(volume) as mkt_share
from
    (
        select
            extract(year from o_orderdate) as o_year,
            l_extendedprice * (1 - l_discount) as volume,
            n2.n_name as nation
        from
            part,
            supplier,
            lineitem,
            orders,
            customer,
            nation n1,
            nation n2,
            region
        where
            p_partkey = l_partkey
            and s_suppkey = l_suppkey
            and l_orderkey = o_orderkey
            and o_custkey = c_custkey
            and c_nationkey = n1.n_nationkey
            and n1.n_regionkey = r_regionkey
            and r_name = 'AMERICA'
            and s_nationkey = n2.n_nationkey
            and o_orderdate between date '1995-01-01' and date '1996-12-31'
            and p_type = 'ECONOMY ANODIZED STEEL'
    ) as all_nations
group by
    o_year
order by
    o_year;

--Q9
select
    nation,
    o_year,
    sum(amount) as sum_profit
from
    (
        select
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

--Q10
select
    c_custkey,
    c_name,
    sum(l_extendedprice * (1 - l_discount)) as revenue,
    c_acctbal,
    n_name,
    c_address,
    c_phone,
    c_comment
from
    customer,
    orders,
    lineitem,
    nation
where
    c_custkey = o_custkey
    and l_orderkey = o_orderkey
    and o_orderdate >= date '1993-10-01'
    and o_orderdate < date '1993-10-01' + interval '3' month
    and l_returnflag = 'R'
    and c_nationkey = n_nationkey
group by
    c_custkey,
    c_name,
    c_acctbal,
    c_phone,
    n_name,
    c_address,
    c_comment
order by
    revenue desc
limit 20;


--Q11
select
    ps_partkey,
    sum(ps_supplycost * ps_availqty) as value
from
    partsupp,
    supplier,
    nation
where
    ps_suppkey = s_suppkey
    and s_nationkey = n_nationkey
    and n_name = 'GERMANY'
group by
    ps_partkey having
    sum(ps_supplycost * ps_availqty) > (
        select
        sum(ps_supplycost * ps_availqty) * 0.000002
        from
            partsupp,
            supplier,
            nation
        where
            ps_suppkey = s_suppkey
            and s_nationkey = n_nationkey
            and n_name = 'GERMANY'
    )
order by
    value desc;

--Q12
select
    l_shipmode,
    sum(case
        when o_orderpriority = '1-URGENT'
            or o_orderpriority = '2-HIGH'
            then 1
        else 0
    end) as high_line_count,
    sum(case
        when o_orderpriority <> '1-URGENT'
            and o_orderpriority <> '2-HIGH'
            then 1
        else 0
    end) as low_line_count
from
    orders,
    lineitem
where
    o_orderkey = l_orderkey
    and l_shipmode in ('MAIL', 'SHIP')
    and l_commitdate < l_receiptdate
    and l_shipdate < l_commitdate
    and l_receiptdate >= date '1994-01-01'
    and l_receiptdate < date '1994-01-01' + interval '1' year
group by
    l_shipmode
order by
    l_shipmode;

--Q13
select
    c_count,
    count(*) as custdist
from
    (
        select
            c_custkey,
            count(o_orderkey) as c_count
        from
            customer left outer join orders on
                c_custkey = o_custkey
                and o_comment not like '%special%requests%'
        group by
            c_custkey
    ) as c_orders
group by
    c_count
order by
    custdist desc,
    c_count desc;

--Q14
select
    100.00 * sum(case
        when p_type like 'PROMO%'
            then l_extendedprice * (1 - l_discount)
        else 0
    end) / sum(l_extendedprice * (1 - l_discount)) as promo_revenue
from
    lineitem,
    part
where
    l_partkey = p_partkey
    and l_shipdate >= date '1995-09-01'
    and l_shipdate < date '1995-09-01' + interval '1' month;

--Q15
select
    s_suppkey,
    s_name,
    s_address,
    s_phone,
    total_revenue
from
    supplier,
    revenue0
where
    s_suppkey = supplier_no
    and total_revenue = (
        select
            max(total_revenue)
        from
            revenue0
    )
order by
    s_suppkey;

--Q16
select
    p_brand,
    p_type,
    p_size,
    count(distinct ps_suppkey) as supplier_cnt
from
    partsupp,
    part
where
    p_partkey = ps_partkey
    and p_brand <> 'Brand#45'
    and p_type not like 'MEDIUM POLISHED%'
    and p_size in (49, 14, 23, 45, 19, 3, 36, 9)
    and ps_suppkey not in (
        select
            s_suppkey
        from
            supplier
        where
            s_comment like '%Customer%Complaints%'
    )
group by
    p_brand,
    p_type,
    p_size
order by
    supplier_cnt desc,
    p_brand,
    p_type,
    p_size;

--Q17
select
    sum(l_extendedprice) / 7.0 as avg_yearly
from
    lineitem,
    part
where
    p_partkey = l_partkey
    and p_brand = 'Brand#23'
    and p_container = 'MED BOX'
    and l_quantity < (
        select
            0.2 * avg(l_quantity)
        from
            lineitem
        where
            l_partkey = p_partkey
    );

--Q18
select
    c_name,
    c_custkey,
    o_orderkey,
    o_orderdate,
    o_totalprice,
    sum(l_quantity)
from
    customer,
    orders,
    lineitem
where
    o_orderkey  in  (
        select
            l_orderkey
        from
            lineitem
        group  by
            l_orderkey  having
                sum(l_quantity)  >  300
    )
    and  c_custkey  =  o_custkey
    and  o_orderkey  =  l_orderkey
group  by
    c_name,
    c_custkey,
    o_orderkey,
    o_orderdate,
    o_totalprice
order  by
    o_totalprice  desc,
    o_orderdate
limit  100;


--Q19
select
    sum(l_extendedprice* (1 - l_discount)) as revenue
from
    lineitem,
    part
where
    (
        p_partkey = l_partkey
        and p_brand = 'Brand#12'
        and p_container in ('SM CASE', 'SM BOX', 'SM PACK', 'SM PKG')
        and l_quantity >= 1 and l_quantity <= 1 + 10
        and p_size between 1 and 5
        and l_shipmode in ('AIR', 'AIR REG')
        and l_shipinstruct = 'DELIVER IN PERSON'
    )
    or
    (
        p_partkey = l_partkey
        and p_brand = 'Brand#23'
        and p_container in ('MED BAG', 'MED BOX', 'MED PKG', 'MED PACK')
        and l_quantity >= 10 and l_quantity <= 10 + 10
        and p_size between 1 and 10
        and l_shipmode in ('AIR', 'AIR REG')
        and l_shipinstruct = 'DELIVER IN PERSON'
    )
    or
    (
        p_partkey = l_partkey
        and p_brand = 'Brand#34'
        and p_container in ('LG CASE', 'LG BOX', 'LG PACK', 'LG PKG')
        and l_quantity >= 20 and l_quantity <= 20 + 10
        and p_size between 1 and 15
        and l_shipmode in ('AIR', 'AIR REG')
        and l_shipinstruct = 'DELIVER IN PERSON'
    );

--Q20
select
    s_name,
    s_address
from
    supplier,
    nation
where
    s_suppkey in (
        select
            ps_suppkey
        from
            partsupp
        where
            ps_partkey in (
                select
                    p_partkey
                from
                    part
                where
                        p_name like 'forest%'
            )
            and ps_availqty > (
                select
                    0.5 * sum(l_quantity)
                from
                    lineitem
                where
                    l_partkey = ps_partkey
                    and l_suppkey = ps_suppkey
                    and l_shipdate >= date '1994-01-01'
                    and l_shipdate < date '1994-01-01' + interval '1' year
            )
    )
    and s_nationkey = n_nationkey
    and n_name = 'CANADA'
order by
    s_name;

--Q21
select
    s_name,
    count(*) as numwait
from
    supplier,
    lineitem l1,
    orders,
    nation
where
    s_suppkey = l1.l_suppkey
    and o_orderkey = l1.l_orderkey
    and o_orderstatus = 'F'
    and l1.l_receiptdate > l1.l_commitdate
    and exists (
        select
            *
        from
            lineitem l2
        where
                l2.l_orderkey = l1.l_orderkey
          and l2.l_suppkey <> l1.l_suppkey
    )
    and not exists (
        select
            *
        from
            lineitem l3
        where
                l3.l_orderkey = l1.l_orderkey
          and l3.l_suppkey <> l1.l_suppkey
          and l3.l_receiptdate > l3.l_commitdate
    )
    and s_nationkey = n_nationkey
    and n_name = 'SAUDI ARABIA'
group by
    s_name
order by
    numwait desc,
    s_name
limit 100;

--Q22
select
    cntrycode,
    count(*) as numcust,
    sum(c_acctbal) as totacctbal
from
    (
        select
            substring(c_phone, 1, 2) as cntrycode,
            c_acctbal
        from
            customer
        where
            substring(c_phone, 1, 2) in
            ('13', '31', '23', '29', '30', '18', '17')
            and c_acctbal > (
                select
                    avg(c_acctbal)
                from
                    customer
                where
                    c_acctbal > 0.00
                    and substring(c_phone, 1, 2) in
                      ('13', '31', '23', '29', '30', '18', '17')
            )
            and not exists (
                select
                    *
                from
                    orders
                where
                    o_custkey = c_custkey
            )
    ) as custsale
group by
    cntrycode
order by
    cntrycode;

```
