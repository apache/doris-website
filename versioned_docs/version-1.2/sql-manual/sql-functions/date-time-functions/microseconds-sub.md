---
{
    "title": "MICROSECONDS_SUB",
    "language": "en"
}
---

## microseconds_sub
### description
#### Syntax

`DATETIMEV2 microseconds_sub(DATETIMEV2 basetime, INT delta)`
- basetime: Base time whose type is DATETIMEV2
- delta: Microseconds to subtract from basetime
- Return type of this function is DATETIMEV2

### example
```
mysql> select now(3), microseconds_sub(now(3), 100000);
+-------------------------+----------------------------------+
| now(3)                  | microseconds_sub(now(3), 100000) |
+-------------------------+----------------------------------+
| 2023-02-25 02:03:05.174 | 2023-02-25 02:03:05.074          |
+-------------------------+----------------------------------+
```
`now(3)` returns current time as type DATETIMEV2 with precision `3`，`microseconds_sub(now(3), 100000)` means 100000 microseconds before current time

### keywords
    microseconds_sub
