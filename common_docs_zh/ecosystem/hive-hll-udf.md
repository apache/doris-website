---
{
    "title": "Hive HLL UDF",
    "language": "zh-CN"
}
---

<!-- 
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

# Hive HLL UDF

 Hive HLL UDF 提供了在 hive 表中生成 HLL 运算等 UDF，Hive 中的 HLL 与 Doris HLL 完全一致，Hive 中的 HLL 可以通过 Spark HLL Load 导入 Doris。关于 HLL 更多介绍可以参考：[使用 HLL 近似去重](https://doris.apache.org/zh-CN/docs/query-acceleration/distinct-counts/using-hll/)

 函数简介：
  1. UDAF
 
    · to_hll：聚合函数，返回一个 Doris HLL 列，类似于 to_bitmap 函数
 
    · hll_union：聚合函数，功能同 Doris 的 BE 同名函数，计算分组的并集，返回一个 Doris HLL 列，类似于 bitmap_union 函数

  2. UDF

    · hll_cardinality：返回添加到 HLL 的不同元素的数量，类似于 bitmap_count 函数

 主要目的：
  1. 减少数据导入 Doris 时间 , 除去了构建字典、HLL 预聚合等流程；
  2. 节省 Hive 存储，使用 HLL 对数据压缩，极大减少了存储成本，相对于 Bitmap 的统计更加节省存储；
  3. 提供在 Hive 中 HLL 的灵活运算：并集、基数统计，计算后的 HLL 也可以直接导入 Doris；
 
 注意事项：
 HLL 统计为近似计算有一定误差，大概 1%~2% 左右。

## 使用方法

### 在 Hive 中创建 HLL 类型和普通表，往普通表插入测试数据

```sql
-- 创建一个测试数据库，以 hive_test 为例：
use hive_test;

-- 例子：创建 Hive HLL 表
CREATE TABLE IF NOT EXISTS `hive_hll_table`(
  `k1`   int       COMMENT '',
  `k2`   String    COMMENT '',
  `k3`   String    COMMENT '',
  `uuid` binary    COMMENT 'hll'
) comment  'comment'

-- 例子：创建普通 Hive 表，插入测试数据
CREATE TABLE IF NOT EXISTS `hive_table`(
    `k1`   int       COMMENT '',
    `k2`   String    COMMENT '',
    `k3`   String    COMMENT '',
    `uuid` int       COMMENT ''
) comment  'comment'

insert into hive_table select 1, 'a', 'b', 12345;
insert into hive_table select 1, 'a', 'c', 12345;
insert into hive_table select 2, 'b', 'c', 23456;
insert into hive_table select 3, 'c', 'd', 34567;
```

### Hive HLL UDF 使用：

Hive HLL UDF 需要在 Hive/Spark 中使用，首先需要编译 fe 得到 hive-udf.jar。
编译准备工作：如果进行过 ldb 源码编译可直接编译 fe，如果没有进行过 ldb 源码编译，则需要手动安装 thrift，可参考：[FE 开发环境搭建](https://doris.apache.org/zh-CN/community/developer-guide/fe-idea-dev/) 中的编译与安装

```sql
--clone doris 源码
git clone https://github.com/apache/doris.git
cd doris
git submodule update --init --recursive

--安装 thrift，已安装可略过
--进入 fe 目录
cd fe

--执行 maven 打包命令（fe 的子 module 会全部打包）
mvn package -Dmaven.test.skip=true
--也可以只打 hive-udf module
mvn package -pl hive-udf -am -Dmaven.test.skip=true

-- 打包编译完成进入 hive-udf 目录会有 target 目录，里面就会有打包完成的 hive-udf.jar 包
-- 需要将编译好的 hive-udf.jar 包上传至 HDFS，这里以传至 hdfs 的根目录为示例：
hdfs dfs -put hive-udf/target/hive-udf.jar /

```

下面进入 Hive 中进行 SQL 语句操作：

```sql
-- 加载 hive hll udf jar 包，根据实际情况更改 hostname 和 port  
add jar hdfs://hostname:port/hive-udf.jar;

-- 创建 UDAF 函数
create temporary function to_hll as 'org.apache.doris.udf.ToHllUDAF' USING JAR 'hdfs://hostname:port/hive-udf.jar';
create temporary function hll_union as 'org.apache.doris.udf.HllUnionUDAF' USING JAR 'hdfs://hostname:port/hive-udf.jar';


-- 创建 UDF 函数
create temporary function hll_cardinality as 'org.apache.doris.udf.HllCardinalityUDF' USING JAR 'hdfs://node:9000/hive-udf.jar';


-- 例子：通过 to_hll 这个 UDAF 进行聚合生成 hll 写入 Hive HLL 表
insert into hive_hll_table
select 
    k1,
    k2,
    k3,
    to_hll(uuid) as uuid
from 
    hive_table
group by 
    k1,
    k2,
    k3

-- 例子：hll_cardinality 计算 hll 中元素个数
select k1, k2, k3, hll_cardinality(uuid) from hive_hll_table;
+-----+-----+-----+------+
| k1  | k2  | k3  | _c3  |
+-----+-----+-----+------+
| 1   | a   | b   | 1    |
| 1   | a   | c   | 1    |
| 2   | b   | c   | 1    |
| 3   | c   | d   | 1    |
+-----+-----+-----+------+

-- 例子：hll_union 用于计算分组后的 hll 并集，将返回 3 行
select k1, hll_union(uuid) from hive_hll_table group by k1;

-- 例子：也可以合并后继续统计
select k3, hll_cardinality(hll_union(uuid)) from hive_hll_table group by k3;
+-----+------+
| k3  | _c1  |
+-----+------+
| b   | 1    |
| c   | 2    |
| d   | 1    |
+-----+------+
```

###  Hive HLL UDF  说明

## Hive HLL 导入 doris

### 方法一：Catalog（推荐）

创建 Hive 表指定为 TEXT 格式，对于 Binary 类型，Hive 会以 base64 编码的字符串形式保存，此时可以通过 Hive Catalog 的形式，直接将 HLL 数据通过 [hll_from_base64](../sql-manual/sql-functions/hll-functions/hll-from-base64.md) 函数插入到 Doris 内部。

以下是一个完整的例子：

1. 在 Hive 中创建 Hive 表

```sql
CREATE TABLE IF NOT EXISTS `hive_hll_table`(
`k1`   int       COMMENT '',
`k2`   String    COMMENT '',
`k3`   String    COMMENT '',
`uuid` binary    COMMENT 'hll'
) stored as textfile 

-- 然后可以沿用前面的步骤基于普通表使用 to_hll 函数往 hive_hll_table 插入数据，这里不再赘述
```

2. [在 Doris 中创建 Catalog](../lakehouse/datalake-analytics/hive.md)

```sql
CREATE CATALOG hive PROPERTIES (
    'type'='hms',
    'hive.metastore.uris' = 'thrift://127.0.0.1:9083'
);
```

3. 创建 Doris 内表

```sql
CREATE TABLE IF NOT EXISTS `doris_test`.`doris_hll_table`(
    `k1`   int                   COMMENT '',
    `k2`   varchar(10)           COMMENT '',
    `k3`   varchar(10)           COMMENT '',
    `uuid` HLL  HLL_UNION  COMMENT 'hll'
)
AGGREGATE KEY(k1, k2, k3)
DISTRIBUTED BY HASH(`k1`) BUCKETS 1
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);
```

4. 从 Hive 插入数据到 Doris 中

```sql
insert into doris_hll_table select k1, k2, k3, hll_from_base64(uuid) from hive.hive_test.hive_hll_table;

-- 可以查看导入后的数据，结合 hll_to_base64 进行解码
select *, hll_to_base64(uuid) from doris_hll_table;
+------+------+------+------+---------------------+
| k1   | k2   | k3   | uuid | hll_to_base64(uuid) |
+------+------+------+------+---------------------+
|    1 | a    | b    | NULL | AQFw+a9MhpKhoQ==    |
|    1 | a    | c    | NULL | AQFw+a9MhpKhoQ==    |
|    2 | b    | c    | NULL | AQGyB7kbWBxh+A==    |
|    3 | c    | d    | NULL | AQFYbJB5VpNBhg==    |
+------+------+------+------+---------------------+

-- 也可以进一步使用 Doris 原生的 HLL 函数进行统计，可以看到和前面在 Hive 中统计的结果一致
select k3, hll_cardinality(hll_union(uuid)) from doris_hll_table group by k3;
+------+----------------------------------+
| k3   | hll_cardinality(hll_union(uuid)) |
+------+----------------------------------+
| b    |                                1 |
| d    |                                1 |
| c    |                                2 |
+------+----------------------------------+

-- 此时，查外表的数据，也就是查导入前的数据进行统计、对比也能校验数据正确性
select k3, hll_cardinality(hll_union(hll_from_base64(uuid))) from hive.hive_test.hive_hll_table group by k3;
+------+---------------------------------------------------+
| k3   | hll_cardinality(hll_union(hll_from_base64(uuid))) |
+------+---------------------------------------------------+
| d    |                                                 1 |
| b    |                                                 1 |
| c    |                                                 2 |
+------+---------------------------------------------------+
```

### 方法二：Spark Load

 详见：[Spark Load](https://doris.apache.org/zh-CN/docs/1.2/data-operate/import/import-way/spark-load-manual) -> 基本操作  -> 创建导入 (示例 3：上游数据源是 hive binary 类型情况) 
