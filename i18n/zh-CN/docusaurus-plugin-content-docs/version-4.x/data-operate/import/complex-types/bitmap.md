---
{
    "title": "Bitmap",
    "language": "zh-CN",
    "description": "BITMAP 类型可以在 Duplicate 表、Unique 表、Aggregate 表中使用，只能作为 Key 类，无法作为 Value 列使用。在 Aggregate 表中使用 BITMAP 类型，其建表时必须使用聚合类型 BITMAPUNION。用户不需要指定长度和默认值。"
}
---

BITMAP 类型可以在 Duplicate 表、Unique 表、Aggregate 表中使用，只能作为 Key 类，无法作为 Value 列使用。在 Aggregate 表中使用 BITMAP 类型，其建表时必须使用聚合类型 BITMAP_UNION。用户不需要指定长度和默认值。长度根据数据的聚合程度系统内控制。更多文档参考[Bitmap](../../../sql-manual/basic-element/sql-data-types/aggregate/BITMAP)。

## 使用示例

### 第 1 步：准备数据

创建如下的 csv 文件：test_bitmap.csv

```sql
1|koga|17723
2|nijg|146285
3|lojn|347890
4|lofn|489871
5|jfin|545679
6|kon|676724
7|nhga|767689
8|nfubg|879878
9|huang|969798
10|buag|97997
```

### 第 2 步：在库中创建表

```sql
CREATE TABLE testdb.test_bitmap(
    typ_id     BIGINT                NULL   COMMENT "ID",
    hou        VARCHAR(10)           NULL   COMMENT "one",
    arr        BITMAP  BITMAP_UNION  NOT NULL   COMMENT "two"
)
AGGREGATE KEY(typ_id,hou)
DISTRIBUTED BY HASH(typ_id,hou) BUCKETS 10;
```

### 第 3 步：导入数据

```sql
curl --location-trusted -u <doris_user>:<doris_password> \
    -H "column_separator:|" \
    -H "columns:typ_id,hou,arr,arr=to_bitmap(arr)" \
    -T test_bitmap.csv \
    -XPUT http://<fe_ip>:<fe_http_port>/api/testdb/test_bitmap/_stream_load
```

### 第 4 步：检查导入数据

```sql
mysql> select typ_id,hou,bitmap_to_string(arr) from testdb.test_bitmap;
+--------+-------+-----------------------+
| typ_id | hou   | bitmap_to_string(arr) |
+--------+-------+-----------------------+
|      4 | lofn  | 489871                |
|      6 | kon   | 676724                |
|      9 | huang | 969798                |
|      3 | lojn  | 347890                |
|      8 | nfubg | 879878                |
|      7 | nhga  | 767689                |
|      1 | koga  | 17723                 |
|      2 | nijg  | 146285                |
|      5 | jfin  | 545679                |
|     10 | buag  | 97997                 |
+--------+-------+-----------------------+
10 rows in set (0.07 sec)
```

## 导入含有多个元素的 bitmap 

以下展示了 stream load 导入含有多个元素的 bitmap 列的两种方法，用户可以根据自己源文件格式选择合适的方法。

### bitmap_from_string

使用 `bitmap_from_string` 导入不允许源文件中 arr 列存在方括号，否则会认为是数据质量错误。

```sql
1|koga|17,723
2|nijg|146,285
3|lojn|347,890
4|lofn|489,871
5|jfin|545,679
6|kon|676,724
7|nhga|767,689
8|nfubg|879,878
9|huang|969,798
10|buag|97,997
```

stream load 命令

```sql
curl --location-trusted -u <doris_user>:<doris_password> \
    -H "column_separator:|" \
    -H "columns:typ_id,hou,arr,arr=bitmap_from_string(arr)" \
    -T test_bitmap.csv \
    -XPUT http://<fe_ip>:<fe_http_port>/api/testdb/test_bitmap/_stream_load
```

### bitmap_from_array

使用 `bitmap_from_array` 导入允许源文件中 arr 列存在方括号，但是在 stream load 中必须先将 string 类型 cast 成 array 类型使用。
如果不加 cast 转换参数类型，会因为找不到正确的函数签名报错 `[ANALYSIS_ERROR]TStatus: errCode = 2, detailMessage = Does not support non-builtin functions, or function does not exist: bitmap_from_array(<slot 8>)`。

```sql
1|koga|[17,723]
2|nijg|[146,285]
3|lojn|[347,890]
4|lofn|[489,871]
5|jfin|[545,679]
6|kon|[676,724]
7|nhga|[767,689]
8|nfubg|[879,878]
9|huang|[969,798]
10|buag|[97,997]
```

stream load 命令

```sql
curl --location-trusted -u <doris_user>:<doris_password> \
    -H "column_separator:|" \
    -H "columns:typ_id,hou,arr_str,arr=bitmap_from_array(cast(arr_str as array<int>))" \
    -T test_bitmap.csv \
    -XPUT http://<fe_ip>:<fe_http_port>/api/testdb/test_bitmap/_stream_load
```
