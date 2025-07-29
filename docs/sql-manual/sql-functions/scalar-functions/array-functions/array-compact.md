---
{
    "title": "ARRAY_COMPACT",
    "language": "en"
}
---

## Description

Removes consecutive duplicate elements from an array. The order of result values is determined by the order in the source array.

## Syntax
```sql
ARRAY_COMPACT(<arr>)
```

## Parameters
| Parameter | Description |
|---|---|
| `<arr>` | The array to remove consecutive duplicate elements from  |

## Return Value

An array without consecutive duplicate elements.

## Example

```sql
select array_compact([1, 2, 3, 3, null, null, 4, 4]);
```
```text
+----------------------------------------------------+
| array_compact(ARRAY(1, 2, 3, 3, NULL, NULL, 4, 4)) |
+----------------------------------------------------+
| [1, 2, 3, NULL, 4]                                 |
+----------------------------------------------------+
```
```sql
select array_compact(['aaa','aaa','bbb','ccc','ccccc',null, null,'dddd']);
```
```text
+-------------------------------------------------------------------------------+
| array_compact(ARRAY('aaa', 'aaa', 'bbb', 'ccc', 'ccccc', NULL, NULL, 'dddd')) |
+-------------------------------------------------------------------------------+
| ['aaa', 'bbb', 'ccc', 'ccccc', NULL, 'dddd']                                  |
+-------------------------------------------------------------------------------+
```
```sql
select array_compact(['2015-03-13','2015-03-13']);
```
```text
+--------------------------------------------------+
| array_compact(ARRAY('2015-03-13', '2015-03-13')) |
+--------------------------------------------------+
| ['2015-03-13']                                   |
+--------------------------------------------------+
```

