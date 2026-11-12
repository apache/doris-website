---
{
    "title": "BITMAP_HASH",
    "language": "en",
    "description": "Computes the 32-bit hash value of any input type and returns a Bitmap containing that hash value."
}
---

## Description

Computes the 32-bit hash value of any input type and returns a Bitmap containing that hash value.

## Syntax

```sql
BITMAP_HASH(<expr>)
```

## Parameters

| Parameter | Description           |
|-----------|-----------------------|
| `<expr>`  | Any value or field expression |

## Return Value

Returns a Bitmap containing the 32-bit hash value of the parameter `<expr>`.

::: note

The hash algorithm used is MurMur3.  
MurMur3 is a high-performance, low-collision hashing algorithm that produces values close to a random distribution and can pass chi-squared distribution tests. Note that the hash values computed may differ across different hardware platforms and seed values.  
For more details on the performance of this algorithm, see the [Smhasher](http://rurban.github.io/smhasher/) benchmark.

:::

## Examples

To compute the MurMur3 hash of a value, you can use:

```sql
select bitmap_to_array(bitmap_hash('hello'))[1];
```

The result will be:

```text
+-------------------------------------------------------------+
| %element_extract%(bitmap_to_array(bitmap_hash('hello')), 1) |
+-------------------------------------------------------------+
|                                                  1321743225 |
+-------------------------------------------------------------+
```

To count the distinct values in a column using bitmaps, which can be more efficient than `count distinct` in some scenarios. The example below populates a `words` table with 6 rows containing 4 distinct values; at the doc-corpus scale a real query of this shape can return numbers in the millions:

```sql
CREATE TABLE `words` (`word` VARCHAR(64))
DISTRIBUTED BY HASH(`word`) BUCKETS 1
PROPERTIES ("replication_num" = "1");

INSERT INTO `words` VALUES ('apple'), ('banana'), ('cherry'), ('apple'), ('date'), ('banana');

select bitmap_count(bitmap_union(bitmap_hash(`word`))) from `words`;
```

```text
+-------------------------------------------------+
| bitmap_count(bitmap_union(bitmap_hash(`word`))) |
+-------------------------------------------------+
|                                               4 |
+-------------------------------------------------+
```

```sql
select bitmap_to_string(bitmap_hash(NULL)) AS res;
```

The result will be:

```text
+------+
| res  |
+------+
|      |
+------+
```
