---
{
    "title": "行列混存",
    "language": "zh-CN",
    "description": "Doris 默认采用列式存储，每个列连续存储，在分析场景（如聚合，过滤，排序等）有很好的性能，因为只需要读取所需要的列减少不必要的 IO。但是在点查场景（比如 SELECT ），需要读取所有列，每个列都需要一次 IO 导致 IOPS 成为瓶颈，特别对列多的宽表（比如上百列）尤为明显。"
}
---

## 行列混存介绍

Doris 默认采用列式存储，每个列连续存储，在分析场景（如聚合，过滤，排序等）有很好的性能，因为只需要读取所需要的列减少不必要的 IO。但是在点查场景（比如 `SELECT *`），需要读取所有列，每个列都需要一次 IO 导致 IOPS 成为瓶颈，特别对列多的宽表（比如上百列）尤为明显。

为了解决点查场景 IOPS 的瓶颈问题，Doris 2.0.0 版本开始支持行列混存，用户建表时指定开启行存后，点查（比如 `SELECT *`）每一行只需要一次 IO，在宽表列很多的情况下性能有数量级提升。

行存的原理是在存储时增加了一个额外的列，这个列将对应行的所有列拼接起来采用特殊的二进制格式存储。

## 使用语法

建表时在表的 PROPERTIES 中指定是否开启行存，哪些列开启行存，行存的存储压缩单元大小 page_size。

1. 是否开启行存：默认为 false 不开启
```
"store_row_column" = "true"
```

2. 行存 page_size：默认为 16KB。
```
"row_store_page_size" = "16384"
```

page 是存储读写的最小单元，page_size 是行存 page 的大小，也就是说读一行也需要产生一个 page 的 IO。这个值越大压缩效果越好存储空间占用越低，但是点查时 IO 开销越大性能越低（因为一次 IO 至少读一个 page），反过来值越小存储空间越高，点查性能越好。默认值 16KB 是大多数情况下比较均衡的选择，如果更偏向查询性能可以配置较小的值比如 4KB 甚至更低，如果更偏向存储空间可以配置较大的值比如 64KB 甚至更高。


## 使用示例

下面的例子创建一个 8 列的表，为了高并发点查性能配置 page_size 为 4KB。

```
CREATE TABLE `tbl_point_query` (
    `key` int(11) NULL,
    `v1` decimal(27, 9) NULL,
    `v2` varchar(30) NULL,
    `v3` varchar(30) NULL,
    `v4` date NULL,
    `v5` datetime NULL,
    `v6` float NULL,
    `v7` datev2 NULL
) ENGINE=OLAP
UNIQUE KEY(`key`)
COMMENT 'OLAP'
DISTRIBUTED BY HASH(`key`) BUCKETS 1
PROPERTIES (
    "enable_unique_key_merge_on_write" = "true",
    "light_schema_change" = "true",
    "store_row_column" = "true",
    "row_store_page_size" = "4096"
);
```

查询
```
SELECT key, v1, v3, v5, v7 FROM tbl_point_query WHERE key = 100；
```

更多点查的使用请参考 [高并发点查](../query-acceleration/high-concurrent-point-query) 。


## 注意事项

1. 开启行存后占用的存储空间会增加，存储空间的增加和数据特点有关，一般是原来表的 2 到 10 倍，具体空间占用需要使用实际数据测试。
2. 行存的 page_size 对存储空间的也有影响，可以根据前面的表属性参数 `row_store_page_size` 说明进行调整。
