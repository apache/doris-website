---
{
    "title": "Data Types",
    "language": "en",
    "description": "The list of data types supported by Apache Doris is as follows:"
}
---

The list of data types supported by Apache Doris is as follows:

### [Numeric Types](../sql-manual/basic-element/sql-data-types/data-type-overview#numeric-types)


| Type Name      | Storage Size (Bytes) | Description                                                  |
| -------------- | --------- | ------------------------------------------------------------ |
| [BOOLEAN](../sql-manual/basic-element/sql-data-types/numeric/BOOLEAN)        | 1         | Boolean value. 0 represents false, 1 represents true.        |
| [TINYINT](../sql-manual/basic-element/sql-data-types/numeric/TINYINT)        | 1         | Signed integer, range [-128, 127].                           |
| [SMALLINT](../sql-manual/basic-element/sql-data-types/numeric/SMALLINT)       | 2         | Signed integer, range [-32768, 32767].                       |
| [INT](../sql-manual/basic-element/sql-data-types/numeric/INT)            | 4         | Signed integer, range [-2147483648, 2147483647].             |
| [BIGINT](../sql-manual/basic-element/sql-data-types/numeric/BIGINT)         | 8         | Signed integer, range [-9223372036854775808, 9223372036854775807]. |
| [LARGEINT](../sql-manual/basic-element/sql-data-types/numeric/LARGEINT)       | 16        | Signed integer, range [-2^127 + 1 ~ 2^127 - 1].              |
| [FLOAT](../sql-manual/basic-element/sql-data-types/numeric/FLOATING-POINT)          | 4         | Floating-point number, range [-3.4*10^38 ~ 3.4*10^38].       |
| [DOUBLE](../sql-manual/basic-element/sql-data-types/numeric/FLOATING-POINT)         | 8         | Floating-point number, range [-1.79*10^308 ~ 1.79*10^308].   |
| [DECIMAL](../sql-manual/basic-element/sql-data-types/numeric/DECIMAL)        | 4/8/16/32    | High-precision fixed-point number. Format: DECIMAL(P[,S]). P represents the total number of significant digits (precision), and S represents the number of digits after the decimal point (scale). The range of P is [1, MAX_P]. When `enable_decimal256`=false, MAX_P=38; when `enable_decimal256`=true, MAX_P=76. The range of S is [0, P].<br>The default value of `enable_decimal256` is false. Setting it to true yields more precise results but incurs some performance overhead.<br>Storage size:<ul><li>When 0 < precision <= 9, occupies 4 bytes.<li>When 9 < precision <= 18, occupies 8 bytes.<li>When 16 < precision <= 38, occupies 16 bytes.<li>When 38 < precision <= 76, occupies 32 bytes.<ul>|

### [Date Types](../sql-manual/basic-element/sql-data-types/data-type-overview#date-types)

| Type Name             | Storage Size (Bytes) | Description                                                                                |  
| --------------------- | ---------------- | ------------------------------------------------------------------------------------------ |  
| [DATE](../sql-manual/basic-element/sql-data-types/date-time/DATE)         | 4               | Date type. The current value range is ['0000-01-01', '9999-12-31'], and the default print format is 'yyyy-MM-dd'.         |  
| [DATETIME](../sql-manual/basic-element/sql-data-types/date-time/DATETIME) | 8               | Date and time type. Format: DATETIME([P]). The optional parameter P represents the time precision, with a value range of [0, 6], meaning up to 6 decimal digits (microseconds) are supported. The default value when not set is 0.<br />The value range is ['0000-01-01 00:00:00[.000000]', '9999-12-31 23:59:59[.999999]']. The print format is 'yyyy-MM-dd HH:mm:ss.SSSSSS'. |

### [String Types](../sql-manual/basic-element/sql-data-types/data-type-overview#string-types)

| Type Name      | Storage Size (Bytes) | Description                                                  |
| -------------- | --------- | ------------------------------------------------------------ |
| [CHAR](../sql-manual/basic-element/sql-data-types/string-type/CHAR)           | M         | Fixed-length string. M represents the byte length of the fixed-length string. The range of M is 1-255. |
| [VARCHAR](../sql-manual/basic-element/sql-data-types/string-type/VARCHAR)        | Variable     | Variable-length string. M represents the byte length of the variable-length string. The range of M is 1-65533. Variable-length strings are stored in UTF-8 encoding, so an English character typically occupies 1 byte, while a Chinese character occupies 3 bytes. |
| [STRING](../sql-manual/basic-element/sql-data-types/string-type/STRING)         | Variable     | Variable-length string. By default supports 1048576 bytes (1MB), and can be increased up to 2147483643 bytes (2GB). It can be adjusted via the BE configuration `string_type_length_soft_limit_bytes`. The String type can only be used in Value columns, not in Key columns or partition/bucketing columns. |

### [Semi-Structured Types](../sql-manual/basic-element/sql-data-types/data-type-overview#semi-structured-types)
| Type Name      | Storage Size (Bytes) | Description                                                  |
| -------------- | --------- | ------------------------------------------------------------ |
| [ARRAY](../sql-manual/basic-element/sql-data-types/semi-structured/ARRAY)          | Variable     | An array composed of elements of type T. It cannot be used as a Key column. Currently supported in tables of the Duplicate and Unique models. |
| [MAP](../sql-manual/basic-element/sql-data-types/semi-structured/MAP)            | Variable     | A map composed of elements of types K and V. It cannot be used as a Key column. Currently supported in tables of the Duplicate and Unique models. |
| [STRUCT](../sql-manual/basic-element/sql-data-types/semi-structured/STRUCT)         | Variable	    | A struct composed of multiple Fields, which can also be understood as a collection of multiple columns. It cannot be used as a Key. Currently, STRUCT is only supported in tables of the Duplicate model. The names and number of Fields in a Struct are fixed and are always Nullable.|
| [JSON](../sql-manual/basic-element/sql-data-types/semi-structured/JSON)           | Variable     | Binary JSON type. It is stored in binary JSON format, and JSON internal fields are accessed via JSON functions. The length limit and configuration method are the same as for String. |
| [VARIANT](../sql-manual/basic-element/sql-data-types/semi-structured/VARIANT)        | Variable     | Dynamically variable data type, designed for semi-structured data such as JSON. It can store any JSON, automatically splitting fields in the JSON into sub-columns for storage to improve storage efficiency and query analysis performance. The length limit and configuration method are the same as for String. The Variant type can only be used in Value columns, not in Key columns or partition/bucketing columns.|

### [Aggregate Types](../sql-manual/basic-element/sql-data-types/data-type-overview#aggregate-types)

| Type Name      | Storage Size (Bytes) | Description                                                  |
| -------------- | --------- | ------------------------------------------------------------ |
| [HLL](../sql-manual/basic-element/sql-data-types/aggregate/HLL)            | Variable     | HLL is approximate deduplication. When the data volume is large, its performance is better than Count Distinct. The error of HLL is typically around 1%, and sometimes reaches 2%. HLL cannot be used as a Key column, and the aggregation type HLL_UNION must be specified when creating the table. Users do not need to specify the length and default value. The length is internally controlled by the system based on the aggregation degree of the data. HLL columns can only be queried or used through the corresponding `hll_union_agg`, `hll_raw_agg`, `hll_cardinality`, and `hll_hash` functions.|
| [BITMAP](../sql-manual/basic-element/sql-data-types/aggregate/BITMAP)         | Variable     | Columns of the Bitmap type can be used in Aggregate tables, Unique tables, or Duplicate tables. When used in Unique tables or Duplicate tables, they must be used as non-Key columns. When used in Aggregate tables, they must be used as non-Key columns, and the aggregation type BITMAP_UNION must be specified when creating the table. Users do not need to specify the length and default value. The length is internally controlled by the system based on the aggregation degree of the data. BITMAP columns can only be queried or used through the corresponding `bitmap_union_count`, `bitmap_union`, `bitmap_hash`, `bitmap_hash64`, and other functions. |
| [QUANTILE_STATE](../sql-manual/basic-element/sql-data-types/aggregate/QUANTILE-STATE) | Variable     | QUANTILE_STATE is a type used for computing approximate quantile values. During ingestion, it pre-aggregates different Values for the same Key. When the number of values does not exceed 2048, it records all data in detail. When the number of values exceeds 2048, it uses the TDigest algorithm to aggregate (cluster) the data and stores the centroids after clustering. QUANTILE_STATE cannot be used as a Key column, and the aggregation type QUANTILE_UNION must be specified when creating the table. Users do not need to specify the length and default value. The length is internally controlled by the system based on the aggregation degree of the data. QUANTILE_STATE columns can only be queried or used through the corresponding `QUANTILE_PERCENT`, `QUANTILE_UNION`, `TO_QUANTILE_STATE`, and other functions. |
| [AGG_STATE](../sql-manual/basic-element/sql-data-types/aggregate/AGG-STATE)      | Variable     | Aggregate function. It can only be used together with the state/merge/union function combinators. AGG_STATE cannot be used as a Key column, and the signature of the aggregate function must be declared at the same time when creating the table. Users do not need to specify the length and default value. The actual size of stored data depends on the function implementation. |

### [IP Types](../sql-manual/basic-element/sql-data-types/data-type-overview#ip-types)
| Type Name      | Storage Size (Bytes) | Description                                                  |
| -------------- | --------- | ------------------------------------------------------------ |
| [IPv4](../sql-manual/basic-element/sql-data-types/ip/IPV4)            |   4 bytes  |  Stores an IPv4 address as 4 bytes of binary data, used together with the `ipv4_*` family of functions.         |
| [IPv6](../sql-manual/basic-element/sql-data-types/ip/IPV6)            |   16 bytes  |  Stores an IPv6 address as 16 bytes of binary data, used together with the `ipv6_*` family of functions.      |

You can also view all data types supported by Apache Doris through the `SHOW DATA TYPES;` statement.
