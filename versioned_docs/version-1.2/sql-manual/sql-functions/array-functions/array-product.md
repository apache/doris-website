---
{
    "title": "ARRAY_PRODUCT",
    "language": "en"
}
---

## array_product

array_product

### description

#### Syntax

`T array_product(ARRAY<T> arr)`

Get the product of all elements in an array (`NULL` values are skipped).
When the array is empty or all elements in the array are `NULL` values, the function returns `NULL`.

### example

```shell
mysql> create table array_type_table(k1 INT, k2 Array<int>) duplicate key (k1)
    -> distributed by hash(k1) buckets 1 properties('replication_num' = '1');
mysql> insert into array_type_table values (0, []), (1, [NULL]), (2, [1, 2, 3]), (3, [1, NULL, 3]);
mysql> select k2, array_product(k2) from array_type_table;
+--------------+---------------------+
| k2           | array_product(`k2`) |
+--------------+---------------------+
| []           |                NULL |
| [NULL]       |                NULL |
| [1, 2, 3]    |                   6 |
| [1, NULL, 3] |                   3 |
+--------------+---------------------+
4 rows in set (0.01 sec)

```

### keywords

ARRAY,PRODUCT,ARRAY_PRODUCT

