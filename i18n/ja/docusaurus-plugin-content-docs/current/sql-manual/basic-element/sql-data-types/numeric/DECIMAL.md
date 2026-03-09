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
    高精度固定小数点数。Pは有効桁数（精度）の総数を表し、Sは小数点以下の小数部分の桁数を表します。
    有効桁数Pの範囲は[1, MAX_P]で、enable_decimal256=falseの場合MAX_P=38、enable_decimal256=trueの場合MAX_P=76です。
    小数点以下の桁数Sの範囲は[0, P]です。

    デフォルトでは、精度は38、スケールは9です（つまりDECIMAL(38, 9)）。

    enable_decimal256のデフォルト値はfalseです。これをtrueに設定すると、より正確な結果を得ることができますが、パフォーマンスの低下を招きます。

    decimal型を出力する際、末尾の桁が0であっても、小数点の後は常にS桁で表示されます。例えば、decimal(18, 6)型の数値123.456は123.456000として出力されます。

### 精度推論

DECIMALには非常に複雑な型推論ルールのセットがあります。異なる式に対して、精度推論のために異なるルールが適用されます。

#### 算術演算

e1(p1, s1)とe2(p2, s2)が2つのDECIMAL数値であると仮定した場合、演算結果の精度推論ルールは以下の通りです：

|演算|結果の精度|結果のスケール|オーバーフロー時の結果精度|オーバーフロー時の結果スケール|中間e1型|中間e2型|
|-------|------------|---------|-----------------|--------------|--------|------|
|e1 + e2|max(p1 - s1,p2 - s2) + max(s1, s2) + 1|max(s1, s2)|MAX_P|min(MAX_P, p) - max(p1 - s1,p2 - s2)|結果に応じてキャスト|結果に応じてキャスト|
|e1 - e2|max(p1 - s1,p2 - s2) + max(s1, s2) + 1|max(s1, s2)|MAX_P|min(MAX_P, p) - max(p1 - s1,p2 - s2)|結果に応じてキャスト|結果に応じてキャスト|
|e1 * e2|p1 + p2|s1 + s2|MAX_P|<ol><li>precision - scale < MAX_P - `decimal_overflow_scale`: min(scale, 38 - (precision - scale))</li><li>precision - scale > MAX_P - `decimal_overflow_scale`, and scale < `decimal_overflow_scale`: s1 + s2</li><li>precision - scale > MAX_P - `decimal_overflow_scale`，scale >= `decimal_overflow_scale`：`decimal_overflow_scale`</li></ol>|変更なし|変更なし|
|e1 / e2|p1 + s2 + `div_precision_increment`|s1 + `div_precision_increment`|MAX_P|<ol><li>precision - s1 less than max_precision - `decimal_overflow_scale`: (max_precision - (precision - s1)) + `div_precision_increment`</li><li>precision - s1 greater than max_precision - `decimal_overflow_scale`, and s1 less than `decimal_overflow_scale`: s1 + `div_precision_increment`</li><li>precision - s1 greater than max_precision - `decimal_overflow_scale`, and s1 greater than or equal to `decimal_overflow_scale`: `decimal_overflow_scale` + `div_precision_increment`</li></ol>|pは結果に応じてキャスト、sは結果+e2.scaleに応じてキャスト||
|e1 % e2|max(p1 - s1,p2 - s2) + max(s1, s2)|max(s1, s2)|MAX_P|min(MAX_P, p) - max(p1 - s1,p2 - s2)|結果に応じてキャスト|結果に応じてキャスト|

表の`Result scale if overflow`を計算するルールにおいて、`precision`は`Result precision`列の`precision`を、`scale`は`Result scale`列の`scale`を指します。

`div_precision_increment`はFEの設定パラメータです。[div_precision_increment](../../../../admin-manual/config/fe-config#div_precision_increment)を参照してください。

`decimal_overflow_scale`はFEのセッション変数で、decimal値の計算結果の精度がオーバーフローした場合に、計算結果で保持可能な小数点以下の最大桁数を示します。デフォルト値は6です。

注目すべき点として、除算計算のプロセスは以下の通りです：
DECIMAL(p1, s1) / DECIMAL(p2, s2)は、まずDECIMAL(p1 + s2 + div_precision_increment, s1 + s2) / DECIMAL(p2, s2)に変換されてから計算が実行されます。したがって、DECIMAL(p1 + s2 + div_precision_increment, s1 + div_precision_increment)がDECIMALの範囲を満たしていても、
DECIMAL(p1 + s2 + div_precision_increment, s1 + s2)への変換により
範囲を超える場合があり、Dorisはデフォルトで`Arithmetic overflow`エラーを報告します。

##### 例
###### 乗算オーバーフローなし

```sql
create table test_decimal_mul_no_overflow(f1 decimal(19, 9), f2 decimal(19, 9)) properties('replication_num'='1');
insert into test_decimal_mul_no_overflow values('9999999999.999999999', '9999999999.999999999');
```
乗算結果の精度の計算規則に従って、結果の型はdecimal(38, 18)となり、オーバーフローしません：

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
計算結果：

```sql
select f1, f2, f1 * f2 from test_decimal_mul_no_overflow;
+----------------------+----------------------+-----------------------------------------+
| f1                   | f2                   | f1 * f2                                 |
+----------------------+----------------------+-----------------------------------------+
| 9999999999.999999999 | 9999999999.999999999 | 99999999999999999980.000000000000000001 |
+----------------------+----------------------+-----------------------------------------+
```
###### 乗算オーバーフロー

```sql
create table test_decimal_mul_overflow1(f1 decimal(20, 5), f2 decimal(21, 6)) properties('replication_num'='1');
insert into test_decimal_mul_overflow1 values('12345678901234.12345', '12345678901234.123456');
```
乗算結果の精度の計算ルールによると、デフォルト設定（`enable_decimal256`=false、`decimal_overflow_scale`=6、`div_precision_increment`=4）において、通常の計算結果タイプは`decimal(41, 11)`です。精度がオーバーフローするため、オーバーフロールールに従って再計算する必要があります：`MAX_P` - `decimal_overflow_scale` = 38 - 6 = 32、`precision` - `scale` = 41 - 11 = 30 < 32、ルール1が適用され、最終結果scale = min(11, 38 - 30) = 8、最終結果タイプはdecimal(38, 8)になります：

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
`decimal_overflow_scale`の値が増加した場合、例えば`set decimal_overflow_scale=9;`の場合、オーバーフロールールに従って計算が実行されます：`MAX_P` - `decimal_overflow_scale` = 38 - 9 = 29、`precision` - `scale` = 41 - 11 = 30 > 29、かつscale > `decimal_overflow_scale`のため、オーバーフロールール3が適用され、最終的な計算結果の型は`decimal(38,9)`となります：

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
計算結果：

```sql
select f1, f2, f1 * f2 from test_decimal_mul_overflow1;
+----------------------+-----------------------+---------------------------------------+
| f1                   | f2                    | f1 * f2                               |
+----------------------+-----------------------+---------------------------------------+
| 12345678901234.12345 | 12345678901234.123456 | 152415787532377393748917544.097244643 |
+----------------------+-----------------------+---------------------------------------+
```
`decimal_overflow_scale`の値を引き続き増加させる場合、例えば`set decimal_overflow_scale=12;`とすると、オーバーフロールールに従って計算されます：`MAX_P` - `decimal_overflow_scale` = 38 - 12 = 26、`precision` - `scale` = 41 - 11 = 30 > 26、かつscale < `decimal_overflow_scale`。この場合、オーバーフロールール2が適用され、最終的な計算結果の型は`decimal(38,11)`となります：

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
###### 乗算オーバーフロー時にdecimal256を有効化

```sql
create table test_decimal_mul_overflow_dec256(f1 decimal(38, 19), f2 decimal(38, 19)) properties('replication_num'='1');
insert into test_decimal_mul_overflow_dec256 values('9999999999999999999.9999999999999999999', '9999999999999999999.9999999999999999999');
```
デフォルトでは（`enable_decimal256`=false）、乗算の実際の結果はオーバーフローします。この場合、decimal256を有効にできます：`set enable_decimal256=true`で正確な結果を計算し、結果の型はdecimal(76, 38)になります：

```sql
set enable_decimal256=true;

elect f1, f2, f1 * f2 from test_decimal_mul_overflow_dec256;
+-----------------------------------------+-----------------------------------------+-------------------------------------------------------------------------------+
| f1                                      | f2                                      | f1 * f2                                                                       |
+-----------------------------------------+-----------------------------------------+-------------------------------------------------------------------------------+
| 9999999999999999999.9999999999999999999 | 9999999999999999999.9999999999999999999 | 99999999999999999999999999999999999998.00000000000000000000000000000000000001 |
+-----------------------------------------+-----------------------------------------+-------------------------------------------------------------------------------+
```
###### Division オーバーフローなし

```sql
create table test_decimal_div_no_overflow(f1 decimal(19, 9), f2 decimal(19, 9)) properties('replication_num'='1');

insert into test_decimal_div_no_overflow values('1234567890.123456789', '234567890.123456789');
```
除算結果の精度の計算規則に従い、デフォルト設定（`enable_decimal256`=false、`decimal_overflow_scale`=6、`div_precision_increment`=4）下では、通常の計算結果の型は`decimal(19 + 9 + 4, 9 + 4)`、つまり`decimal(32, 13)`であり、精度はオーバーフローしません。結果の最終的な型は`decimal(32, 13)`です：

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
結果により多くの小数点以下の桁数を保持したい場合は、`div_precision_increment`を増やすことができます。例えば、`admin set frontend config('div_precision_increment'='8');`のようにします。そうすると、上記の計算ルールに従って、計算結果の型は`decimal(36, 17)`になります：

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
###### 除算オーバーフロー規則1

```sql
create table test_decimal_div_overflow1(f1 decimal(27, 8), f2 decimal(27, 8)) properties('replication_num'='1');

insert into test_decimal_div_overflow1 values('123456789012345678.12345678', '23456789012345678.12345678');
```
除算結果精度の計算ルールに従い、デフォルト設定（`enable_decimal256`=false、`decimal_overflow_scale`=6、`div_precision_increment`=4）では、通常の計算結果型は`decimal(27 + 8 + 4, 8 + 4)`、つまり`decimal(39, 12)`になります。精度がオーバーフローしたため、オーバーフロールールに従って再計算する必要があります：`MAX_P` - `decimal_overflow_scale` = 38 - 6 = 32、`precision` - s1 = 39 - 8 = 31 < 32なので、`Result scale if overflow`ルール1が適用され、結果スケールは（`MAX_P` - （`precision` - `s1`））+ `div_precision_increment` = （38 - （39 - 8））+ 4 = 11となり、結果型は`decimal(38, 11)`になります：

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
`decimal_overflow_scale`の値が増加した場合、例えば`set decimal_overflow_scale=8;`では、オーバーフロールールに従って計算が実行されます：`MAX_P` - `decimal_overflow_scale` = 38 - 8 = 30、`precision` - s1 = 39 - 8 = 31 > 30、かつs1 == `decimal_overflow_scale`であるため、オーバーフロールール3が適用され、最終的な計算結果の型は`decimalv3(38,12)`となります：

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
###### 除算オーバーフロー規則2

```sql
create table test_decimal(f1 decimal(38, 4), f2 decimal(38, 4)) properties('replication_num'='1');

insert into test_decimal values('123456789012345678.1234', '23456789012345678.1234');
```
除算結果精度の計算ルールに従って、デフォルト設定（`enable_decimal256`=false、`decimal_overflow_scale`=6、`div_precision_increment`=4）の下では、通常の計算結果タイプは`decimal(38 + 4 + 4, 4 + 4)`、つまり`decimal(46, 8)`です。精度がオーバーフローしたため、オーバーフロールールに従って再計算する必要があります：`MAX_P` - `decimal_overflow_scale` = 38 - 6 = 32、`precision` - s1 = 46 - 4 = 42 > 32、s1 = 4 < `decimal_overflow_scale`なので、`Result scale if overflow`ルール2が適用され、結果スケールは`s1` + `div_precision_increment` = 4 + 4 = 8となり、結果タイプは`decimal(38, 8)`となります：

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
計算結果：

```sql
select f1, f2, f1 / f2 from test_decimal;
+-------------------------+------------------------+-------------+
| f1                      | f2                     | f1 / f2     |
+-------------------------+------------------------+-------------+
| 123456789012345678.1234 | 23456789012345678.1234 |  5.26315809 |
+-------------------------+------------------------+-------------+
```
結果により多くの小数点以下桁数を保持したい場合は、`div_precision_increment`を増加させることができます。例えば、`admin set frontend config('div_precision_increment'='8');`のように設定します。その後、上記の計算ルールに従って、計算結果の型は`decimal(38, 12)`になります：

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
decimal256が有効になっている場合（`set enable_decimal256 = true;`）、結果の精度はオーバーフローなしで正常に計算され、結果の型は`decimal(46, 8)`になります：

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
###### 除算オーバーフロー規則3

```sql
create table test_decimal_div_overflow3(f1 decimal(38, 7), f2 decimal(38, 7)) properties('replication_num'='1');

insert into test_decimal_div_overflow3 values('123456789012345678.1234567', '23456789012345678.1234567');
```
除算結果精度の計算規則によると、デフォルト設定（`enable_decimal256`=false、`decimal_overflow_scale`=6、`div_precision_increment`=4）では、通常の計算結果タイプは`decimal(38 + 7 + 4, 7 + 4)`、つまり`decimal(49, 11)`です。精度がオーバーフローするため、オーバーフロー規則に従って再計算が必要です：`MAX_P` - `decimal_overflow_scale` = 38 - 6 = 32、`precision` - s1 = 49 - 7 = 42 > 32、s1 = 7 > `decimal_overflow_scale`であるため、`Result scale if overflow`規則3が適用され、結果スケールは`decimal_overflow_scale` + `div_precision_increment` = 6 + 4 = 10となり、結果タイプは`decimal(38, 10)`となります：

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
#### 集約操作

* SUM / MULTI_DISTINCT_SUM: SUM(DECIMAL(a, b)) -> DECIMAL(MAX_P, b)。
* AVG: AVG(DECIMAL(a, b)) -> DECIMAL(MAX_P, max(b, 4))。

#### デフォルトルール

上記で言及した式を除いて、他の式は精度推定にデフォルトルールを使用します。つまり、式`expr(DECIMAL(a, b))`の場合、結果の型もDECIMAL(a, b)となります。

#### 結果精度の調整

DECIMALに対する精度要件は、ユーザーによって異なります。上記のルールはDorisのデフォルト動作です。**ユーザーが異なる精度要件を持つ場合、以下の方法で精度を調整できます**：

* 期待する結果精度がデフォルト精度よりも大きい場合、パラメータの精度を調整することで結果精度を調整できます。例えば、ユーザーが`AVG(col)`を計算してDECIMAL(x, y)を結果として得ることを期待し、`col`の型がDECIMAL (a, b)の場合、式を`AVG(CAST(col as DECIMAL (x, y))`として書き直すことができます。
* 期待する結果精度がデフォルト精度よりも小さい場合、出力結果を近似することで望ましい精度を得ることができます。例えば、ユーザーが`AVG(col)`を計算してDECIMAL(x, y)を結果として得ることを期待し、`col`の型がDECIMAL(a, b)の場合、式を`ROUND(AVG(col), y)`として書き直すことができます。

### DECIMALが必要な理由

DorisのDECIMALは真の高精度固定小数点数です。Decimalには以下の主要な利点があります：
1. より広い範囲を表現できます。DECIMALの精度とスケールの両方の値範囲が大幅に拡張されました。
2. より高いパフォーマンス。旧バージョンのDECIMALはメモリで16バイト、ストレージで12バイトを必要としますが、DECIMALは以下に示すように適応的な調整を行っています。

|     precision        | 占有領域（メモリ/ディスク）|
|----------------------|-------------------|
| 0 < precision <= 9   |      4 bytes      |
| 9 < precision <= 18  |      8 bytes      |
| 18 < precision <= 38 |     16 bytes      |
| 38 < precision <= 76 |     32 bytes      |

3. より完全な精度推定。異なる式に対して、異なる精度推論ルールを適用して結果の精度を推定します。

### keywords
DECIMAL
