---
{
    "title": "MICROSECONDS_ADD",
    "language": "en"
}
---

## microseconds_add
### description
#### Syntax

`DATETIMEV2 microseconds_add(DATETIMEV2 basetime, INT delta)`
- basetime: Base time whose type is DATETIMEV2
- delta: Microseconds to add to basetime
- Return type of this function is DATETIMEV2

### example
```
mysql> select now(3), microseconds_add(now(3), 100000);
+-------------------------+----------------------------------+
| now(3)                  | microseconds_add(now(3), 100000) |
+-------------------------+----------------------------------+
| 2023-02-21 11:35:56.556 | 2023-02-21 11:35:56.656          |
+-------------------------+----------------------------------+
```
`now(3)` returns current time as type DATETIMEV2 with precision 3d，`microseconds_add(now(3), 100000)` means 100000 microseconds after current time

### keywords
    microseconds_add

    