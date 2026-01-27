---
{
    "title": "BITMAP",
    "language": "zh-CN",
    "description": "BITMAP"
}
---

## BITMAP
## 描述
BITMAP

BITMAP 类型的列可以在 Aggregate 表、Unique 表或 Duplicate 表中使用。
在 Unique 表或 duplicate 表中使用时，其必须作为非 key 列使用。
在 Aggregate 表中使用时，其必须作为非 key 列使用，且建表时配合的聚合类型为 BITMAP_UNION。
用户不需要指定长度和默认值。长度根据数据的聚合程度系统内控制。
并且 BITMAP 列只能通过配套的 bitmap_union_count、bitmap_union、bitmap_hash、bitmap_hash64 等函数进行查询或使用。

离线场景下使用 BITMAP 会影响导入速度，在数据量大的情况下查询速度会慢于 HLL，并优于 Count Distinct。
注意：实时场景下 BITMAP 如果不使用全局字典，使用了 bitmap_hash() 可能会导致有千分之一左右的误差。如果这个误差不可接受，可以使用 bitmap_hash64。

## 举例

建表示例如下：

    create table metric_table (
      datekey int,
      hour int,
      device_id bitmap BITMAP_UNION
    )
    aggregate key (datekey, hour)
    distributed by hash(datekey, hour) buckets 1
    properties(
      "replication_num" = "1"
    );

插入数据示例：

    insert into metric_table values
    (20200622, 1, to_bitmap(243)),
    (20200622, 2, bitmap_from_array([1,2,3,4,5,434543])),
    (20200622, 3, to_bitmap(287667876573));

查询数据示例：

    select hour, BITMAP_UNION_COUNT(pv) over(order by hour) uv from(
       select hour, BITMAP_UNION(device_id) as pv
       from metric_table -- 查询每小时的累计UV
       where datekey=20200622
    group by hour order by 1
    ) final;

在查询时，可以设置[会话变量](../../../../sql-manual/sql-statements/session/variable/SET-VARIABLE)`return_object_data_as_binary`为 true，这样 bitmap 会以二进制的形式返回。

### keywords

    BITMAP
