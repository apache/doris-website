---
{
    "title": "EXPLAIN",
    "language": "en",
    "description": "The EXPLAIN statement displays Doris's query execution plan for a given query."
}
---

## Description

The EXPLAIN statement displays Doris's query execution plan for a given query. Doris's query optimizer aims to create an efficient plan using statistical data, data characteristics, and features like HASH JOIN, partitioning, and bucketing. However, due to theoretical and practical constraints, the plan may sometimes under perform. 

To improve performance, it's essential to analyze the current plan. This article teaches how to use the EXPLAIN statement for optimization.



## Syntax

```plain text
{EXPLAIN | DESC} [VERBOSE] <query_block>
```

## Required Parameters

**<query_block>**

> This is the query statement for which you want the explain plan.

## Optional Parameters

**[VERBOSE]**

> Whether to display detailed information is determined by the `VERBOSE` specification. With `VERBOSE`, comprehensive details are shown, including specifics on each operator, the tuple IDs they use, and detailed descriptions for each tuple. Without it, concise information is provided.


## Return Results

### Basic Concepts

To better understand the information displayed by `EXPLAIN`, let's introduce a few core concepts of the Doris execution plan.

| Name      | Explanation                                                  |
| :-------- | :----------------------------------------------------------- |
| PLAN      | Execution plan. A query is translated into an execution plan by the execution planner, which is then executed by the execution engine. |
| FRAGMENT  | Execution fragment. Since Doris is a distributed execution engine, a complete execution plan is divided into multiple single-node execution fragments. A FRAGMENT table represents a complete single-node execution fragment. Multiple FRAGMENTS combine to form a complete PLAN. |
| PLAN NODE | Operator. The smallest unit of the execution plan. A FRAGMENT consists of multiple operators. Each operator is responsible for a specific execution logic, such as aggregation, joins, etc. |

### Return Result Structure

The result of the Doris `EXPLAIN` statement is a complete PLAN. Within the PLAN, FRAGMENTS are ordered from back to front based on the execution sequence. Within each FRAGMENT, operators (PLAN NODES) are also ordered from back to front based on the execution sequence.

An example is provided below:


```sql
+--------------------------------------------------+
| Explain String(Nereids Planner)                  |
+--------------------------------------------------+
| PLAN FRAGMENT 0                                  |
|   OUTPUT EXPRS:                                  |
|     cnt[#10]                                     |
|     cnt[#11]                                     |
|   PARTITION: UNPARTITIONED                       |
|                                                  |
|   HAS_COLO_PLAN_NODE: false                      |
|                                                  |
|   VRESULT SINK                                   |
|      MYSQL_PROTOCAL                              |
|                                                  |
|   7:VEXCHANGE                                    |
|      offset: 0                                   |
|      distribute expr lists:                      |
|                                                  |
| PLAN FRAGMENT 1                                  |
|                                                  |
|   PARTITION: RANDOM                              |
|                                                  |
|   HAS_COLO_PLAN_NODE: false                      |
|                                                  |
|   STREAM DATA SINK                               |
|     EXCHANGE ID: 07                              |
|     UNPARTITIONED                                |
|                                                  |
|   6:VHASH JOIN(354)                              |
|   |  join op: INNER JOIN(BROADCAST)[]            |
|   |  equal join conjunct: cnt[#7] = cnt[#5]      |
|   |  cardinality=1                               |
|   |  vec output tuple id: 8                      |
|   |  vIntermediate tuple ids: 7                  |
|   |  hash output slot ids: 5 7                   |
|   |  distribute expr lists:                      |
|   |  distribute expr lists:                      |
|   |                                              |
|   |----4:VEXCHANGE                               |
|   |       offset: 0                              |
|   |       distribute expr lists:                 |
|   |                                              |
|   5:VEXCHANGE                                    |
|      offset: 0                                   |
|      distribute expr lists:                      |
|                                                  |
| PLAN FRAGMENT 2                                  |
|   ...                                            |
|                                                  |
| PLAN FRAGMENT 3                                  |
|   ...                                            |
+--------------------------------------------------+
```

Operators are linked to their child nodes with dashed lines. When an operator has multiple children, they are arranged vertically, representing a right-to-left order. In the example above, operator 6 (VHASH JOIN) has operator 5 (EXCHANGE) as its left child and operator 4 (EXCHANGE) as its right child.


### Fragment Field Descriptions


| Name               | Description                                                  |
| :----------------- | :----------------------------------------------------------- |
| PARTITION          | Displays the data distribution of the current Fragment       |
| HAS_COLO_PLAN_NODE | Indicates if the fragment contains colocate operators        |
| Sink               | The method of fragment data output, see the table below for details |



**Sink Methods**


| Name               | Description                                                  |
| :----------------- | :----------------------------------------------------------- |
| STREAM DATA SINK   | Outputs data to the next Fragment. It includes two lines of information.<br />First line: The downstream EXCHANGE NODE to which data is sent.<br />Second line: The method of data distribution. <br />  - UNPARTITIONED means each downstream instance receives the full data set. This typically occurs in broadcast joins or when single-instance logic is required, such as global limit or order by.<br /> - RANDOM means each downstream instance receives a random subset of data without repetition.<br /> - HASH_PARTITIONED uses the listed slots as keys to hash and send data shards to the same downstream instance. This is often used upstream of partition hash joins or the second stage of two-phase aggregations. |
| RESULT SINK        | Sends result data to the FE. The first line indicates the protocol used for data transmission, currently supporting MySQL and arrow protocols. |
| OLAP TABLE SINK    | Writes data to an OLAP table.                                |
| MultiCastDataSinks | A multicast operator that contains multiple STREAM DATA SINKs. Each STREAM DATA SINK sends the full data set to its downstream. |



### Tuple Information Description

When using VERBOSE mode, Tuple information is output. Tuple information describes the SLOT details within a row of data, including SLOT type, nullable status, etc.

The output contains multiple TupleDescriptors, each containing multiple SlotDescriptors. An example is shown below:

```sql
Tuples:
TupleDescriptor{id=0, tbl=t1}
  SlotDescriptor{id=0, col=c1, colUniqueId=0, type=int, nullable=true, isAutoIncrement=false, subColPath=null}
  SlotDescriptor{id=2, col=c3, colUniqueId=2, type=int, nullable=true, isAutoIncrement=false, subColPath=null}
```

#### TupleDescriptor



| Name | Description                                                  |
| :--- | :----------------------------------------------------------- |
| id   | The id of the tuple descriptor                               |
| tbl  | The corresponding table of the tuple, or `null` if not applicable  |



#### SlotDescriptor

| Name            | Description                                                  |
| :-------------- | :----------------------------------------------------------- |
| id              | The id of the slot descriptor                                |
| col             | The corresponding column of the slot, or left blank if not applicable |
| colUniqueId     | The unique id of the corresponding column, or -1 if not applicable |
| type            | The type of the slot                                         |
| nullable        | Indicates if the corresponding data can be null              |
| isAutoIncrement | Indicates if the column is auto-incremented                  |
| subColPath      | The sub-column path within the column, currently only applies to variant types |

### Operator Descriptions

#### Operator List

| Name                  | Description                                                  |
| :-------------------- | :----------------------------------------------------------- |
| AGGREGATE             | Aggregation operator                                         |
| ANALYTIC              | Window function operator                                     |
| ASSERT NUMBER OF ROWS | Operator to check the number of downstream output rows       |
| EXCHANGE              | Data exchange receiver operator                              |
| MERGING-EXCHANGE      | Data exchange receiver with sorting and row limit functionality |
| HASH JOIN             | Hash join operator                                           |
| NESTED LOOP JOIN      | Nested loop join operator                                    |
| PartitionTopN         | Intra-partition data pre-filtering operator                  |
| REPEAT_NODE           | Data replication operator                                    |
| DataGenScanNode       | Table-valued function operator                               |
| EsScanNode            | ES table scan operator                                       |
| HIVE_SCAN_NODE        | Hive table scan operator                                     |
| HUDI_SCAN_NODE        | Hudi table scan operator                                     |
| ICEBERG_SCAN_NODE     | Iceberg table scan operator                                  |
| PAIMON_SCAN_NODE      | Paimon table scan operator                                   |
| JdbcScanNode          | Jdbc table scan operator                                     |
| OlapScanNode          | Olap table scan operator                                     |
| SELECT                | Filtering operator                                           |
| UNION                 | Set union operator                                           |
| EXCEPT                | Set difference operator                                      |
| INTERSECT             | Set intersection operator                                    |
| SORT                  | Sorting operator                                             |
| TOP-N                 | Sort and return top N results operator                       |
| TABLE FUNCTION NODE   | Table function operator (lateral view)                       |



#### Common Fields



| Name                    | Description                                                  |
| :---------------------- | :----------------------------------------------------------- |
| limit                   | Limits the number of output rows                             |
| offset                  | Number of rows to skip before outputting                     |
| conjuncts               | Filters the results of the current node. Executed before projections. |
| projections             | Projection operations after the current operator. Executed after conjuncts. |
| project output tuple id | The output tuple after projection. The slot arrangement within the data tuple can be seen via tuple desc. |
| cardinality             | Estimated row count by the optimizer                         |
| distribute expr lists   | The original data distribution method for the child nodes of the current node |
| Expression's slot id    | The specific slot corresponding to the slot id can be found in the tuple list in verbose mode. This list provides information such as slot type and nullable attributes. Represented as `[#5]` after the expression. |



#### AGGREGATE



| Name                | Description                                                  |
| :------------------ | :----------------------------------------------------------- |
| (Aggregation Phase) | The aggregation phase is represented by two terms.<br /> The first term can be either update (local aggregation) or merge (global aggregation).<br /> The second term indicates whether the current data is serialized (serialize) or has completed final calculations (finalize). |
| STREAMING           | Only local aggregation operators in multi-stage aggregation truncation have this flag. Indicates that the current aggregation node may use STREAMING mode, where input data is passed directly to the next stage of aggregation without actual computation. |
| output              | The output of the current aggregation operator. All local pre-aggregation functions are prefixed with partial. |
| group by            | The key for aggregation                                      |



#### ANALYTIC



| Name         | Description                                                  |
| :----------- | :----------------------------------------------------------- |
| functions    | The name of the current window function                      |
| partition by | Corresponds to the partition by clause in the over clause of the window function. Windowing expression. |
| order by     | Sorting expression and order within the window               |
| window       | Window range                                                 |



#### ASSERT NUMBER OF ROWS



| Name | Description                                                |
| :--- | :--------------------------------------------------------- |
| EQ   | The downstream output must match this row count constraint |



#### HASH JOIN



| Name                  | Description                                                  |
| :-------------------- | :----------------------------------------------------------- |
| join op               | Type of join                                                 |
| equal join conjunct   | Equality condition in the join condition                     |
| other join predicates | Conditions in the join condition, excluding equality         |
| mark join predicates  | Conditions used in mark join                                 |
| other predicates      | Filtering predicates after join execution                    |
| runtime filters       | Generated runtime filters                                    |
| output slot ids       | List of final output slots                                   |
| hash output slot ids  | List of output slots after hash join execution, but before other join conditions are applied |
| isMarkJoin            | Indicates whether it is a mark join                          |


#### NESTED LOOP JOIN



| Name                 | Description                  |
| :------------------- | :--------------------------- |
| join op              | Type of join operation       |
| join conjuncts       | Conditions for joining       |
| mark join predicates | Conditions used in mark join |
| predicates           | Filter predicates after join |
| runtime filters      | Generated runtime filters    |
| output slot ids      | List of final output slots   |
| isMarkJoin           | Whether it is a mark join    |



#### PartitionTopN



| Name                 | Description                                                  |
| :------------------- | :----------------------------------------------------------- |
| functions            | Window functions applying grouped filter optimization        |
| has global limit     | Presence of a global limit on the number of rows             |
| partition limit      | Limit on the number of rows within each partition            |
| partition topn phase | Current phase: TWO_PHASE_GLOBAL_PTOPN for global phase after shuffling by partition key, TWO_PHASE_LOCAL_PTOPN for local phase before shuffling by partition key |



#### REPEAT_NODE



| Name   | Description                                                  |
| :----- | :----------------------------------------------------------- |
| repeat | Number of repetitions for each row and corresponding slot ids for aggregation columns |
| exprs  | List of expressions for output data after repetition         |



#### DataGenScanNode



| Name                 | Description         |
| :------------------- | :------------------ |
| table value function | Table function name |



#### EsScanNode



| Name              | Description                    |
| :---------------- | :----------------------------- |
| SORT COLUMN       | Columns for sorting results    |
| LOCAL_PREDICATES  | Filters executed within Doris  |
| REMOTE_PREDICATES | Filters executed within ES     |
| ES index/type     | ES index and type for querying |



#### HIVE_SCAN_NODE



| Name          | Description                                |
| :------------ | :----------------------------------------- |
| inputSplitNum | Number of scan splits                      |
| totalFileSize | Total file size being scanned              |
| scanRanges    | Information on scan splits                 |
| partition     | Number of partitions being scanned         |
| backends      | Specific data info for each BE to scan     |
| cardinality   | Estimated number of rows by optimizer      |
| avgRowSize    | Estimated average row size by optimizer    |
| numNodes      | Number of BEs used by the current operator |
| pushdown agg  | Aggregations pushed down to scan           |



#### HUDI_SCAN_NODE



| Name                 | Description                                |
| :------------------- | :----------------------------------------- |
| inputSplitNum        | Number of scan splits                      |
| totalFileSize        | Total file size being scanned              |
| scanRanges           | Information on scan splits                 |
| partition            | Number of partitions being scanned         |
| backends             | Specific data info for each BE to scan     |
| cardinality          | Estimated number of rows by optimizer      |
| avgRowSize           | Estimated average row size by optimizer    |
| numNodes             | Number of BEs used by the current operator |
| pushdown agg         | Aggregations pushed down to scan           |
| hudiNativeReadSplits | Number of splits read using native method  |



#### ICEBERG_SCAN_NODE



| Name                     | Description                                |
| :----------------------- | :----------------------------------------- |
| inputSplitNum            | Number of scan splits                      |
| totalFileSize            | Total file size being scanned              |
| scanRanges               | Information on scan splits                 |
| partition                | Number of partitions being scanned         |
| backends                 | Specific data info for each BE to scan     |
| cardinality              | Estimated number of rows by optimizer      |
| avgRowSize               | Estimated average row size by optimizer    |
| numNodes                 | Number of BEs used by the current operator |
| pushdown agg             | Aggregations pushed down to scan           |
| icebergPredicatePushdown | Filters pushed down to iceberg API         |



#### PAIMON_SCAN_NODE

| Name                   | Description                                |
| :--------------------- | :----------------------------------------- |
| inputSplitNum          | Number of scan splits                      |
| totalFileSize          | Total file size being scanned              |
| scanRanges             | Information on scan splits                 |
| partition              | Number of partitions being scanned         |
| backends               | Specific data info for each BE to scan     |
| cardinality            | Estimated number of rows by optimizer      |
| avgRowSize             | Estimated average row size by optimizer    |
| numNodes               | Number of BEs used by the current operator |
| pushdown agg           | Aggregations pushed down to scan           |
| paimonNativeReadSplits | Number of splits read using native method  |


#### NESTED LOOP JOIN



| Name                 | Description                  |
| :------------------- | :--------------------------- |
| join op              | Type of join operation       |
| join conjuncts       | Conditions for joining       |
| mark join predicates | Conditions used in mark join |
| predicates           | Filter predicates after join |
| runtime filters      | Generated runtime filters    |
| output slot ids      | List of final output slots   |
| isMarkJoin           | Whether it is a mark join    |



#### PartitionTopN



| Name                 | Description                                                  |
| :------------------- | :----------------------------------------------------------- |
| functions            | Window functions applying grouped filter optimization        |
| has global limit     | Presence of a global limit on the number of rows             |
| partition limit      | Limit on the number of rows within each partition            |
| partition topn phase | Current phase: TWO_PHASE_GLOBAL_PTOPN for global phase after shuffling by partition key, TWO_PHASE_LOCAL_PTOPN for local phase before shuffling by partition key |



#### REPEAT_NODE



| Name   | Description                                                  |
| :----- | :----------------------------------------------------------- |
| repeat | Number of repetitions for each row and corresponding slot ids for aggregation columns |
| exprs  | List of expressions for output data after repetition         |



#### DataGenScanNode



| Name                 | Description         |
| :------------------- | :------------------ |
| table value function | Table function name |



#### EsScanNode



| Name              | Description                    |
| :---------------- | :----------------------------- |
| SORT COLUMN       | Columns for sorting results    |
| LOCAL_PREDICATES  | Filters executed within Doris  |
| REMOTE_PREDICATES | Filters executed within ES     |
| ES index/type     | ES index and type for querying |



#### HIVE_SCAN_NODE



| Name          | Description                                |
| :------------ | :----------------------------------------- |
| inputSplitNum | Number of scan splits                      |
| totalFileSize | Total file size being scanned              |
| scanRanges    | Information on scan splits                 |
| partition     | Number of partitions being scanned         |
| backends      | Specific data info for each BE to scan     |
| cardinality   | Estimated number of rows by optimizer      |
| avgRowSize    | Estimated average row size by optimizer    |
| numNodes      | Number of BEs used by the current operator |
| pushdown agg  | Aggregations pushed down to scan           |



#### HUDI_SCAN_NODE



| Name                 | Description                                |
| :------------------- | :----------------------------------------- |
| inputSplitNum        | Number of scan splits                      |
| totalFileSize        | Total file size being scanned              |
| scanRanges           | Information on scan splits                 |
| partition            | Number of partitions being scanned         |
| backends             | Specific data info for each BE to scan     |
| cardinality          | Estimated number of rows by optimizer      |
| avgRowSize           | Estimated average row size by optimizer    |
| numNodes             | Number of BEs used by the current operator |
| pushdown agg         | Aggregations pushed down to scan           |
| hudiNativeReadSplits | Number of splits read using native method  |



#### ICEBERG_SCAN_NODE



| Name                     | Description                                |
| :----------------------- | :----------------------------------------- |
| inputSplitNum            | Number of scan splits                      |
| totalFileSize            | Total file size being scanned              |
| scanRanges               | Information on scan splits                 |
| partition                | Number of partitions being scanned         |
| backends                 | Specific data info for each BE to scan     |
| cardinality              | Estimated number of rows by optimizer      |
| avgRowSize               | Estimated average row size by optimizer    |
| numNodes                 | Number of BEs used by the current operator |
| pushdown agg             | Aggregations pushed down to scan           |
| icebergPredicatePushdown | Filters pushed down to iceberg API         |



#### PAIMON_SCAN_NODE



| Name                   | Description                                |
| :--------------------- | :----------------------------------------- |
| inputSplitNum          | Number of scan splits                      |
| totalFileSize          | Total file size being scanned              |
| scanRanges             | Information on scan splits                 |
| partition              | Number of partitions being scanned         |
| backends               | Specific data info for each BE to scan     |
| cardinality            | Estimated number of rows by optimizer      |
| avgRowSize             | Estimated average row size by optimizer    |
| numNodes               | Number of BEs used by the current operator |
| pushdown agg           | Aggregations pushed down to scan           |
| paimonNativeReadSplits | Number of splits read using native method  |

#### JdbcScanNode



| Name  | Description                  |
| :---- | :--------------------------- |
| TABLE | JDBC-side table name to scan |
| QUERY | Query used for scanning      |



#### OlapScanNode



| Name           | Description                                                  |
| :------------- | :----------------------------------------------------------- |
| TABLE          | Table being scanned. Parentheses indicate the name of the hit synchronized materialized view. |
| SORT INFO      | Present when SCAN pre-sorting is planned. Indicates partial pre-sorting and pre-truncation of SCAN output. |
| SORT LIMIT     | Present when SCAN pre-sorting is planned. Indicates the truncation length for pre-truncation. |
| TOPN OPT       | Present when TOP-N Runtime Filter is planned.                |
| PREAGGREGATION | Indicates whether pre-aggregation is enabled. Relevant for MOR aggregation and primary key models. ON means data at the storage layer satisfies upper-layer needs without extra aggregation. OFF means extra aggregation is performed. |
| partitions     | Number of partitions currently scanned, total partitions, and list of scanned partition names. |
| tablets        | Number of tablets scanned and total tablets in the table.    |
| tabletList     | List of tablets scanned.                                     |
| avgRowSize     | Estimated row size by the optimizer.                         |
| numNodes       | Number of BEs assigned to the current scan.                  |
| pushAggOp      | Results are returned by reading zonemap metadata. Supports MIN, MAX, COUNT aggregation information. |



#### UNION



| Name           | Description                                                  |
| :------------- | :----------------------------------------------------------- |
| constant exprs | List of constant expressions to be included in the output.   |
| child exprs    | Children's outputs projected through this expression list as input to the set operator. |



#### EXCEPT



| Name        | Description                                                  |
| :---------- | :----------------------------------------------------------- |
| child exprs | Children's outputs projected through this expression list as input to the set operator. |



#### INTERSECT



| Name        | Description                                                  |
| :---------- | :----------------------------------------------------------- |
| child exprs | Children's outputs projected through this expression list as input to the set operator. |



#### SORT



| Name     | Description                          |
| :------- | :----------------------------------- |
| order by | Sorting key and specific sort order. |



#### TABLE FUNCTION NODE



| Name                  | Description                                               |
| :-------------------- | :-------------------------------------------------------- |
| table function        | Name of the table function used.                          |
| lateral view tuple id | Tuple ID corresponding to newly generated columns.        |
| output slot id        | List of slot IDs for columns output after column pruning. |



#### TOP-N



| Name          | Description                                            |
| :------------ | :----------------------------------------------------- |
| order by      | Sorting key and specific sort order.                   |
| TOPN OPT      | Present when TOP-N runtime filter optimization is hit. |
| OPT TWO PHASE | Present when TOP-N deferred materialization is hit.    |