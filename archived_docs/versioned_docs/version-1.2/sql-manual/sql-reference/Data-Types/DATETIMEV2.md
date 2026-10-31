---
{
    "title": "DATETIMEV2",
    "language": "en"
}
---

## DATETIMEV2

DATETIMEV2

### Description
DATETIMEV2([P])
Date and time type.
The optional parameter P indicates the time precision and the value range is [0, 6], that is, it supports up to 6 decimal places (microseconds). 0 when not set.
Value range is ['0000-01-01 00:00:00[.000000]','9999-12-31 23:59:59[.999999]'].
The form of printing is 'yyyy-MM-dd HH:mm:ss.SSSSSS'

### note

Compared with the DATETIME type, DATETIMEV2 is more efficient and supports a time precision of up to microseconds.

### keywords
DATETIMEV2
