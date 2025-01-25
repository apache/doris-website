---
{
    "title": "NGRAM_SEARCH",
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

Calculates the N-gram similarity between two strings.

N-gram similarity is a text similarity calculation method based on N-grams (N-gram sequences). N-gram similarity ranges from 0 to 1, where a higher value indicates greater similarity between the two strings.

An N-gram is a contiguous sequence of N characters or words from a text. For example, for the string 'text', when N=2, its bi-grams are: {"te", "ex", "xt"}.

The N-gram similarity is calculated as:  
**2 * |Intersection| / (|haystack set| + |pattern set|)**  

Where |haystack set| and |pattern set| are the N-grams of `haystack` and `pattern`, respectively, and `Intersection` is the intersection of the two sets.

Note that, by definition, a similarity of 1 does not mean the two strings are identical.

## Syntax

```sql
DOUBLE ngram_search(VARCHAR haystack, VARCHAR pattern, INT gram_num)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `haystack` | The string to be checked, supports only ASCII encoding |
| `pattern`  | The string used for similarity comparison, must be a constant, supports only ASCII encoding |
| `gram_num` | The `N` in N-gram, must be a constant |

## Return Value

Returns the N-gram similarity between `haystack` and `pattern`.  
Special case: If the length of `haystack` or `pattern` is less than `gram_num`, returns 0.

## Examples

```sql
mysql> SELECT ngram_search('123456789' , '12345' , 3);
+---------------------------------------+
| ngram_search('123456789', '12345', 3) |
+---------------------------------------+
|                                   0.6 |
+---------------------------------------+

mysql> SELECT ngram_search('abababab', 'babababa', 2);
+-----------------------------------------+
| ngram_search('abababab', 'babababa', 2) |
+-----------------------------------------+
|                                       1 |
+-----------------------------------------+
```
