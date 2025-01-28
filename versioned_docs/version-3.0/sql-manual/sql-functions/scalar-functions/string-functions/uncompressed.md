---
{
    "title": "UNCOMPRESS",
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
The UNCOMPRESS function is used to extract binary data into a string or value, and the binary data needs to be the result of 'COMPRESS'

## Syntax

```sql
UNCOMPRESS(<compressed_str>)
```

## Parameters

| Parameters                | Description   |
|--------------------|---------------|
| `<compressed_str>` | Compressed binary data |

The parameter type is varchar or string

## Return Value
The return value is the same as the input <compressed> type

Special cases:
- <compressed> Returns NULL if the binary data is not compressed.


## Example

``` sql
select uncompress(compress('abc'));
```
```text 
+-----------------------------+
| uncompress(compress('abc')) |
+-----------------------------+
| abc                         |
+-----------------------------+
```
```sql
select uncompress('0x03000000789C4B4C4A0600024D019');
```
```text 
+-----------------------------------------------+
| uncompress('0x03000000789C4B4C4A0600024D019') |
+-----------------------------------------------+
| NULL                                          |
+-----------------------------------------------+
```
`0x03000000789c4b4c4a0600024d019` is `compress('abc')` has carried on the tiny changes, it is illegal.
```sql
select uncompress(compress(''));
```
```text 
+--------------------------+
| uncompress(compress('')) |
+--------------------------+
|                          |
+--------------------------+
```