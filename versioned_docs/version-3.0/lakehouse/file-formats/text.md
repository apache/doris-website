---
{
    "title": "Text/CSV/JSON",
    "language": "zh-CN"
}
---

This document introduces the support for reading and writing text file formats in Doris.

## Text/CSV

* Catalog

  Supports reading Hive tables in the `org.apache.hadoop.mapred.TextInputFormat` format.

  Support following SerDes:

  - `org.apache.hadoop.hive.serde2.lazy.LazySimpleSerDe`
  - `org.apache.hadoop.hive.serde2.OpenCSVSerde` (Since 2.1.7)
  - `org.apache.hadoop.hive.serde2.MultiDelimitSerDe` (Since 3.1.0)  

* Table Valued Function

* Import

  Import functionality supports Text/CSV formats. See the import documentation for details.

* Export

  Export functionality supports Text/CSV formats. See the export documentation for details.

### Supported Compression Formats

* uncompressed
* gzip
* deflate
* bzip2
* zstd
* lz4
* snappy
* lzo

## JSON

### Catalog

- `org.apache.hadoop.hive.serde2.JsonSerDe` (Since 3.0.4)

- `org.apache.hive.hcatalog.data.JsonSerDe` (Since 3.0.4)

  1. Supports both primitive and complex types.
  2. Does not support the `timestamp.formats` SERDEPROPERTIES.

- Hive table in [`org.openx.data.jsonserde.JsonSerDe`](https://github.com/rcongiu/Hive-JSON-Serde) (Since 3.0.6)

  1. Supports both primitive and complex types.
  2. SERDEPROPERTIES: Only [`ignore.malformed.json`](https://github.com/rcongiu/Hive-JSON-Serde?tab=readme-ov-file#importing-malformed-data) is supported and behaves the same as in this JsonSerDe. Other SERDEPROPERTIES are not effective.
  3. Does not support [`Using Arrays`](https://github.com/rcongiu/Hive-JSON-Serde?tab=readme-ov-file#using-arrays) (similar to Text/CSV format, where all column data is placed into a single array).
  4. Does not support [`Promoting a Scalar to an Array`](https://github.com/rcongiu/Hive-JSON-Serde?tab=readme-ov-file#promoting-a-scalar-to-an-array) (promoting a scalar to a single-element array).
  5. By default, Doris can correctly recognize the table schema. However, due to the lack of support for certain parameters, automatic schema recognition might fail. In this case, you can set `read_hive_json_in_one_column = true` to place the entire JSON row into the first column to ensure the original data is fully read. Users can then process it manually. This feature requires the first column's data type to be `String`.

### Import

Import functionality supports JSON formats. See the import documentation for details.

## Character Set

Currently, Doris only supports the UTF-8 character set encoding. However, some data, such as the data in Hive Text-formatted tables, may contain content encoded in non-UTF-8 encoding, which will cause reading failures and result in the following error:

```text
Only support csv data in utf8 codec
```

In this case, you can set the session variable as follows:

```text
SET enable_text_validate_utf8 = false
```

This will ignore the UTF-8 encoding check, allowing you to read this content. Note that this parameter is only used to skip the check, and non-UTF-8 encoded content will still be displayed as garbled text.

This parameter has been supported since version 3.0.4.

