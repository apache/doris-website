---
{
    "title": "ARRAY_INTERSECT",
    "language": "ja",
    "description": "複数の配列の共通部分、つまりすべての配列に存在する要素を返します。"
}
---

## array_intersect

<version since="2.0.0">

</version>

### 説明

複数の配列の共通部分、つまりすべての配列に存在する要素を返します。この関数はすべての入力配列に存在する要素を探し、重複を除いた新しい配列を作成します。

### 構文

```sql
array_intersect(ARRAY<T> arr1, ARRAY<T> arr2, [ARRAY<T> arr3, ...])
```

### パラメータ

- `arr1, arr2, arr3, ...`：共通部分を求める ARRAY<T> 型の配列。二つ以上の配列を指定できます。

**T に指定できる型：**
- 数値型：TINYINT、SMALLINT、INT、BIGINT、LARGEINT、FLOAT、DOUBLE、DECIMAL
- 文字列型：CHAR、VARCHAR、STRING
- 日付・時刻型：DATE、DATETIME、DATEV2、DATETIMEV2、TIMESTAMP_NS
- 真偽値型：BOOLEAN
- IP 型：IPV4、IPV6
- UUID：[UUID](../../../basic-element/sql-data-types/uuid.md)

### 戻り値

戻り値の型：ARRAY<T>

戻り値の意味：
- すべての入力配列に存在する要素を、重複を除いて新しい配列に格納して返します。
- すべての入力配列に共通する要素がない場合は、空の配列を返します。

使用上の注意：
- すべての入力配列に存在する要素を探し、結果の配列では重複を除きます。
- 空の配列と NULL ではない配列の共通部分は、空の配列になります。共通する要素がない場合も、空の配列を返します。
- NULL の配列はサポートされません。
- 要素の比較には型の互換性に関する規則が適用されます。型に互換性がない場合は変換を試み、変換に失敗すると null になります。
- 配列内の null 要素は通常の要素として扱われ、null 同士は等しいとみなされます。

**クエリ例：**

二つの配列の共通部分：
```sql
SELECT array_intersect([1, 2, 3, 4, 5], [2, 4, 6, 8]);
+------------------------------------------------+
| array_intersect([1, 2, 3, 4, 5], [2, 4, 6, 8]) |
+------------------------------------------------+
| [4, 2]                                         |
+------------------------------------------------+
```

複数の配列の共通部分：
```sql
SELECT array_intersect([1, 2, 3, 4, 5], [2, 4, 6, 8], [2, 4, 10, 12]);
+----------------------------------------------------------------+
| array_intersect([1, 2, 3, 4, 5], [2, 4, 6, 8], [2, 4, 10, 12]) |
+----------------------------------------------------------------+
| [2, 4]                                                         |
+----------------------------------------------------------------+
```

文字列配列の共通部分：
```sql
SELECT array_intersect(['a', 'b', 'c'], ['b', 'c', 'd']);
+--------------------------------------------+
| array_intersect(['a','b','c'], ['b','c','d']) |
+--------------------------------------------+
| ["b", "c"]                                 |
+--------------------------------------------+
```

null を含む配列。null は等値比較ができる値として扱われます：
```sql
SELECT array_intersect([1, null, 2, null, 3], [null, 2, 3, 4]);
+---------------------------------------------------------+
| array_intersect([1, null, 2, null, 3], [null, 2, 3, 4]) |
+---------------------------------------------------------+
| [null, 2, 3]                                            |
+---------------------------------------------------------+
```

文字列配列と整数配列の共通部分：
文字列 '2' は整数 2 に変換できますが、'b' は変換に失敗して null になります：
```sql
SELECT array_intersect([1, 2, null, 3], ['2', 'b']);
+----------------------------------------------+
| array_intersect([1, 2, null, 3], ['2', 'b']) |
+----------------------------------------------+
| [null, 2]                                    |
+----------------------------------------------+
```

空の配列と任意の配列の共通部分：
```sql
SELECT array_intersect([], [1, 2, 3]);
+-----------------------------+
| array_intersect([], [1,2,3]) |
+-----------------------------+
| []                          |
+-----------------------------+
```

入力配列が NULL の場合はエラーになります：
```sql
SELECT array_intersect(NULL, NULL);
ERROR 1105 (HY000): errCode = 2, detailMessage = class org.apache.doris.nereids.types.NullType cannot be cast to class org.apache.doris.nereids.types.ArrayType (org.apache.doris.nereids.types.NullType and org.apache.doris.nereids.types.ArrayType are in unnamed module of loader 'app')
```

複合型はサポートされず、エラーになります：
ネストした配列型はサポートされず、エラーになります：
```sql
SELECT array_intersect([[1,2],[3,4],[5,6]]);
ERROR 1105 (HY000): errCode = 2, detailMessage = array_intersect does not support type ARRAY<ARRAY<TINYINT>>, expression is array_intersect([[1, 2], [3, 4], [5, 6]])
```

MAP 型はサポートされず、エラーになります：
```sql
SELECT array_intersect([{'k':1},{'k':2},{'k':3}]);
ERROR 1105 (HY000): errCode = 2, detailMessage = array_intersect does not support type ARRAY<MAP<VARCHAR(1),TINYINT>>, expression is array_intersect([map('k', 1), map('k', 2), map('k', 3)])
```

引数の数が正しくない場合はエラーになります：
```sql
SELECT array_intersect([1, 2, 3]);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not found function 'array_intersect' which has 1 arity. Candidate functions are: [array_intersect(Expression, Expression, ...)]
```

配列以外の型を渡した場合はエラーになります：
```sql
SELECT array_intersect('not_an_array', [1, 2, 3]);
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_intersect(VARCHAR(12), ARRAY<INT>)
```

### キーワード

ARRAY, INTERSECT, ARRAY_INTERSECT
