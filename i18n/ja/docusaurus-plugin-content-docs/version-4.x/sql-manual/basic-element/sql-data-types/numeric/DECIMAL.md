---
{
    "title": "DECIMAL",
    "language": "ja",
    "description": "DECIMAL"
}
---

## DECIMAL

DECIMAL

### 説明
    DECIMAL(P[,S])
    High-precision fixed-point number, where P represents the total count of significant digits (precision), and S is the count of decimal digits in the fractional part, to the right of the decimal point.
    The range of significant digits P is [1, MAX_P], where MAX_P=38 when enable_decimal256=false, and MAX_P=76 when enable_decimal256=true.
    The range of decimal places S is [0, P].

    By default, precision is 38, and scale is 9(that is DECIMAL(38, 9)).

    The default value of enable_decimal256 is false. Setting it to true can get more accurate results, but it will bring some performance loss.

    When outputting decimal types, the decimal point is always followed by S digits, even if the trailing digits are 0. For example, the number 123.456 of type decimal(18, 6) will be output as 123.456000.

DECIMAL は高精度の固定小数点数です。P は有効桁数の合計（精度）、S は小数点以下の桁数（スケール）を表します。P の上限は上記の設定によって変わり、S はゼロ以上で P 以下です。具体的な範囲は上の定義に示されています。

精度とスケールの既定値は上の定義に示されています。P の上限を拡張する設定は既定で無効です。有効にすると、より高精度の結果を得られますが、性能がいくらか低下します。

DECIMAL 型の値を出力するときは、末尾がゼロでも小数点以下に常に S 桁が表示されます。具体例は上の定義に示されています。

### 精度の推論

DECIMAL の型推論規則は複雑です。式の種類に応じて、異なる規則で結果の精度を推論します。

#### 算術演算

e1(p1, s1) と e2(p2, s2) を DECIMAL 値とすると、演算結果の精度の推論規則は次のとおりです。

|演算|結果の精度|結果のスケール|オーバーフロー時の結果の精度|オーバーフロー時の結果のスケール|中間結果の e1 の型|中間結果の e2 の型|
|-------|------------|---------|-----------------|--------------|--------|------|
|e1 + e2|max(p1 - s1,p2 - s2) + max(s1, s2) + 1|max(s1, s2)|MAX_P|min(MAX_P, p) - max(p1 - s1,p2 - s2)|結果に応じてキャスト|結果に応じてキャスト|
|e1 - e2|max(p1 - s1,p2 - s2) + max(s1, s2) + 1|max(s1, s2)|MAX_P|min(MAX_P, p) - max(p1 - s1,p2 - s2)|結果に応じてキャスト|結果に応じてキャスト|
|e1 * e2|p1 + p2|s1 + s2|MAX_P|<ol><li>precision - scale < MAX_P - `decimal_overflow_scale`: min(scale, 38 - (precision - scale))</li><li>precision - scale > MAX_P - `decimal_overflow_scale` かつ scale < `decimal_overflow_scale`: s1 + s2</li><li>precision - scale > MAX_P - `decimal_overflow_scale` かつ scale >= `decimal_overflow_scale`: `decimal_overflow_scale`</li></ol>|変更なし|変更なし|
|e1 / e2|p1 + s2 + `div_precision_increment`|s1 + `div_precision_increment`|MAX_P|<ol><li>precision - s1 が max_precision - `decimal_overflow_scale` より小さい場合: (max_precision - (precision - s1)) + `div_precision_increment`</li><li>precision - s1 が max_precision - `decimal_overflow_scale` より大きく、s1 が `decimal_overflow_scale` より小さい場合: s1 + `div_precision_increment`</li><li>precision - s1 が max_precision - `decimal_overflow_scale` より大きく、s1 が `decimal_overflow_scale` 以上の場合: `decimal_overflow_scale` + `div_precision_increment`</li></ol>|p は結果に応じてキャストし、s は結果+e2.scale に応じてキャスト||
|e1 % e2|max(p1 - s1,p2 - s2) + max(s1, s2)|max(s1, s2)|MAX_P|min(MAX_P, p) - max(p1 - s1,p2 - s2)|結果に応じてキャスト|結果に応じてキャスト|

表の `Result scale if overflow` の計算規則で使う `precision` は、`precision` （`Result precision` 列）の値を指し、`scale` は `scale` （`Result scale` 列）の値を指します。

`div_precision_increment` は FE の設定パラメータです。[div_precision_increment](../../../../admin-manual/config/fe-config#div_precision_increment) を参照してください。

`decimal_overflow_scale` は FE のセッション変数です。DECIMAL 値の計算結果で精度がオーバーフローしたときに、結果に保持できる小数点以下の最大桁数を示します。デフォルト値は 6 です。

除算の計算過程は次のとおりです。
DECIMAL(p1, s1) / DECIMAL(p2, s2) は、まず DECIMAL(p1 + s2 + div_precision_increment, s1 + s2) / DECIMAL(p2, s2) に変換され、その後に計算されます。このため、DECIMAL(p1 + s2 + div_precision_increment, s1 + div_precision_increment) が DECIMAL の範囲内であっても、
DECIMAL(p1 + s2 + div_precision_increment, s1 + s2) への変換によって範囲を超えることがあります。
この場合、Doris はデフォルトで `Arithmetic overflow` エラーを報告します。

##### 例
###### 乗算でオーバーフローしない場合
```sql
create table test_decimal_mul_no_overflow(f1 decimal(19, 9), f2 decimal(19, 9)) properties('replication_num'='1');
insert into test_decimal_mul_no_overflow values('9999999999.999999999', '9999999999.999999999');
```
乗算結果の精度の計算規則によると、結果の型は decimal(38, 18) となり、オーバーフローしません。
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

計算結果:
```sql
select f1, f2, f1 * f2 from test_decimal_mul_no_overflow;
+----------------------+----------------------+-----------------------------------------+
| f1                   | f2                   | f1 * f2                                 |
+----------------------+----------------------+-----------------------------------------+
| 9999999999.999999999 | 9999999999.999999999 | 99999999999999999980.000000000000000001 |
+----------------------+----------------------+-----------------------------------------+
```

###### 乗算でオーバーフローする場合
```sql
create table test_decimal_mul_overflow1(f1 decimal(20, 5), f2 decimal(21, 6)) properties('replication_num'='1');
insert into test_decimal_mul_overflow1 values('12345678901234.12345', '12345678901234.123456');
```
乗算結果の精度の計算規則によると、デフォルト設定（`enable_decimal256`=false、`decimal_overflow_scale`=6、`div_precision_increment`=4）では、通常の計算による結果の型は `decimal(41, 11)` です。精度がオーバーフローするため、オーバーフロー規則に従って再計算する必要があります。`MAX_P` - `decimal_overflow_scale` = 38 - 6 = 32、`precision` - `scale` = 41 - 11 = 30 < 32 なので、規則 1 が適用されます。最終的な結果のスケールは min(11, 38 - 30) = 8、結果の型は decimal(38, 8) です。
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
計算結果:
```sql
select f1, f2, f1 * f2 from test_decimal_mul_overflow1;
+----------------------+-----------------------+--------------------------------------+
| f1                   | f2                    | f1 * f2                              |
+----------------------+-----------------------+--------------------------------------+
| 12345678901234.12345 | 12345678901234.123456 | 152415787532377393748917544.09724464 |
+----------------------+-----------------------+--------------------------------------+
```
`decimal_overflow_scale` の値を大きくする場合、たとえば `set decimal_overflow_scale=9;` を設定すると、オーバーフロー規則に従って計算されます。`MAX_P` - `decimal_overflow_scale` = 38 - 9 = 29、`precision` - `scale` = 41 - 11 = 30 > 29、かつ scale > `decimal_overflow_scale` なので、オーバーフロー規則 3 が適用され、最終的な結果の型は `decimal(38,9)` です。
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
計算結果:
```sql
select f1, f2, f1 * f2 from test_decimal_mul_overflow1;
+----------------------+-----------------------+---------------------------------------+
| f1                   | f2                    | f1 * f2                               |
+----------------------+-----------------------+---------------------------------------+
| 12345678901234.12345 | 12345678901234.123456 | 152415787532377393748917544.097244643 |
+----------------------+-----------------------+---------------------------------------+
```
さらに `decimal_overflow_scale` の値を大きくし、たとえば `set decimal_overflow_scale=12;` を設定すると、オーバーフロー規則に従って計算されます。`MAX_P` - `decimal_overflow_scale` = 38 - 12 = 26、`precision` - `scale` = 41 - 11 = 30 > 26、かつ scale < `decimal_overflow_scale` です。この場合、オーバーフロー規則 2 が適用され、最終的な結果の型は `decimal(38,11)` です。
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
計算結果:
```sql
select f1, f2, f1 * f2 from test_decimal_mul_overflow1;
+----------------------+-----------------------+-----------------------------------------+
| f1                   | f2                    | f1 * f2                                 |
+----------------------+-----------------------+-----------------------------------------+
| 12345678901234.12345 | 12345678901234.123456 | 152415787532377393748917544.09724464320 |
+----------------------+-----------------------+-----------------------------------------+
```

###### 乗算がオーバーフローする場合に decimal256 を有効にする
```sql
create table test_decimal_mul_overflow_dec256(f1 decimal(38, 19), f2 decimal(38, 19)) properties('replication_num'='1');
insert into test_decimal_mul_overflow_dec256 values('9999999999999999999.9999999999999999999', '9999999999999999999.9999999999999999999');
```
デフォルト（`enable_decimal256`=false）では、乗算の実際の結果がオーバーフローします。この場合は `set enable_decimal256=true` で decimal256 を有効にすると正確な結果を計算できます。結果の型は decimal(76, 38) です。
```sql
set enable_decimal256=true;

select f1, f2, f1 * f2 from test_decimal_mul_overflow_dec256;
+-----------------------------------------+-----------------------------------------+-------------------------------------------------------------------------------+
| f1                                      | f2                                      | f1 * f2                                                                       |
+-----------------------------------------+-----------------------------------------+-------------------------------------------------------------------------------+
| 9999999999999999999.9999999999999999999 | 9999999999999999999.9999999999999999999 | 99999999999999999999999999999999999998.00000000000000000000000000000000000001 |
+-----------------------------------------+-----------------------------------------+-------------------------------------------------------------------------------+
```

###### 除算でオーバーフローしない場合
```sql
create table test_decimal_div_no_overflow(f1 decimal(19, 9), f2 decimal(19, 9)) properties('replication_num'='1');

insert into test_decimal_div_no_overflow values('1234567890.123456789', '234567890.123456789');
```
除算結果の精度の計算規則によると、デフォルト設定（`enable_decimal256`=false、`decimal_overflow_scale`=6、`div_precision_increment`=4）では、通常の計算による結果の型は `decimal(19 + 9 + 4, 9 + 4)`、つまり `decimal(32, 13)` となり、精度はオーバーフローしません。最終的な結果の型は `decimal(32, 13)` です。

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

結果に小数点以下の桁をより多く保持したい場合は、`div_precision_increment` を大きくできます。たとえば `admin set frontend config('div_precision_increment'='8');` と設定します。この場合、上記の計算規則による結果の型は `decimal(36, 17)` です。
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
計算結果:
```sql
select f1, f2, f1 / f2 from test_decimal_div_no_overflow;
+----------------------+---------------------+---------------------+
| f1                   | f2                  | f1 / f2             |
+----------------------+---------------------+---------------------+
| 1234567890.123456789 | 234567890.123456789 | 5.26315809667590986 |
+----------------------+---------------------+---------------------+
```

###### 除算のオーバーフロー規則 1
```sql
create table test_decimal_div_overflow1(f1 decimal(27, 8), f2 decimal(27, 8)) properties('replication_num'='1');

insert into test_decimal_div_overflow1 values('123456789012345678.12345678', '23456789012345678.12345678');
```
除算結果の精度の計算規則によると、デフォルト設定（`enable_decimal256`=false、`decimal_overflow_scale`=6、`div_precision_increment`=4）では、通常の計算による結果の型は `decimal(27 + 8 + 4, 8 + 4)`、つまり `decimal(39, 12)` です。精度がオーバーフローするため、オーバーフロー規則に従って再計算する必要があります。`MAX_P` - `decimal_overflow_scale` = 38 - 6 = 32、`precision` - s1 = 39 - 8 = 31 < 32 なので、`Result scale if overflow` の規則 1 が適用されます。結果のスケールは (`MAX_P` - (`precision` - `s1`)) + `div_precision_increment` = (38 - (39 - 8)) + 4 = 11、結果の型は `decimal(38, 11)` です。
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

計算結果:
```sql
select f1, f2, f1 / f2 from test_decimal_div_overflow1; 
+-----------------------------+----------------------------+---------------+
| f1                          | f2                         | f1 / f2       |
+-----------------------------+----------------------------+---------------+
| 123456789012345678.12345678 | 23456789012345678.12345678 | 5.26315809667 |
+-----------------------------+----------------------------+---------------+
```

`decimal_overflow_scale` の値を大きくする場合、たとえば `set decimal_overflow_scale=8;` を設定すると、オーバーフロー規則に従って計算されます。`MAX_P` - `decimal_overflow_scale` = 38 - 8 = 30、`precision` - s1 = 39 - 8 = 31 > 30、かつ s1 == `decimal_overflow_scale` なので、オーバーフロー規則 3 が適用され、最終的な結果の型は `decimalv3(38,12)` です。
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

計算結果:
```sql
select f1, f2, f1 / f2 from test_decimal_div_overflow1;
+-----------------------------+----------------------------+----------------+
| f1                          | f2                         | f1 / f2        |
+-----------------------------+----------------------------+----------------+
| 123456789012345678.12345678 | 23456789012345678.12345678 | 5.263158096675 |
+-----------------------------+----------------------------+----------------+
```

###### 除算のオーバーフロー規則 2
```sql
create table test_decimal(f1 decimal(38, 4), f2 decimal(38, 4)) properties('replication_num'='1');

insert into test_decimal values('123456789012345678.1234', '23456789012345678.1234');
```
除算結果の精度の計算規則によると、デフォルト設定（`enable_decimal256`=false、`decimal_overflow_scale`=6、`div_precision_increment`=4）では、通常の計算による結果の型は `decimal(38 + 4 + 4, 4 + 4)`、つまり `decimal(46, 8)` です。精度がオーバーフローするため、オーバーフロー規則に従って再計算する必要があります。`MAX_P` - `decimal_overflow_scale` = 38 - 6 = 32、`precision` - s1 = 46 - 4 = 42 > 32、かつ s1 = 4 < `decimal_overflow_scale` なので、`Result scale if overflow` の規則 2 が適用されます。結果のスケールは `s1` + `div_precision_increment` = 4 + 4 = 8、結果の型は `decimal(38, 8)` です。
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
計算結果:
```sql
select f1, f2, f1 / f2 from test_decimal;
+-------------------------+------------------------+-------------+
| f1                      | f2                     | f1 / f2     |
+-------------------------+------------------------+-------------+
| 123456789012345678.1234 | 23456789012345678.1234 |  5.26315809 |
+-------------------------+------------------------+-------------+
```

結果に小数点以下の桁をより多く保持したい場合は、`div_precision_increment` を大きくできます。たとえば `admin set frontend config('div_precision_increment'='8');` と設定します。この場合、上記の計算規則による結果の型は `decimal(38, 12)` です。
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
計算結果:
```sql
select f1, f2, f1 / f2 from test_decimal;
+-------------------------+------------------------+-----------------+
| f1                      | f2                     | f1 / f2         |
+-------------------------+------------------------+-----------------+
| 123456789012345678.1234 | 23456789012345678.1234 |  5.263158096675 |
+-------------------------+------------------------+-----------------+
```

decimal256 を有効にした場合（`set enable_decimal256 = true;`）、結果の精度はオーバーフローすることなく通常どおりに計算され、結果の型は `decimal(46, 8)` です。
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

###### 除算のオーバーフロー規則 3
```sql
create table test_decimal_div_overflow3(f1 decimal(38, 7), f2 decimal(38, 7)) properties('replication_num'='1');

insert into test_decimal_div_overflow3 values('123456789012345678.1234567', '23456789012345678.1234567');
```
除算結果の精度の計算規則によると、デフォルト設定（`enable_decimal256`=false、`decimal_overflow_scale`=6、`div_precision_increment`=4）では、通常の計算による結果の型は `decimal(38 + 7 + 4, 7 + 4)`、つまり `decimal(49, 11)` です。精度がオーバーフローするため、オーバーフロー規則に従って再計算する必要があります。`MAX_P` - `decimal_overflow_scale` = 38 - 6 = 32、`precision` - s1 = 49 - 7 = 42 > 32、かつ s1 = 7 > `decimal_overflow_scale` なので、`Result scale if overflow` の規則 3 が適用されます。結果のスケールは `decimal_overflow_scale` + `div_precision_increment` = 6 + 4 = 10、結果の型は `decimal(38, 10)` です。
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

計算結果:
```sql
select f1, f2, f1 / f2 from test_decimal_div_overflow3; 
+----------------------------+---------------------------+--------------+
| f1                         | f2                        | f1 / f2      |
+----------------------------+---------------------------+--------------+
| 123456789012345678.1234567 | 23456789012345678.1234567 | 5.2631580966 |
+----------------------------+---------------------------+--------------+
```

#### 集約演算

* SUM / MULTI_DISTINCT_SUM: SUM(DECIMAL(a, b)) -> DECIMAL(MAX_P, b).
* AVG: AVG(DECIMAL(a, b)) -> DECIMAL(MAX_P, max(b, 4)).

#### デフォルトの規則

上記以外の式には、精度の推論にデフォルトの規則を使用します。つまり、式が `expr(DECIMAL(a, b))` の場合、結果の型も DECIMAL(a, b) です。

#### 結果の精度の調整

DECIMAL に求める精度はユーザーによって異なります。上記は Doris のデフォルトの動作です。**異なる精度が必要な場合は、次の方法で調整できます**。

* 期待する結果の精度がデフォルトの精度より高い場合は、引数の精度を調整します。たとえば、`AVG(col)` の結果として DECIMAL(x, y) を得たい場合に、`col` の型が DECIMAL (a, b) なら、式を `AVG(CAST(col as DECIMAL (x, y))` に書き換えられます。
* 期待する結果の精度がデフォルトの精度より低い場合は、出力結果を丸めることで目的の精度を得られます。たとえば、`AVG(col)` の結果として DECIMAL(x, y) を得たい場合に、`col` の型が DECIMAL(a, b) なら、式を `ROUND(AVG(col), y)` に書き換えられます。

### DECIMAL が必要な理由

Doris の DECIMAL は、真の高精度固定小数点数です。主な利点は次のとおりです。
1. 表現できる範囲が広い。DECIMAL では、精度とスケールの両方の値の範囲が大幅に拡大されています。
2. 性能が高い。旧バージョンの DECIMAL はメモリ上で 16 バイト、ストレージ上で 12 バイトを使用しますが、DECIMAL では以下のように必要な容量が値に応じて変わります。

|     精度        | 使用容量（メモリ/ディスク） |
|----------------------|-------------------|
| 0 < precision <= 9   |      4 バイト      |
| 9 < precision <= 18  |      8 バイト      |
| 18 < precision <= 38 |     16 バイト      |
| 38 < precision <= 76 |     32 バイト      |

3. 精度の推論がより充実している。式の種類に応じて異なる推論規則を適用し、結果の精度を求めます。

### キーワード
DECIMAL
