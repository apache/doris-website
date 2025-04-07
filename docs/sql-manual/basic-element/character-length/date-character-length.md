---
{
    "title": "Date Type Character Length",
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

Consistent with standard SQL, Doris requires the use of type keywords and strings to specify date character lengths. The space between the keyword and string is optional. For example:

```sql
DATE '2008-08-08'
TIMESTAMP '2008-08-08 20:08:08'
```

## Date Formats

### DATE Character Length

- Use a string separated by `-` in the format `'YYYY-MM-DD'` or `'YY-MM-DD'`. Doris also supports MySQL's non-standard separator formats, but their use is not recommended.
- As a string without separators, use the format `'YYYYMMDD'` or `'YYMMDD'` (provided the string is meaningful as a date).

### DATETIME Character Length

- Use a string separated by `-` in the format `'YYYY-MM-DD hh:mm:ss'` or `'YY-MM-DD hh:mm:ss'`. Doris also supports MySQL's non-standard separator formats, but their use is not recommended. The separator between date and time can be a space (` `) or `T`. **Unlike MySQL 8.4 and earlier versions, Doris does not support any other separators between time and date.**
- As a string without separators, use the format `'YYYYMMDDhhmmss'` or `'YYMMDDhhmmss'` (provided the string is meaningful as a date).

DATETIME character lengths can include a fractional second part with a precision up to microseconds (six digits). The fractional part should always be separated from the rest of the time with a dot (`.`); other fractional second separators are not recognized.

### Two-Digit Years

Dates containing two-digit year values are ambiguous because the century is unknown. Doris uses the following rules to interpret two-digit year values:

- Year values between 70-99 are interpreted as years 1970-1999.
- Year values between 00-69 are interpreted as years 2000-2069.

### Time Zones

DATE and DATETIME character lengths can use time zone suffixes. When using time zones, the time zone must be immediately adjacent to the previous date or time part, with no spaces in between. For example:

```sql
TIMESTAMP '2008-08-08 20:08:08+08:00'
```

The time zone formats supported by Doris are:

- Time zone offset: Format is `{+ | -}hh:mm`. For example, for UTC+8, it is `+08:00`.
- Time zone name. For example, Shanghai time zone is `Asia/Shanghai`.

### Handling of Invalid Values

When encountering values that cannot be parsed into valid date character lengths, Doris will report an error directly. For example:

```sql
SELECT date '071332'
```

Will produce the following error:

```sql
date/datetime literal [071332] is invalid
```