---
{
    "title": "ARRAY_CUM_SUM",
    "language": "en"
}
---

## array_cum_sum

<version since="1.2.3">

array_cum_sum

</version>

### description

Get the cumulative sum of an array (`NULL` values are skipped).
If the array contains `NULL` values, then `NULL` is set at the same position in the result array.

#### Syntax

```sql
Array<T> array_cum_sum(Array<T>)
```

### notice

`Only supported in vectorized engine`

### example

```shell
mysql> create table array_type_table(k1 INT, k2 Array<int>) duplicate key (k1) distributed by hash(k1) buckets 1 properties('replication_num' = '1');
mysql> insert into array_type_table values (0, []), (1, [NULL]), (2, [1, 2, 3, 4]), (3, [1, NULL, 3, NULL, 5]);
mysql> select k2, array_cum_sum(k2) from array_type_table;
+-----------------------+-----------------------+
| k2                    | array_cum_sum(`k2`)   |
+-----------------------+-----------------------+
| []                    | []                    |
| [NULL]                | [NULL]                |
| [1, 2, 3, 4]          | [1, 3, 6, 10]         |
| [1, NULL, 3, NULL, 5] | [1, NULL, 4, NULL, 9] |
+-----------------------+-----------------------+

4 rows in set
Time: 0.122s
```

### keywords

ARRAY,CUM_SUM,ARRAY_CUM_SUM