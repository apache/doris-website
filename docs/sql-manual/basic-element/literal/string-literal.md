---
{
    "title": "String Type Literal",
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

A string is a sequence of bytes or characters enclosed in single quotes (') or double quotes ("). For example:

```sql
'a string'
"another string"
```

## Escape Characters

In strings, certain sequences have special meanings unless the NO_BACKSLASH_ESCAPES SQL mode is enabled. These sequences start with a backslash (\), which is known as an escape character. The escape characters recognized by Doris are listed in the table below:

| Escape Character | Meaning                                      |
| -------------- | ------------------------------------------- |
| `\0`         | ASCII character NUL ('X'00')              |
| `\'`         | Single quote (')                             |
| `\"`         | Double quote (")                            |
| `\b`         | Backspace                                   |
| `\n`        | Newline                                     |
| `\r`        | Carriage return                                |
| `\t`        | Tab                                         |
| `\Z`        | ASCII 26 (Control+Z)                         |
| `\\`        | Backslash (`\`)                              |
| `\%`        | Percent sign `%`. For details, see the notes below |
| `\_`        | Underscore `_`. For details, see the notes below |

**Notes**

> 1. In pattern matching contexts, `%` and `_` are usually interpreted as wildcards, but using the sequences `\%` and `\_` can search for literal instances of `%` and `_`. For more information, see the description of the LIKE operator in the "Pattern Matching Operators" section. If `\%` or `\_` are used outside of pattern contexts, they will be calculated as the string `\%` and `\_`, not as `%` and `_`.
> 2. Backslashes in escape characters not listed in the table are ignored. For example, `'\y'` and `'y' are equivalent.

## Using Quotes in String Literals

There are several ways to include quote characters in strings:

- In a string enclosed in single quotes ('), single quotes can be written as two single quotes ('').
- In a string enclosed in double quotes ("), double quotes can be written as two double quotes (").
- Add an escape character (`\`) before the quote character.
- When including a single quote in a string enclosed in double quotes, no special treatment is necessary, nor must the single quote be doubled or escaped. Similarly, when including a double quote in a string enclosed in single quotes, no special treatment is required.