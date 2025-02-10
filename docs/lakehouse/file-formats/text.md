---
{
    "title": "Text/CSV/JSON",
    "language": "zh-CN"
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

This document introduces the support for reading and writing text file formats in Doris.

## Text/CSV

* Catalog

  Supports reading Hive tables in the `org.apache.hadoop.mapred.TextInputFormat` format.

  Supports reading Hive tables in the `org.apache.hadoop.hive.serde2.OpenCSVSerde` format. (Supported from version 2.1.7)

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

* Catalog

  Supports reading Hive tables in the `org.apache.hive.hcatalog.data.JsonSerDe` format. (Supported from version 3.0.4)

* Import

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

