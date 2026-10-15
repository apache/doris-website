---
{
    "title": "ARRAY_AVG",
    "language": "ja",
    "description": "配列内の数値要素の平均を計算します。NULL 値と数値に変換できない要素は計算から除外します。"
}
---

## array_avg

<version since="2.0.0">

</version>

## 説明

配列内の数値要素の平均を計算します。配列内の NULL 値と数値に変換できない要素を除外し、有効な数値要素のみの平均を計算します。

## 構文

```sql
array_avg(ARRAY<T> arr)
```

### パラメータ

- `arr`：ARRAY<T> 型。平均を計算する配列です。カラム名または定数値を指定できます。

**T に使用できる型：**
- 数値型：TINYINT、SMALLINT、INT、BIGINT、LARGEINT、FLOAT、DOUBLE、DECIMAL
- 文字列型：CHAR、VARCHAR、STRING（数値への変換を試みます）
- ブール型：BOOLEAN（数値への変換を試みます）

### 戻り値

戻り値の型：入力の型に応じて自動的に選択されます。

戻り値の意味：
- 配列内の有効な数値要素すべての平均を返します。
- 配列が空の場合、またはすべての要素が NULL か数値に変換できない場合は、NULL を返します。

使用上の注意：
- 配列に文字列などの型が含まれる場合は、要素を DOUBLE 型に変換しようとします。変換に失敗した要素は除外され、平均の計算には含まれません。
- 平均を計算するために、すべての要素を互換性のある数値型に変換しようとします。平均の戻り値の型は入力の型に応じて自動的に選択されます。
  - 入力が DOUBLE または FLOAT の場合、DOUBLE を返します。
  - 入力が整数型の場合、DOUBLE を返します。
  - 入力が DECIMAL の場合、元の精度とスケールを維持した DECIMAL を返します。
- 空の配列は NULL を返します。要素が一つだけの配列は、その要素の値を返します。
- 配列が NULL の場合、型変換エラーを返します。
- ネストした配列、MAP、STRUCT などの複合型は平均の計算に使用できず、呼び出すとエラーになります。
- 配列内の NULL 要素は平均の計算に含まれません。

### 例

```sql
CREATE TABLE array_avg_test (
    id INT,
    int_array ARRAY<INT>,
    double_array ARRAY<DOUBLE>,
    mixed_array ARRAY<STRING>
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 3
PROPERTIES (
    "replication_num" = "1"
);

INSERT INTO array_avg_test VALUES
(1, [1, 2, 3, 4, 5], [1.1, 2.2, 3.3, 4.4, 5.5], ['1', '2', '3', '4', '5']),
(2, [10, 20, 30], [10.5, 20.5, 30.5], ['10', '20', '30']),
(3, [], [], []),
(4, NULL, NULL, NULL),
(5, [1, null, 3, null, 5], [1.1, null, 3.3, null, 5.5], ['1', null, '3', null, '5']);
```

**クエリの例：**

double_array の平均を計算します。
```sql
SELECT array_avg(double_array) FROM array_avg_test WHERE id = 1;
+-------------------------+
| array_avg(double_array) |
+-------------------------+
|                     3.3 |
+-------------------------+
```

混合型の配列の平均を計算します。文字列は数値に変換されます。
```sql
SELECT array_avg(mixed_array) FROM array_avg_test WHERE id = 1;
+------------------------+
| array_avg(mixed_array) |
+------------------------+
|                      3 |
+------------------------+
```

空の配列は NULL を返します。
```sql
SELECT array_avg(int_array) FROM array_avg_test WHERE id = 3;
+----------------------+
| array_avg(int_array) |
+----------------------+
|                 NULL |
+----------------------+
```

NULL の配列は NULL を返します。
```sql
SELECT array_avg(int_array) FROM array_avg_test WHERE id = 4;
+----------------------+
| array_avg(int_array) |
+----------------------+
|                 NULL |
+----------------------+
```

NULL 値を含む配列では、NULL 要素は計算に含まれません。
```sql
SELECT array_avg(int_array) FROM array_avg_test WHERE id = 5;
+----------------------+
| array_avg(int_array) |
+----------------------+
|                    3 |
+----------------------+
```

複合型の例：

ネストした配列型はサポートされず、エラーになります。
```sql
SELECT array_avg([[1,2,3]]);
ERROR 1105 (HY000): errCode = 2, detailMessage = array_avg([[1, 2, 3]]) does not support type: ARRAY<TINYINT>
```

MAP 型はサポートされず、エラーになります。
```sql
SELECT array_avg([{'k':1},{'k':2}]);
ERROR 1105 (HY000): errCode = 2, detailMessage = array_avg([map('k', 1), map('k', 2)]) does not support type: MAP<VARCHAR(1),TINYINT>
```

引数の数が正しくない場合のエラー：
```sql
SELECT array_avg([1,2,3], [4,5,6]);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not found function 'array_avg' which has 2 arity. Candidate functions are: [array_avg(Expression)]
```

配列以外の型を渡した場合のエラー：
```sql
SELECT array_avg('not_an_array');
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_avg(VARCHAR(12))
```

配列が NULL の場合、型変換エラーを返します。
```
mysql> SELECT array_avg(NULL);
ERROR 1105 (HY000): errCode = 2, detailMessage = class org.apache.doris.nereids.types.NullType cannot be cast to class org.apache.doris.nereids.types.ArrayType (org.apache.doris.nereids.types.NullType and org.apache.doris.nereids.types.ArrayType are in unnamed module of loader 'app')
```

### キーワード

ARRAY, AVG, ARRAY_AVG
