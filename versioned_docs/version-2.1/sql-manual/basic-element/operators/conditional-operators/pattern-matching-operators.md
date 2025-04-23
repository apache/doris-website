---
{
    "title": "Pattern Matching Operators",
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

Pattern matching operators are used to compare character-type data.

## Operator Introduction

| Operator | Function | Example |
| ----------------------------------- | ------------------------------------------------------------ | --------------------------- |
| `<char1> [NOT] LIKE <char2>` | If `<char1>` does not match the pattern `<char2>`, it is TRUE. In `<char2>`, the character `%` matches any zero or multiple characters (except for an empty string). The character `_` matches any single character. If there is an escape character before the wildcard character, it is treated as a literal character. | `SELECT 'ABCD' LIKE '%C_'` |
| `<char1> [NOT] {REGEXP \| RLIKE} <char2>` | If `<char1>` does not match the pattern `<char2>`, it is TRUE. For the specific rules of regular expressions, please refer to the subsequent REGEXP section. | `SELECT 'ABCD' REGEXP 'A.*D'` |

### LIKE

The LIKE condition specifies a test involving pattern matching. The equality comparison operator (`=`) precisely matches one character value to another character value, while the LIKE condition matches a part of one character value with another character value by searching for the pattern specified in the second value within the first value.

The syntax is as follows:

```sql
<char1> [ NOT ] LIKE <char2>
```

Where:

- `char1` is a character expression (such as a character column), known as the search value.
- `char2` is a character expression, usually a string literal, known as the pattern.

Both character expressions (`char1`, `char2`) can be any of CHAR, VARCHAR, or STRING data types. If they are different, Doris will convert them all to VARCHAR or STRING.

Patterns can include special pattern matching characters:

- The underscore (`_`) in the pattern matches exactly one character in the value.
- The percent sign (`%`) in the pattern can match zero or multiple characters in the value. The pattern `%` cannot match NULL.

### REGEXP (RLIKE)

REGEXP is similar to the LIKE condition, differing in that REGEXP performs regular expression matching, rather than the simple pattern matching performed by LIKE. This condition uses a set of input characters defined by a character to evaluate strings.

The syntax is as follows:

```sql
<char1> [ NOT ] { REGEXP | RLIKE } <char2>
```

Where:

- `char1` is a character expression (such as a character column), known as the search value.
- `char2` is a character expression, usually a string literal, known as the pattern.

Both character expressions (`char1`, `char2`) can be any of CHAR, VARCHAR, or STRING data types. If they are different, Doris will convert them all to VARCHAR or STRING.