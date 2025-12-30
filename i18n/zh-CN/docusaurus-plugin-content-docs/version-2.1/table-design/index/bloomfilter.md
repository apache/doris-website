---
{
    "title": "BloomFilter 索引",
    "language": "zh-CN",
    "description": "BloomFilter 索引是基于 BloomFilter 的一种跳数索引。它的原理是利用 BloomFilter 跳过等值查询指定条件不满足的数据块，达到减少 I/O 查询加速的目的。"
}
---

## 索引原理


BloomFilter 索引是基于 BloomFilter 的一种跳数索引。它的原理是利用 BloomFilter 跳过等值查询指定条件不满足的数据块，达到减少 I/O 查询加速的目的。

BloomFilter 是由 Bloom 在 1970 年提出的一种多哈希函数映射的快速查找算法。通常应用在一些需要快速判断某个元素是否属于集合，但是并不严格要求 100% 正确的场合，BloomFilter 有以下特点：

-   空间效率高的概率型数据结构，用来检查一个元素是否在一个集合中。

-   对于一个元素检测是否存在的调用，BloomFilter 会告诉调用者两个结果之一：可能存在或者一定不存在。

BloomFilter 是由一个超长的二进制位数组和一系列的哈希函数组成。二进制位数组初始全部为 0，当给定一个待查询的元素时，这个元素会被一系列哈希函数计算映射出一系列的值，所有的值在位数组的偏移量处置为 1。

下图所示出一个 m=18, k=3（m 是该 Bit 数组的大小，k 是 Hash 函数的个数）的 BloomFilter 示例。集合中的 x、y、z 三个元素通过 3 个不同的哈希函数散列到位数组中。当查询元素 w 时，通过 Hash 函数计算之后只要有一个位为 0，因此 w 不在该集合中。但是反过来全部都是 1 只能说明可能在集合中、不能肯定一定在集合中，因为 Hash 函数可能出现 Hash 碰撞。

![Bloom_filter.svg](/images/Bloom_filter.svg.png)


反过来如果某个元素经过哈希函数计算后得到所有的偏移位置，若这些位置全都为 1，只能说明可能在集合中、不能肯定一定在集合中，因为 Hash 函数可能出现 Hash 碰撞。这就是 BloomFilter“假阳性”，因此基于 BloomFilter 的索引只能跳过不满足条件的数据，不能精确定位满足条件的数据。

Doris BloomFilter 索引以数据块（page）为单位构建，每个数据块存储一个 BloomFilter。写入时，对于数据块中的每个值，经过 Hash 存入数据块对应的 BloomFilter。查询时，根据等值条件的值，判断每个数据块对应的 BloomFilter 是否包含这个值，不包含则跳过对应的数据块不读取，达到减少 I/O 查询加速的目的。


## 使用场景

BloomFilter 索引能够对等值查询（包括 = 和 IN）加速，对高基数字段效果较好，比如 `userid` 等唯一 ID 字段。

:::tip

BloomFilter 的使用有下面一些限制：

- 对 IN 和 = 之外的查询没有效果，比如 !=, NOT IN, >, < 等

- 不支持对 Tinyint、Float、Double 类型的列建 BloomFilter 索引。

- 对低基数字段的加速效果很有限，比如“性别”字段仅有两种值，几乎每个数据块都会包含所有取值，导致 BloomFilter 索引失去意义。


如果要查看某个查询 BloomFilter 索引效果，可以通过 Query Profile 中的相关指标进行分析。

- BlockConditionsFilteredBloomFilterTime 是 BloomFilter 索引消耗的时间

- RowsBloomFilterFiltered 是 BloomFilter 过滤掉的行数，可以与其他几个 Rows 值对比分析 BloomFilter 索引过滤效果

:::

## 管理索引

### 建表时创建 BloomFilter 索引

由于历史原因，BloomFilter 索引定义的语法与倒排索引等通用 INDEX 语法不一样。BloomFilter 索引通过表的 PROPERTIES  "bloom_filter_columns" 指定哪些字段建 BloomFilter 索引，可以指定一个或者多个字段。

```sql
PROPERTIES (
"bloom_filter_columns" = "column_name1,column_name2"
);
```

### 查看 BloomFilter 索引

```sql
SHOW CREATE TABLE table_name;
```

### 已有表增加、删除 BloomFilter 索引

通过 ALTER TABLE 修改表的 bloom_filter_columns 属性来完成。

**为 column_name3 增加 BloomFilter 索引**
```SQL
ALTER TABLE table_name SET ("bloom_filter_columns" = "column_name1,column_name2,column_name3");
```

**删除 column_name1 的 BloomFilter 索引**
```SQL
ALTER TABLE table_name SET ("bloom_filter_columns" = "column_name2,column_name3");
```

## 使用索引

BloomFilter 索引用于加速 WHERE 条件中的等值查询，能加速时自动生效，没有特殊语法。

可以通过 Query Profile 中的下面几个指标分析 BloomFilter 索引的加速效果。
- RowsBloomFilterFiltered BloomFilter 索引过滤掉的行数，可以与其他几个 Rows 值对比分析索引过滤效果
- BlockConditionsFilteredBloomFilterTime BloomFilter 倒排索引消耗的时间

## 使用示例

下面通过实例来看看 Doris 怎么创建 BloomFilter 索引。

Doris BloomFilter 索引的创建是通过在建表语句的 PROPERTIES 里加上 "bloom_filter_columns"="k1,k2,k3", 这个属性，k1,k2,k3 是要创建的 BloomFilter 索引的 Key 列名称，例如下面对表里的 saler_id,category_id 创建了 BloomFilter 索引。

```sql
CREATE TABLE IF NOT EXISTS sale_detail_bloom  (
    sale_date date NOT NULL COMMENT "销售时间",
    customer_id int NOT NULL COMMENT "客户编号",
    saler_id int NOT NULL COMMENT "销售员",
    sku_id int NOT NULL COMMENT "商品编号",
    category_id int NOT NULL COMMENT "商品分类",
    sale_count int NOT NULL COMMENT "销售数量",
    sale_price DECIMAL(12,2) NOT NULL COMMENT "单价",
    sale_amt DECIMAL(20,2)  COMMENT "销售总金额"
)
Duplicate  KEY(sale_date, customer_id,saler_id,sku_id,category_id)
DISTRIBUTED BY HASH(saler_id) BUCKETS 10
PROPERTIES (
"replication_num" = "1",
"bloom_filter_columns"="saler_id,category_id"
);
```
