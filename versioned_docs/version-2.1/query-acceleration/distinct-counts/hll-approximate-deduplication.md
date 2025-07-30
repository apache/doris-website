---
{
"title": "HLL Approximate Deduplication",
"language": "en"
}
---

# HLL Approximate Deduplication

## Use Cases

In real-world business scenarios, as the volume of business data grows, the pressure of deduplication also increases. When the data reaches a certain scale, the cost of precise deduplication becomes increasingly high. **HLL** (HyperLogLog) stands out for its excellent space complexity of O(m⋅log⁡log⁡n) time complexity of O(n), and a controlled error rate of 1%–2%, depending on the dataset size and the hash function used.

When acceptable to the business, using approximate algorithms for fast deduplication is an effective way to reduce computational pressure.

------

## What is HyperLogLog

HyperLogLog (HLL) is an enhanced version of the LogLog algorithm. It is used for approximate distinct counting and is mathematically based on **Bernoulli trials**.

### Explanation:

Imagine flipping a coin with heads and tails. Each flip has a 50% probability of landing on either side. Keep flipping the coin until it shows heads, and record the number of flips as one trial.

For multiple Bernoulli trials:

- Let n be the number of heads obtained after n trials.
- Let k be the number of flips required in each trial. For example, if it took 12 flips to get heads in a trial, k_max would be 12 for this set of trials.

Bernoulli trials yield the following conclusions:

1. In n trials, no trial will require more than k_max flips.
2. At least one trial will require exactly k_max flips.

By applying maximum likelihood estimation, it can be derived that:

n = 2 ^ k_max

Thus, by recording only k_max, the total number of unique items (cardinality) can be estimated.

------

## Use HLL for Approximate Deduplication

### Creating a Table

1. When using HLL for deduplication:
   - The target column type must be set to `HLL`.
   - The aggregation function must be set to `HLL_UNION`.
2. HLL-type columns cannot be used as key columns.
3. Users do not need to specify the length or default value. The system internally manages the length based on data aggregation levels.

Example table creation:

```sql
CREATE TABLE test_hll(
        dt DATE,
        id INT,
        name CHAR(10),
        province CHAR(10),
        os CHAR(10),
        uv HLL HLL_UNION
)
AGGREGATE KEY (dt, id, name, province, os)
DISTRIBUTED BY HASH(id) BUCKETS 10
PROPERTIES(
        "replication_num" = "1",
        "in_memory"="false"
);
```

------

### Importing Data

Here is sample data (`test_hll.csv`) that can be imported using Stream Load:

```csv
2022-05-05,10001,Test 01,Beijing,windows 
2022-05-05,10002,Test 01,Beijing,linux 
2022-05-05,10003,Test 01,Beijing,macos 
2022-05-05,10004,Test 01,Hebei,windows 
2022-05-06,10001,Test 01,Shanghai,windows 
2022-05-06,10002,Test 01,Shanghai,linux 
2022-05-06,10003,Test 01,Jiangsu,macos 
2022-05-06,10004,Test 01,Shaanxi,windows
```

**Stream Load Command**:

```bash
curl --location-trusted -u root: -H "label:label_test_hll_load" \
    -H "column_separator:," \
    -H "columns:dt,id,name,province,os, uv=hll_hash(id)" -T test_hll.csv http://fe_IP:8030/api/demo/test_hll/_stream_load
```

**Result**:

```json
{
    "TxnId": 693,
    "Label": "label_test_hll_load",
    "TwoPhaseCommit": "false",
    "Status": "Success",
    "Message": "OK",
    "NumberTotalRows": 8,
    "NumberLoadedRows": 8,
    "NumberFilteredRows": 0,
    "NumberUnselectedRows": 0,
    "LoadBytes": 320,
    "LoadTimeMs": 23,
    "BeginTxnTimeMs": 0,
    "StreamLoadPutTimeMs": 1,
    "ReadDataTimeMs": 0,
    "WriteDataTimeMs": 9,
    "CommitAndPublishTimeMs": 11
}
```

------

## Querying Data

HLL columns cannot return raw values directly. Instead, HLL aggregate functions must be used for queries.

**Total UV Calculation**:

```sql
SELECT HLL_UNION_AGG(uv) FROM test_hll;
+---------------------+
| hll_union_agg(`uv`) |
+---------------------+
|                   4 |
+---------------------+
```

Equivalent to:

```sql
SELECT COUNT(DISTINCT id) FROM test_hll;
+----------------------+
| count(DISTINCT `id`) |
+----------------------+
|                    4 |
+----------------------+
```

**Daily UV Calculation**:

```sql
SELECT dt, HLL_UNION_AGG(uv) FROM test_hll GROUP BY dt;
+------------+---------------------+
| dt         | hll_union_agg       |
+------------+---------------------+
| 2022-05-05 |                   4 |
| 2022-05-06 |                   4 |
+------------+---------------------+
```

------

## Related Functions

- **HLL_UNION_AGG(hll)**: An aggregate function to estimate the cardinality of all data meeting the conditions.
- **HLL_CARDINALITY(hll)**: A function to calculate the cardinality of a single HLL column.
- **HLL_HASH(column_name)**: Generates an HLL column type, used during insert or data import (as shown above).
- **HLL_EMPTY()**: Generates an empty HLL column for default values during `INSERT` or data import.
