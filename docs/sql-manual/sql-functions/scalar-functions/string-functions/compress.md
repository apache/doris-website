---
{
    "title": "COMPRESS",
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
The COMPRESS function is used to compress strings or values into binary data. The compressed data can be decompressed using the UNCOMPRESS function.

## Syntax

```sql
COMPRESS(<uncompressed_str>)
```

## Parameters

| Parameters                | Description            |
|--------------------|---------------|
| `<uncompressed_str>` | Uncompressed raw string |

The parameter type is varchar or string

## Return Value
The return string is the same as the input <uncompressed_str> type  
The first ten digits of the returned string are the hexadecimal length of the original string, for example, 0x01000000. Followed by the compressed value.

Special case：
- <uncompressed_str> Return '0x' when input is ''

## Example

``` sql
select compress('abc');
```
```text
+----------------------------------+
| compress('abc')                  |
+----------------------------------+
| 0x03000000789C4B4C4A0600024D0127 |
+----------------------------------+
```
```
mysql> select compress('');
```
```
+--------------+
| compress('') |
+--------------+
| 0x           |
+--------------+
```