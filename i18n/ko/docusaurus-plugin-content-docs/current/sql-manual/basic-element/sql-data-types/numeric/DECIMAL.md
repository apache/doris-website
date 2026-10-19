---
{
    "title": "DECIMAL",
    "language": "ko",
    "description": "DECIMAL"
}
---

## DECIMAL {#decimal}

DECIMAL

### 설명 {#description}
    DECIMAL(P[,S])
    High-precision fixed-point number, where P represents the total count of significant digits (precision), and S is the count of decimal digits in the fractional part, to the right of the decimal point.
    The range of significant digits P is [1, MAX_P], where MAX_P=38 when enable_decimal256=false, and MAX_P=76 when enable_decimal256=true.
    The range of decimal places S is [0, P].

    By default, precision is 38, and scale is 9(that is DECIMAL(38, 9)).

    The default value of enable_decimal256 is false. Setting it to true can get more accurate results, but it will bring some performance loss.

    When outputting decimal types, the decimal point is always followed by S digits, even if the trailing digits are 0. For example, the number 123.456 of type decimal(18, 6) will be output as 123.456000.

### 정밀도 추론 {#precision-deduction}

DECIMAL에는 매우 복잡한 타입 추론 규칙이 있습니다. 표현식에 따라 서로 다른 규칙을 적용하여 정밀도를 추론합니다.

#### 산술 연산 {#arithmetic-operations}

e1(p1, s1)과 e2(p2, s2)가 두 DECIMAL 수라고 가정할 때, 연산 결과의 정밀도 추론 규칙은 다음과 같습니다.

|연산|결과 정밀도|결과 소수 자릿수|오버플로 시 결과 정밀도|오버플로 시 결과 소수 자릿수|중간 e1 타입|중간 e2 타입|
|-------|------------|---------|-----------------|--------------|--------|------|
|e1 + e2|max(p1 - s1,p2 - s2) + max(s1, s2) + 1|max(s1, s2)|MAX_P|min(MAX_P, p) - max(p1 - s1,p2 - s2)|결과에 따라 형 변환|결과에 따라 형 변환|
|e1 - e2|max(p1 - s1,p2 - s2) + max(s1, s2) + 1|max(s1, s2)|MAX_P|min(MAX_P, p) - max(p1 - s1,p2 - s2)|결과에 따라 형 변환|결과에 따라 형 변환|
|e1 * e2|p1 + p2|s1 + s2|MAX_P|<ol><li>precision - scale < MAX_P - `decimal_overflow_scale`: min(scale, 38 - (precision - scale))</li><li>precision - scale > MAX_P - `decimal_overflow_scale`이고 scale < `decimal_overflow_scale`인 경우: s1 + s2</li><li>precision - scale > MAX_P - `decimal_overflow_scale`이고 scale >= `decimal_overflow_scale`인 경우: `decimal_overflow_scale`</li></ol>|변경 없음|변경 없음|
|e1 / e2|p1 + s2 + `div_precision_increment`|s1 + `div_precision_increment`|MAX_P|<ol><li>precision - s1이 max_precision - `decimal_overflow_scale`보다 작은 경우: (max_precision - (precision - s1)) + `div_precision_increment`</li><li>precision - s1이 max_precision - `decimal_overflow_scale`보다 크고 s1이 `decimal_overflow_scale`보다 작은 경우: s1 + `div_precision_increment`</li><li>precision - s1이 max_precision - `decimal_overflow_scale`보다 크고 s1이 `decimal_overflow_scale`보다 크거나 같은 경우: `decimal_overflow_scale` + `div_precision_increment`</li></ol>|p는 결과에 따라 형 변환, s는 결과+e2.scale에 따라 형 변환||
|e1 % e2|max(p1 - s1,p2 - s2) + max(s1, s2)|max(s1, s2)|MAX_P|min(MAX_P, p) - max(p1 - s1,p2 - s2)|결과에 따라 형 변환|결과에 따라 형 변환|

위 표의 `Result scale if overflow` 계산 규칙에서 `precision`은 `precision`, 즉 `Result precision` 열의 값을 가리키고, `scale`은 `scale`, 즉 `Result scale` 열의 값을 가리킵니다.

`div_precision_increment`는 FE의 설정 매개변수입니다. [div_precision_increment](../../../../admin-manual/config/fe-config#div_precision_increment)를 참조하세요.

`decimal_overflow_scale`은 FE의 세션 변수로, decimal 값의 계산 결과에서 정밀도 오버플로가 발생할 때 결과에 유지할 수 있는 최대 소수 자릿수를 나타냅니다. 기본값은 6입니다.

나눗셈은 다음과 같은 과정으로 계산된다는 점에 유의하세요.
DECIMAL(p1, s1) / DECIMAL(p2, s2)는 먼저 DECIMAL(p1 + s2 + div_precision_increment, s1 + s2) / DECIMAL(p2, s2)로 변환된 후 계산됩니다. 따라서 DECIMAL(p1 + s2 + div_precision_increment, s1 + div_precision_increment)가 DECIMAL의 범위 안에 있더라도,
DECIMAL(p1 + s2 + div_precision_increment, s1 + s2)로 변환하면서
범위를 초과할 수 있습니다. 이 경우 Doris는 기본적으로 `Arithmetic overflow` 오류를 보고합니다.

##### 예제 {#examples}
###### 오버플로가 발생하지 않는 곱셈 {#multiplication-no-overflow}
```sql
create table test_decimal_mul_no_overflow(f1 decimal(19, 9), f2 decimal(19, 9)) properties('replication_num'='1');
insert into test_decimal_mul_no_overflow values('9999999999.999999999', '9999999999.999999999');
```
곱셈 결과의 정밀도 계산 규칙에 따르면 결과 타입은 decimal(38, 18)이며 오버플로가 발생하지 않습니다.
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

계산 결과:
```sql
select f1, f2, f1 * f2 from test_decimal_mul_no_overflow;
+----------------------+----------------------+-----------------------------------------+
| f1                   | f2                   | f1 * f2                                 |
+----------------------+----------------------+-----------------------------------------+
| 9999999999.999999999 | 9999999999.999999999 | 99999999999999999980.000000000000000001 |
+----------------------+----------------------+-----------------------------------------+
```

###### 곱셈 오버플로 {#multiplication-overflow}
```sql
create table test_decimal_mul_overflow1(f1 decimal(20, 5), f2 decimal(21, 6)) properties('replication_num'='1');
insert into test_decimal_mul_overflow1 values('12345678901234.12345', '12345678901234.123456');
```
곱셈 결과의 정밀도 계산 규칙에 따르면 기본 설정(`enable_decimal256`=false, `decimal_overflow_scale`=6, `div_precision_increment`=4)에서 일반적인 계산 결과 타입은 `decimal(41, 11)`입니다. 정밀도 오버플로가 발생하므로 오버플로 규칙에 따라 다시 계산해야 합니다. `MAX_P` - `decimal_overflow_scale` = 38 - 6 = 32이고 `precision` - `scale` = 41 - 11 = 30 < 32이므로 규칙 1이 적용됩니다. 최종 결과의 소수 자릿수 = min(11, 38 - 30) = 8이며, 최종 결과 타입은 decimal(38, 8)입니다.
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
계산 결과:
```sql
select f1, f2, f1 * f2 from test_decimal_mul_overflow1;
+----------------------+-----------------------+--------------------------------------+
| f1                   | f2                    | f1 * f2                              |
+----------------------+-----------------------+--------------------------------------+
| 12345678901234.12345 | 12345678901234.123456 | 152415787532377393748917544.09724464 |
+----------------------+-----------------------+--------------------------------------+
```
`decimal_overflow_scale` 값을 늘리면, 예를 들어 `set decimal_overflow_scale=9;`로 설정하면 오버플로 규칙에 따라 다음과 같이 계산됩니다. `MAX_P` - `decimal_overflow_scale` = 38 - 9 = 29이고 `precision` - `scale` = 41 - 11 = 30 > 29이며 scale > `decimal_overflow_scale`이므로 오버플로 규칙 3이 적용됩니다. 최종 계산 결과 타입은 `decimal(38,9)`입니다.
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
계산 결과:
```sql
select f1, f2, f1 * f2 from test_decimal_mul_overflow1;
+----------------------+-----------------------+---------------------------------------+
| f1                   | f2                    | f1 * f2                               |
+----------------------+-----------------------+---------------------------------------+
| 12345678901234.12345 | 12345678901234.123456 | 152415787532377393748917544.097244643 |
+----------------------+-----------------------+---------------------------------------+
```
`decimal_overflow_scale` 값을 더 늘리면, 예를 들어 `set decimal_overflow_scale=12;`로 설정하면 오버플로 규칙에 따라 다음과 같이 계산됩니다. `MAX_P` - `decimal_overflow_scale` = 38 - 12 = 26이고 `precision` - `scale` = 41 - 11 = 30 > 26이며 scale < `decimal_overflow_scale`입니다. 이 경우 오버플로 규칙 2가 적용되며, 최종 계산 결과 타입은 `decimal(38,11)`입니다.
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
계산 결과:
```sql
select f1, f2, f1 * f2 from test_decimal_mul_overflow1;
+----------------------+-----------------------+-----------------------------------------+
| f1                   | f2                    | f1 * f2                                 |
+----------------------+-----------------------+-----------------------------------------+
| 12345678901234.12345 | 12345678901234.123456 | 152415787532377393748917544.09724464320 |
+----------------------+-----------------------+-----------------------------------------+
```

###### 곱셈 오버플로 시 decimal256 활성화 {#enable-decimal256-when-multiplication-overflow}
```sql
create table test_decimal_mul_overflow_dec256(f1 decimal(38, 19), f2 decimal(38, 19)) properties('replication_num'='1');
insert into test_decimal_mul_overflow_dec256 values('9999999999999999999.9999999999999999999', '9999999999999999999.9999999999999999999');
```
기본 설정(`enable_decimal256`=false)에서는 실제 곱셈 결과에 오버플로가 발생합니다. 이 경우 decimal256을 활성화하는 `set enable_decimal256=true`를 실행하여 정확한 결과를 계산할 수 있으며, 결과 타입은 decimal(76, 38)입니다.
```sql
set enable_decimal256=true;

select f1, f2, f1 * f2 from test_decimal_mul_overflow_dec256;
+-----------------------------------------+-----------------------------------------+-------------------------------------------------------------------------------+
| f1                                      | f2                                      | f1 * f2                                                                       |
+-----------------------------------------+-----------------------------------------+-------------------------------------------------------------------------------+
| 9999999999999999999.9999999999999999999 | 9999999999999999999.9999999999999999999 | 99999999999999999999999999999999999998.00000000000000000000000000000000000001 |
+-----------------------------------------+-----------------------------------------+-------------------------------------------------------------------------------+
```

###### 오버플로가 발생하지 않는 나눗셈 {#division-no-overflow}
```sql
create table test_decimal_div_no_overflow(f1 decimal(19, 9), f2 decimal(19, 9)) properties('replication_num'='1');

insert into test_decimal_div_no_overflow values('1234567890.123456789', '234567890.123456789');
```
나눗셈 결과의 정밀도 계산 규칙에 따르면 기본 설정(`enable_decimal256`=false, `decimal_overflow_scale`=6, `div_precision_increment`=4)에서 일반적인 계산 결과 타입은 `decimal(19 + 9 + 4, 9 + 4)`, 즉 `decimal(32, 13)`이며 정밀도 오버플로가 발생하지 않습니다. 최종 결과 타입은 `decimal(32, 13)`입니다.

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

결과에 더 많은 소수 자릿수를 유지하려면 `div_precision_increment` 값을 늘릴 수 있습니다. 예를 들어 `admin set frontend config('div_precision_increment'='8');`를 실행하면 위 계산 규칙에 따른 결과 타입은 `decimal(36, 17)`입니다.
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
계산 결과:
```sql
select f1, f2, f1 / f2 from test_decimal_div_no_overflow;
+----------------------+---------------------+---------------------+
| f1                   | f2                  | f1 / f2             |
+----------------------+---------------------+---------------------+
| 1234567890.123456789 | 234567890.123456789 | 5.26315809667590986 |
+----------------------+---------------------+---------------------+
```

###### 나눗셈 오버플로 규칙 1 {#division-overflow-rule-1}
```sql
create table test_decimal_div_overflow1(f1 decimal(27, 8), f2 decimal(27, 8)) properties('replication_num'='1');

insert into test_decimal_div_overflow1 values('123456789012345678.12345678', '23456789012345678.12345678');
```
나눗셈 결과의 정밀도 계산 규칙에 따르면 기본 설정(`enable_decimal256`=false, `decimal_overflow_scale`=6, `div_precision_increment`=4)에서 일반적인 계산 결과 타입은 `decimal(27 + 8 + 4, 8 + 4)`, 즉 `decimal(39, 12)`입니다. 정밀도 오버플로가 발생하므로 오버플로 규칙에 따라 다시 계산해야 합니다. `MAX_P` - `decimal_overflow_scale` = 38 - 6 = 32이고 `precision` - s1 = 39 - 8 = 31 < 32이므로 `Result scale if overflow` 규칙 1이 적용됩니다. 결과 소수 자릿수는 (`MAX_P` - (`precision` - `s1`)) + `div_precision_increment` = (38 - (39 - 8)) + 4 = 11이며, 결과 타입은 `decimal(38, 11)`입니다.
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

계산 결과:
```sql
select f1, f2, f1 / f2 from test_decimal_div_overflow1; 
+-----------------------------+----------------------------+---------------+
| f1                          | f2                         | f1 / f2       |
+-----------------------------+----------------------------+---------------+
| 123456789012345678.12345678 | 23456789012345678.12345678 | 5.26315809667 |
+-----------------------------+----------------------------+---------------+
```

`decimal_overflow_scale` 값을 늘리면, 예를 들어 `set decimal_overflow_scale=8;`로 설정하면 오버플로 규칙에 따라 다음과 같이 계산됩니다. `MAX_P` - `decimal_overflow_scale` = 38 - 8 = 30이고 `precision` - s1 = 39 - 8 = 31 > 30이며 s1 == `decimal_overflow_scale`이므로 오버플로 규칙 3이 적용됩니다. 최종 계산 결과 타입은 `decimalv3(38,12)`입니다.
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

계산 결과:
```sql
select f1, f2, f1 / f2 from test_decimal_div_overflow1;
+-----------------------------+----------------------------+----------------+
| f1                          | f2                         | f1 / f2        |
+-----------------------------+----------------------------+----------------+
| 123456789012345678.12345678 | 23456789012345678.12345678 | 5.263158096675 |
+-----------------------------+----------------------------+----------------+
```

###### 나눗셈 오버플로 규칙 2 {#division-overflow-rule-2}
```sql
create table test_decimal(f1 decimal(38, 4), f2 decimal(38, 4)) properties('replication_num'='1');

insert into test_decimal values('123456789012345678.1234', '23456789012345678.1234');
```
나눗셈 결과의 정밀도 계산 규칙에 따르면 기본 설정(`enable_decimal256`=false, `decimal_overflow_scale`=6, `div_precision_increment`=4)에서 일반적인 계산 결과 타입은 `decimal(38 + 4 + 4, 4 + 4)`, 즉 `decimal(46, 8)`입니다. 정밀도 오버플로가 발생하므로 오버플로 규칙에 따라 다시 계산해야 합니다. `MAX_P` - `decimal_overflow_scale` = 38 - 6 = 32이고 `precision` - s1 = 46 - 4 = 42 > 32이며 s1 = 4 < `decimal_overflow_scale`이므로 `Result scale if overflow` 규칙 2가 적용됩니다. 결과 소수 자릿수는 `s1` + `div_precision_increment` = 4 + 4 = 8이며, 결과 타입은 `decimal(38, 8)`입니다.
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
계산 결과:
```sql
select f1, f2, f1 / f2 from test_decimal;
+-------------------------+------------------------+-------------+
| f1                      | f2                     | f1 / f2     |
+-------------------------+------------------------+-------------+
| 123456789012345678.1234 | 23456789012345678.1234 |  5.26315809 |
+-------------------------+------------------------+-------------+
```

결과에 더 많은 소수 자릿수를 유지하려면 `div_precision_increment` 값을 늘릴 수 있습니다. 예를 들어 `admin set frontend config('div_precision_increment'='8');`를 실행하면 위 계산 규칙에 따른 결과 타입은 `decimal(38, 12)`입니다.
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
계산 결과:
```sql
select f1, f2, f1 / f2 from test_decimal;
+-------------------------+------------------------+-----------------+
| f1                      | f2                     | f1 / f2         |
+-------------------------+------------------------+-----------------+
| 123456789012345678.1234 | 23456789012345678.1234 |  5.263158096675 |
+-------------------------+------------------------+-----------------+
```

decimal256을 활성화하면(`set enable_decimal256 = true;`) 오버플로 없이 결과 정밀도를 정상적으로 계산하며, 결과 타입은 `decimal(46, 8)`입니다.
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

###### 나눗셈 오버플로 규칙 3 {#division-overflow-rule-3}
```sql
create table test_decimal_div_overflow3(f1 decimal(38, 7), f2 decimal(38, 7)) properties('replication_num'='1');

insert into test_decimal_div_overflow3 values('123456789012345678.1234567', '23456789012345678.1234567');
```
나눗셈 결과의 정밀도 계산 규칙에 따르면 기본 설정(`enable_decimal256`=false, `decimal_overflow_scale`=6, `div_precision_increment`=4)에서 일반적인 계산 결과 타입은 `decimal(38 + 7 + 4, 7 + 4)`, 즉 `decimal(49, 11)`입니다. 정밀도 오버플로가 발생하므로 오버플로 규칙에 따라 다시 계산해야 합니다. `MAX_P` - `decimal_overflow_scale` = 38 - 6 = 32이고 `precision` - s1 = 49 - 7 = 42 > 32이며 s1 = 7 > `decimal_overflow_scale`이므로 `Result scale if overflow` 규칙 3이 적용됩니다. 결과 소수 자릿수는 `decimal_overflow_scale` + `div_precision_increment` = 6 + 4 = 10이며, 결과 타입은 `decimal(38, 10)`입니다.
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

계산 결과:
```sql
select f1, f2, f1 / f2 from test_decimal_div_overflow3; 
+----------------------------+---------------------------+--------------+
| f1                         | f2                        | f1 / f2      |
+----------------------------+---------------------------+--------------+
| 123456789012345678.1234567 | 23456789012345678.1234567 | 5.2631580966 |
+----------------------------+---------------------------+--------------+
```

#### 집계 연산 {#aggregation-operations}

* SUM / MULTI_DISTINCT_SUM: SUM(DECIMAL(a, b)) -> DECIMAL(MAX_P, b).
* AVG: AVG(DECIMAL(a, b)) -> DECIMAL(MAX_P, max(b, 4)).

#### 기본 규칙 {#default-rules}

위에서 언급한 표현식을 제외한 다른 표현식은 정밀도 추론에 기본 규칙을 사용합니다. 즉, 표현식 `expr(DECIMAL(a, b))`의 결과 타입도 DECIMAL(a, b)입니다.

#### 결과 정밀도 조정 {#adjusting-result-precision}

사용자마다 DECIMAL에 요구하는 정밀도가 다릅니다. 위 규칙은 Doris의 기본 동작입니다. **다른 정밀도가 필요한 경우 다음과 같은 방법으로 정밀도를 조정할 수 있습니다**.

* 원하는 결과 정밀도가 기본 정밀도보다 높으면 매개변수의 정밀도를 조정하여 결과 정밀도를 조정할 수 있습니다. 예를 들어, `AVG(col)`을 계산하여 DECIMAL(x, y) 타입의 결과를 얻으려 하고 `col`의 타입이 DECIMAL (a, b)라면 표현식을 `AVG(CAST(col as DECIMAL (x, y))`로 다시 작성할 수 있습니다.
* 원하는 결과 정밀도가 기본 정밀도보다 낮으면 출력 결과를 반올림하여 원하는 정밀도를 얻을 수 있습니다. 예를 들어, `AVG(col)`을 계산하여 DECIMAL(x, y) 타입의 결과를 얻으려 하고 `col`의 타입이 DECIMAL(a, b)라면 표현식을 `ROUND(AVG(col), y)`로 다시 작성할 수 있습니다.

### DECIMAL이 필요한 이유 {#why-decimal-is-required}

Doris의 DECIMAL은 진정한 고정밀 고정 소수점 수입니다. Decimal의 주요 장점은 다음과 같습니다.
1. 더 넓은 범위를 표현할 수 있습니다. DECIMAL의 정밀도와 소수 자릿수 모두 값의 범위가 크게 확장되었습니다.
2. 성능이 더 높습니다. 이전 버전의 DECIMAL은 메모리에서 16바이트, 저장 공간에서 12바이트를 사용하지만, DECIMAL은 아래와 같이 정밀도에 따라 공간 사용량을 조정합니다.

|     정밀도        | 사용 공간(메모리/디스크) |
|----------------------|-------------------|
| 0 < precision <= 9   |      4바이트      |
| 9 < precision <= 18  |      8바이트      |
| 18 < precision <= 38 |     16바이트      |
| 38 < precision <= 76 |     32바이트      |

3. 정밀도 추론이 더 완전해졌습니다. 표현식에 따라 서로 다른 정밀도 추론 규칙을 적용하여 결과의 정밀도를 추론합니다.

### 키워드 {#keywords}
DECIMAL
