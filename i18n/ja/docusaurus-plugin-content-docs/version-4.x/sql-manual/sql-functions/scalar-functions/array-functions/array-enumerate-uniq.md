---
{
    "title": "ARRAY_ENUMERATE_UNIQ",
    "language": "ja",
    "description": "配列内の各要素について、その要素がそれまでに出現した回数を返します。"
}
---

## array_enumerate_uniq

<version since="2.0.0">

</version>

## 説明

配列内の各要素について、その要素がそれまでに出現した回数を返します。各要素に対して、配列内で何回目の出現かを示す数値を生成します。

## 構文

```sql
array_enumerate_uniq(ARRAY<T> arr1, [ARRAY<T> arr2, ...])
```

### パラメータ

- `arr1, arr2, ...`：ARRAY<T> 型。一意の出現回数を生成する対象の配列です。一つ以上の配列を指定できます。

**T に使用できる型：**
- 数値型：TINYINT、SMALLINT、INT、BIGINT、LARGEINT、FLOAT、DOUBLE、DECIMAL
- 文字列型：CHAR、VARCHAR、STRING
- 日付・時刻型：DATE、DATETIME、DATEV2、DATETIMEV2
- 真偽値型：BOOLEAN
- IP 型：IPV4、IPV6

### 戻り値

戻り値の型：ARRAY<BIGINT>

戻り値の意味：
- 入力配列と同じ長さの新しい配列を返します。各位置には、対応する要素の出現回数が入ります
- 入力配列が NULL の場合は NULL を返します

使用上の注意：
- 配列内の各要素について、1 から始まり、出現するたびに増加する数値を生成します
- 同じ要素が複数回現れる場合、その要素の出現回数が順に増加します
- 配列を複数指定する場合、すべての配列の長さが同じである必要があります。長さが異なるとエラーになります。各配列の対応する位置の要素を組み合わせ、その組み合わせに対して出現回数を生成します
- 空の配列に対しては空の配列を、NULL の配列に対しては NULL を返します
- 配列内の NULL 要素に対しても、対応する出現回数を生成します

**クエリ例：**

配列内の各要素の出現回数を生成します。同じ要素が複数回現れる場合、出現するたびに回数が増加します：
```sql
SELECT array_enumerate_uniq([1, 2, 1, 3, 2, 1]);
+------------------------------------------+
| array_enumerate_uniq([1, 2, 1, 3, 2, 1]) |
+------------------------------------------+
| [1, 1, 2, 1, 2, 3]                       |
+------------------------------------------+
```

空の配列に対しては空の配列を返します：
```sql
SELECT array_enumerate_uniq([]);
+----------------------+
| array_enumerate_uniq([]) |
+----------------------+
| []                   |
+----------------------+
```

NULL の配列に対しては NULL を返します：
```sql
SELECT array_enumerate_uniq(NULL), array_enumerate_uniq(NULL, NULL);
+----------------------------+----------------------------------+
| array_enumerate_uniq(NULL) | array_enumerate_uniq(NULL, NULL) |
+----------------------------+----------------------------------+
| NULL                       | NULL                             |
+----------------------------+----------------------------------+
```

NULL 要素を含む配列では、NULL 要素に対しても出現回数を生成します：
```sql
SELECT array_enumerate_uniq([1, null, 1, null, 1]);
+--------------------------------------------+
| array_enumerate_uniq([1, null, 1, null, 1]) |
+--------------------------------------------+
| [1, 1, 2, 2, 3]                            |
+--------------------------------------------+
```

複数の配列を指定した場合、各配列の要素の組み合わせに基づいて出現回数を生成します：
```sql
SELECT array_enumerate_uniq([1, 2, 1], [10, 20, 10]);
+----------------------------------------------+
| array_enumerate_uniq([1, 2, 1], [10, 20, 10]) |
+----------------------------------------------+
| [1, 1, 2]                                    |
+----------------------------------------------+
```

配列の長さが一致しない場合はエラーになります：
```sql
SELECT array_enumerate_uniq([1,2,3], [4,5]);
ERROR 1105 (HY000): errCode = 2, detailMessage = lengths of all arrays of function array_enumerate_uniq must be equal.
```

IP 型の使用例：
```sql
SELECT array_enumerate_uniq(CAST(['192.168.1.1', '192.168.1.2', '192.168.1.1'] AS ARRAY<IPV4>));
+------------------------------------------------------------------------------------------+
| array_enumerate_uniq(CAST(['192.168.1.1', '192.168.1.2', '192.168.1.1'] AS ARRAY<IPV4>)) |
+------------------------------------------------------------------------------------------+
| [1, 1, 2]                                                                                |
+------------------------------------------------------------------------------------------+

mysql> SELECT array_enumerate_uniq(CAST(['2001:db8::1', '2001:db8::2', '2001:db8::1'] AS ARRAY<IPV6>));
+------------------------------------------------------------------------------------------+
| array_enumerate_uniq(CAST(['2001:db8::1', '2001:db8::2', '2001:db8::1'] AS ARRAY<IPV6>)) |
+------------------------------------------------------------------------------------------+
| [1, 1, 2]                                                                                |
+------------------------------------------------------------------------------------------+
```

複合型の使用例：

ネストした配列型はサポートされず、エラーになります：
```sql
SELECT array_enumerate_uniq([[1,2],[3,4],[5,6]]);
ERROR 1105 (HY000): errCode = 2, detailMessage = array_enumerate_uniq does not support type ARRAY<ARRAY<TINYINT>>, expression is array_enumerate_uniq([[1, 2], [3, 4], [5, 6]])
```

MAP 型はサポートされず、エラーになります：
```sql
SELECT array_enumerate_uniq([{'k':1},{'k':2},{'k':3}]);
ERROR 1105 (HY000): errCode = 2, detailMessage = array_enumerate_uniq does not support type ARRAY<MAP<VARCHAR(1),TINYINT>>, expression is array_enumerate_uniq([map('k', 1), map('k', 2), map('k', 3)])
```

引数の数が正しくない場合はエラーになります：
```sql
SELECT array_enumerate_uniq();
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not found function 'array_enumerate_uniq' which has 0 arity. Candidate functions are: [array_enumerate_uniq(Expression, Expression...)]
```

配列以外の型を渡した場合はエラーになります：
```sql
SELECT array_enumerate_uniq('not_an_array');
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_enumerate_uniq(VARCHAR(12))
```

### キーワード

ARRAY, ENUMERATE, UNIQ, ARRAY_ENUMERATE_UNIQ
