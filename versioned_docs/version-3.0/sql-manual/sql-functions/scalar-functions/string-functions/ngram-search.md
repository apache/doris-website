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

Calculate the N-gram similarity between `text` and `pattern`. The similarity ranges from 0 to 1, where a higher similarity indicates greater similarity between the two strings. 

Both `pattern` and `gram_num` must be constants. If the length of either `text` or `pattern` is less than `gram_num`, return 0.

N-gram similarity is a method for calculating text similarity based on N-grams. An N-gram is a set of continuous N characters or words extracted from a text string. For example, for the string "text" with N=2 (bigram), the bigrams are: {"te", "ex", "xt"}.

The N-gram similarity is calculated as:

2 * |Intersection| / (|text set| + |pattern set|)

where |text set| and |pattern set| are the N-grams of `text` and `pattern`, and `Intersection` is the intersection of the two sets.

Note that, by definition, a similarity of 1 does not necessarily mean the two strings are identical.

Only supports ASCII encoding.

## Syntax

`DOUBLE ngram_search(VARCHAR text,VARCHAR pattern,INT gram_num)`

## Example

```sql
mysql> select ngram_search('123456789' , '12345' , 3);
+---------------------------------------+
| ngram_search('123456789', '12345', 3) |
+---------------------------------------+
|                                   0.6 |
+---------------------------------------+

mysql> select ngram_search("abababab","babababa",2);
+-----------------------------------------+
| ngram_search('abababab', 'babababa', 2) |
+-----------------------------------------+
|                                       1 |
+-----------------------------------------+
```
## keywords
    NGRAM_SEARCH,NGRAM,SEARCH
