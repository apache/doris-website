---
{
    "title": "EXTRACT",
    "language": "en"
}
---

## extract
### description
#### Syntax

`INT extract(unit FROM DATETIME)`

Extract DATETIME The value of a specified unit. The unit can be year, day, hour, minute, or second

### Example

```
mysql> select extract(year from '2022-09-22 17:01:30') as year,
    -> extract(month from '2022-09-22 17:01:30') as month,
    -> extract(day from '2022-09-22 17:01:30') as day,
    -> extract(hour from '2022-09-22 17:01:30') as hour,
    -> extract(minute from '2022-09-22 17:01:30') as minute,
    -> extract(second from '2022-09-22 17:01:30') as second;
+------+-------+------+------+--------+--------+
| year | month | day  | hour | minute | second |
+------+-------+------+------+--------+--------+
| 2022 |     9 |   22 |   17 |      1 |     30 |
+------+-------+------+------+--------+--------+
```

### keywords

    extract
