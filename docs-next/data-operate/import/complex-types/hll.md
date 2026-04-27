---
{
    "title": "HLL",
    "language": "en",
    "description": "HLL is used for approximate deduplication and performs better than Count Distinct when dealing with large data volumes."
}
---

HLL is used for approximate deduplication and performs better than Count Distinct when dealing with large data volumes. The load of HLL needs to be combined with functions like hll_hash. For more documentation, refer to [HLL](../../../sql-manual/basic-element/sql-data-types/aggregate/HLL).

## Usage Example

### Step 1: Prepare Data

Create the following CSV file: test_hll.csv

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

### Step 2: Create Table in Database

```sql
CREATE TABLE testdb.test_hll(
    typ_id           BIGINT          NULL   COMMENT "ID",
    typ_name         VARCHAR(10)     NULL   COMMENT "NAME",
    pv               hll hll_union   NOT NULL   COMMENT "hll"
)
AGGREGATE KEY(typ_id,typ_name)
DISTRIBUTED BY HASH(typ_id) BUCKETS 10;
```

### Step 3: Load Data

```sql
curl --location-trusted -u <doris_user>:<doris_password> \
    -H "column_separator:|" \
    -H "columns:typ_id,typ_name,pv=hll_hash(typ_id)" \
    -T test_hll.csv \
    -XPUT http://<fe_ip>:<fe_http_port>/api/testdb/test_hll/_stream_load
```

### Step 4: Check Loaded Data

Use hll_cardinality to query:

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