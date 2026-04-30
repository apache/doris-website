---
{
    "title": "Hive Bitmap/HLL UDF",
    "language": "zh-CN",
    "description": "在 Hive 中生成与运算 Bitmap、HLL 的 UDF，结果可直接导入 Doris，跳过字典构建与预聚合，降低导入耗时与存储成本。"
}
---

Doris 提供了一组 Hive UDF，可在 Hive 表中直接生成、运算 Bitmap 与 HLL。Hive 中产生的 Bitmap、HLL 与 Doris 内核完全一致，可通过 Hive Catalog 或 Spark Load 直接导入 Doris。

关于 HLL 的更多介绍，可参考：[使用 HLL 近似去重](../../query-acceleration/distinct-counts/hll-approximate-deduplication)。

## 适用场景

| 场景                       | 收益                                                                                |
| -------------------------- | ----------------------------------------------------------------------------------- |
| 缩短数据导入 Doris 的时间  | 在 Hive 端完成字典构建与预聚合，导入 Doris 时无需重复构建                            |
| 降低 Hive 与 Doris 存储成本 | Bitmap、HLL 对原始数据进行压缩；HLL 的存储开销通常显著低于 Bitmap                     |
| 在 Hive 中灵活运算         | 支持 Bitmap 的交集 / 并集 / 差集，以及 HLL 的并集 / 基数统计，结果可直接导入 Doris    |

:::tip
HLL 是近似算法，统计结果与精确值通常存在 1%~2% 的误差。对精度要求严格的场景请使用 Bitmap。
:::

## 函数列表

<!-- 知识类型: 函数参考 -->

### Bitmap UDF

| 函数             | 类型  | 功能                              |
| ---------------- | ----- | --------------------------------- |
| `to_bitmap`      | UDAF  | 聚合生成一列 Doris Bitmap          |
| `bitmap_union`   | UDAF  | 计算分组内 Bitmap 的并集           |
| `bitmap_count`   | UDF   | 返回 Bitmap 中元素个数             |
| `bitmap_and`     | UDF   | 计算两个 Bitmap 的交集             |
| `bitmap_or`      | UDF   | 计算两个 Bitmap 的并集             |
| `bitmap_xor`     | UDF   | 计算两个 Bitmap 的对称差           |

### HLL UDF

| 函数              | 类型  | 功能                                                |
| ----------------- | ----- | --------------------------------------------------- |
| `to_hll`          | UDAF  | 聚合生成一列 Doris HLL，作用类似 `to_bitmap`         |
| `hll_union`       | UDAF  | 计算分组内 HLL 的并集，作用类似 `bitmap_union`        |
| `hll_cardinality` | UDF   | 返回 HLL 中不同元素的近似数量，作用类似 `bitmap_count` |

## 使用流程

<!-- 知识类型: 操作步骤 -->

整体流程分为四步：

1. 编译 `hive-udf.jar`，并上传至 HDFS。
2. 在 Hive 中加载 JAR 并注册 UDF。
3. 在 Hive 中使用 UDF 生成、运算 Bitmap 或 HLL。
4. 通过 Hive Catalog 或 Spark Load 将结果导入 Doris。

### 第一步：编译 UDF JAR

Hive Bitmap、HLL UDF 需要在 Hive / Spark 中使用，需先编译 Doris FE 模块得到 `hive-udf.jar`。

**编译准备**：若已完成过 ldb 源码编译，可直接编译 FE；否则需手动安装 thrift，详见 [FE 开发环境搭建](https://doris.apache.org/zh-CN/community/developer-guide/fe-idea-dev/)。

```bash
# 1. 克隆 Doris 源码
git clone https://github.com/apache/doris.git
cd doris
git submodule update --init --recursive

# 2. 进入 fe 目录
cd fe

# 3. 执行 maven 打包（fe 的全部子模块都会被打包）
mvn package -Dmaven.test.skip=true

# 也可仅打包 hive-udf 模块
mvn package -pl hive-udf -am -Dmaven.test.skip=true

# 4. 打包完成后在 hive-udf/target 目录下会生成 hive-udf.jar
#    将其上传至 HDFS（以传至根目录为例）
hdfs dfs -put hive-udf/target/hive-udf.jar /
```

### 第二步：在 Hive 中加载 JAR 并注册 UDF

进入 Hive，根据实际情况修改 HDFS 的 `hostname` 与 `port`：

```sql
-- 加载 UDF JAR
add jar hdfs://hostname:port/hive-udf.jar;

-- 注册 Bitmap UDAF
create temporary function to_bitmap     as 'org.apache.doris.udf.ToBitmapUDAF'    USING JAR 'hdfs://hostname:port/hive-udf.jar';
create temporary function bitmap_union  as 'org.apache.doris.udf.BitmapUnionUDAF' USING JAR 'hdfs://hostname:port/hive-udf.jar';

-- 注册 Bitmap UDF
create temporary function bitmap_count  as 'org.apache.doris.udf.BitmapCountUDF'  USING JAR 'hdfs://hostname:port/hive-udf.jar';
create temporary function bitmap_and    as 'org.apache.doris.udf.BitmapAndUDF'    USING JAR 'hdfs://hostname:port/hive-udf.jar';
create temporary function bitmap_or     as 'org.apache.doris.udf.BitmapOrUDF'     USING JAR 'hdfs://hostname:port/hive-udf.jar';
create temporary function bitmap_xor    as 'org.apache.doris.udf.BitmapXorUDF'    USING JAR 'hdfs://hostname:port/hive-udf.jar';

-- 注册 HLL UDAF
create temporary function to_hll        as 'org.apache.doris.udf.ToHllUDAF'       USING JAR 'hdfs://hostname:port/hive-udf.jar';
create temporary function hll_union     as 'org.apache.doris.udf.HllUnionUDAF'    USING JAR 'hdfs://hostname:port/hive-udf.jar';

-- 注册 HLL UDF
create temporary function hll_cardinality as 'org.apache.doris.udf.HllCardinalityUDF' USING JAR 'hdfs://hostname:port/hive-udf.jar';
```

### 第三步：在 Hive 中生成与运算

#### 准备测试数据

```sql
use hive_test;

-- 普通 Hive 表，存放原始数据
CREATE TABLE IF NOT EXISTS `hive_table`(
    `k1`   int       COMMENT '',
    `k2`   String    COMMENT '',
    `k3`   String    COMMENT '',
    `uuid` int       COMMENT ''
) COMMENT 'source table';

insert into hive_table select 1, 'a', 'b', 12345;
insert into hive_table select 1, 'a', 'c', 12345;
insert into hive_table select 2, 'b', 'c', 23456;
insert into hive_table select 3, 'c', 'd', 34567;
```

#### Bitmap 示例

```sql
-- 创建 Hive Bitmap 表，binary 列用于保存 Bitmap
CREATE TABLE IF NOT EXISTS `hive_bitmap_table`(
    `k1`   int       COMMENT '',
    `k2`   String    COMMENT '',
    `k3`   String    COMMENT '',
    `uuid` binary    COMMENT 'bitmap'
) COMMENT 'bitmap table';

-- 通过 to_bitmap 聚合生成 Bitmap，写入 Hive Bitmap 表
insert into hive_bitmap_table
select
    k1,
    k2,
    k3,
    to_bitmap(uuid) as uuid
from hive_table
group by k1, k2, k3;

-- 计算 Bitmap 中元素个数
select k1, k2, k3, bitmap_count(uuid) from hive_bitmap_table;

-- 计算分组后的 Bitmap 并集
select k1, bitmap_union(uuid) from hive_bitmap_table group by k1;
```

#### HLL 示例

```sql
-- 创建 Hive HLL 表，binary 列用于保存 HLL
CREATE TABLE IF NOT EXISTS `hive_hll_table`(
    `k1`   int       COMMENT '',
    `k2`   String    COMMENT '',
    `k3`   String    COMMENT '',
    `uuid` binary    COMMENT 'hll'
) COMMENT 'hll table';

-- 通过 to_hll 聚合生成 HLL，写入 Hive HLL 表
insert into hive_hll_table
select
    k1,
    k2,
    k3,
    to_hll(uuid) as uuid
from hive_table
group by k1, k2, k3;

-- 计算 HLL 中元素个数
select k1, k2, k3, hll_cardinality(uuid) from hive_hll_table;
+-----+-----+-----+------+
| k1  | k2  | k3  | _c3  |
+-----+-----+-----+------+
| 1   | a   | b   | 1    |
| 1   | a   | c   | 1    |
| 2   | b   | c   | 1    |
| 3   | c   | d   | 1    |
+-----+-----+-----+------+

-- 计算分组后的 HLL 并集（返回 3 行）
select k1, hll_union(uuid) from hive_hll_table group by k1;

-- 也可以先合并再统计
select k3, hll_cardinality(hll_union(uuid)) from hive_hll_table group by k3;
+-----+------+
| k3  | _c1  |
+-----+------+
| b   | 1    |
| c   | 2    |
| d   | 1    |
+-----+------+
```

### 第四步：将 Hive Bitmap / HLL 导入 Doris

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: Hive 已有 Bitmap / HLL 数据，需要写入 Doris 内表 -->

**推荐方式：Hive Catalog**

将 Hive 表存储为 `TEXT` 格式时，`binary` 类型会以 Base64 编码字符串保存。借助 Hive Catalog，可直接通过 [`bitmap_from_base64`](../../sql-manual/sql-functions/scalar-functions/bitmap-functions/bitmap-from-base64) 或 [`hll_from_base64`](../../sql-manual/sql-functions/scalar-functions/hll-functions/hll-from-base64) 函数将数据写入 Doris 内表。

完整流程如下：

1. 在 Hive 中将表创建为 `TEXTFILE` 格式
2. 在 Doris 中创建 [Hive Catalog](../../lakehouse/catalogs/hive-catalog)
3. 在 Doris 中创建对应的 Bitmap / HLL 内表
4. 通过 `INSERT INTO ... SELECT` 从 Hive 写入 Doris

#### Bitmap 完整示例

**1. Hive 端创建 TEXT 格式表**

```sql
CREATE TABLE IF NOT EXISTS `test`.`hive_bitmap_table`(
    `k1`   int       COMMENT '',
    `k2`   String    COMMENT '',
    `k3`   String    COMMENT '',
    `uuid` binary    COMMENT 'bitmap'
) STORED AS TEXTFILE;
```

**2. Doris 端创建 Hive Catalog**

```sql
CREATE CATALOG hive PROPERTIES (
    'type' = 'hms',
    'hive.metastore.uris' = 'thrift://127.0.0.1:9083'
);
```

**3. Doris 端创建 Bitmap 内表**

```sql
CREATE TABLE IF NOT EXISTS `test`.`doris_bitmap_table`(
    `k1`   int                    COMMENT '',
    `k2`   String                 COMMENT '',
    `k3`   String                 COMMENT '',
    `uuid` BITMAP   BITMAP_UNION  COMMENT 'bitmap'
)
AGGREGATE KEY(k1, k2, k3)
DISTRIBUTED BY HASH(`k1`) BUCKETS 1
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);
```

**4. 通过 Catalog 从 Hive 写入 Doris**

```sql
insert into test.doris_bitmap_table
select k1, k2, k3, bitmap_from_base64(uuid)
from hive.test.hive_bitmap_table;
```

#### HLL 完整示例

**1. Hive 端创建 TEXT 格式表**

```sql
CREATE TABLE IF NOT EXISTS `hive_hll_table`(
    `k1`   int       COMMENT '',
    `k2`   String    COMMENT '',
    `k3`   String    COMMENT '',
    `uuid` binary    COMMENT 'hll'
) STORED AS TEXTFILE;

-- 可沿用前文步骤，通过 to_hll 函数从普通表写入数据
```

**2. Doris 端创建 Hive Catalog**

```sql
CREATE CATALOG hive PROPERTIES (
    'type' = 'hms',
    'hive.metastore.uris' = 'thrift://127.0.0.1:9083'
);
```

**3. Doris 端创建 HLL 内表**

```sql
CREATE TABLE IF NOT EXISTS `doris_test`.`doris_hll_table`(
    `k1`   int                  COMMENT '',
    `k2`   varchar(10)          COMMENT '',
    `k3`   varchar(10)          COMMENT '',
    `uuid` HLL   HLL_UNION      COMMENT 'hll'
)
AGGREGATE KEY(k1, k2, k3)
DISTRIBUTED BY HASH(`k1`) BUCKETS 1
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);
```

**4. 通过 Catalog 从 Hive 写入 Doris**

```sql
insert into doris_test.doris_hll_table
select k1, k2, k3, hll_from_base64(uuid)
from hive.hive_test.hive_hll_table;

-- 查看导入结果，可结合 hll_to_base64 解码
select *, hll_to_base64(uuid) from doris_test.doris_hll_table;
+------+------+------+------+---------------------+
| k1   | k2   | k3   | uuid | hll_to_base64(uuid) |
+------+------+------+------+---------------------+
|    1 | a    | b    | NULL | AQFw+a9MhpKhoQ==    |
|    1 | a    | c    | NULL | AQFw+a9MhpKhoQ==    |
|    2 | b    | c    | NULL | AQGyB7kbWBxh+A==    |
|    3 | c    | d    | NULL | AQFYbJB5VpNBhg==    |
+------+------+------+------+---------------------+

-- 在 Doris 内表上使用原生 HLL 函数统计，结果与 Hive 中一致
select k3, hll_cardinality(hll_union(uuid)) from doris_test.doris_hll_table group by k3;
+------+----------------------------------+
| k3   | hll_cardinality(hll_union(uuid)) |
+------+----------------------------------+
| b    |                                1 |
| d    |                                1 |
| c    |                                2 |
+------+----------------------------------+

-- 直接查 Hive 外表（即导入前的数据）做交叉校验，确认数据一致
select k3, hll_cardinality(hll_union(hll_from_base64(uuid)))
from hive.hive_test.hive_hll_table
group by k3;
+------+---------------------------------------------------+
| k3   | hll_cardinality(hll_union(hll_from_base64(uuid))) |
+------+---------------------------------------------------+
| d    |                                                 1 |
| b    |                                                 1 |
| c    |                                                 2 |
+------+---------------------------------------------------+
```

## 注意事项

- **HLL 精度**：HLL 为近似算法，统计结果与精确值通常存在 1%~2% 误差；对精度要求严格的场景请改用 Bitmap。
- **存储格式**：通过 Hive Catalog 导入时，Hive 表需使用 `TEXTFILE` 格式，`binary` 列才会以 Base64 字符串保存。
- **JAR 路径**：示例中的 `hdfs://hostname:port/hive-udf.jar` 需替换为实际的 HDFS 地址，且建议所有 UDF 引用同一份 JAR。
- **函数对应关系**：`to_hll` ↔ `to_bitmap`、`hll_union` ↔ `bitmap_union`、`hll_cardinality` ↔ `bitmap_count`，便于在 Bitmap 与 HLL 方案之间切换。
