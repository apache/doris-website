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
| `<uncompressed_str>` | Uncompressed raw string, parameter type is varchar or string   |


## Return Value

The return string is of the same type as the input `uncompressed_str`  

The return string is an unreadable compressed byte stream.  
Special cases:
- `uncompressed_str` Return empty string(`''`) when the input is empty string(`''`)

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
select compress('');
```
```text 
+--------------+
| compress('') |
+--------------+
|              |
+--------------+
```