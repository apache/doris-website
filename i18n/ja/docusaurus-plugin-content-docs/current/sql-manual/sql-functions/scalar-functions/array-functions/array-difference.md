---
{
    "title": "ARRAY_DIFFERENCE",
    "language": "ja",
    "description": "配列内の隣接する要素の差を左から右に計算し、元の配列と同じ長さの配列を返します。"
}
---

## array_difference

<version since="2.0.0">

</version>

## 説明

配列内の隣接する要素の差を計算します。配列を左から右に走査し、各要素とその直前の要素との差を計算して、元の配列と同じ長さの新しい配列を返します。最初の要素の差は常に 0 です。

## 構文

```sql
array_difference(ARRAY<T> arr)
```

### パラメータ

- `arr`：ARRAY\<T> 型。差を計算する配列です。列名または定数値を指定できます。

**T でサポートされる型：**
- 数値型：TINYINT、SMALLINT、INT、BIGINT、LARGEINT、FLOAT、DOUBLE、DECIMAL

### 戻り値

戻り値の型：ARRAY\<T>

戻り値の意味：
- 入力配列と同じ長さの新しい配列を返します。各位置には現在の要素と直前の要素との差が入り、最初の要素の差は 0 です。
- NULL：入力配列が NULL の場合。

使用上の注意：
- 配列に文字列などの他の型が含まれる場合は、要素を DOUBLE 型に変換しようとします。変換できない要素は null となり、差の計算には使用されません。
- 差の計算では、すべての要素を互換性のある数値型に変換しようとします。差の戻り値の型は入力の型に応じて自動的に選択されます。
  - 入力が DOUBLE または FLOAT の場合、ARRAY\<DOUBLE> を返します。
  - 入力が整数型の場合、ARRAY\<BIGINT> または ARRAY\<LARGEINT> を返します。
  - 入力が DECIMAL の場合、元の精度とスケールを維持した ARRAY\<DECIMAL> を返します。
- 差は左から右に計算されます。各位置には現在の要素と直前の要素との差が入り、最初の要素は 0 です。
- 空の配列には空の配列、NULL の配列には NULL、要素が一つだけの配列には [0] を返します。
- 複合型（ネストした配列、MAP、STRUCT）の差は計算できず、呼び出すとエラーになります。
- 配列内の null 要素は、それ以降の差の計算に影響します。直前の要素が null の場合、現在の位置の差は null になります。

### 使用例

```sql
CREATE TABLE array_difference_test (
    id INT,
    int_array ARRAY<INT>,
    double_array ARRAY<DOUBLE>
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 3
PROPERTIES (
    "replication_num" = "1"
);

INSERT INTO array_difference_test VALUES
(1, [1, 3, 6, 10, 15], [1.1, 3.3, 6.6, 11.0, 16.5]),
(2, [10, 30, 60], [10.5, 41.0, 76.5]),
(3, [], []),
(4, NULL, NULL);
```

**クエリ例：**

int_array の差：各位置には現在の要素と直前の要素との差が入り、最初の要素は 0 です。
```sql
SELECT array_difference(int_array) FROM array_difference_test WHERE id = 1;
+-----------------------------+
| array_difference(int_array) |
+-----------------------------+
| [0, 2, 3, 4, 5]             |
+-----------------------------+
```

double_array の差：浮動小数点数の配列の差を計算し、浮動小数点数の結果を返します。

二番目の位置の結果が 2.1999999999999997 になるのは、浮動小数点数の二進表現の精度によるわずかな誤差のためです（3.3 - 1.1 は二進数では正確に 2.2 と表現できません）。後続の 3.3、4.4、5.5 は「通常の値」に見える場合がありますが、実際には二進数での近似値であり、丸めると十進数の値に一致しているだけです。これは、IEEE 754 浮動小数点数に基づくすべてのシステム（MySQL、Snowflake、Python、JavaScript など）で起こる現象です。
```sql
SELECT array_difference(double_array) FROM array_difference_test WHERE id = 1;
+------------------------------------------+
| array_difference(double_array)           |
+------------------------------------------+
| [0, 2.1999999999999997, 3.3, 4.4, 5.5]  |
+------------------------------------------+
```

空の配列には空の配列を返します。
```sql
SELECT array_difference(int_array) FROM array_difference_test WHERE id = 3;
+-----------------------------+
| array_difference(int_array) |
+-----------------------------+
| []                          |
+-----------------------------+
```

NULL の配列には NULL を返します。入力配列が NULL の場合、エラーを発生させずに NULL を返します。
```sql
SELECT array_difference(int_array) FROM array_difference_test WHERE id = 4;
+-----------------------------+
| array_difference(int_array) |
+-----------------------------+
| NULL                        |
+-----------------------------+
```

要素が一つだけの配列には [0] を返します。
```sql
SELECT array_difference([42]);
+------------------------+
| array_difference([42]) |
+------------------------+
| [0]                    |
+------------------------+
```

null 値を含む配列では、直前の要素が null の場合、現在の位置の差も null になります。
```sql
SELECT array_difference([1, null, 3, null, 5]);
+-----------------------------------------+
| array_difference([1, null, 3, null, 5]) |
+-----------------------------------------+
| [0, null, null, null, null]             |
+-----------------------------------------+
```

文字列と数値を混在させた場合、数値に変換できる要素は差の計算に使用されます。変換できない要素は null となり、対応する位置の結果も null になります。
```sql
SELECT array_difference(['a', 1, 'b', 2, 'c', 3]);
+--------------------------------------------+
| array_difference(['a', 1, 'b', 2, 'c', 3]) |
+--------------------------------------------+
| [null, null, null, null, null, null]       |
+--------------------------------------------+
```

複合型の例：

ネストした配列型はサポートされず、エラーになります。
```sql
SELECT array_difference([[1,2,3]]);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_difference(ARRAY<ARRAY<TINYINT>>)
```

MAP 型はサポートされず、エラーになります。
```sql
SELECT array_difference([{'k':1},{'k':2}]);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_difference(ARRAY<MAP<VARCHAR(1),TINYINT>>)
```

STRUCT 型はサポートされず、エラーになります。
```sql
SELECT array_difference(array(named_struct('name','Alice','age',20),named_struct('name','Bob','age',30)));
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_difference(ARRAY<STRUCT<name:TEXT,age:TINYINT>>)
```

パラメータの数が正しくない場合はエラーになります。
```sql
SELECT array_difference([1,2,3],[4,5,6]);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not found function 'array_difference' which has 2 arity. Candidate functions are: [array_difference(Expression)]
```

配列以外の型を渡すとエラーになります。
```sql
SELECT array_difference('not_an_array');
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_difference(VARCHAR(12))
```

### キーワード

ARRAY, DIFFERENCE, ARRAY_DIFFERENCE 
