---
{
    "title": "DECIMAL",
    "language": "en",
    "description": "DECIMAL"
}
---

## DECIMAL

DECIMAL

### Description
    DECIMAL(P[,S])
    High-precision fixed-point number, where P represents the total count of significant digits (precision), and S is the count of decimal digits in the fractional part, to the right of the decimal point.
    The range of significant digits P is [1, MAX_P], where MAX_P=38 when enable_decimal256=false, and MAX_P=76 when enable_decimal256=true.
    The range of decimal places S is [0, P].

    By default, precision is 38, and scale is 9(that is DECIMAL(38, 9)).

    The default value of enable_decimal256 is false. Setting it to true can get more accurate results, but it will bring some performance loss.

    When outputting decimal types, the decimal point is always followed by S digits, even if the trailing digits are 0. For example, the number 123.456 of type decimal(18, 6) will be output as 123.456000.

### Precision Deduction

DECIMAL has a very complex set of type inference rules. For different expressions, different rules will be applied for precision inference.

#### Arithmetic Operations

Assuming e1(p1, s1) and e2(p2, s2) are two DECIMAL numbers, the precision deduction rules for operation results are as follows:

|Operation|Result precision|Result scale|Result precision if overflow|Result scale if overflow|Intermediate e1 type|Intermediate e2 type|
|-------|------------|---------|-----------------|--------------|--------|------|
|e1 + e2|max(p1 - s1,p2 - s2) + max(s1, s2) + 1|max(s1, s2)|MAX_P|min(MAX_P, p) - max(p1 - s1,p2 - s2)|Cast according to result|Cast according to result|
|e1 - e2|max(p1 - s1,p2 - s2) + max(s1, s2) + 1|max(s1, s2)|MAX_P|min(MAX_P, p) - max(p1 - s1,p2 - s2)|Cast according to result|Cast according to result|
|e1 * e2|p1 + p2|s1 + s2|MAX_P|<ol><li>precision - scale < MAX_P - `decimal_overflow_scale`: min(scale, 38 - (precision - scale))</li><li>precision - scale > MAX_P - `decimal_overflow_scale`, and scale < `decimal_overflow_scale`: s1 + s2</li><li>precision - scale > MAX_P - `decimal_overflow_scale`，scale >= `decimal_overflow_scale`：`decimal_overflow_scale`</li></ol>|Unchanged|Unchanged|
|e1 / e2|p1 + s2 + `div_precision_increment`|s1 + `div_precision_increment`|MAX_P|<ol><li>precision - s1 less than max_precision - `decimal_overflow_scale`: (max_precision - (precision - s1)) + `div_precision_increment`</li><li>precision - s1 greater than max_precision - `decimal_overflow_scale`, and s1 less than `decimal_overflow_scale`: s1 + `div_precision_increment`</li><li>precision - s1 greater than max_precision - `decimal_overflow_scale`, and s1 greater than or equal to `decimal_overflow_scale`: `decimal_overflow_scale` + `div_precision_increment`</li></ol>|p cast according to result, s cast according to result+e2.scale||
|e1 % e2|max(p1 - s1,p2 - s2) + max(s1, s2)|max(s1, s2)|MAX_P|min(MAX_P, p) - max(p1 - s1,p2 - s2)|Cast according to result|Cast according to result|

In the rules for calculating `Result scale if overflow` in the table, `precision` refers to `precision` in the `Result precision` column, and `scale` refers to `scale` in the `Result scale` column.

`div_precision_increment` is a configuration parameter of FE, see [div_precision_increment](../../../../admin-manual/config/fe-config#div_precision_increment).

`decimal_overflow_scale` is a session variable of FE, which indicates the maximum number of decimal places that can be retained in the calculation result when the precision of the decimal value calculation result overflows. The default value is 6.

It is worth noting that the process of division calculation is as follows:
DECIMAL(p1, s1) / DECIMAL(p2, s2) is first converted to DECIMAL(p1 + s2 + div_precision_increment, s1 + s2) / DECIMAL(p2, s2) and then the calculation is performed. Therefore, it is possible that DECIMAL(p1 + s2 + div_precision_increment, s1 + div_precision_increment) satisfies the range of DECIMAL, 
but due to the conversion to DECIMAL(p1 + s2 + div_precision_increment, s1 + s2), 
it exceeds the range, Doris will report an `Arithmetic overflow` error by default.

##### Examples
###### Multiplication No Overflow
```sql
create table test_decimal_mul_no_overflow(f1 decimal(19, 9), f2 decimal(19, 9)) properties('replication_num'='1');
insert into test_decimal_mul_no_overflow values('9999999999.999999999', '9999999999.999999999');
```
According to the calculation rules of the multiplication result precision, the result type is decimal(38, 18) and will not overflow:
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

Calculation Results:
```sql
select f1, f2, f1 * f2 from test_decimal_mul_no_overflow;
+----------------------+----------------------+-----------------------------------------+
| f1                   | f2                   | f1 * f2                                 |
+----------------------+----------------------+-----------------------------------------+
| 9999999999.999999999 | 9999999999.999999999 | 99999999999999999980.000000000000000001 |
+----------------------+----------------------+-----------------------------------------+
```

###### Multiplication Overflow
```sql
create table test_decimal_mul_overflow1(f1 decimal(20, 5), f2 decimal(21, 6)) properties('replication_num'='1');
insert into test_decimal_mul_overflow1 values('12345678901234.12345', '12345678901234.123456');
```
According to the calculation rules of the precision of the multiplication result, under the default configuration (`enable_decimal256`=false, `decimal_overflow_scale`=6, `div_precision_increment`=4), the normal calculated result type is `decimal(41, 11)`. The precision overflows and needs to be recalculated according to the overflow rules: `MAX_P` - `decimal_overflow_scale` = 38 - 6 = 32, `precision` - `scale` = 41 - 11 = 30 < 32, Rule 1 applies, the final result scale = min(11, 38 - 30) = 8, and the final result type is decimal(38, 8):
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
Calculation Results:
```sql
select f1, f2, f1 * f2 from test_decimal_mul_overflow1;
+----------------------+-----------------------+--------------------------------------+
| f1                   | f2                    | f1 * f2                              |
+----------------------+-----------------------+--------------------------------------+
| 12345678901234.12345 | 12345678901234.123456 | 152415787532377393748917544.09724464 |
+----------------------+-----------------------+--------------------------------------+
```
If the value of `decimal_overflow_scale` is increased, for example, `set decimal_overflow_scale=9;`, the calculation is performed according to the overflow rule: `MAX_P` - `decimal_overflow_scale` = 38 - 9 = 29, `precision` - `scale` = 41 - 11 = 30 > 29, and scale > `decimal_overflow_scale`, overflow rule 3 applies, and the final calculated result type is: `decimal(38,9)`:
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
Calculation Results:
```sql
select f1, f2, f1 * f2 from test_decimal_mul_overflow1;
+----------------------+-----------------------+---------------------------------------+
| f1                   | f2                    | f1 * f2                               |
+----------------------+-----------------------+---------------------------------------+
| 12345678901234.12345 | 12345678901234.123456 | 152415787532377393748917544.097244643 |
+----------------------+-----------------------+---------------------------------------+
```
If we continue to increase the value of `decimal_overflow_scale`, for example, `set decimal_overflow_scale=12;`, we calculate according to the overflow rule: `MAX_P` - `decimal_overflow_scale` = 38 - 12 = 26, `precision` - `scale` = 41 - 11 = 30 > 26, and scale < `decimal_overflow_scale`. In this case, overflow rule 2 applies, and the final calculated result type is: `decimal(38,11)`:
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
Calculation Results:
```sql
select f1, f2, f1 * f2 from test_decimal_mul_overflow1;
+----------------------+-----------------------+-----------------------------------------+
| f1                   | f2                    | f1 * f2                                 |
+----------------------+-----------------------+-----------------------------------------+
| 12345678901234.12345 | 12345678901234.123456 | 152415787532377393748917544.09724464320 |
+----------------------+-----------------------+-----------------------------------------+
```

###### Enable decimal256 when multiplication overflow
```sql
create table test_decimal_mul_overflow_dec256(f1 decimal(38, 19), f2 decimal(38, 19)) properties('replication_num'='1');
insert into test_decimal_mul_overflow_dec256 values('9999999999999999999.9999999999999999999', '9999999999999999999.9999999999999999999');
```
By default (`enable_decimal256`=false), the actual result of the multiplication will overflow. In this case, you can enable decimal256: `set enable_decimal256=true` to calculate the exact result, and the result type is decimal(76, 38):
```sql
set enable_decimal256=true;

elect f1, f2, f1 * f2 from test_decimal_mul_overflow_dec256;
+-----------------------------------------+-----------------------------------------+-------------------------------------------------------------------------------+
| f1                                      | f2                                      | f1 * f2                                                                       |
+-----------------------------------------+-----------------------------------------+-------------------------------------------------------------------------------+
| 9999999999999999999.9999999999999999999 | 9999999999999999999.9999999999999999999 | 99999999999999999999999999999999999998.00000000000000000000000000000000000001 |
+-----------------------------------------+-----------------------------------------+-------------------------------------------------------------------------------+
```

###### Division No Overflow
```sql
create table test_decimal_div_no_overflow(f1 decimal(19, 9), f2 decimal(19, 9)) properties('replication_num'='1');

insert into test_decimal_div_no_overflow values('1234567890.123456789', '234567890.123456789');
```
According to the calculation rules of the division result precision, under the default configuration (`enable_decimal256`=false, `decimal_overflow_scale`=6, `div_precision_increment`=4), the normal calculated result type is `decimal(19 + 9 + 4, 9 + 4)`, that is, `decimal(32, 13)`, and the precision does not overflow. The final type of the result is `decimal(32, 13)`:

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

If you want the result to retain more decimal places, you can increase `div_precision_increment`, for example, `admin set frontend config('div_precision_increment'='8');`. Then according to the above calculation rules, the calculated result type is `decimal(36, 17)`:
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
Calculation Result:
```sql
select f1, f2, f1 / f2 from test_decimal_div_no_overflow;
+----------------------+---------------------+---------------------+
| f1                   | f2                  | f1 / f2             |
+----------------------+---------------------+---------------------+
| 1234567890.123456789 | 234567890.123456789 | 5.26315809667590986 |
+----------------------+---------------------+---------------------+
```

###### Division Overflow Rule 1
```sql
create table test_decimal_div_overflow1(f1 decimal(27, 8), f2 decimal(27, 8)) properties('replication_num'='1');

insert into test_decimal_div_overflow1 values('123456789012345678.12345678', '23456789012345678.12345678');
```
According to the calculation rules of the division result precision, under the default configuration (`enable_decimal256`=false, `decimal_overflow_scale`=6, `div_precision_increment`=4), the normal calculated result type is `decimal(27 + 8 + 4, 8 + 4)`, that is, `decimal(39, 12)`. The precision overflowed and needs to be recalculated according to the overflow rules: `MAX_P` - `decimal_overflow_scale` = 38 - 6 = 32, `precision` - s1 = 39 - 8 = 31 < 32, so the `Result scale if overflow` rule 1 applies, and the result scale is (`MAX_P` - (`precision` - `s1`)) + `div_precision_increment` = (38 - (39 - 8)) + 4 = 11, and the result type is `decimal(38, 11)`:
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

Calculation Result:
```sql
select f1, f2, f1 / f2 from test_decimal_div_overflow1; 
+-----------------------------+----------------------------+---------------+
| f1                          | f2                         | f1 / f2       |
+-----------------------------+----------------------------+---------------+
| 123456789012345678.12345678 | 23456789012345678.12345678 | 5.26315809667 |
+-----------------------------+----------------------------+---------------+
```

If the value of `decimal_overflow_scale` is increased, for example, `set decimal_overflow_scale=8;`, the calculation is performed according to the overflow rules: `MAX_P` - `decimal_overflow_scale` = 38 - 8 = 30, `precision` - s1 = 39 - 8 = 31 > 30, and s1 == `decimal_overflow_scale`, overflow rule 3 applies, and the final calculated result type is: `decimalv3(38,12)`:
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

Calculation Result:
```sql
select f1, f2, f1 / f2 from test_decimal_div_overflow1;
+-----------------------------+----------------------------+----------------+
| f1                          | f2                         | f1 / f2        |
+-----------------------------+----------------------------+----------------+
| 123456789012345678.12345678 | 23456789012345678.12345678 | 5.263158096675 |
+-----------------------------+----------------------------+----------------+
```

###### Division Overflow Rule 2
```sql
create table test_decimal(f1 decimal(38, 4), f2 decimal(38, 4)) properties('replication_num'='1');

insert into test_decimal values('123456789012345678.1234', '23456789012345678.1234');
```
According to the calculation rules of the division result precision, under the default configuration (`enable_decimal256`=false, `decimal_overflow_scale`=6, `div_precision_increment`=4), the normal calculated result type is `decimal(38 + 4 + 4, 4 + 4)`, that is, `decimal(46, 8)`. The precision overflowed and needs to be recalculated according to the overflow rules: `MAX_P` - `decimal_overflow_scale` = 38 - 6 = 32, `precision` - s1 = 46 - 4 = 42 > 32, s1 = 4 < `decimal_overflow_scale`, so the `Result scale if overflow` rule 2 is applied, and the result scale is `s1` + `div_precision_increment` = 4 + 4 = 8, and the result type is `decimal(38, 8)`:
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
Calculation Result:
```sql
select f1, f2, f1 / f2 from test_decimal;
+-------------------------+------------------------+-------------+
| f1                      | f2                     | f1 / f2     |
+-------------------------+------------------------+-------------+
| 123456789012345678.1234 | 23456789012345678.1234 |  5.26315809 |
+-------------------------+------------------------+-------------+
```

If you want the result to retain more decimal places, you can increase `div_precision_increment`, for example, `admin set frontend config('div_precision_increment'='8');`. Then according to the above calculation rules, the calculated result type is `decimal(38, 12)`:
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
Calculation result:
```sql
select f1, f2, f1 / f2 from test_decimal;
+-------------------------+------------------------+-----------------+
| f1                      | f2                     | f1 / f2         |
+-------------------------+------------------------+-----------------+
| 123456789012345678.1234 | 23456789012345678.1234 |  5.263158096675 |
+-------------------------+------------------------+-----------------+
```

If decimal256 is enabled (`set enable_decimal256 = true;`), the result precision is calculated normally without overflow, and the result type is `decimal(46, 8)`:
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

###### Division Overflow Rule 3
```sql
create table test_decimal_div_overflow3(f1 decimal(38, 7), f2 decimal(38, 7)) properties('replication_num'='1');

insert into test_decimal_div_overflow3 values('123456789012345678.1234567', '23456789012345678.1234567');
```
According to the calculation rules of the division result precision, under the default configuration (`enable_decimal256`=false, `decimal_overflow_scale`=6, `div_precision_increment`=4), the normal calculated result type is `decimal(38 + 7 + 4, 7 + 4)`, that is, `decimal(49, 11)`. The precision overflows and needs to be recalculated according to the overflow rules: `MAX_P` - `decimal_overflow_scale` = 38 - 6 = 32, `precision` - s1 = 49 - 7 = 42 > 32, s1 = 7 > `decimal_overflow_scale`, so the `Result scale if overflow` rule 3 is applied, and the result scale is `decimal_overflow_scale` + `div_precision_increment` = 6 + 4 = 10, and the result type is `decimal(38, 10)`:
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

Caculation result:
```sql
select f1, f2, f1 / f2 from test_decimal_div_overflow3; 
+----------------------------+---------------------------+--------------+
| f1                         | f2                        | f1 / f2      |
+----------------------------+---------------------------+--------------+
| 123456789012345678.1234567 | 23456789012345678.1234567 | 5.2631580966 |
+----------------------------+---------------------------+--------------+
```

#### Aggregation Operations

* SUM / MULTI_DISTINCT_SUM: SUM(DECIMAL(a, b)) -> DECIMAL(MAX_P, b).
* AVG: AVG(DECIMAL(a, b)) -> DECIMAL(MAX_P, max(b, 4)).

#### Default Rules

Except for the expressions mentioned above, other expressions use default rules for precision deduction. That is, for the expression `expr(DECIMAL(a, b))`, the result type is also DECIMAL(a, b).

#### Adjusting Result Precision

Different users have different precision requirements for DECIMAL. The above rules are the default behavior of Doris. If users **have different precision requirements, they can adjust the precision in the following ways**:

* If the expected result precision is greater than the default precision, you can adjust the result precision by adjusting the parameter's precision. For example, if the user expects to calculate `AVG(col)` and get DECIMAL(x, y) as the result, where the type of `col` is DECIMAL (a, b), the expression can be rewritten to `AVG(CAST(col as DECIMAL (x, y))`.
* If the expected result precision is less than the default precision, the desired precision can be obtained by approximating the output result. For example, if the user expects to calculate `AVG(col)` and get DECIMAL(x, y) as the result, where the type of `col` is DECIMAL(a, b), the expression can be rewritten as `ROUND(AVG(col), y)`.

### Why DECIMAL is Required

DECIMAL in Doris is a real high-precision fixed-point number. Decimal has the following core advantages:
1. It can represent a wider range. The value ranges of both precision and scale in DECIMAL have been significantly expanded.
2. Higher performance. The old version of DECIMAL requires 16 bytes in memory and 12 bytes in storage, while DECIMAL has made adaptive adjustments as shown below.

|     precision        | Space occupied (memory/disk) |
|----------------------|-------------------|
| 0 < precision <= 9   |      4 bytes      |
| 9 < precision <= 18  |      8 bytes      |
| 18 < precision <= 38 |     16 bytes      |
| 38 < precision <= 76 |     32 bytes      |

3. More complete precision deduction. For different expressions, different precision inference rules are applied to deduce the precision of the results.

### keywords
DECIMAL
