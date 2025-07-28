---
{
    "title": "TIME_TO_SEC",
    "language": "en"
}
---

## time_to_sec
### description
#### Syntax

`INT time_to_sec(TIME datetime)`

input parameter is the time type
Convert the specified time value to seconds, returned result is: hours × 3600+ minutes×60 + seconds.

### example

```
mysql >select current_time(),time_to_sec(current_time());
+----------------+-----------------------------+
| current_time() | time_to_sec(current_time()) |
+----------------+-----------------------------+
| 16:32:18       |                       59538 |
+----------------+-----------------------------+
1 row in set (0.01 sec)
```
### keywords
    TIME_TO_SEC
