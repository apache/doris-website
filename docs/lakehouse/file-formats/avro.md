---
{
    "title": "Avro | File Formats",
    "language": "en",
    "description": "Query Avro object container files in Apache Doris: examples, supported codecs and types, Hive schema rules, and native reader limitations.",
    "sidebar_label": "Avro",
    "keywords": ["Avro", "Avro OCF", "Avro TVF", "Hive Avro", "Iceberg Avro", "Avro schema evolution"],
    "doc_type": "feature"
}
---

# Avro

## Overview

Doris reads Avro **object container files (OCF)** through file table-valued functions (TVFs), file loads, Hive Catalog, and Iceberg Catalog. An OCF contains its writer schema and compression codec. Raw Avro messages and Confluent Schema Registry wire-format messages are not OCF files.

:::info Development version

This page describes native Avro support added by [apache/doris#70808](https://github.com/apache/doris/pull/70808). Use a build containing that change on **all FE and BE nodes**, and keep `enable_file_scanner_v2 = true`. Do not assume this functionality is available in an earlier release or during a partial rolling upgrade.

:::

| Entry point | Avro support |
| --- | --- |
| S3, HDFS, and Local TVFs | Read seekable OCF files with `"format" = "avro"`. |
| File loads | Broker Load, ordinary Stream Load of a complete file, `INSERT INTO ... SELECT` from a TVF, and COPY INTO where available. See [Avro import](../../data-operate/import/file-format/avro.md). |
| Hive Catalog | Detect Avro from table metadata; read ordinary and partitioned tables, subject to the schema and timestamp restrictions below. |
| Iceberg Catalog | Read Avro data, equality-delete, and position-delete files, including snapshots containing multiple file formats. |
| Paimon Catalog | Read Avro through the Paimon SDK, preserving merge and deletion semantics. The native reader's type mapping below does not describe the Paimon SDK path. |
| Writing Avro | Not supported by OUTFILE, EXPORT, or Catalog writes. |

## Quick Start

### Prepare a file

The following example requires Python 3 and `pip`. Install `fastavro` in your Python environment, then create an OCF with two records:

```shell
python3 -m pip install fastavro
python3 - <<'PY'
from fastavro import writer

schema = {
    "type": "record",
    "name": "Example",
    "namespace": "example",
    "fields": [
        {"name": "id", "type": "long"},
        {"name": "label", "type": ["null", "string"], "default": None},
    ],
}
records = [{"id": 1, "label": "alpha"}, {"id": 2, "label": None}]
with open("example.avro", "wb") as output:
    writer(output, schema, records, codec="deflate")
PY
```

Upload `example.avro` to an S3-compatible bucket accessible to the FE and BE nodes. The examples use `s3://example-bucket/avro/example.avro`; replace the path, endpoint, region, and credentials with your storage settings. Use a Doris account with the privileges required by the [S3 TVF](../../sql-manual/sql-functions/table-valued-functions/s3.md).

### Query the file

```sql
SET enable_file_scanner_v2 = true;

SELECT id, label
FROM S3(
    "uri" = "s3://example-bucket/avro/example.avro",
    "s3.endpoint" = "https://s3.example.com",
    "s3.region" = "us-east-1",
    "s3.access_key" = "<access-key>",
    "s3.secret_key" = "<secret-key>",
    "format" = "avro"
)
ORDER BY id;
```

Expected result:

```text
+----+-------+
| id | label |
+----+-------+
|  1 | alpha |
|  2 | NULL  |
+----+-------+
```

The TVF discovers column names and types from the embedded writer schema. You do not need `csv_schema`, a separate schema file, or a Schema Registry.

## Parameters

| Setting | Type | Default | Required | Effect |
| --- | --- | --- | --- | --- |
| TVF `format` | String | No Avro default | Yes | Set to `avro`. Storage and authentication properties follow the selected TVF. |
| `enable_file_scanner_v2` | Boolean session variable | `true` | Must be enabled | Selects the reader required by this page. |
| OCF `avro.codec` | File metadata | `null` if absent | No client setting | Selects the block codec automatically; do not use an outer gzip or zstd wrapper around the file. |

### Supported compression

| OCF codec | Meaning |
| --- | --- |
| `null` | Uncompressed blocks |
| `deflate` | Deflate-compressed blocks |
| `snappy` | Snappy-compressed blocks with the Avro checksum |
| `zstandard` | Zstandard-compressed blocks |

Other codecs are unsupported. Compression is read from the OCF header, independently of the filename.

### Type mapping

The following table describes native TVF schema inference. Hive and Iceberg use their Catalog schemas and type-mapping rules in addition to file decoding.

| Avro type or logical type | Doris type |
| --- | --- |
| `boolean` | `BOOLEAN` |
| `int`, `long` | `INT`, `BIGINT` |
| `float`, `double` | `FLOAT`, `DOUBLE` |
| `string`, `enum` | `STRING`; enums return their symbol text |
| `bytes`, `fixed` without a recognized logical annotation | `VARBINARY` |
| `decimal` | `DECIMAL(p,s)`, with precision at most 76; target-type limits also apply |
| `uuid` | `UUID` |
| `date` | `DATE` |
| `time-millis`, `time-micros` | `TIME(3)`, `TIME(6)` |
| `timestamp-millis`, `timestamp-micros` | `TIMESTAMPTZ(3)`, `TIMESTAMPTZ(6)`; display follows session time-zone rules |
| `local-timestamp-millis`, `local-timestamp-micros` | `DATETIME(3)`, `DATETIME(6)`; wall-clock fields are preserved |
| `local-timestamp-nanos` | `TIMESTAMP_NS` |
| `record`, `array`, `map` | `STRUCT`, `ARRAY`, `MAP`; ordinary Avro map keys are strings |
| A nullable union with one non-null branch | The corresponding nullable Doris type |
| `null` | A nullable `STRING` column containing only NULL |

Instant `timestamp-nanos` is unsupported. It is distinct from the supported wall-clock `local-timestamp-nanos` type.

## Examples

### Read from HDFS

Copy the same example file to HDFS, configure access as described in [HDFS TVF](../../sql-manual/sql-functions/table-valued-functions/hdfs.md), and replace the URI and user:

```sql
SELECT id, label
FROM HDFS(
    "uri" = "hdfs://namenode.example.com:8020/avro/example.avro",
    "fs.defaultFS" = "hdfs://namenode.example.com:8020",
    "hadoop.username" = "<hdfs-user>",
    "format" = "avro"
)
ORDER BY id;
```

This returns the same two rows as the S3 example. [Local TVF](../../sql-manual/sql-functions/table-valued-functions/local.md) also accepts `"format" = "avro"` for files on a BE node.

### Read lake tables

Configure a [Hive Catalog](../catalogs/hive-catalog.mdx) or [Iceberg Catalog](../catalogs/iceberg-catalog.mdx), and query an existing Avro-backed table using ordinary SQL. No TVF `format` property is needed for Catalog scans.

For example, if the Catalog is named `hive`, the database is `example_db`, and `example_table` contains the two example records:

```sql
SELECT id, label FROM hive.example_db.example_table ORDER BY id;
```

The result is the same two rows shown above. For Iceberg, use the Iceberg Catalog to preserve field IDs, schema evolution, and equality/position deletes. Reading an individual data file through a TVF does not apply table-level deletes. Existing v3 DELETE/MERGE operations can carry forward Avro position deletes into their normal deletion-vector output; this does not enable writing Avro files.

For [Paimon Catalog](../catalogs/paimon-catalog.mdx), Avro remains on the SDK path. Do not force a raw-file/native read to bypass Paimon's merge semantics.

## Limitations

### File and schema restrictions

* The input must be a seekable OCF whose root is a record. Live `http_stream` and raw Kafka/Confluent Avro messages are unsupported by this reader.
* Recursive records, unions with multiple non-null branches, and excessively nested schemas are unsupported.
* Sibling field names that differ only by case are rejected, including inside nested records.
* A zero-field root record can retain its row count, but a nested empty record cannot be represented as a Doris `STRUCT` and is rejected.
* Generic Avro reader-schema resolution is not supported. The Hive rules below are a restricted compatibility contract, rather than support for every Avro schema-evolution feature.

### Hive schema compatibility

* Ordinary Hive column DDL and generated-style nullable reader schemas with explicit null defaults are supported. Column matching uses field names, including reordered columns and added nullable columns; `hive_orc_use_column_names` and `hive_parquet_use_column_names` do not switch Avro to positional matching.
* An explicit `avro.schema.literal` must use the supported generated-style schema. Custom defaults, aliases, named references, and explicit record-name changes are rejected. A schema supplied only through an effective `avro.schema.url` is unsupported; Doris does not fetch that URL.
* Writer, reader, and Hive output types must be compatible. Physical narrowing, case-only field matches, changed decimal precision/scale, intermediate reader/output type differences, and bytes-to-string resolution are rejected. Hive `CHAR`/`VARCHAR` coercion is unsupported; use `STRING` where appropriate.
* Logical annotations must match. Hive timestamp reading supports `timestamp-millis`; the broader TVF timestamp mapping above must not be assumed for Hive tables.
* Hive writer time-zone and calendar metadata are honored. Legacy writer time-zone conversion is unsupported. Timestamps before 1900 without writer time-zone metadata are also unsupported. Convert these files with a compatible writer before reading them through this path.

### Error handling

| Symptom | Action |
| --- | --- |
| Invalid Avro magic or truncated container | Verify that the input is a complete OCF, not a raw message or an externally compressed file. |
| Unsupported codec or schema | Check the codec, type mapping, and Hive restrictions above; convert unsupported input before retrying. |
| Avro remains unsupported after an upgrade | Check that every FE and BE includes the change and FileScannerV2 is enabled. |

## Best practices

* Query Hive, Iceberg, and Paimon through their Catalogs when you need table-level semantics; use TVFs for standalone files and import preparation.
* Inspect the inferred schema and sample rows before loading into an existing Doris table, especially for decimals, binary values, nested values, and timestamps.
* Avro is a row-oriented format. For repeated analytical scans, consider Parquet or ORC. Very small Avro splits can add work because each split must locate its boundary from preceding block headers; do not assume smaller splits always improve performance.
