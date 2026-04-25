---
{
    "title": "DECIMAL",
    "language": "zh-CN",
    "description": "DECIMAL"
}
---

## DECIMAL

DECIMAL

## 描述
    DECIMAL(P[,S])
    高精度定点数，P 代表一共有多少个有效数字(precision)，S 代表小数位有多少数字(scale)。
    有效数字 P 的范围是 [1, MAX_P]，enable_decimal256=false时，MAX_P=38, enable_decimal256=true时，MAX_P=76。
    小数位数字数量 S 的范围是 [0, P]。

    P默认值是38，S默认是9（DECIMAL(38, 9)）。

    enable_decimal256 的默认值是false，设置为true 可以获得更加精确的结果，但是会带来一些性能损失。

    decimal类型在输出时，小数点后总是显示S位数字，即使小数的后缀是0。比如类型decimal(18, 6)的数字123.456，会输出成123.456000。

### 精度推演

DECIMAL 有一套很复杂的类型推演规则，针对不同的表达式，会应用不同规则进行精度推断。

#### 四则运算

假定e1(p1, s1)和e2(p2, s2)是两个DECIMAL类型的数字，运算结果精度推演规则如下：

|运算|结果precision|结果scale|溢出时结果precision|溢出时结果scale|中间结果e1类型|中间e2类型|
|-------|------------|---------|-----------------|--------------|--------|------|
|e1 + e2|max(p1 - s1,p2 - s2) + max(s1, s2) + 1|max(s1, s2)|MAX_P|min(MAX_P, p) - max(p1 - s1,p2 - s2)|按照结果cast|按照结果cast|
|e1 - e2|max(p1 - s1,p2 - s2) + max(s1, s2) + 1|max(s1, s2)|MAX_P|min(MAX_P, p) - max(p1 - s1,p2 - s2) |按照结果cast|按照结果cast|
|e1 * e2|p1 + p2|s1 + s2|MAX_P|<ol><li>precision - scale < MAX_P - `decimal_overflow_scale`：min(scale, MAX_P - (precision - scale))</li><li>precision - scale > MAX_P - `decimal_overflow_scale`，且scale < `decimal_overflow_scale`：s1 + s2</li><li>precision - scale > MAX_P - `decimal_overflow_scale`，scale >= `decimal_overflow_scale`：`decimal_overflow_scale`</li></ol>|不变|不变|
|e1 / e2|p1 + s2 + `div_precision_increment`|s1 + `div_precision_increment`|MAX_P|<ol><li>precision - s1小于MAX_P - `decimal_overflow_scale`：(MAX_P - (precision - s1))+  `div_precision_increment`</li><li>precision - s1大于MAX_P - `decimal_overflow_scale`，且s1小于`decimal_overflow_scale`：s1 +  `div_precision_increment`</li><li>precision - s1大于MAX_P - `decimal_overflow_scale`，且s1大于等于`decimal_overflow_scale`：`decimal_overflow_scale` +  `div_precision_increment`</li></ol>|p按照结果cast，s按照结果+e2.scale cast||
|e1 % e2|max(p1 - s1,p2 - s2) + max(s1, s2) |max(s1, s2)|MAX_P|min(MAX_P, p) - max(p1 - s1,p2 - s2) |按照结果cast|按照结果cast|

表格中计算`溢出时结果scale`的规则中，`precision`表示`结果precision`列中`precision`，`scale`表示`结果scale`列中的`scale`。

`div_precision_increment`是FE的配置参数，参见[div_precision_increment](../../../../admin-manual/config/fe-config#div_precision_increment)。

`decimal_overflow_scale`是FE的session variable，表示当decimal数值计算结果精度溢出时，计算结果最多可保留的小数位数，默认值是6。

值得注意的是，除法计算的过程是DECIMAL(p1, s1) / DECIMAL(p2, s2) 先转换成 DECIMAL(p1 + s2 + `div_precision_increment`, s1 + s2 ) /  DECIMAL(p2, s2)  然后再进行计算，所以可能会出现DECIMAL(p1 + s2 + `div_precision_increment`, s1 + `div_precision_increment`) 是满足 DECIMAL 的范围，但是由于先转换成了 DECIMAL(p1 + s2 + `div_precision_increment`, s1 + s2 )导致超出范围，Doris默认情况下会报`Arithmetic overflow`错误。

##### 示例
###### 乘法不溢出
```sql
create table test_decimal_mul_no_overflow(f1 decimal(19, 9), f2 decimal(19, 9)) properties('replication_num'='1');
insert into test_decimal_mul_no_overflow values('9999999999.999999999', '9999999999.999999999');
```
根据乘法结果精度的计算规则，结果类型是decimal(38, 18)，不会溢出：
```sql
explain verbose select f1, f2, f1 * f2 from test_decimal_mul_no_overflow;
+----------------------------------------------------------------------------------------------------------------------------------+
| Explain String(Nereids Planner)                                                                                                  |
+----------------------------------------------------------------------------------------------------------------------------------+
| PLAN FRAGMENT 0                                                                                                                  |
|   OUTPUT EXPRS:                                                                                                                  |
|     f1[#2]                                                                                                                       |
|     f2[#3]                                                                                                                       |
|     f1 * f2[#4]                                                                                                                  |
|   PARTITION: UNPARTITIONED                                                                                                       |
|                                                                                                                                  |
|   HAS_COLO_PLAN_NODE: false                                                                                                      |
|                                                                                                                                  |
|   VRESULT SINK                                                                                                                   |
|      MYSQL_PROTOCAL                                                                                                              |
|                                                                                                                                  |
|   1:VEXCHANGE                                                                                                                    |
|      offset: 0                                                                                                                   |
|      distribute expr lists:                                                                                                      |
|      tuple ids: 1N                                                                                                               |
|                                                                                                                                  |
| PLAN FRAGMENT 1                                                                                                                  |
|                                                                                                                                  |
|   PARTITION: RANDOM                                                                                                              |
|                                                                                                                                  |
|   HAS_COLO_PLAN_NODE: false                                                                                                      |
|                                                                                                                                  |
|   STREAM DATA SINK                                                                                                               |
|     EXCHANGE ID: 01                                                                                                              |
|     UNPARTITIONED                                                                                                                |
|                                                                                                                                  |
|   0:VOlapScanNode(59)                                                                                                            |
|      TABLE: test.test_decimal_mul_no_overflow(test_decimal_mul_no_overflow), PREAGGREGATION: ON                                  |
|      partitions=1/1 (test_decimal_mul_no_overflow)                                                                               |
|      tablets=10/10, tabletList=1750210355691,1750210355693,1750210355695 ...                                                     |
|      cardinality=1, avgRowSize=3065.0, numNodes=1                                                                                |
|      pushAggOp=NONE                                                                                                              |
|      desc: 0                                                                                                                     |
|      final projections: f1[#0], f2[#1], (f1[#0] * f2[#1])                                                                        |
|      final project output tuple id: 1                                                                                            |
|      tuple ids: 0                                                                                                                |
|                                                                                                                                  |
| Tuples:                                                                                                                          |
| TupleDescriptor{id=0, tbl=test_decimal_mul_no_overflow}                                                                          |
|   SlotDescriptor{id=0, col=f1, colUniqueId=0, type=decimalv3(19,9), nullable=true, isAutoIncrement=false, subColPath=null}       |
|   SlotDescriptor{id=1, col=f2, colUniqueId=1, type=decimalv3(19,9), nullable=true, isAutoIncrement=false, subColPath=null}       |
|                                                                                                                                  |
| TupleDescriptor{id=1, tbl=test_decimal_mul_no_overflow}                                                                          |
|   SlotDescriptor{id=2, col=f1, colUniqueId=0, type=decimalv3(19,9), nullable=true, isAutoIncrement=false, subColPath=null}       |
|   SlotDescriptor{id=3, col=f2, colUniqueId=1, type=decimalv3(19,9), nullable=true, isAutoIncrement=false, subColPath=null}       |
|   SlotDescriptor{id=4, col=null, colUniqueId=null, type=decimalv3(38,18), nullable=true, isAutoIncrement=false, subColPath=null} |
```

计算结果：
```sql
select f1, f2, f1 * f2 from test_decimal_mul_no_overflow;
+----------------------+----------------------+-----------------------------------------+
| f1                   | f2                   | f1 * f2                                 |
+----------------------+----------------------+-----------------------------------------+
| 9999999999.999999999 | 9999999999.999999999 | 99999999999999999980.000000000000000001 |
+----------------------+----------------------+-----------------------------------------+
```

###### 乘法溢出规则
```sql
create table test_decimal_mul_overflow1(f1 decimal(20, 5), f2 decimal(21, 6)) properties('replication_num'='1');
insert into test_decimal_mul_overflow1 values('12345678901234.12345', '12345678901234.123456');
```
根据乘法结果精度的计算规则，默认配置下(`enable_decimal256`=false, `decimal_overflow_scale`=6, `div_precision_increment`=4)，正常计算出来的结果类型是`decimal(41, 11)`，precision溢出了，需要按照溢出时的规则重新计算：`MAX_P` - `decimal_overflow_scale` = 38 - 6 = 32，`precision` - `scale` = 41 - 11 = 30 < 32， 适用规则1，最终结果scale = min(11, 38 - 30) = 8，最终结果类型是decimal(38, 8)：
```sql
 explain verbose select f1, f2, f1 * f2 from test_decimal_mul_overflow1;
+---------------------------------------------------------------------------------------------------------------------------------+
| Explain String(Nereids Planner)                                                                                                 |
+---------------------------------------------------------------------------------------------------------------------------------+
| PLAN FRAGMENT 0                                                                                                                 |
|   OUTPUT EXPRS:                                                                                                                 |
|     f1[#2]                                                                                                                      |
|     f2[#3]                                                                                                                      |
|     f1 * f2[#4]                                                                                                                 |
|   PARTITION: UNPARTITIONED                                                                                                      |
|                                                                                                                                 |
|   HAS_COLO_PLAN_NODE: false                                                                                                     |
|                                                                                                                                 |
|   VRESULT SINK                                                                                                                  |
|      MYSQL_PROTOCAL                                                                                                             |
|                                                                                                                                 |
|   1:VEXCHANGE                                                                                                                   |
|      offset: 0                                                                                                                  |
|      distribute expr lists:                                                                                                     |
|      tuple ids: 1N                                                                                                              |
|                                                                                                                                 |
| PLAN FRAGMENT 1                                                                                                                 |
|                                                                                                                                 |
|   PARTITION: RANDOM                                                                                                             |
|                                                                                                                                 |
|   HAS_COLO_PLAN_NODE: false                                                                                                     |
|                                                                                                                                 |
|   STREAM DATA SINK                                                                                                              |
|     EXCHANGE ID: 01                                                                                                             |
|     UNPARTITIONED                                                                                                               |
|                                                                                                                                 |
|   0:VOlapScanNode(59)                                                                                                           |
|      TABLE: test.test_decimal_mul_overflow1(test_decimal_mul_overflow1), PREAGGREGATION: ON                                     |
|      partitions=1/1 (test_decimal_mul_overflow1)                                                                                |
|      tablets=10/10, tabletList=1750210355791,1750210355793,1750210355795 ...                                                    |
|      cardinality=1, avgRowSize=3115.0, numNodes=1                                                                               |
|      pushAggOp=NONE                                                                                                             |
|      desc: 0                                                                                                                    |
|      final projections: f1[#0], f2[#1], (f1[#0] * f2[#1])                                                                       |
|      final project output tuple id: 1                                                                                           |
|      tuple ids: 0                                                                                                               |
|                                                                                                                                 |
| Tuples:                                                                                                                         |
| TupleDescriptor{id=0, tbl=test_decimal_mul_overflow1}                                                                           |
|   SlotDescriptor{id=0, col=f1, colUniqueId=0, type=decimalv3(20,5), nullable=true, isAutoIncrement=false, subColPath=null}      |
|   SlotDescriptor{id=1, col=f2, colUniqueId=1, type=decimalv3(21,6), nullable=true, isAutoIncrement=false, subColPath=null}      |
|                                                                                                                                 |
| TupleDescriptor{id=1, tbl=test_decimal_mul_overflow1}                                                                           |
|   SlotDescriptor{id=2, col=f1, colUniqueId=0, type=decimalv3(20,5), nullable=true, isAutoIncrement=false, subColPath=null}      |
|   SlotDescriptor{id=3, col=f2, colUniqueId=1, type=decimalv3(21,6), nullable=true, isAutoIncrement=false, subColPath=null}      |
|   SlotDescriptor{id=4, col=null, colUniqueId=null, type=decimalv3(38,8), nullable=true, isAutoIncrement=false, subColPath=null} |
```
计算结果：
```sql
select f1, f2, f1 * f2 from test_decimal_mul_overflow1;
+----------------------+-----------------------+--------------------------------------+
| f1                   | f2                    | f1 * f2                              |
+----------------------+-----------------------+--------------------------------------+
| 12345678901234.12345 | 12345678901234.123456 | 152415787532377393748917544.09724464 |
+----------------------+-----------------------+--------------------------------------+
```
如果调大`decimal_overflow_scale`的值，比如`set decimal_overflow_scale=9;`，按照溢出时的规则进行计算：`MAX_P` - `decimal_overflow_scale` = 38 - 9 = 29，`precision` - `scale` = 41 - 11 = 30 > 29，且scale > `decimal_overflow_scale`，适用溢出规则3，最终计算出的结果类型为：`decimal(38,9)`：
```sql
explain verbose select f1, f2, f1 * f2 from test_decimal_mul_overflow1;
+---------------------------------------------------------------------------------------------------------------------------------+
| Explain String(Nereids Planner)                                                                                                 |
+---------------------------------------------------------------------------------------------------------------------------------+
| PLAN FRAGMENT 0                                                                                                                 |
|   OUTPUT EXPRS:                                                                                                                 |
|     f1[#2]                                                                                                                      |
|     f2[#3]                                                                                                                      |
|     f1 * f2[#4]                                                                                                                 |
|   PARTITION: UNPARTITIONED                                                                                                      |
|                                                                                                                                 |
|   HAS_COLO_PLAN_NODE: false                                                                                                     |
|                                                                                                                                 |
|   VRESULT SINK                                                                                                                  |
|      MYSQL_PROTOCAL                                                                                                             |
|                                                                                                                                 |
|   1:VEXCHANGE                                                                                                                   |
|      offset: 0                                                                                                                  |
|      distribute expr lists:                                                                                                     |
|      tuple ids: 1N                                                                                                              |
|                                                                                                                                 |
| PLAN FRAGMENT 1                                                                                                                 |
|                                                                                                                                 |
|   PARTITION: RANDOM                                                                                                             |
|                                                                                                                                 |
|   HAS_COLO_PLAN_NODE: false                                                                                                     |
|                                                                                                                                 |
|   STREAM DATA SINK                                                                                                              |
|     EXCHANGE ID: 01                                                                                                             |
|     UNPARTITIONED                                                                                                               |
|                                                                                                                                 |
|   0:VOlapScanNode(59)                                                                                                           |
|      TABLE: test.test_decimal_mul_overflow1(test_decimal_mul_overflow1), PREAGGREGATION: ON                                     |
|      partitions=1/1 (test_decimal_mul_overflow1)                                                                                |
|      tablets=10/10, tabletList=1750210355963,1750210355965,1750210355967 ...                                                    |
|      cardinality=1, avgRowSize=3145.0, numNodes=1                                                                               |
|      pushAggOp=NONE                                                                                                             |
|      desc: 0                                                                                                                    |
|      final projections: f1[#0], f2[#1], (f1[#0] * f2[#1])                                                                       |
|      final project output tuple id: 1                                                                                           |
|      tuple ids: 0                                                                                                               |
|                                                                                                                                 |
| Tuples:                                                                                                                         |
| TupleDescriptor{id=0, tbl=test_decimal_mul_overflow1}                                                                           |
|   SlotDescriptor{id=0, col=f1, colUniqueId=0, type=decimalv3(20,5), nullable=true, isAutoIncrement=false, subColPath=null}      |
|   SlotDescriptor{id=1, col=f2, colUniqueId=1, type=decimalv3(21,6), nullable=true, isAutoIncrement=false, subColPath=null}      |
|                                                                                                                                 |
| TupleDescriptor{id=1, tbl=test_decimal_mul_overflow1}                                                                           |
|   SlotDescriptor{id=2, col=f1, colUniqueId=0, type=decimalv3(20,5), nullable=true, isAutoIncrement=false, subColPath=null}      |
|   SlotDescriptor{id=3, col=f2, colUniqueId=1, type=decimalv3(21,6), nullable=true, isAutoIncrement=false, subColPath=null}      |
|   SlotDescriptor{id=4, col=null, colUniqueId=null, type=decimalv3(38,9), nullable=true, isAutoIncrement=false, subColPath=null} |
```
计算结果：
```sql
select f1, f2, f1 * f2 from test_decimal_mul_overflow1;
+----------------------+-----------------------+---------------------------------------+
| f1                   | f2                    | f1 * f2                               |
+----------------------+-----------------------+---------------------------------------+
| 12345678901234.12345 | 12345678901234.123456 | 152415787532377393748917544.097244643 |
+----------------------+-----------------------+---------------------------------------+
```
如果继续调大`decimal_overflow_scale`的值，比如`set decimal_overflow_scale=12;`，按照溢出时的规则进行计算：`MAX_P` - `decimal_overflow_scale` = 38 - 12 = 26，`precision` - `scale` = 41 - 11 = 30 > 26，且scale < `decimal_overflow_scale`，此时适用溢出规则2，最终计算出的结果类型为：`decimal(38,11)`：
```sql
explain verbose select f1, f2, f1 * f2 from test_decimal_mul_overflow1;
+----------------------------------------------------------------------------------------------------------------------------------+
| Explain String(Nereids Planner)                                                                                                  |
+----------------------------------------------------------------------------------------------------------------------------------+
| PLAN FRAGMENT 0                                                                                                                  |
|   OUTPUT EXPRS:                                                                                                                  |
|     f1[#2]                                                                                                                       |
|     f2[#3]                                                                                                                       |
|     f1 * f2[#4]                                                                                                                  |
|   PARTITION: UNPARTITIONED                                                                                                       |
|                                                                                                                                  |
|   HAS_COLO_PLAN_NODE: false                                                                                                      |
|                                                                                                                                  |
|   VRESULT SINK                                                                                                                   |
|      MYSQL_PROTOCAL                                                                                                              |
|                                                                                                                                  |
|   1:VEXCHANGE                                                                                                                    |
|      offset: 0                                                                                                                   |
|      distribute expr lists:                                                                                                      |
|      tuple ids: 1N                                                                                                               |
|                                                                                                                                  |
| PLAN FRAGMENT 1                                                                                                                  |
|                                                                                                                                  |
|   PARTITION: RANDOM                                                                                                              |
|                                                                                                                                  |
|   HAS_COLO_PLAN_NODE: false                                                                                                      |
|                                                                                                                                  |
|   STREAM DATA SINK                                                                                                               |
|     EXCHANGE ID: 01                                                                                                              |
|     UNPARTITIONED                                                                                                                |
|                                                                                                                                  |
|   0:VOlapScanNode(59)                                                                                                            |
|      TABLE: test.test_decimal_mul_overflow1(test_decimal_mul_overflow1), PREAGGREGATION: ON                                      |
|      partitions=1/1 (test_decimal_mul_overflow1)                                                                                 |
|      tablets=10/10, tabletList=1750210355963,1750210355965,1750210355967 ...                                                     |
|      cardinality=1, avgRowSize=3145.0, numNodes=1                                                                                |
|      pushAggOp=NONE                                                                                                              |
|      desc: 0                                                                                                                     |
|      final projections: f1[#0], f2[#1], (f1[#0] * f2[#1])                                                                        |
|      final project output tuple id: 1                                                                                            |
|      tuple ids: 0                                                                                                                |
|                                                                                                                                  |
| Tuples:                                                                                                                          |
| TupleDescriptor{id=0, tbl=test_decimal_mul_overflow1}                                                                            |
|   SlotDescriptor{id=0, col=f1, colUniqueId=0, type=decimalv3(20,5), nullable=true, isAutoIncrement=false, subColPath=null}       |
|   SlotDescriptor{id=1, col=f2, colUniqueId=1, type=decimalv3(21,6), nullable=true, isAutoIncrement=false, subColPath=null}       |
|                                                                                                                                  |
| TupleDescriptor{id=1, tbl=test_decimal_mul_overflow1}                                                                            |
|   SlotDescriptor{id=2, col=f1, colUniqueId=0, type=decimalv3(20,5), nullable=true, isAutoIncrement=false, subColPath=null}       |
|   SlotDescriptor{id=3, col=f2, colUniqueId=1, type=decimalv3(21,6), nullable=true, isAutoIncrement=false, subColPath=null}       |
|   SlotDescriptor{id=4, col=null, colUniqueId=null, type=decimalv3(38,11), nullable=true, isAutoIncrement=false, subColPath=null} |
```
计算结果：
```sql
select f1, f2, f1 * f2 from test_decimal_mul_overflow1;
+----------------------+-----------------------+-----------------------------------------+
| f1                   | f2                    | f1 * f2                                 |
+----------------------+-----------------------+-----------------------------------------+
| 12345678901234.12345 | 12345678901234.123456 | 152415787532377393748917544.09724464320 |
+----------------------+-----------------------+-----------------------------------------+
```

###### 乘法溢出时开启decimal256
```sql
create table test_decimal_mul_overflow_dec256(f1 decimal(38, 19), f2 decimal(38, 19)) properties('replication_num'='1');
insert into test_decimal_mul_overflow_dec256 values('9999999999999999999.9999999999999999999', '9999999999999999999.9999999999999999999');
```
默认情况下(`enable_decimal256`=false)，相乘的实际结果会溢出，此时可以开启decimal256：`set enable_decimal256=true`，可以计算出精确的结果，结果类型为decimal(76, 38)：
```sql
set enable_decimal256=true;

elect f1, f2, f1 * f2 from test_decimal_mul_overflow_dec256;
+-----------------------------------------+-----------------------------------------+-------------------------------------------------------------------------------+
| f1                                      | f2                                      | f1 * f2                                                                       |
+-----------------------------------------+-----------------------------------------+-------------------------------------------------------------------------------+
| 9999999999999999999.9999999999999999999 | 9999999999999999999.9999999999999999999 | 99999999999999999999999999999999999998.00000000000000000000000000000000000001 |
+-----------------------------------------+-----------------------------------------+-------------------------------------------------------------------------------+
```

###### 除法不溢出
```sql
create table test_decimal_div_no_overflow(f1 decimal(19, 9), f2 decimal(19, 9)) properties('replication_num'='1');

insert into test_decimal_div_no_overflow values('1234567890.123456789', '234567890.123456789');
```
根据除法结果精度的计算规则，默认配置下(`enable_decimal256`=false, `decimal_overflow_scale`=6, `div_precision_increment`=4)，正常计算出来的结果类型是`decimal(19 + 9 + 4, 9 + 4)`，即`decimal(32, 13)`，precision没有溢出，结果的最终类型就是`decimal(32, 13)`：

```sql
 explain verbose select f1, f2, f1 / f2 from test_decimal_div_no_overflow;
+----------------------------------------------------------------------------------------------------------------------------------+
| Explain String(Nereids Planner)                                                                                                  |
+----------------------------------------------------------------------------------------------------------------------------------+
| PLAN FRAGMENT 0                                                                                                                  |
|   OUTPUT EXPRS:                                                                                                                  |
|     f1[#2]                                                                                                                       |
|     f2[#3]                                                                                                                       |
|     f1 / f2[#4]                                                                                                                  |
|   PARTITION: UNPARTITIONED                                                                                                       |
|                                                                                                                                  |
|   HAS_COLO_PLAN_NODE: false                                                                                                      |
|                                                                                                                                  |
|   VRESULT SINK                                                                                                                   |
|      MYSQL_PROTOCAL                                                                                                              |
|                                                                                                                                  |
|   1:VEXCHANGE                                                                                                                    |
|      offset: 0                                                                                                                   |
|      distribute expr lists:                                                                                                      |
|      tuple ids: 1N                                                                                                               |
|                                                                                                                                  |
| PLAN FRAGMENT 1                                                                                                                  |
|                                                                                                                                  |
|   PARTITION: RANDOM                                                                                                              |
|                                                                                                                                  |
|   HAS_COLO_PLAN_NODE: false                                                                                                      |
|                                                                                                                                  |
|   STREAM DATA SINK                                                                                                               |
|     EXCHANGE ID: 01                                                                                                              |
|     UNPARTITIONED                                                                                                                |
|                                                                                                                                  |
|   0:VOlapScanNode(59)                                                                                                            |
|      TABLE: test_decimal.test_decimal_div_no_overflow(test_decimal_div_no_overflow), PREAGGREGATION: ON                                  |
|      partitions=1/1 (test_decimal_div_no_overflow)                                                                                   |
|      tablets=10/10, tabletList=1750210335692,1750210335694,1750210335696 ...                                                     |
|      cardinality=1, avgRowSize=0.0, numNodes=1                                                                                   |
|      pushAggOp=NONE                                                                                                              |
|      desc: 0                                                                                                                     |
|      final projections: f1[#0], f2[#1], (CAST(f1[#0] AS decimalv3(32,22)) / f2[#1])                                              |
|      final project output tuple id: 1                                                                                            |
|      tuple ids: 0                                                                                                                |
|                                                                                                                                  |
| Tuples:                                                                                                                          |
| TupleDescriptor{id=0, tbl=test_decimal_div_no_overflow}                                                                              |
|   SlotDescriptor{id=0, col=f1, colUniqueId=0, type=decimalv3(19,9), nullable=true, isAutoIncrement=false, subColPath=null}       |
|   SlotDescriptor{id=1, col=f2, colUniqueId=1, type=decimalv3(19,9), nullable=true, isAutoIncrement=false, subColPath=null}       |
|                                                                                                                                  |
| TupleDescriptor{id=1, tbl=test_decimal_div_no_overflow}                                                                              |
|   SlotDescriptor{id=2, col=f1, colUniqueId=0, type=decimalv3(19,9), nullable=true, isAutoIncrement=false, subColPath=null}       |
|   SlotDescriptor{id=3, col=f2, colUniqueId=1, type=decimalv3(19,9), nullable=true, isAutoIncrement=false, subColPath=null}       |
|   SlotDescriptor{id=4, col=null, colUniqueId=null, type=decimalv3(32,13), nullable=true, isAutoIncrement=false, subColPath=null} |

select f1, f2, f1 / f2 from test_decimal_div_no_overflow;
+----------------------+---------------------+-----------------+
| f1                   | f2                  | f1 / f2         |
+----------------------+---------------------+-----------------+
| 1234567890.123456789 | 234567890.123456789 | 5.2631580966759 |
+----------------------+---------------------+-----------------+
```

如果期望结果保留更多小数位，可以调大`div_precision_increment`, 比如`admin set frontend config('div_precision_increment'='8');`，则根据上述计算规则，计算出的结果类型为`decimal(36, 17)`：
```sql
admin set frontend config('div_precision_increment'='8');
explain verbose select f1, f2, f1 / f2 from test_decimal_div_no_overflow;
+----------------------------------------------------------------------------------------------------------------------------------+
| Explain String(Nereids Planner)                                                                                                  |
+----------------------------------------------------------------------------------------------------------------------------------+
| PLAN FRAGMENT 0                                                                                                                  |
|   OUTPUT EXPRS:                                                                                                                  |
|     f1[#2]                                                                                                                       |
|     f2[#3]                                                                                                                       |
|     f1 / f2[#4]                                                                                                                  |
|   PARTITION: UNPARTITIONED                                                                                                       |
|                                                                                                                                  |
|   HAS_COLO_PLAN_NODE: false                                                                                                      |
|                                                                                                                                  |
|   VRESULT SINK                                                                                                                   |
|      MYSQL_PROTOCAL                                                                                                              |
|                                                                                                                                  |
|   1:VEXCHANGE                                                                                                                    |
|      offset: 0                                                                                                                   |
|      distribute expr lists:                                                                                                      |
|      tuple ids: 1N                                                                                                               |
|                                                                                                                                  |
| PLAN FRAGMENT 1                                                                                                                  |
|                                                                                                                                  |
|   PARTITION: RANDOM                                                                                                              |
|                                                                                                                                  |
|   HAS_COLO_PLAN_NODE: false                                                                                                      |
|                                                                                                                                  |
|   STREAM DATA SINK                                                                                                               |
|     EXCHANGE ID: 01                                                                                                              |
|     UNPARTITIONED                                                                                                                |
|                                                                                                                                  |
|   0:VOlapScanNode(59)                                                                                                            |
|      TABLE: test.test_decimal_div_no_overflow(test_decimal_div_no_overflow), PREAGGREGATION: ON                                          |
|      partitions=1/1 (test_decimal_div_no_overflow)                                                                                   |
|      tablets=10/10, tabletList=1750210354910,1750210354912,1750210354914 ...                                                     |
|      cardinality=1, avgRowSize=3120.0, numNodes=1                                                                                |
|      pushAggOp=NONE                                                                                                              |
|      desc: 0                                                                                                                     |
|      final projections: f1[#0], f2[#1], (CAST(f1[#0] AS decimalv3(36,26)) / f2[#1])                                              |
|      final project output tuple id: 1                                                                                            |
|      tuple ids: 0                                                                                                                |
|                                                                                                                                  |
| Tuples:                                                                                                                          |
| TupleDescriptor{id=0, tbl=test_decimal_div_no_overflow}                                                                              |
|   SlotDescriptor{id=0, col=f1, colUniqueId=0, type=decimalv3(19,9), nullable=true, isAutoIncrement=false, subColPath=null}       |
|   SlotDescriptor{id=1, col=f2, colUniqueId=1, type=decimalv3(19,9), nullable=true, isAutoIncrement=false, subColPath=null}       |
|                                                                                                                                  |
| TupleDescriptor{id=1, tbl=test_decimal_div_no_overflow}                                                                              |
|   SlotDescriptor{id=2, col=f1, colUniqueId=0, type=decimalv3(19,9), nullable=true, isAutoIncrement=false, subColPath=null}       |
|   SlotDescriptor{id=3, col=f2, colUniqueId=1, type=decimalv3(19,9), nullable=true, isAutoIncrement=false, subColPath=null}       |
|   SlotDescriptor{id=4, col=null, colUniqueId=null, type=decimalv3(36,17), nullable=true, isAutoIncrement=false, subColPath=null} |
```
计算结果：
```sql
select f1, f2, f1 / f2 from test_decimal_div_no_overflow;
+----------------------+---------------------+---------------------+
| f1                   | f2                  | f1 / f2             |
+----------------------+---------------------+---------------------+
| 1234567890.123456789 | 234567890.123456789 | 5.26315809667590986 |
+----------------------+---------------------+---------------------+
```

###### 除法溢出规则1
```sql
create table test_decimal_div_overflow1(f1 decimal(27, 8), f2 decimal(27, 8)) properties('replication_num'='1');

insert into test_decimal_div_overflow1 values('123456789012345678.12345678', '23456789012345678.12345678');
```
根据除法结果精度的计算规则，默认配置下(`enable_decimal256`=false, `decimal_overflow_scale`=6, `div_precision_increment`=4)，正常计算出来的结果类型是`decimal(27 + 8 + 4, 8 + 4)`，即`decimal(39, 12)`。precision溢出了，需要按照溢出时的规则重新计算：`MAX_P` - `decimal_overflow_scale` = 38 - 6 = 32，`precision` - s1 = 39 - 8 = 31 < 32，所以适用`溢出时scale`规则1，结果scale为(`MAX_P` - (`precision` - `s1`))+ `div_precision_increment` = (38 - (39 - 8)) + 4 = 11，结果类型为`decimal(38, 11)`：
```sql
explain verbose select f1, f2, f1 / f2 from test_decimal_div_overflow1;
+----------------------------------------------------------------------------------------------------------------------------------+
| Explain String(Nereids Planner)                                                                                                  |
+----------------------------------------------------------------------------------------------------------------------------------+
| PLAN FRAGMENT 0                                                                                                                  |
|   OUTPUT EXPRS:                                                                                                                  |
|     f1[#2]                                                                                                                       |
|     f2[#3]                                                                                                                       |
|     f1 / f2[#4]                                                                                                                  |
|   PARTITION: UNPARTITIONED                                                                                                       |
|                                                                                                                                  |
|   HAS_COLO_PLAN_NODE: false                                                                                                      |
|                                                                                                                                  |
|   VRESULT SINK                                                                                                                   |
|      MYSQL_PROTOCAL                                                                                                              |
|                                                                                                                                  |
|   1:VEXCHANGE                                                                                                                    |
|      offset: 0                                                                                                                   |
|      distribute expr lists:                                                                                                      |
|      tuple ids: 1N                                                                                                               |
|                                                                                                                                  |
| PLAN FRAGMENT 1                                                                                                                  |
|                                                                                                                                  |
|   PARTITION: RANDOM                                                                                                              |
|                                                                                                                                  |
|   HAS_COLO_PLAN_NODE: false                                                                                                      |
|                                                                                                                                  |
|   STREAM DATA SINK                                                                                                               |
|     EXCHANGE ID: 01                                                                                                              |
|     UNPARTITIONED                                                                                                                |
|                                                                                                                                  |
|   0:VOlapScanNode(59)                                                                                                            |
|      TABLE: test_decimal.test_decimal_div_overflow1(test_decimal_div_overflow1), PREAGGREGATION: ON                                      |
|      partitions=1/1 (test_decimal_div_overflow1)                                                                                     |
|      tablets=10/10, tabletList=1750210336251,1750210336253,1750210336255 ...                                                     |
|      cardinality=1, avgRowSize=3455.0, numNodes=1                                                                                |
|      pushAggOp=NONE                                                                                                              |
|      desc: 0                                                                                                                     |
|      final projections: f1[#0], f2[#1], (CAST(f1[#0] AS decimalv3(38,19)) / f2[#1])                                              |
|      final project output tuple id: 1                                                                                            |
|      tuple ids: 0                                                                                                                |
|                                                                                                                                  |
| Tuples:                                                                                                                          |
| TupleDescriptor{id=0, tbl=test_decimal_div_overflow1}                                                                                |
|   SlotDescriptor{id=0, col=f1, colUniqueId=0, type=decimalv3(27,8), nullable=true, isAutoIncrement=false, subColPath=null}       |
|   SlotDescriptor{id=1, col=f2, colUniqueId=1, type=decimalv3(27,8), nullable=true, isAutoIncrement=false, subColPath=null}       |
|                                                                                                                                  |
| TupleDescriptor{id=1, tbl=test_decimal_div_overflow1}                                                                                |
|   SlotDescriptor{id=2, col=f1, colUniqueId=0, type=decimalv3(27,8), nullable=true, isAutoIncrement=false, subColPath=null}       |
|   SlotDescriptor{id=3, col=f2, colUniqueId=1, type=decimalv3(27,8), nullable=true, isAutoIncrement=false, subColPath=null}       |
|   SlotDescriptor{id=4, col=null, colUniqueId=null, type=decimalv3(38,11), nullable=true, isAutoIncrement=false, subColPath=null} |
```

计算结果：
```sql
select f1, f2, f1 / f2 from test_decimal_div_overflow1; 
+-----------------------------+----------------------------+---------------+
| f1                          | f2                         | f1 / f2       |
+-----------------------------+----------------------------+---------------+
| 123456789012345678.12345678 | 23456789012345678.12345678 | 5.26315809667 |
+-----------------------------+----------------------------+---------------+
```

如果调大`decimal_overflow_scale`的值，比如`set decimal_overflow_scale=8;`，按照溢出时的规则进行计算：`MAX_P` - `decimal_overflow_scale` = 38 - 8 = 30，`precision` - s1 = 39 - 8 = 31 > 30，且s1 == `decimal_overflow_scale`，适用溢出规则3，最终计算出的结果类型为：`decimalv3(38,12)`：
```sql
set decimal_overflow_scale=8;
explain verbose select f1, f2, f1 / f2 from test_decimal_div_overflow1;
+----------------------------------------------------------------------------------------------------------------------------------+
| Explain String(Nereids Planner)                                                                                                  |
+----------------------------------------------------------------------------------------------------------------------------------+
| PLAN FRAGMENT 0                                                                                                                  |
|   OUTPUT EXPRS:                                                                                                                  |
|     f1[#2]                                                                                                                       |
|     f2[#3]                                                                                                                       |
|     f1 / f2[#4]                                                                                                                  |
|   PARTITION: UNPARTITIONED                                                                                                       |
|                                                                                                                                  |
|   HAS_COLO_PLAN_NODE: false                                                                                                      |
|                                                                                                                                  |
|   VRESULT SINK                                                                                                                   |
|      MYSQL_PROTOCAL                                                                                                              |
|                                                                                                                                  |
|   1:VEXCHANGE                                                                                                                    |
|      offset: 0                                                                                                                   |
|      distribute expr lists:                                                                                                      |
|      tuple ids: 1N                                                                                                               |
|                                                                                                                                  |
| PLAN FRAGMENT 1                                                                                                                  |
|                                                                                                                                  |
|   PARTITION: RANDOM                                                                                                              |
|                                                                                                                                  |
|   HAS_COLO_PLAN_NODE: false                                                                                                      |
|                                                                                                                                  |
|   STREAM DATA SINK                                                                                                               |
|     EXCHANGE ID: 01                                                                                                              |
|     UNPARTITIONED                                                                                                                |
|                                                                                                                                  |
|   0:VOlapScanNode(59)                                                                                                            |
|      TABLE: test.test_decimal_div_overflow1(test_decimal_div_overflow1), PREAGGREGATION: ON                                              |
|      partitions=1/1 (test_decimal_div_overflow1)                                                                                     |
|      tablets=10/10, tabletList=1750210355035,1750210355037,1750210355039 ...                                                     |
|      cardinality=1, avgRowSize=3355.0, numNodes=1                                                                                |
|      pushAggOp=NONE                                                                                                              |
|      desc: 0                                                                                                                     |
|      final projections: f1[#0], f2[#1], (CAST(f1[#0] AS decimalv3(38,20)) / f2[#1])                                              |
|      final project output tuple id: 1                                                                                            |
|      tuple ids: 0                                                                                                                |
|                                                                                                                                  |
| Tuples:                                                                                                                          |
| TupleDescriptor{id=0, tbl=test_decimal_div_overflow1}                                                                                |
|   SlotDescriptor{id=0, col=f1, colUniqueId=0, type=decimalv3(27,8), nullable=true, isAutoIncrement=false, subColPath=null}       |
|   SlotDescriptor{id=1, col=f2, colUniqueId=1, type=decimalv3(27,8), nullable=true, isAutoIncrement=false, subColPath=null}       |
|                                                                                                                                  |
| TupleDescriptor{id=1, tbl=test_decimal_div_overflow1}                                                                                |
|   SlotDescriptor{id=2, col=f1, colUniqueId=0, type=decimalv3(27,8), nullable=true, isAutoIncrement=false, subColPath=null}       |
|   SlotDescriptor{id=3, col=f2, colUniqueId=1, type=decimalv3(27,8), nullable=true, isAutoIncrement=false, subColPath=null}       |
|   SlotDescriptor{id=4, col=null, colUniqueId=null, type=decimalv3(38,12), nullable=true, isAutoIncrement=false, subColPath=null} |
```

计算结果：
```sql
select f1, f2, f1 / f2 from test_decimal_div_overflow1;
+-----------------------------+----------------------------+----------------+
| f1                          | f2                         | f1 / f2        |
+-----------------------------+----------------------------+----------------+
| 123456789012345678.12345678 | 23456789012345678.12345678 | 5.263158096675 |
+-----------------------------+----------------------------+----------------+
```

###### 除法溢出规则2
```sql
create table test_decimal(f1 decimal(38, 4), f2 decimal(38, 4)) properties('replication_num'='1');

insert into test_decimal values('123456789012345678.1234', '23456789012345678.1234');
```
根据除法结果精度的计算规则，默认配置下(`enable_decimal256`=false, `decimal_overflow_scale`=6, `div_precision_increment`=4)，正常计算出来的结果类型是`decimal(38 + 4 + 4, 4 + 4)`，即`decimal(46, 8)`。precision溢出了，需要按照溢出时的规则重新计算：`MAX_P` - `decimal_overflow_scale` = 38 - 6 = 32，`precision` - s1 = 46 - 4 = 42 > 32，s1 = 4 < `decimal_overflow_scale`，所以适用`溢出时scale`规则2，结果scale为`s1` + `div_precision_increment` = 4 + 4 = 8，结果类型为`decimal(38, 8)`：
```sql
explain verbose select f1, f2, f1 / f2 from test_decimal;
+---------------------------------------------------------------------------------------------------------------------------------+
| Explain String(Nereids Planner)                                                                                                 |
+---------------------------------------------------------------------------------------------------------------------------------+
| PLAN FRAGMENT 0                                                                                                                 |
|   OUTPUT EXPRS:                                                                                                                 |
|     f1[#2]                                                                                                                      |
|     f2[#3]                                                                                                                      |
|     f1 / f2[#4]                                                                                                                 |
|   PARTITION: UNPARTITIONED                                                                                                      |
|                                                                                                                                 |
|   HAS_COLO_PLAN_NODE: false                                                                                                     |
|                                                                                                                                 |
|   VRESULT SINK                                                                                                                  |
|      MYSQL_PROTOCAL                                                                                                             |
|                                                                                                                                 |
|   1:VEXCHANGE                                                                                                                   |
|      offset: 0                                                                                                                  |
|      distribute expr lists:                                                                                                     |
|      tuple ids: 1N                                                                                                              |
|                                                                                                                                 |
| PLAN FRAGMENT 1                                                                                                                 |
|                                                                                                                                 |
|   PARTITION: RANDOM                                                                                                             |
|                                                                                                                                 |
|   HAS_COLO_PLAN_NODE: false                                                                                                     |
|                                                                                                                                 |
|   STREAM DATA SINK                                                                                                              |
|     EXCHANGE ID: 01                                                                                                             |
|     UNPARTITIONED                                                                                                               |
|                                                                                                                                 |
|   0:VOlapScanNode(59)                                                                                                           |
|      TABLE: test_decimal.test_decimal(test_decimal), PREAGGREGATION: ON                                                         |
|      partitions=1/1 (test_decimal)                                                                                              |
|      tablets=10/10, tabletList=1750210334096,1750210334098,1750210334100 ...                                                    |
|      cardinality=1, avgRowSize=3250.0, numNodes=1                                                                               |
|      pushAggOp=NONE                                                                                                             |
|      desc: 0                                                                                                                    |
|      final projections: f1[#0], f2[#1], (CAST(f1[#0] AS decimalv3(38,12)) / f2[#1])                                             |
|      final project output tuple id: 1                                                                                           |
|      tuple ids: 0                                                                                                               |
|                                                                                                                                 |
| Tuples:                                                                                                                         |
| TupleDescriptor{id=0, tbl=test_decimal}                                                                                         |
|   SlotDescriptor{id=0, col=f1, colUniqueId=0, type=decimalv3(38,4), nullable=true, isAutoIncrement=false, subColPath=null}      |
|   SlotDescriptor{id=1, col=f2, colUniqueId=1, type=decimalv3(38,4), nullable=true, isAutoIncrement=false, subColPath=null}      |
|                                                                                                                                 |
| TupleDescriptor{id=1, tbl=test_decimal}                                                                                         |
|   SlotDescriptor{id=2, col=f1, colUniqueId=0, type=decimalv3(38,4), nullable=true, isAutoIncrement=false, subColPath=null}      |
|   SlotDescriptor{id=3, col=f2, colUniqueId=1, type=decimalv3(38,4), nullable=true, isAutoIncrement=false, subColPath=null}      |
|   SlotDescriptor{id=4, col=null, colUniqueId=null, type=decimalv3(38,8), nullable=true, isAutoIncrement=false, subColPath=null} |
```
计算结果：
```sql
select f1, f2, f1 / f2 from test_decimal;
+-------------------------+------------------------+-------------+
| f1                      | f2                     | f1 / f2     |
+-------------------------+------------------------+-------------+
| 123456789012345678.1234 | 23456789012345678.1234 |  5.26315809 |
+-------------------------+------------------------+-------------+
```

如果期望结果保留更多小数位，可以调大`div_precision_increment`, 比如`admin set frontend config('div_precision_increment'='8');`，则根据上述计算规则，计算出的结果类型为`decimal(38, 12)`：
```sql
admin set frontend config('div_precision_increment'='8');

explain verbose select f1, f2, f1 / f2 from test_decimal;
+----------------------------------------------------------------------------------------------------------------------------------+
| Explain String(Nereids Planner)                                                                                                  |
+----------------------------------------------------------------------------------------------------------------------------------+
| PLAN FRAGMENT 0                                                                                                                  |
|   OUTPUT EXPRS:                                                                                                                  |
|     f1[#2]                                                                                                                       |
|     f2[#3]                                                                                                                       |
|     f1 / f2[#4]                                                                                                                  |
|   PARTITION: UNPARTITIONED                                                                                                       |
|                                                                                                                                  |
|   HAS_COLO_PLAN_NODE: false                                                                                                      |
|                                                                                                                                  |
|   VRESULT SINK                                                                                                                   |
|      MYSQL_PROTOCAL                                                                                                              |
|                                                                                                                                  |
|   1:VEXCHANGE                                                                                                                    |
|      offset: 0                                                                                                                   |
|      distribute expr lists:                                                                                                      |
|      tuple ids: 1N                                                                                                               |
|                                                                                                                                  |
| PLAN FRAGMENT 1                                                                                                                  |
|                                                                                                                                  |
|   PARTITION: RANDOM                                                                                                              |
|                                                                                                                                  |
|   HAS_COLO_PLAN_NODE: false                                                                                                      |
|                                                                                                                                  |
|   STREAM DATA SINK                                                                                                               |
|     EXCHANGE ID: 01                                                                                                              |
|     UNPARTITIONED                                                                                                                |
|                                                                                                                                  |
|   0:VOlapScanNode(59)                                                                                                            |
|      TABLE: test_decimal.test_decimal(test_decimal), PREAGGREGATION: ON                                                          |
|      partitions=1/1 (test_decimal)                                                                                               |
|      tablets=10/10, tabletList=1750210334096,1750210334098,1750210334100 ...                                                     |
|      cardinality=2, avgRowSize=3240.0, numNodes=1                                                                                |
|      pushAggOp=NONE                                                                                                              |
|      desc: 0                                                                                                                     |
|      final projections: f1[#0], f2[#1], (CAST(f1[#0] AS decimalv3(38,16)) / f2[#1])                                              |
|      final project output tuple id: 1                                                                                            |
|      tuple ids: 0                                                                                                                |
|                                                                                                                                  |
| Tuples:                                                                                                                          |
| TupleDescriptor{id=0, tbl=test_decimal}                                                                                          |
|   SlotDescriptor{id=0, col=f1, colUniqueId=0, type=decimalv3(38,4), nullable=true, isAutoIncrement=false, subColPath=null}       |
|   SlotDescriptor{id=1, col=f2, colUniqueId=1, type=decimalv3(38,4), nullable=true, isAutoIncrement=false, subColPath=null}       |
|                                                                                                                                  |
| TupleDescriptor{id=1, tbl=test_decimal}                                                                                          |
|   SlotDescriptor{id=2, col=f1, colUniqueId=0, type=decimalv3(38,4), nullable=true, isAutoIncrement=false, subColPath=null}       |
|   SlotDescriptor{id=3, col=f2, colUniqueId=1, type=decimalv3(38,4), nullable=true, isAutoIncrement=false, subColPath=null}       |
|   SlotDescriptor{id=4, col=null, colUniqueId=null, type=decimalv3(38,12), nullable=true, isAutoIncrement=false, subColPath=null} |
```
计算结果：
```sql
select f1, f2, f1 / f2 from test_decimal;
+-------------------------+------------------------+-----------------+
| f1                      | f2                     | f1 / f2         |
+-------------------------+------------------------+-----------------+
| 123456789012345678.1234 | 23456789012345678.1234 |  5.263158096675 |
+-------------------------+------------------------+-----------------+
```

如果开启decimal256(`set enable_decimal256 = true;`)，则正常计算出的结果precision没有溢出，结果类型是`decimal(46, 8)`：
```sql
set enable_decimal256=true;

admin set frontend config('div_precision_increment'='4');

explain verbose select f1, f2, f1 / f2 from test_decimal;
+---------------------------------------------------------------------------------------------------------------------------------+
| Explain String(Nereids Planner)                                                                                                 |
+---------------------------------------------------------------------------------------------------------------------------------+
| PLAN FRAGMENT 0                                                                                                                 |
|   OUTPUT EXPRS:                                                                                                                 |
|     f1[#2]                                                                                                                      |
|     f2[#3]                                                                                                                      |
|     f1 / f2[#4]                                                                                                                 |
|   PARTITION: UNPARTITIONED                                                                                                      |
|                                                                                                                                 |
|   HAS_COLO_PLAN_NODE: false                                                                                                     |
|                                                                                                                                 |
|   VRESULT SINK                                                                                                                  |
|      MYSQL_PROTOCAL                                                                                                             |
|                                                                                                                                 |
|   1:VEXCHANGE                                                                                                                   |
|      offset: 0                                                                                                                  |
|      distribute expr lists:                                                                                                     |
|      tuple ids: 1N                                                                                                              |
|                                                                                                                                 |
| PLAN FRAGMENT 1                                                                                                                 |
|                                                                                                                                 |
|   PARTITION: RANDOM                                                                                                             |
|                                                                                                                                 |
|   HAS_COLO_PLAN_NODE: false                                                                                                     |
|                                                                                                                                 |
|   STREAM DATA SINK                                                                                                              |
|     EXCHANGE ID: 01                                                                                                             |
|     UNPARTITIONED                                                                                                               |
|                                                                                                                                 |
|   0:VOlapScanNode(59)                                                                                                           |
|      TABLE: test_decimal.test_decimal(test_decimal), PREAGGREGATION: ON                                                         |
|      partitions=1/1 (test_decimal)                                                                                              |
|      tablets=10/10, tabletList=1750210334096,1750210334098,1750210334100 ...                                                    |
|      cardinality=2, avgRowSize=3240.0, numNodes=1                                                                               |
|      pushAggOp=NONE                                                                                                             |
|      desc: 0                                                                                                                    |
|      final projections: f1[#0], f2[#1], (CAST(f1[#0] AS decimalv3(46,12)) / f2[#1])                                             |
|      final project output tuple id: 1                                                                                           |
|      tuple ids: 0                                                                                                               |
|                                                                                                                                 |
| Tuples:                                                                                                                         |
| TupleDescriptor{id=0, tbl=test_decimal}                                                                                         |
|   SlotDescriptor{id=0, col=f1, colUniqueId=0, type=decimalv3(38,4), nullable=true, isAutoIncrement=false, subColPath=null}      |
|   SlotDescriptor{id=1, col=f2, colUniqueId=1, type=decimalv3(38,4), nullable=true, isAutoIncrement=false, subColPath=null}      |
|                                                                                                                                 |
| TupleDescriptor{id=1, tbl=test_decimal}                                                                                         |
|   SlotDescriptor{id=2, col=f1, colUniqueId=0, type=decimalv3(38,4), nullable=true, isAutoIncrement=false, subColPath=null}      |
|   SlotDescriptor{id=3, col=f2, colUniqueId=1, type=decimalv3(38,4), nullable=true, isAutoIncrement=false, subColPath=null}      |
|   SlotDescriptor{id=4, col=null, colUniqueId=null, type=decimalv3(46,8), nullable=true, isAutoIncrement=false, subColPath=null} |

select f1, f2, f1 / f2 from test_decimal;
+-------------------------+------------------------+-------------+
| f1                      | f2                     | f1 / f2     |
+-------------------------+------------------------+-------------+
| 123456789012345678.1234 | 23456789012345678.1234 |  5.26315809 |
+-------------------------+------------------------+-------------+
```

###### 除法溢出规则3
```sql
create table test_decimal_div_overflow3(f1 decimal(38, 7), f2 decimal(38, 7)) properties('replication_num'='1');

insert into test_decimal_div_overflow3 values('123456789012345678.1234567', '23456789012345678.1234567');
```
根据除法结果精度的计算规则，默认配置下(`enable_decimal256`=false, `decimal_overflow_scale`=6, `div_precision_increment`=4)，正常计算出来的结果类型是`decimal(38 + 7 + 4, 7 + 4)`，即`decimal(49, 11)`。precision溢出了，需要按照溢出时的规则重新计算：`MAX_P` - `decimal_overflow_scale` = 38 - 6 = 32，`precision` - s1 = 49 - 7 = 42 > 32，s1 = 7 > `decimal_overflow_scale`，所以适用`溢出时scale`规则3，结果scale为`decimal_overflow_scale` + `div_precision_increment` = 6 + 4 = 10，结果类型为`decimal(38, 10)`：
```sql
explain verbose select f1, f2, f1 / f2 from test_decimal_div_overflow3;
+----------------------------------------------------------------------------------------------------------------------------------+
| Explain String(Nereids Planner)                                                                                                  |
+----------------------------------------------------------------------------------------------------------------------------------+
| PLAN FRAGMENT 0                                                                                                                  |
|   OUTPUT EXPRS:                                                                                                                  |
|     f1[#2]                                                                                                                       |
|     f2[#3]                                                                                                                       |
|     f1 / f2[#4]                                                                                                                  |
|   PARTITION: UNPARTITIONED                                                                                                       |
|                                                                                                                                  |
|   HAS_COLO_PLAN_NODE: false                                                                                                      |
|                                                                                                                                  |
|   VRESULT SINK                                                                                                                   |
|      MYSQL_PROTOCAL                                                                                                              |
|                                                                                                                                  |
|   1:VEXCHANGE                                                                                                                    |
|      offset: 0                                                                                                                   |
|      distribute expr lists:                                                                                                      |
|      tuple ids: 1N                                                                                                               |
|                                                                                                                                  |
| PLAN FRAGMENT 1                                                                                                                  |
|                                                                                                                                  |
|   PARTITION: RANDOM                                                                                                              |
|                                                                                                                                  |
|   HAS_COLO_PLAN_NODE: false                                                                                                      |
|                                                                                                                                  |
|   STREAM DATA SINK                                                                                                               |
|     EXCHANGE ID: 01                                                                                                              |
|     UNPARTITIONED                                                                                                                |
|                                                                                                                                  |
|   0:VOlapScanNode(59)                                                                                                            |
|      TABLE: test_decimal.test_decimal_div_overflow3(test_decimal_div_overflow3), PREAGGREGATION: ON                                      |
|      partitions=1/1 (test_decimal_div_overflow3)                                                                                     |
|      tablets=10/10, tabletList=1750210336825,1750210336827,1750210336829 ...                                                     |
|      cardinality=1, avgRowSize=0.0, numNodes=1                                                                                   |
|      pushAggOp=NONE                                                                                                              |
|      desc: 0                                                                                                                     |
|      final projections: f1[#0], f2[#1], (CAST(f1[#0] AS decimalv3(38,17)) / f2[#1])                                              |
|      final project output tuple id: 1                                                                                            |
|      tuple ids: 0                                                                                                                |
|                                                                                                                                  |
| Tuples:                                                                                                                          |
| TupleDescriptor{id=0, tbl=test_decimal_div_overflow3}                                                                                |
|   SlotDescriptor{id=0, col=f1, colUniqueId=0, type=decimalv3(38,7), nullable=true, isAutoIncrement=false, subColPath=null}       |
|   SlotDescriptor{id=1, col=f2, colUniqueId=1, type=decimalv3(38,7), nullable=true, isAutoIncrement=false, subColPath=null}       |
|                                                                                                                                  |
| TupleDescriptor{id=1, tbl=test_decimal_div_overflow3}                                                                                |
|   SlotDescriptor{id=2, col=f1, colUniqueId=0, type=decimalv3(38,7), nullable=true, isAutoIncrement=false, subColPath=null}       |
|   SlotDescriptor{id=3, col=f2, colUniqueId=1, type=decimalv3(38,7), nullable=true, isAutoIncrement=false, subColPath=null}       |
|   SlotDescriptor{id=4, col=null, colUniqueId=null, type=decimalv3(38,10), nullable=true, isAutoIncrement=false, subColPath=null} |
```

计算结果：
```sql
select f1, f2, f1 / f2 from test_decimal_div_overflow3; 
+----------------------------+---------------------------+--------------+
| f1                         | f2                        | f1 / f2      |
+----------------------------+---------------------------+--------------+
| 123456789012345678.1234567 | 23456789012345678.1234567 | 5.2631580966 |
+----------------------------+---------------------------+--------------+
```

#### 聚合运算

* SUM / MULTI_DISTINCT_SUM: SUM(DECIMAL(a, b)) -> DECIMAL(MAX_P, b).
* AVG: AVG(DECIMAL(a, b)) -> DECIMAL(MAX_P, max(b, 4)).

#### 默认规则

除上述提到的函数外，其余表达式都使用默认规则进行精度推演。即对于表达式 `expr(DECIMAL(a, b))`，结果类型同样也是 DECIMAL(a, b)。

#### 调整结果精度

不同用户对 DECIMAL 的精度要求各不相同，上述规则为当前 Doris 的默认行为，如果用户**有不同的精度需求，可以通过以下方式进行精度调整**：
1. 如果期望的结果精度大于默认精度，可以通过调整入参精度来调整结果精度。例如用户期望计算`AVG(col)`得到 DECIMAL(x, y) 作为结果，其中`col`的类型为 DECIMAL(a, b)，则可以改写表达式为`AVG(CAST(col as DECIMAL(x, y)))`。
2. 如果期望的结果精度小于默认精度，可以通过对输出结果求近似得到想要的精度。例如用户期望计算`AVG(col)`得到 DECIMAL(x, y) 作为结果，其中`col`的类型为 DECIMAL(a, b)，则可以改写表达式为`ROUND(AVG(col), y)`。

### 为什么需要 DECIMAL

Doris 中的 DECIMAL 是真正意义上的高精度定点数，Decimal 有以下核心优势：
1. 可表示范围更大。DECIMAL 中 precision 和 scale 的取值范围都进行了明显扩充。
2. 性能更高。老版本的 DECIMAL 在内存中需要占用 16 bytes，在存储中占用 12 bytes，而 DECIMAL 进行了自适应调整（如下表格）。

|     precision        | 占用空间（内存/磁盘）|
|----------------------|-------------------|
| 0 < precision <= 9   |      4 bytes      |
| 9 < precision <= 18  |      8 bytes      |
| 18 < precision <= 38 |     16 bytes      |
| 38 < precision <= 76 |     32 bytes      |

3. 更完备的精度推演。对于不同的表达式，应用不同的精度推演规则对结果的精度进行推演。

### keywords
    DECIMAL
