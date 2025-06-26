---
{
    "title": "BITMAP_UNION",
    "language": "en"
}
---

## bitmap_union function

### description

Aggregate function, used to calculate the grouped bitmap union. Common usage scenarios such as: calculating PV, UV.

#### Syntax

`BITMAP BITMAP_UNION(BITMAP value)`

Enter a set of bitmap values, find the union of this set of bitmap values, and return.

### example

```
mysql> select page_id, bitmap_union(user_id) from table group by page_id;
```

Combined with the bitmap_count function, the PV data of the web page can be obtained

```
mysql> select page_id, bitmap_count(bitmap_union(user_id)) from table group by page_id;
```

When the user_id field is int, the above query semantics is equivalent to

```
mysql> select page_id, count(distinct user_id) from table group by page_id;
```

### keywords

    BITMAP_UNION, BITMAP
