---
{
    "title": "ARRAY_CUM_SUM",
    "language": "ja",
    "description": "配列の累積和を計算します。配列を左から右に走査し、先頭から各位置までの要素の合計を求めます。"
}
---

## array_cum_sum

<version since="2.0.0">

</version>

## 説明

配列の累積和を計算します。配列を左から右に走査し、先頭から現在の位置まで（現在の位置を含む）の全要素の合計を計算して、元の配列と同じ長さの新しい配列を返します。

## 構文

```sql
array_cum_sum(ARRAY<T> arr)
```

### パラメータ

- `arr`：ARRAY\<T> 型。累積和を計算する配列です。カラム名または定数値を指定できます。

**T でサポートされる型：**
  - 数値型：TINYINT、SMALLINT、INT、BIGINT、LARGEINT、FLOAT、DOUBLE、DECIMAL

### 戻り値

戻り値の型：ARRAY\<T>

戻り値の意味：

- 入力配列と同じ長さの新しい配列を返します。各位置には、元の配列の先頭からその位置までの全要素の合計が格納されます
- 入力配列が NULL の場合は NULL を返します

使用上の注意：
- 配列に他の型（文字列など）が含まれる場合、要素を DOUBLE 型に変換しようとします。変換できない要素は null になります。
- 累積和を計算するために、全要素を互換性のある数値型に変換しようとします。累積和の戻り値の型は、入力の型に応じて自動的に選択されます。
  - 入力が DOUBLE または FLOAT の場合、ARRAY\<DOUBLE> を返します
  - 入力が整数型の場合、ARRAY\<BIGINT> または ARRAY\<LARGEINT> を返します
  - 入力が DECIMAL の場合、元の精度とスケールを維持した ARRAY\<DECIMAL> を返します
- 累積和は左から右に計算され、各位置にはその位置までのすべての非 null 要素の合計が格納されます。
- 空の配列は空の配列を返し、NULL の配列は NULL を返します。要素が一つだけの配列は元の配列を返します。
- ネストした配列、MAP、STRUCT などの複合型は累積和に対応しておらず、呼び出すとエラーになります。
- 配列内の null 要素については、最初の非 null 値以降に現れる null を 0 として累積和の計算に含めます。

### 使用例

```sql
CREATE TABLE array_cum_sum_test (
    id INT,
    int_array ARRAY<INT>,
    double_array ARRAY<DOUBLE>
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 3
PROPERTIES (
    "replication_num" = "1"
);

INSERT INTO array_cum_sum_test VALUES
(1, [1, 2, 3, 4, 5], [1.1, 2.2, 3.3, 4.4, 5.5]),
(2, [10, 20, 30], [10.5, 20.5, 30.5]),
(3, [], []),
(4, NULL, NULL);
```

**クエリ例：**

int_array の累積和：各位置には、先頭から現在の位置まで（現在の位置を含む）の全要素の合計が格納されます。
```sql
SELECT array_cum_sum(int_array) FROM array_cum_sum_test WHERE id = 1;
+-----------------------------+
| array_cum_sum(int_array)    |
+-----------------------------+
| [1, 3, 6, 10, 15]           |
+-----------------------------+
```

double_array の累積和：浮動小数点数の配列の累積和を計算し、浮動小数点数の結果を返します。

二番目の位置の結果が 3.3000000000000003 になるのは、浮動小数点数の二進表現の精度によって生じる小さな誤差のためです。1.1 と 2.2 は二進浮動小数点数（IEEE 754 の double 型）で正確に表現できず、近似値としてしか格納できません。これらを加算すると誤差が蓄積し、3.3000000000000003 になります。その後の累積和（6.6、11、16.5 など）は「通常の値」に見えることがありますが、実際には近似値であり、丸めた結果が十進数の値と一致しているだけです。これは IEEE 754 浮動小数点数を使用するすべてのシステム（MySQL、Snowflake、Python、JavaScript など）で起こる現象です。
```sql
SELECT array_cum_sum(double_array) FROM array_cum_sum_test WHERE id = 1;
+------------------------------------------+
| array_cum_sum(double_array)              |
+------------------------------------------+
| [1.1, 3.3000000000000003, 6.6, 11, 16.5] |
+------------------------------------------+
```

文字列と数値が混在する場合、数値に変換できる要素は累積和に加算され、変換できない要素は null になります。累積和の計算では、その null 値を 0 として扱います。
```sql
SELECT array_cum_sum(['a', 1, 'b', 2, 'c', 3]);
+-----------------------------------------+
| array_cum_sum(['a', 1, 'b', 2, 'c', 3]) |
+-----------------------------------------+
| [null, 1, null, 3, null, 6]             |
+-----------------------------------------+
```

空の配列は空の配列を返します。
```sql
SELECT array_cum_sum(int_array) FROM array_cum_sum_test WHERE id = 3;
+-----------------------------+
| array_cum_sum(int_array)    |
+-----------------------------+
| []                          |
+-----------------------------+
```

NULL の配列は NULL を返します。入力配列が NULL の場合、エラーにはなりません。
```sql
SELECT array_cum_sum(int_array) FROM array_cum_sum_test WHERE id = 4;
+-----------------------------+
| array_cum_sum(int_array)    |
+-----------------------------+
| NULL                        |
+-----------------------------+
```

要素が一つだけの配列は元の配列を返します。
```sql
SELECT array_cum_sum([42]);
+----------------------+
| array_cum_sum([42])  |
+----------------------+
| [42]                 |
+----------------------+
```

null 値を含む配列では、最初の非 null 値以降の null を 0 として累積和の計算に含めます。
```sql
SELECT array_cum_sum([null, 1, null, 3, null, 5]);
+--------------------------------------------+
| array_cum_sum([null, 1, null, 3, null, 5]) |
+--------------------------------------------+
| [null, 1, 1, 4, 4, 9]                      |
+--------------------------------------------+
```

複合型の例：

ネストした配列型はサポートされず、エラーになります。
```sql
SELECT array_cum_sum([[1,2,3]]);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_cum_sum(ARRAY<ARRAY<TINYINT>>)
```

MAP 型はサポートされず、エラーになります。
```sql
SELECT array_cum_sum([{'k':1},{'k':2}]);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_cum_sum(ARRAY<MAP<VARCHAR(1),TINYINT>>)
```

STRUCT 型はサポートされず、エラーになります。
```sql
SELECT array_cum_sum(array(named_struct('name','Alice','age',20),named_struct('name','Bob','age',30)));
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_cum_sum(ARRAY<STRUCT<name:TEXT,age:TINYINT>>)
```

パラメータの数が正しくない場合はエラーになります。
```sql
SELECT array_cum_sum([1,2,3],[4,5,6]);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not found function 'array_cum_sum' which has 2 arity. Candidate functions are: [array_cum_sum(Expression)]
```

配列以外の型を渡すとエラーになります。
```sql
SELECT array_cum_sum('not_an_array');
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_cum_sum(VARCHAR(12))
```

### キーワード

ARRAY, CUM, SUM, CUM_SUM, ARRAY_CUM_SUM 
