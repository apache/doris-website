---
{
    "title": "数据倾斜处理",
    "language": "zh-CN",
    "description": "Doris 是一个 MPP 数据库，依赖数据 shuffle 进行并行的计算加速。但是实际生产场景经常会遇到因为数据倾斜导致查询并行的单线程的执行瓶颈。下节介绍如何发现这类问题，并提供一些通用的解决方法。"
}
---

# 数据倾斜处理

## 概述

Doris 是一个 MPP 数据库，依赖数据 shuffle 进行并行的计算加速。但是实际生产场景经常会遇到因为数据倾斜导致查询并行的单线程的执行瓶颈。下节介绍如何发现这类问题，并提供一些通用的解决方法。

## 案例 1：Bucket 数据倾斜导致 shuffle 方式不优

当 Table 在 Join Key 上出现数据倾斜时，数据会在不同的 BE instance 间会分布不均，导致单点的执行瓶颈，进而拖慢整个查询的执行时间。

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
      -  MemoryUsage:  sum  ,  avg  ,  max  ,  min 
          -  PeakMemoryUsage:  sum  11.81  MB,  avg  84.00  KB,  max  84.00  KB,  min  84.00  KB 
          -  ProbeKeyArena:  sum  11.81  MB,  avg  84.00  KB,  max  84.00  KB,  min  84.00  KB 
      -  OpenTime:  avg  194.970us,  max  497.685us,  min  93.738us  
      -  ProbeRows:  sum  23.884018M  (23884018),  avg  165.861K  (165861),  max  219.346276M  (219346276),  min  1984  (1984) 
      -  ProjectionTime:  avg  7.336ms,  max  33.540ms,  min  3.760ms 
      -  RowsProduced:  sum  28.8K  (28800),  avg  200,  max  200,  min  200 
```

从上面的 Join 的 Profile 上 max 指标上来看，执行时间和 ProbeRows 的有明显的倾斜情况。

```Bash
ExecTime:  avg  166.206ms,  max  10s947.344ms,  min  8.845ms 
ProbeRows:  sum  23.884018M  (23884018),  avg  165.861K  (165861),  max  219.346276M  (219346276),  min  1984  (1984) 
```

然而，由于数据基于 join key shuffle 之后分布不均，会导致其中一个线程处理了 2 亿行数据，而另一个线程只处理了 几千行数据。

上述 case 在理想情况下，每个线程各处理的数据是接近的。但因为 Join 列数据倾斜的问题，可能会导致大量的计算工作由一个线程完成的。为了解决这个性能瓶颈，可以参考“使用 Hint 控制 Join Shuffle 方式”章节中提到的调优技巧，指定 broadcast join hint 如下，让左表不进行数据的 shuffle，这样就可以有效避免因为 Join 列数据倾斜导致的性能瓶颈。

```SQL
SELECT COUNT(*) FROM orders o JOIN [broadcast] customer c ON o.customer_number = c.customer_number;
```

## 案例 2：列数据倾斜导致 join 左右边颠倒

当前 Doris 优化器基于数据均匀假设估算选择率，过滤估行偏差大会影响算子的计划选择。以如下 SQL 为例：

```SQL
select count(*) 
from orders, customer 
where o_custkey = c_custkey
and o_orderdate < '1920-01-02';
```

在均匀分布的假设下，优化器可能会认为经过`o_orderdate < '1920-01-02'`过滤后输出的行数会少于 `customer` 表的行数，因此可能选择`customer`join `orders` 的连接顺序。

但是如果实际数据存在倾斜，导致满足条件的 `orders` 表的条数多于 `customer` ，那么更合理的连接顺序应该是`orders`join`customer` 。为了解决这个性能问题，可以参考“使用 Leading Hint 控制 Join 顺序”章节中提到的调优技巧，指定 leading hint 如下，强制生成`customer`join `orders` 的连接顺序。

改写 SQL 如下：

```SQL
select /*+leading(orders customer)*/ count(*) 
from orders, customer 
where o_custkey = c_custkey
and o_orderdate < '1920-01-02'
```

## 总结

数据倾斜是常见的生产场景性能问题。通过 EXPLAIN 和 PROFILE 工具输出观察计划和执行瓶颈，定位倾斜原因，然后就可以使用 Hint 工具进行相应的计划调整，规避数据倾斜对性能的影响了。