---
{
    "title": "Data Skew Handling",
    "language": "en",
    "description": "Doris is an MPP database that relies on data shuffle for parallel computing acceleration. However, in actual production scenarios,"
}
---

# Data Skew Handling

## Overview

Doris is an MPP database that relies on data shuffle for parallel computing acceleration. However, in actual production scenarios, performance bottlenecks in single threads of query parallelism are often encountered due to data skew. The following sections introduce how to identify such problems and provide some general solutions.

## Case 1: Bucket Data Skew Leading to Suboptimal Shuffle Method

When data skew occurs on the Join Key of a table, the data will be unevenly distributed among different BE instances, resulting in a single-point execution bottleneck and thus slowing down the overall query execution time.

```SQL
HASH_JOIN_OPERATOR  (id=27): 
      -  PlanInfo 
            -  join  op: INNER  JOIN(PARTITIONED)[] 
            -  equal  join  conjunct:  (customer_number  =  customer_number) 
            -  runtime  filters:  RF001[bloom]  <-  customer_number(200/256/2048) 
            -  cardinality=200         
            -  vec  output  tuple  id:  28 
            -  output  tuple  id:  28  
            -  vIntermediate  tuple  ids:  27 
            -  hash  output  slot  ids:  192  193  194  195  196  197  198  199  200  201  174  175  240  176  177  178  179  180  181  182  183  184  185  186  187  188  189  190  191 
            -  project  output  tuple  id:  28 
      -  BlocksProduced:  sum  4.883K  (4883),  avg  33,  max  39,  min  29 
      -  CloseTime:  avg  37.28us,  max  132.653us,  min  13.945us  
      -  ExecTime:  avg  166.206ms,  max  10s947.344ms,  min  8.845ms 
      -  InitTime:  avg  0ns,  max  0ns,  min  0ns  
      -  MemoryUsage:  sum ,  avg ,  max ,  min 
          -  PeakMemoryUsage:  sum  11.81  MB,  avg  84.00  KB,  max  84.00  KB,  min  84.00  KB 
          -  ProbeKeyArena:  sum  11.81  MB,  avg  84.00  KB,  max  84.00  KB,  min  84.00  KB 
      -  OpenTime:  avg  194.970us,  max  497.685us,  min  93.738us  
      -  ProbeRows:  sum  23.884018M  (23884018),  avg  165.861K  (165861),  max  219.346276M  (219346276),  min  1984  (1984) 
      -  ProjectionTime:  avg  7.336ms,  max  33.540ms,  min  3.760ms 
      -  RowsProduced:  sum  28.8K  (28800),  avg  200,  max  200,  min  200 
```

From the max indicators in the above Join's Profile, there is an obvious skew in the execution time and ProbeRows.

```Bash
ExecTime:  avg  166.206ms,  max  10s947.344ms,  min  8.845ms 
ProbeRows:  sum  23.884018M  (23884018),  avg  165.861K  (165861),  max  219.346276M  (219346276),  min  1984  (1984) 
```

However, due to the uneven distribution of data after shuffling based on the join key, one thread may process 200 million rows of data while another thread only processes a few thousand rows.
In the ideal case of the above scenario, each thread should process approximately the same amount of data. But due to the data skew problem of the Join column, a large amount of computational work may be completed by a single thread. To solve this performance bottleneck, refer to the tuning techniques mentioned in the "Using Hint to Control Join Shuffle Method" section and specify the broadcast join hint as follows to prevent the left table from shuffling data, thus effectively avoiding the performance bottleneck caused by data skew on the Join column.

```SQL
SELECT COUNT(*) FROM orders o JOIN [broadcast] customer c ON o.customer_number = c.customer_number;
```

## Case 2: Column Data Skew Leading to Reversed Join Sides

The current Doris optimizer estimates the selectivity based on the assumption of uniform data distribution. Large deviations in the estimated number of rows after filtering can affect the operator's plan selection. Take the following SQL as an example:

```SQL
select count(*) 
from orders, customer 
where o_custkey = c_custkey
and o_orderdate < '1920-01-02';
```

Under the assumption of uniform distribution, the optimizer may think that the number of rows output after filtering by `o_orderdate < '1920-01-02'` will be less than the number of rows in the `customer` table. Therefore, it may choose the join order of `customer` join `orders`.
However, if the actual data is skewed and the number of rows in the `orders` table that satisfy the condition is greater than that in the `customer` table, then a more reasonable join order should be `orders` join `customer`. To solve this performance problem, refer to the tuning techniques mentioned in the "Using Leading Hint to Control Join Order" section and specify the leading hint as follows to force the generation of the join order of `customer` join `orders`.

Rewrite the SQL as follows:

```SQL
select /*+leading(orders customer)*/ count(*) 
from orders, customer 
where o_custkey = c_custkey
and o_orderdate < '1920-01-02'
```

## Summary

Data skew is a common performance problem in production scenarios. By observing the plan and execution bottlenecks through the EXPLAIN and PROFILE tool outputs, locating the cause of the skew, and then using the Hint tool to make corresponding plan adjustments, the impact of data skew on performance can be avoided.