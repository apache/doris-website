---
{
    "title": "HLL",
    "language": "zh-CN",
    "description": "HLL 是用作模糊去重，在数据量大的情况性能优于 Count Distinct。HLL 的导入需要结合 hllhash 等函数来使用。更多文档参考HLL。"
}
---

HLL 是用作模糊去重，在数据量大的情况性能优于 Count Distinct。HLL 的导入需要结合 hll_hash 等函数来使用。更多文档参考[HLL](../../../sql-manual/basic-element/sql-data-types/aggregate/HLL)。

## 使用示例

### 第 1 步：准备数据

创建如下的 csv 文件：test_hll.csv

```sql
1001|koga
1002|nijg
1003|lojn
1004|lofn
1005|jfin
1006|kon
1007|nhga
1008|nfubg
1009|huang
1010|buag
```

### 第 2 步：在库中创建表

```sql
CREATE TABLE testdb.test_hll(
    typ_id           BIGINT          NULL   COMMENT "ID",
    typ_name         VARCHAR(10)     NULL   COMMENT "NAME",
    pv               hll hll_union   NOT NULL   COMMENT "hll"
)
AGGREGATE KEY(typ_id,typ_name)
DISTRIBUTED BY HASH(typ_id) BUCKETS 10;
```

### 第 3 步：导入数据

```sql
curl --location-trusted -u <doris_user>:<doris_password> \
    -H "column_separator:|" \
    -H "columns:typ_id,typ_name,pv=hll_hash(typ_id)" \
    -T test_hll.csv \
    -XPUT http://<fe_ip>:<fe_http_port>/api/testdb/test_hll/_stream_load
```

### 第 4 步：检查导入数据

使用 hll_cardinality 进行查询：

```sql
mysql> select typ_id,typ_name,hll_cardinality(pv) from testdb.test_hll;
+--------+----------+---------------------+
| typ_id | typ_name | hll_cardinality(pv) |
+--------+----------+---------------------+
|   1010 | buag     |                   1 |
|   1002 | nijg     |                   1 |
|   1001 | koga     |                   1 |
|   1008 | nfubg    |                   1 |
|   1005 | jfin     |                   1 |
|   1009 | huang    |                   1 |
|   1004 | lofn     |                   1 |
|   1007 | nhga     |                   1 |
|   1003 | lojn     |                   1 |
|   1006 | kon      |                   1 |
+--------+----------+---------------------+
10 rows in set (0.06 sec)
```