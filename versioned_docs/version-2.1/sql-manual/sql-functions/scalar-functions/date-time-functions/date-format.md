---
{
    "title": "DATE_FORMAT",
    "language": "en"
}
---

<!-- 
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

## Description

Convert the date type to a bit string according to the format type.

## Syntax

```sql
DATE_FORMAT(<date>, <format>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<date>` | A valid date value |
| `<format>` | Specifies the output format for the date/time |


The formats available are:

| Format  | Description                                                          |
|---------|----------------------------------------------------------------------|
| %a      | Abbreviation for Sunday Name                                          |
| %b      | Abbreviated Monthly Name                                              |
| %c      | Month, numerical value                                                |
| %D      | Sky in the Moon with English Prefix                                    |
| %d      | Monthly day, numerical value (00-31)                                  |
| %e      | Monthly day, numerical value (0-31)                                   |
| %f      | Microseconds                                                          |
| %H      | Hours (00-23)                                                         |
| %h      | Hour (01-12)                                                          |
| %I      | Hours (01-12)                                                         |
| %i      | Minutes, numerical value (00-59)                                      |
| %j      | Days of Year (001-366)                                                |
| %k      | Hours (0-23)                                                          |
| %l      | Hours (1-12)                                                          |
| %M      | Moon Name                                                            |
| %m      | Month, numerical value (00-12)                                        |
| %p      | AM or PM                                                              |
| %r      | Time, 12-hour (hh:mm:ss AM or PM)                                     |
| %S      | Seconds (00-59)                                                       |
| %s      | Seconds (00-59)                                                       |
| %T      | Time, 24-hour (hh:mm:ss)                                              |
| %U      | Week (00-53) Sunday is the first day of the week                      |
| %u      | Week (00-53) Monday is the first day of the week                      |
| %V      | Week (01-53) Sunday is the first day of the week, and %X is used     |
| %v      | Week (01-53) Monday is the first day of the week, and %x is used     |
| %W      | Sunday                                                                |
| %w      | Weekly day (0 = Sunday, 6 = Saturday)                                 |
| %X      | Year, where Sunday is the first day of the week, 4 digits, and %V used|
| %x      | Year, where Monday is the first day of the week, 4 digits, and %V used|
| %Y      | Year, 4 digits                                                        |
| %y      | Year, 2 digits                                                        |
| %%      | Represent %                                                           |

Also support 3 formats:
```text
yyyyMMdd
yyyy-MM-dd
yyyy-MM-dd HH:mm:ss
```

## Return Value

The formatted date string, with the following special case:
- Currently, a maximum of 128 bytes of string is supported. If the returned value exceeds 128 bytes, it will return NULL.

## Examples

```sql
select date_format('2009-10-04 22:23:00', '%W %M %Y');
```

```text
+------------------------------------------------+
| date_format('2009-10-04 22:23:00', '%W %M %Y') |
+------------------------------------------------+
| Sunday October 2009                            |
+------------------------------------------------+
```

```sql
select date_format('2007-10-04 22:23:00', '%H:%i:%s');
```

```text
+------------------------------------------------+
| date_format('2007-10-04 22:23:00', '%H:%i:%s') |
+------------------------------------------------+
| 22:23:00                                       |
+------------------------------------------------+
```

```sql
select date_format('1900-10-04 22:23:00', '%D %y %a %d %m %b %j');
```

```text
+------------------------------------------------------------+
| date_format('1900-10-04 22:23:00', '%D %y %a %d %m %b %j') |
+------------------------------------------------------------+
| 4th 00 Thu 04 10 Oct 277                                   |
+------------------------------------------------------------+
```

```sql
select date_format('1997-10-04 22:23:00', '%H %k %I %r %T %S %w');
```

```text
+------------------------------------------------------------+
| date_format('1997-10-04 22:23:00', '%H %k %I %r %T %S %w') |
+------------------------------------------------------------+
| 22 22 10 10:23:00 PM 22:23:00 00 6                         |
+------------------------------------------------------------+
```

```sql
select date_format('1999-01-01 00:00:00', '%X %V'); 
```

```text
+---------------------------------------------+
| date_format('1999-01-01 00:00:00', '%X %V') |
+---------------------------------------------+
| 1998 52                                     |
+---------------------------------------------+
```

```sql
select date_format('2006-06-01', '%d');
```

```text
+------------------------------------------+
| date_format('2006-06-01 00:00:00', '%d') |
+------------------------------------------+
| 01                                       |
+------------------------------------------+
```

```sql
select date_format('2006-06-01', '%%%d');
```

```text
+--------------------------------------------+
| date_format('2006-06-01 00:00:00', '%%%d') |
+--------------------------------------------+
| %01                                        |
+--------------------------------------------+
```