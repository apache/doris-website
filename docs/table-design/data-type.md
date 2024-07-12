---
{
    "title": "Data Types",
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

Apache Doris support standard SQL syntax, using MySQL Network Connection Protocol, highly compatible with MySQL syntax protocol. Therefore, in terms of data type support, Apache Doris aligns as closely as possible with MySQL-related data types

The list of data types supported by Doris is as follows:

| Type name      | Storeage (bytes)| Description                                                  |
| -------------- | --------------- | ------------------------------------------------------------ |
| BOOLEAN        | 1               | Boolean data type hat stores only two types of values , 0 represents false, 1 represents true. |
| TINYINT        | 1               | Integer value, signed range is from -128 to 127.             |
| SMALLINT       | 2               | Integer value, signed range is from -32768, 32767.           |
| INT            | 4               | Integer value, signed range from -2147483648 to 2147483647.  |
| BIGINT         | 8               | Integer value, signed range from -9223372036854775808 to 9223372036854775807. |
| LARGEINT       | 16              | Integer value, range [-2 ^ 127 + 1~ 2 ^ 127 - 1].            |
| FLOAT          | 4               | Single precision, a floating ponit number, range [-3.4 * 10 ^ 38~ 3.4 * 10 ^ 38]. |
| DOUBLE         | 8               | Double precision, a floating ponit number, range [-1.79 * 10 ^ 308~ 1.79 * 10 ^ 308] |
| DECIMAL        | 4/8/16          | An exact fixed-point number, defined by its precision (total number of digits) and scale (number of digits to the right of the decimal point).    Format:DECIMAL(M[,D]), M stands for precision, D stands scale.  The range for the significant digits M is [1, 38], while the range for the decimal digits D is [0, precision]. The storage requirements for different precision values are as follows:  - When 0 < precision <= 9, it occupies 4 bytes. - When 9 < precision <= 18, it occupies 8 bytes. - When 16 < precision <=38, it occupies 16 bytes |
| DATE           | 16              | DATE holds values for a calendar year, month and day, the  supported range is ['0000-01-01', '9999-12-31'].  Default print format: 'yyyy-MM-dd'. |
| DATETIME       | 16              | A DATE and TIME combination  Format: DATETIME ([P]).   The optional parameter P represents time precision, with a value range of [0,6], supporting up to 6 decimal places (microseconds). When not set, it is 0.   The supported range is ['0000-01-01 00:00:00 [.000000]', '9999-12-31 23:59:59 [.999999]'].   Default print format: 'yyy-MM-dd HH: mm: ss. SSSSSS '. |
| CHAR           | M               | A FIXED length string, the parameter M specifies the column length in characters. The range of M is from 1 to 255. |
| VARCHAR        | Variable Length | A VARIABLE length string , the parameter M specifies the maximum string length in characters. The range of M is from 1 to 65533.   The variable-length string is stored in UTF-8 encoding. English characters occupy 1 byte, and Chinese characters occupy 3 bytes. |
| STRING         | Variable Length | A VARIABLE length string, default supports 1048576 bytes (1 MB), and a limit of maximum precision of 2147483643 bytes (2 GB).   Size can be configured string_type_length_soft_limit_bytes adjusted through BE.   String type can only be used in value column, not in key column and partition bucket column. |
| ARRAY          | Variable Length | Arrays composed of elements of type T cannot be used as key columns. Currently supported for use in tables with Duplicate and Unique models. |
| MAP            | Variable Length | Maps consisting of elements of type K and V, cannot be used as Key columns. These maps are currently supported in tables using the Duplicate and Unique models. |
| STRUCT         | Variable Length | A structure composed of multiple Fields can also be understood as a collection of multiple columns. It cannot be used as a Key. Currently, STRUCT can only be used in tables of Duplicate models. The name and number of Fields in a Struct are fixed and are always Nullable.|
| JSON           | Variable Length | Binary JSON type, stored in binary JSON format, access internal JSON fields through JSON function.   Supported up to 1048576 bytes (1MB) by default, and can be adjusted to a maximum of 2147483643 bytes (2GB). This limit can be modified through the BE configuration parameter 'jsonb_type_length_soft_limit_bytes'. |
| VARIANT        | Variable Length | The VARIANT data type is dynamically adaptable, specifically designed for semi-structured data like JSON. It can store any JSON object and automatically splits JSON fields into subcolumns for improved storage efficiency and query performance. The length limits and configuration methods are the same as for the STRING type. However, the VARIANT type can only be used in value columns and cannot be used in key columns or partition / bucket columns. |
| HLL            | Variable Length | HLL stands for HyperLogLog, is a fuzzy deduplication. It performs better than Count Distinct when dealing with large datasets.   The error rate of HLL is typically around 1%, and sometimes it can reach 2%. HLL cannot be used as a key column, and the aggregation type is HLL_UNION when creating a table.  Users do not need to specify the length or default value as it is internally controlled based on the aggregation level of the data.  HLL columns can only be queried or used through the companion functions such as hll_union_agg, hll_raw_agg, hll_cardinality, and hll_hash. |
| BITMAP         | Variable Length | BITMAP type can be used in Aggregate tables, Unique tables or Duplicate tables.  - When used in a Unique table or a Duplicate table, BITMAP must be employed as non-key columns.  - When used in an Aggregate table, BITMAP must also serve as non-key columns, and the aggregation type must be set to BITMAP_UNION during table creation.  Users do not need to specify the length or default value as it is internally controlled based on the aggregation level of the data. BITMAP columns can only be queried or used through the companion functions such as bitmap_union_count, bitmap_union, bitmap_hash, and bitmap_hash64. |
| QUANTILE_STATE | Variable Length | A type used to calculate approximate quantile values.  When loading, it performs pre-aggregation for the same keys with different values. When the number of values does not exceed 2048, it records all data in detail. When the number of values is greater than 2048, it employs the TDigest algorithm to aggregate (cluster) the data and store the centroid points after clustering.   QUANTILE_STATE cannot be used as a key column and should be paired with the aggregation type QUANTILE_UNION when creating a table. Users do not need to specify the length or default value as it is internally controlled based on the aggregation level of the data.   QUANTILE_STATE columns can only be queried or used through the companion functions such as QUANTILE_PERCENT, QUANTILE_UNION, and TO_QUANTILE_STATE. |
| AGG_STATE      | Variable Length | Aggregate function can only be used with state/merge/union function combiners.   AGG_STATE cannot be used as a key column. When creating a table, the signature of the aggregate function needs to be declared alongside.   Users do not need to specify the length or default value. The actual data storage size depends on the function's implementation. |

You can also view all the data types supported by Doris with the `SHOW DATA TYPES; `statement.
