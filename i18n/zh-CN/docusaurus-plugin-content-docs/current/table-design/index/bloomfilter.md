---
{
    "title": "BloomFilter 索引",
    "language": "zh-CN",
    "description": "BloomFilter 索引是 Doris 中基于 BloomFilter 算法的跳数索引，用于加速等值查询（= 和 IN），通过跳过不满足条件的数据块减少 I/O 开销。"
}
---

<!-- 知识类型: 功能介绍 + 使用指南 -->
<!-- 适用场景: 高基数字段等值查询加速 -->

BloomFilter 索引是基于 BloomFilter 算法的一种**跳数索引**。它通过快速判断查询值是否可能存在于数据块中，跳过不满足等值查询条件的数据块，从而减少 I/O 开销，加速查询。

### BloomFilter 算法原理

BloomFilter 是 Bloom 在 1970 年提出的一种基于多哈希函数映射的快速查找算法。其核心特点如下：

-   **空间效率高**：使用一个超长的二进制位数组和一组哈希函数，即可表示一个集合。
-   **判断结果**：对某个元素是否存在于集合中的查询，BloomFilter 只会返回两种结果之一：
    -   **可能存在**（存在 Hash 碰撞，可能是假阳性）
    -   **一定不存在**（结果可信）

工作过程如下：

![Bloomfilter Index](/images/next/table-design/bloomfilter.jpg)

1.  二进制位数组初始全部为 0。
2.  插入元素时，元素经过一系列哈希函数计算出多个偏移量，将位数组对应位置置为 1。
3.  查询元素时，同样计算出偏移量；若任一位置为 0，则该元素一定不存在；若全部为 1，则可能存在。

下图展示了一个 m=18, k=3（m 是 Bit 数组大小，k 是 Hash 函数个数）的 BloomFilter 示例。集合中的 x、y、z 三个元素通过 3 个不同的哈希函数散列到位数组中。查询元素 w 时，由于至少有一个对应位为 0，因此 w 一定不在该集合中。

![Bloom_filter.svg](/images/Bloom_filter.svg.png)

由于哈希碰撞的存在，BloomFilter 存在“假阳性”问题。因此，**基于 BloomFilter 的索引只能跳过一定不满足条件的数据，不能精确定位满足条件的数据**。

### Doris 中的实现

Doris BloomFilter 索引以**数据块（page）**为单位构建，每个数据块对应一个 BloomFilter：

-   **写入时**：对数据块中的每个值进行 Hash 计算，并存入对应数据块的 BloomFilter。
-   **查询时**：根据等值条件的值，判断每个数据块对应的 BloomFilter 是否包含该值。若不包含则跳过该数据块，达到减少 I/O、加速查询的目的。

## 使用场景

BloomFilter 索引能够加速等值查询（包括 `=` 和 `IN`），尤其适用于**高基数字段**（如 `userid` 等唯一 ID 字段）。

### 适用场景

| 场景 | 说明 |
|------|------|
| 等值查询 | `WHERE column = value` |
| IN 查询 | `WHERE column IN (v1, v2, ...)` |
| 高基数字段 | 取值种类多、重复率低的字段，如用户 ID、订单号 |

### 使用限制

-   **查询类型限制**：仅对 `=` 和 `IN` 查询有效，对 `!=`、`NOT IN`、`>`、`<` 等查询无效。
-   **数据类型限制**：不支持对 `Tinyint`、`Float`、`Double` 类型的列建立 BloomFilter 索引。
-   **基数限制**：对低基数字段加速效果有限。例如“性别”字段只有两种取值，几乎每个数据块都会包含所有值，BloomFilter 无法过滤数据，索引失去意义。
-   **版本限制**：自 4.1.2 版本起，`CHAR` 类型的 BloomFilter 索引不再生效。

## 管理索引

### 建表时创建 BloomFilter 索引

由于历史原因，BloomFilter 索引的定义语法与倒排索引等通用 `INDEX` 语法不同。BloomFilter 索引通过表的 `PROPERTIES` 属性 `bloom_filter_columns` 指定，可同时指定一个或多个字段：

```sql
PROPERTIES (
    "bloom_filter_columns" = "column_name1,column_name2"
);
```

### 查看 BloomFilter 索引

通过 `SHOW CREATE TABLE` 查看表上已创建的 BloomFilter 索引：

```sql
SHOW CREATE TABLE table_name;
```

### 修改 BloomFilter 索引

通过 `ALTER TABLE` 修改表的 `bloom_filter_columns` 属性，新增或删除 BloomFilter 索引列。

**新增 column_name3 的 BloomFilter 索引**：

```sql
ALTER TABLE table_name SET ("bloom_filter_columns" = "column_name1,column_name2,column_name3");
```

**删除 column_name1 的 BloomFilter 索引**：

```sql
ALTER TABLE table_name SET ("bloom_filter_columns" = "column_name2,column_name3");
```

## 使用索引

BloomFilter 索引用于加速 `WHERE` 条件中的等值查询，**符合条件时自动生效**，无需特殊语法。

### 通过 Query Profile 分析索引效果

可以通过 Query Profile 中的以下指标，分析 BloomFilter 索引的加速效果：

| 指标 | 含义 |
|------|------|
| `RowsBloomFilterFiltered` | BloomFilter 索引过滤掉的行数，可与其他 Rows 指标对比，分析过滤效果 |
| `BlockConditionsFilteredBloomFilterTime` | BloomFilter 索引过滤消耗的时间 |

## 使用示例

下面通过一个示例展示如何在 Doris 中创建 BloomFilter 索引。

在建表语句的 `PROPERTIES` 中通过 `"bloom_filter_columns" = "k1,k2,k3"` 指定建立 BloomFilter 索引的列名。例如，下面的示例对 `saler_id` 和 `category_id` 两个字段创建 BloomFilter 索引：

```sql
CREATE TABLE IF NOT EXISTS sale_detail_bloom (
    sale_date date NOT NULL COMMENT "销售时间",
    customer_id int NOT NULL COMMENT "客户编号",
    saler_id int NOT NULL COMMENT "销售员",
    sku_id int NOT NULL COMMENT "商品编号",
    category_id int NOT NULL COMMENT "商品分类",
    sale_count int NOT NULL COMMENT "销售数量",
    sale_price DECIMAL(12,2) NOT NULL COMMENT "单价",
    sale_amt DECIMAL(20,2) COMMENT "销售总金额"
)
DUPLICATE KEY(sale_date, customer_id, saler_id, sku_id, category_id)
DISTRIBUTED BY HASH(saler_id) BUCKETS 10
PROPERTIES (
    "replication_num" = "1",
    "bloom_filter_columns" = "saler_id,category_id"
);
```
