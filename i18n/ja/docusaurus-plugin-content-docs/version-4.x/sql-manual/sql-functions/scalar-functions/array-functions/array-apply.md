---
{
    "title": "ARRAY_APPLY",
    "language": "ja",
    "description": "指定した比較演算子で配列の要素を絞り込み、条件を満たす要素を含む新しい配列を返します。"
}
---

## array_apply

<version since="1.2.3">


</version>

## 説明

指定した比較演算子で配列の要素を絞り込み、条件を満たす要素を含む新しい配列を返します。ラムダ式の代わりに定義済みの演算子を使う、簡易的な配列フィルタリング関数です。

## 構文

```sql
array_apply(arr, op, val)
```

### パラメータ

- `arr`：ARRAY\<T> 型。絞り込む対象の配列
- `op`：STRING 型。絞り込み条件に使う演算子で、定数である必要があります。使用できる演算子は `=`、`!=`、`>`、`>=`、`<`、`<=` です
- `val`：T 型。絞り込み条件に使う値で、定数である必要があります

**T に使用できる型:**
- 数値型：TINYINT、SMALLINT、INT、BIGINT、LARGEINT、FLOAT、DOUBLE、DECIMAL
- 日付と時刻の型：DATE、DATETIME、DATEV2、DATETIMEV2
- 真偽値型：BOOLEAN

### 戻り値

戻り値の型：ARRAY\<T>

戻り値の意味：
- 絞り込み条件を満たすすべての要素を含む新しい配列を返します
- NULL：入力配列または条件値が NULL の場合に返します
- 空の配列：条件を満たす要素がない場合に返します

使用上の注意：
- 演算子と条件値には、列名や式ではなく定数を指定する必要があります
- 使用できる型は限られ、主に数値型、日付型、真偽値型です
- 空の配列を入力すると空の配列を返し、NULL の配列を入力すると NULL を返します
- 配列内の NULL 要素は除外され、比較演算には参加しません

### 例

```sql
CREATE TABLE array_apply_test (
    id INT,
    int_array ARRAY<INT>,
    double_array ARRAY<DOUBLE>,
    date_array ARRAY<DATE>
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 3
PROPERTIES (
    "replication_num" = "1"
);

INSERT INTO array_apply_test VALUES
(1, [1, 2, 3, 4, 5], [1.1, 2.2, 3.3, 4.4, 5.5], ['2023-01-01', '2023-01-02', '2023-01-03', '2023-01-04', '2023-01-05']),
(2, [10, 20, 30], [10.5, 20.5, 30.5], ['2023-02-01', '2023-02-02', '2023-02-03']),
(3, [], [], []),
(4, NULL, NULL, NULL);
```

**クエリ例：**

double_array から 2 より大きい要素を抽出します：
```sql
SELECT array_apply(double_array, ">", 2) FROM array_apply_test WHERE id = 1;
+------------------------------------------+
| array_apply(double_array, '>', 2)        |
+------------------------------------------+
| [2.2, 3.3, 4.4, 5.5]                     |
+------------------------------------------+
```

int_array から 3 と等しくない要素を抽出します：
```sql
SELECT array_apply(int_array, "!=", 3) FROM array_apply_test WHERE id = 1;
+------------------------------------------+
| array_apply(int_array, '!=', 3)          |
+------------------------------------------+
| [1, 2, 4, 5]                             |
+------------------------------------------+
```

date_array から指定した日付以降の要素を抽出します：
```sql
SELECT array_apply(date_array, ">=", '2023-01-03') FROM array_apply_test WHERE id = 1;
+---------------------------------------------+
| array_apply(date_array, ">=", '2023-01-03') |
+---------------------------------------------+
| ["2023-01-03", "2023-01-04", "2023-01-05"]  |
+---------------------------------------------+
```

空の配列を入力すると、空の配列を返します：
```sql
SELECT array_apply(int_array, ">", 0) FROM array_apply_test WHERE id = 3;
+------------------------------------------+
| array_apply(int_array, '>', 0)           |
+------------------------------------------+
| []                                        |
+------------------------------------------+
```

NULL の配列を入力すると、エラーを発生させずに NULL を返します：
```sql
SELECT array_apply(int_array, ">", 0) FROM array_apply_test WHERE id = 4;
+------------------------------------------+
| array_apply(int_array, '>', 0)           |
+------------------------------------------+
| NULL                                      |
+------------------------------------------+
```

NULL 要素を含む配列では、NULL 要素が除外されます：
```sql
SELECT array_apply([1, null, 3, null, 5], ">", 2);
+------------------------------------------+
| array_apply([1, null, 3, null, 5], '>', 2) |
+------------------------------------------+
| [3, 5]                                   |
+------------------------------------------+
```

### エラー例

サポートされていない演算子：
```sql
SELECT array_apply([1,2,3], "like", 2);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not build function: 'array_apply', expression: array_apply([1, 2, 3], 'like', 2), array_apply(arr, op, val): op support =, >=, <=, >, <, !=, but we get like
```

サポートされていない文字列型：
```sql
SELECT array_apply(['a','b','c'], "=", 'a');
ERROR 1105 (HY000): errCode = 2, detailMessage = array_apply does not support type VARCHAR(1), expression is array_apply(['a', 'b', 'c'], '=', 'a')
```

サポートされていない複合型：
```sql
SELECT array_apply([[1,2],[3,4]], "=", [1,2]);
ERROR 1105 (HY000): errCode = 2, detailMessage = array_apply does not support type ARRAY<TINYINT>, expression is array_apply([[1, 2], [3, 4]], '=', [1, 2])
```

演算子が定数ではない場合：
```sql
SELECT array_apply([1,2,3], concat('>', '='), 2);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not build function: 'array_apply', expression: array_apply([1, 2, 3], concat('>', '='), 2), array_apply(arr, op, val): op support const value only.
```

条件値が定数ではない場合：
```sql
SELECT array_apply([1,2,3], ">", id) FROM array_apply_test WHERE id = 1;
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not build function: 'array_apply', expression: array_apply([1, 2, 3], '>', id), array_apply(arr, op, val): val support const value only.
```

パラメータの数が正しくない場合：
```sql
SELECT array_apply([1,2,3], ">");
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not found function 'array_apply' which has 2 arity. Candidate functions are: [array_apply(Expression, Expression, Expression)]
```

配列以外の型を渡した場合：
```sql
SELECT array_apply('not_an_array', ">", 2);
ERROR 1105 (HY000): errCode = 2, detailMessage = class org.apache.doris.nereids.types.VarcharType cannot be cast to class org.apache.doris.nereids.types.ArrayType (org.apache.doris.nereids.types.VarcharType and org.apache.doris.nereids.types.ArrayType are in unnamed module of loader 'app')
```

### キーワード

ARRAY, APPLY, ARRAY_APPLY 
