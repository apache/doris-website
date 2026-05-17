---
{
    "title": "HLL Approximate Deduplication",
    "language": "en",
    "description": "How to use HLL (HyperLogLog) for approximate deduplication in Doris? With 1%-2% error, O(mloglogn) space complexity, suitable for large-scale UV / cardinality statistics.",
    "keywords": [
        "HLL",
        "HyperLogLog",
        "approximate deduplication",
        "cardinality statistics",
        "UV statistics",
        "HLL_UNION_AGG",
        "HLL_HASH"
    ]
}
---

<!-- Knowledge type: Capability definition / Operational steps -->
<!-- Applicable scenarios: Large-scale data deduplication / UV statistics / Cardinality estimation -->

HLL (HyperLogLog) is an approximate deduplication solution based on a probabilistic algorithm. Within a 1%-2% error range, it computes the cardinality (Distinct Count) of massive datasets with very low space and time overhead.

## Use Cases

<!-- Knowledge type: Architecture selection decision -->

As business data volumes keep growing, the computation and storage costs of exact deduplication rise sharply. Once data reaches a certain scale, exact deduplication is no longer economical.

The HLL algorithm has the following characteristics:

| Dimension        | Behavior                                              |
| :--------------- | :---------------------------------------------------- |
| Space complexity | O(mloglogn)                                           |
| Time complexity  | O(n)                                                  |
| Error range      | About 1%-2% (depends on the dataset and hash function) |

When the business can tolerate the error, using HLL for approximate deduplication is an effective way to reduce computational pressure and accelerate queries.

- Who it suits: scenarios with huge data volumes, tolerance for 1%-2% error, and a need to balance query performance and storage cost.
- How to use it: when creating a table, set the column type to `HLL` and the aggregation function to `HLL_UNION`; during data loading, generate HLL values with `HLL_HASH()`; at query time, aggregate with `HLL_UNION_AGG()`.
- Common uses: UV statistics, user deduplication, unique device count estimation.

## What Is HyperLogLog

<!-- Knowledge type: Principle explanation -->

HyperLogLog is an upgraded version of the LogLog algorithm. It provides imprecise cardinality (distinct count) estimation, and its mathematical foundation is the **Bernoulli trial**.

### An Intuitive Explanation of the Bernoulli Trial

- Assume a coin has two sides, and a single toss has a 50% probability of landing on either side.
- Keep tossing the coin until heads appears, and record this as one complete trial.
- Repeat for n trials, meaning heads has appeared n times. Let k denote the number of tosses in each trial, and let k_i denote the i-th trial.
- Across the n trials, there must be a maximum number of tosses, denoted as k_max (for example, in one trial it took 12 tosses for heads to appear).

### Conclusions Derived

- The number of tosses in each of the n Bernoulli trials is no greater than k_max.
- At least one of the n Bernoulli trials has a toss count equal to k_max.

Combined with maximum likelihood estimation, the relationship between n and k_max can be estimated as: **n = 2 ^ k_max**.

In other words, **as long as you record k_max, you can estimate the total number of records, that is, the cardinality**. This is the core idea of the HLL algorithm.

## Using HLL for Approximate Deduplication

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: Create table -> Load data -> Query -->

### Step 1: Create the table

**Goal**: Create an aggregate table that supports HLL deduplication.

**Constraints**:

1. The target column type must be set to `HLL`, and the aggregation function must be set to `HLL_UNION`.
2. An HLL-type column cannot be used as a Key column.
3. You do not need to specify the length or default value. The length of an HLL column is internally controlled by the system based on the degree of data aggregation.

**Example**:

```SQL
create table test_hll(
        dt date,
        id int,
        name char(10),
        province char(10),
        os char(10),
        uv hll hll_union
)
Aggregate KEY (dt,id,name,province,os)
distributed by hash(id) buckets 10
PROPERTIES(
        "replication_num" = "1",
        "in_memory"="false"
);
```

### Step 2: Load data

**Goal**: Convert raw detail data to an HLL column with `HLL_HASH()` and write it into the table.

**Sample data** (`test_hll.csv`):

```SQL
2022-05-05,10001,test01,Beijing,windows 
2022-05-05,10002,test01,Beijing,linux 
2022-05-05,10003,test01,Beijing,macos 
2022-05-05,10004,test01,Hebei,windows 
2022-05-06,10001,test01,Shanghai,windows 
2022-05-06,10002,test01,Shanghai,linux 
2022-05-06,10003,test01,Jiangsu,macos 
2022-05-06,10004,test01,Shaanxi,windows
```

#### Stream Load command

```SQL
curl --location-trusted -u root: -H "label:label_test_hll_load" \
    -H "column_separator:," \
    -H "columns:dt,id,name,province,os,uv=hll_hash(id)" -T test_hll.csv http://fe_IP:8030/api/demo/test_hll/_stream_load
```

#### Sample load result

```SQL
# curl --location-trusted -u root: -H "label:label_test_hll_load"     -H "column_separator:,"     -H "columns:dt,id,name,province,os, pv=hll_hash(id)" -T test_hll.csv http://127.0.0.1:8030/api/demo/test_hll/_stream_load

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

### Step 3: Query data

**Goal**: Get approximate deduplication results through HLL aggregation functions.

> Note: HLL columns do not allow direct querying of raw values. You can only query them through HLL aggregation functions.

#### Total UV

```SQL
mysql> select HLL_UNION_AGG(uv) from test_hll;
+---------------------+
| hll_union_agg(`uv`) |
+---------------------+
|                   4 |
+---------------------+
1 row in set (0.00 sec)
```

Equivalent form:

```SQL
mysql> SELECT COUNT(DISTINCT uv) FROM test_hll;
+----------------------+
| count(DISTINCT `uv`) |
+----------------------+
|                    4 |
+----------------------+
1 row in set (0.01 sec)
```

#### UV per day

```SQL
mysql> select HLL_UNION_AGG(uv) from test_hll group by dt;
+---------------------+
| hll_union_agg(`uv`) |
+---------------------+
|                   4 |
|                   4 |
+---------------------+
2 rows in set (0.01 sec)
```

## Related Functions

<!-- Knowledge type: Configuration parameters / Function list -->

| Function                   | Purpose                                                                                  |
| :------------------------- | :--------------------------------------------------------------------------------------- |
| `HLL_UNION_AGG(hll)`       | Aggregation function used to compute the cardinality estimate of all matching data       |
| `HLL_CARDINALITY(hll)`     | Computes the cardinality estimate of a single HLL column value                           |
| `HLL_HASH(column_name)`    | Generates an HLL column type, used during Insert or data loading (loading usage above)   |
| `HLL_EMPTY()`              | Generates an empty HLL column, used to fill default values during `insert` or data loading |
