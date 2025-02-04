---
{
    "title": "Index Overview",
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

Database indexes are used to accelerate queries. To speed up different query scenarios, Doris supports various rich indexes.

## Index Types and Principles

From the perspective of accelerating queries and their principles, Doris indexes are categorized into two main types: point query indexes and skip indexes.
- **Point Query Indexes:** Commonly used to speed up point queries, the principle is to locate which rows satisfy the WHERE conditions through the index and directly read those rows. Point query indexes are very effective when the number of rows meeting the conditions is small. Doris's point query indexes include Prefix Index and Inverted Index.
  - **Prefix Index:** Doris stores data in an ordered manner according to the sort key and creates a sparse prefix index every 1024 rows. The key in the index is the value of the sorted column in the first row of the current 1024 rows. If the query involves a sorted column, the system will find the first row of the relevant 1024-row group and start scanning from there.
  - **Inverted Index:** For columns with an inverted index, an posting list is created mapping each value to a set of row ids. For equality queries, it first finds the set of row ids from the posting list, then directly reads the data of those rows, avoiding row-by-row scanning. Inverted indexes can also accelerate range filtering and fulltext search. The algorithms are more complex, but the basic principles are similar. (Note: the previous BITMAP index has been replaced by the more powerful inverted index.)
- **Skip Indexes:** Commonly used to accelerate analysis, the principle is to determine data blocks that do not satisfy the WHERE conditions through the index and skip these blocks, only reading the data blocks that may satisfy the conditions and then performing a row-by-row filter to finally get the rows that meet the conditions. Skip indexes are more effective when the number of rows meeting the conditions is large. Doris's skip indexes include ZoneMap indexes, BloomFilter indexes, and NGram BloomFilter indexes.
  - **ZoneMap Index:** Automatically maintains statistics for each column, recording the maximum, minimum, and whether there are NULL values for each data file (Segment) and data block (Page). For equality queries, range queries, and IS NULL, it can determine whether the data file and data block can contain the data that meets the conditions based on the maximum value, minimum value, and whether there are NULL values. If not, Doris skips reading the corresponding file or data block, reducing IO and accelerating queries.
  - **BloomFilter Index:** Stores values of the indexed column in a BloomFilter data structure, which can quickly determine whether a value is in the BloomFilter with very low storage space. For equality queries, if the value is not in the BloomFilter, the corresponding data file or data block can be skipped, reducing IO and accelerating queries.
  - **NGram BloomFilter Index:** Used to accelerate text LIKE queries. The principle is similar to the BloomFilter index, but instead of storing the original text values, it performs NGram tokenization of the text and stores each token in the BloomFilter. For LIKE queries, the LIKE pattern is also tokenized using NGram. If any token is not in the BloomFilter, the corresponding data file or data block does not meet the LIKE condition and can be skipped.

Among the above indexes, the prefix index and ZoneMap index are built-in indexes automatically maintained by Doris, requiring no user management. Inverted indexes, BloomFilter indexes, and NGram BloomFilter indexes need to be manually created and managed by the user based on the scenario.

- Co
- Comparison of characteristics of different types of indexes

| Type       | Index             | Advantages                                                                                                                        | Limitations                                                                                                             |
|------------|-------------------|---------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------|
| Point Query| Prefix Index      | Built-in index, best performance.<br />Only one prefix index per table.            | Only one prefix index per table.                                                                                   |
| Point Query| Inverted Index    | Supports tokenization and keyword matching.<br />Building index on any column.<br />Multi-condition combination and accelerating more functions. | Large index storage space, similar to raw data.                                                                         |
| Skip       | ZoneMap Index     | Built-in index, small index storage space.<br />Only one prefix index per table.    | Only one prefix index per table.                                                                                   |
| Skip       | BloomFilter Index | More precise than ZoneMap, medium index space.                                   | Supports few query types.<br />Only supports equal (not others: not equal, range, LIKE, MATCH).                         |
| Skip       | NGram BloomFilter | Supports LIKE acceleration, medium index space.                                  | Supports few query types.<br />Only supports LIKE acceleration.                                                         |

- List of operators and functions for index acceleration

| Operator or Function    | Prefix Index | Inverted Index  | ZoneMap Index | BloomFilter Index | NGram BloomFilter Index |
|-------------------------|---------|---------|--------------|-----------------|------------------------|
| =                       | YES     | YES     | YES          | YES             | NO                     |
| !=                      | YES     | YES     | NO           | NO              | NO                     |
| IN                      | YES     | YES     | YES          | YES             | NO                     |
| NOT IN                  | YES     | YES     | NO           | NO              | NO                     |
| >, >=, <, <=, BETWEEN   | YES     | YES     | YES          | NO              | NO                     |
| IS NULL                 | YES     | YES     | YES          | NO              | NO                     |
| IS NOT NULL             | YES     | YES     | NO           | NO              | NO                     |
| LIKE                    | NO      | NO      | NO           | NO              | YES                    |
| MATCH, MATCH_*          | NO      | YES     | NO           | NO              | NO                     |

## Index Design Guidelines

The design and optimization of database table indexes are closely related to data distribution and queries, requiring testing and optimization based on the actual scenario. Although there is no "silver bullet," Doris continuously strives to reduce the difficulty of using indexes. Users can follow these simple guidelines for index selection and testing.

1. Specify the most frequently used filter condition as the KEY to automatically create a prefix index, as it has the best filtering effect. However, only one prefix index can be created per table, so it should be used for the most frequent filter condition.
2. For non-key fields that require filter acceleration, the first choice is to create an inverted index due to its broad applicability and multi-condition combination. The second choice includes the following two indexes:
   - If there is a need for string LIKE matching, add an NGram BloomFilter index.
   - If index storage space is critical, replace the inverted index with a BloomFilter index.
3. If performance is not as expected, analyze the amount of data filtered by the index and the time consumed through QueryProfile. Refer to the detailed documentation of each index for specifics.