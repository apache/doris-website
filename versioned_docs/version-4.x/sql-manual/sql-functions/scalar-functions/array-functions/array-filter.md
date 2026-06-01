---
{
    "title": "ARRAY_FILTER",
    "language": "en",
    "description": "Filters array elements based on conditions and returns a new array composed of elements that satisfy the conditions."
}
---

## array_filter

<version since="2.0.0">

</version>

## Description

Filters array elements based on conditions and returns a new array composed of elements that satisfy the conditions. The function supports two calling methods: a higher-order function form using lambda expressions, and a filtering form directly using boolean arrays.

## Syntax

```sql
array_filter(lambda, array1, ...)
array_filter(array1, array<boolean> filter_array)
```

### Parameters

- `lambda`：lambda expression used to evaluate array elements, returns true/false or expressions that can be converted to boolean values
- `array1, ...`：one or more ARRAY\<T> type parameters
- `filter_array`：ARRAY\<BOOLEAN> type, boolean array used for filtering

**T supported types:**
- Numeric types: TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL
- String types: CHAR, VARCHAR, STRING
- Date and time types: DATE, DATETIME, DATEV2, DATETIMEV2
- Boolean type: BOOLEAN
- IP types: IPV4, IPV6
- Complex data types: ARRAY, MAP, STRUCT

### Return Value

Return type: ARRAY\<T>

Return value meaning:
- Returns a new array composed of all elements that satisfy the filtering conditions
- NULL: if the input array is NULL
- Empty array: if no elements satisfy the conditions

Usage notes:
- Lambda form: the number of lambda expression parameters must match the number of array parameters
- Boolean array form: the length of `array1` and `filter_array` should ideally be completely consistent. If the boolean array is longer, excess boolean values will be ignored; if the boolean array is shorter, only elements at corresponding positions in the boolean array will be processed
- Supports filtering of multiple arrays and complex type arrays
- Empty array returns empty array, NULL array returns NULL
- Lambda can use any scalar expression, cannot use aggregate functions
- Lambda expressions can call other higher-order functions, but need to return compatible types
- For null values in array elements: null elements will be passed to the lambda expression for processing, lambda can evaluate null values

### Examples

**Setup** — create a fixture table and load 4 rows covering normal, edge-case, empty, and NULL scenarios. All later examples reference this fixture.

```sql {setup}
CREATE TABLE array_filter_test (
    id INT,
    int_array ARRAY<INT>,
    double_array ARRAY<DOUBLE>,
    string_array ARRAY<STRING>
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 3
PROPERTIES (
    "replication_num" = "1"
);

INSERT INTO array_filter_test VALUES
(1, [1, 2, 3, 4, 5], [1.1, 2.2, 3.3, 4.4, 5.5], ['a', 'bb', 'ccc', 'dddd', 'eeeee']),
(2, [10, 20, 30], [10.5, 20.5, 30.5], ['x', 'yy', 'zzz']),
(3, [], [], []),
(4, NULL, NULL, NULL);
```

**Example 1** — Lambda over a DOUBLE array column: keep elements `>= 3`.

```sql {example="1"}
SELECT array_filter(x -> x >= 3, double_array) FROM array_filter_test WHERE id = 1;
```

```result {example="1"}
+------------------------------------------+
| array_filter(x -> x >= 3, double_array)  |
+------------------------------------------+
| [3.3, 4.4, 5.5]                          |
+------------------------------------------+
```

**Example 2** — Lambda over a STRING array column: keep elements with `length > 2`.

```sql {example="2"}
SELECT array_filter(x -> length(x) > 2, string_array) FROM array_filter_test WHERE id = 1;
```

```result {example="2"}
+--------------------------------------------------+
| array_filter(x -> length(x) > 2, string_array)   |
+--------------------------------------------------+
| ["ccc", "dddd", "eeeee"]                         |
+--------------------------------------------------+
```

**Example 3** — Boolean-mask form: keep positions where the mask is `true`.

```sql {example="3"}
SELECT array_filter(int_array, [false, true, false, true, true]) FROM array_filter_test WHERE id = 1;
```

```result {example="3"}
+-----------------------------------------------------------+
| array_filter(int_array, [false, true, false, true, true]) |
+-----------------------------------------------------------+
| [2, 4, 5]                                                 |
+-----------------------------------------------------------+
```

**Example 4** — Boolean-mask form with literal arrays.

```sql {example="4"}
SELECT array_filter([1,2,3], [true, false, true]);
```

```result {example="4"}
+--------------------------------------------+
| array_filter([1,2,3], [true, false, true]) |
+--------------------------------------------+
| [1, 3]                                     |
+--------------------------------------------+
```

**Example 5** — Boolean array longer than the value array: extra mask entries are ignored.

```sql {example="5"}
SELECT array_filter([1,2,3], [true, false, true, false]);
```

```result {example="5"}
+---------------------------------------------------+
| array_filter([1,2,3], [true, false, true, false]) |
+---------------------------------------------------+
| [1, 3]                                            |
+---------------------------------------------------+
```

**Example 6** — Boolean array shorter than the value array: only positions covered by the mask are processed.

```sql {example="6"}
SELECT array_filter([1,2,3], [true, false]);
```

```result {example="6"}
+--------------------------------------+
| array_filter([1,2,3], [true, false]) |
+--------------------------------------+
| [1]                                  |
+--------------------------------------+
```

**Example 7** — Empty input array returns an empty array (row `id = 3`).

```sql {example="7"}
SELECT array_filter(x -> x > 0, int_array) FROM array_filter_test WHERE id = 3;
```

```result {example="7"}
+-------------------------------------+
| array_filter(x -> x > 0, int_array) |
+-------------------------------------+
| []                                  |
+-------------------------------------+
```

**Example 8** — NULL input array returns NULL (row `id = 4`).

```sql {example="8"}
SELECT array_filter(x -> x > 0, int_array) FROM array_filter_test WHERE id = 4;
```

```result {example="8"}
+-------------------------------------+
| array_filter(x -> x > 0, int_array) |
+-------------------------------------+
| NULL                                |
+-------------------------------------+
```

**Example 9** — Array containing NULL elements: lambda can test for `IS NOT NULL` to drop them.

```sql {example="9"}
SELECT array_filter(x -> x is not null, [null, 1, null, 2, null]);
```

```result {example="9"}
+------------------------------------------------------------+
| array_filter(x -> x is not null, [null, 1, null, 2, null]) |
+------------------------------------------------------------+
| [1, 2]                                                     |
+------------------------------------------------------------+
```

**Example 10** — Multi-argument lambda over two arrays from the fixture.

```sql {example="10"}
SELECT array_filter((x, y) -> x > y, int_array, double_array) FROM array_filter_test WHERE id = 1;
```

```result {example="10"}
+--------------------------------------------------------+
| array_filter((x, y) -> x > y, int_array, double_array) |
+--------------------------------------------------------+
| []                                                     |
+--------------------------------------------------------+
```

**Example 11** — Filter over a nested array literal: keep sub-arrays with `size > 2`.

```sql {example="11"}
SELECT array_filter(x -> size(x) > 2, [[1,2], [3,4,5], [6], [7,8,9,10]]);
```

```result {example="11"}
+-------------------------------------------------------------------+
| array_filter(x -> size(x) > 2, [[1,2], [3,4,5], [6], [7,8,9,10]]) |
+-------------------------------------------------------------------+
| [[3, 4, 5], [7, 8, 9, 10]]                                        |
+-------------------------------------------------------------------+
```

**Example 12** — Filter over an array of MAPs: keep elements where `x['a'] > 10`.

```sql {example="12"}
SELECT array_filter(x -> x['a'] > 10, [{'a':5}, {'a':15}, {'a':20}]);
```

```result {example="12"}
+---------------------------------------------------------------+
| array_filter(x -> x['a'] > 10, [{'a':5}, {'a':15}, {'a':20}]) |
+---------------------------------------------------------------+
| [{"a":15}, {"a":20}]                                          |
+---------------------------------------------------------------+
```

**Example 13** — Filter over an array of STRUCTs by a field value.

```sql {example="13"}
SELECT array_filter(x -> struct_element(x, 'age') > 18, array(named_struct('name','Alice','age',20),named_struct('name','Bob','age',16),named_struct('name','Eve','age',30)));
```

```result {example="13"}
+------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| array_filter(x -> struct_element(x, 'age') > 18, array(named_struct('name','Alice','age',20),named_struct('name','Bob','age',16),named_struct('name','Eve','age',30))) |
+------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| [{"name":"Alice", "age":20}, {"name":"Eve", "age":30}]                                                                                                                 |
+------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
```

**Example 14** — Lambda parameter count must match the number of arrays passed in.

```sql {example="14"}
SELECT array_filter(x -> x > 0, [1,2,3], [4,5,6], [7,8,9]);
```

```error {example="14"}
ERROR 1105 (HY000): errCode = 2, detailMessage = lambda x -> (x > 0) arguments' size is not equal parameters' size
```

**Example 15** — Multi-array form requires equal length across all input arrays.

```sql {example="15"}
SELECT array_filter((x, y) -> x > y, [1,2,3], [4,5]);
```

```error {example="15"}
ERROR 1105 (HY000): errCode = 2, detailMessage = [INVALID_ARGUMENT]in array map function, the input column size are not equal completely, nested column data rows 1st size is 3, 2th size is 2.
```

**Example 16** — The first argument must be an array.

```sql {example="16"}
SELECT array_filter(x -> x > 0, 'not_an_array');
```

```error {example="16"}
ERROR 1105 (HY000): errCode = 2, detailMessage = lambda argument must be array but is 'not_an_array'
```

**Example 17** — Nested higher-order function: inner `array_count` returns a scalar that the outer `array_filter` lambda can use.

```sql {example="17"}
SELECT array_filter(x -> array_count(y -> y > 5, x) > 0, [[1,2,3],[4,5,6],[7,8,9]]);
```

```result {example="17"}
+------------------------------------------------------------------------------+
| array_filter(x -> array_count(y -> y > 5, x) > 0, [[1,2,3],[4,5,6],[7,8,9]]) |
+------------------------------------------------------------------------------+
| [[4, 5, 6], [7, 8, 9]]                                                       |
+------------------------------------------------------------------------------+
```

**Example 18** — Counter-example: the outer `array_filter` lambda cannot return an array (`array_exists` returns ARRAY<BOOLEAN> here, not a scalar).

```sql {example="18"}
SELECT array_filter(x -> array_exists(y -> y > 5, x), [[1,2,3],[4,5,6]]);
```

```error {example="18"}
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: array_filter(ARRAY<ARRAY<TINYINT>>, ARRAY<ARRAY<BOOLEAN>>)
```

### Keywords

ARRAY, FILTER, ARRAY_FILTER 