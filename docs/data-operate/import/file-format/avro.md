---
{
    "title": "Avro | File Format",
    "language": "en",
    "description": "Load Avro object container files into Apache Doris with Stream Load, Broker Load, or TVFs, including setup, examples, and format restrictions.",
    "sidebar_label": "Avro",
    "keywords": ["Avro import", "Avro Stream Load", "Avro Broker Load", "Avro TVF", "Avro OCF"],
    "doc_type": "feature"
}
---

# Avro

## Overview

Doris imports complete Avro object container files (OCF). This page requires the development-version native Avro support described in [Avro file formats](../../../lakehouse/file-formats/avro.md), including upgraded FE/BE nodes and FileScannerV2. Raw Avro messages are not supported by these file-loading examples.

| Method | Use case |
| --- | --- |
| [Stream Load](../import-way/stream-load-manual.md) | Upload a complete local Avro file over HTTP. |
| [Broker Load](../import-way/broker-load-manual.md) | Asynchronously load Avro files from object storage or HDFS. |
| [INSERT INTO SELECT](../import-way/insert-into-manual.md) with a TVF | Query, filter, and transform Avro file contents before inserting. |
| COPY INTO, where available | Load complete OCF files from an already configured stage with `"file.type" = "avro"`. |

## Quick Start

Create `example.avro` using the Python example in [Avro file formats](../../../lakehouse/file-formats/avro.md#quick-start). It contains `(1, 'alpha')` and `(2, NULL)` in the fields `id` and `label`.

With an account allowed to create the database/table and load data, run:

```sql
CREATE DATABASE IF NOT EXISTS avro_example;

CREATE TABLE avro_example.example_table (
    id BIGINT,
    label STRING
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1");
```

Replace the credentials and FE address, then upload the file:

```shell
curl --location-trusted -u '<user>:<password>' \
    -H 'Expect: 100-continue' \
    -H 'format: avro' \
    -H 'columns: id,label' \
    -T example.avro \
    'http://<fe-host>:<http-port>/api/avro_example/example_table/_stream_load'
```

Check that the response reports `Status: Success`, `NumberLoadedRows: 2`, and `NumberFilteredRows: 0`. Then verify the stored rows:

```sql
SELECT id, label FROM avro_example.example_table ORDER BY id;
```

```text
+----+-------+
| id | label |
+----+-------+
|  1 | alpha |
|  2 | NULL  |
+----+-------+
```

## Parameters

| Entry point | Setting | Type | Default | Required | Effect |
| --- | --- | --- | --- | --- | --- |
| Stream Load | `format: avro` | HTTP header | `csv` | Yes for this example | Parses the uploaded complete file as Avro. |
| Broker Load | `FORMAT AS "avro"` | SQL clause | Inferred from the suffix if omitted | Explicit in this example | Selects Avro decoding. |
| TVF | `"format" = "avro"` | String property | No Avro default | Yes | Discovers the file schema for a query or insert. |
| COPY INTO | `"file.type" = "avro"` | String property | Unset | Explicit to select Avro | Requires a deployment supporting COPY INTO and an already configured stage. |

Compression is selected from the OCF header. Supported codecs are `null`, `deflate`, `snappy`, and `zstandard`; do not wrap the file in another compression format. Storage credentials, column mapping, error filtering, and transaction options follow the selected load method.

## Examples

Each example below starts with an empty destination table. If you already ran Quick Start, truncate the table before trying another method to avoid duplicate rows.

### Broker Load from S3

Upload the same `example.avro` to S3-compatible storage accessible to Doris, and replace the storage settings:

```sql
TRUNCATE TABLE avro_example.example_table;

LOAD LABEL avro_example.avro_broker_example
(
    DATA INFILE("s3://example-bucket/avro/example.avro")
    INTO TABLE example_table
    FORMAT AS "avro"
    (id, label)
)
WITH S3
(
    "AWS_ENDPOINT" = "https://s3.example.com",
    "AWS_ACCESS_KEY" = "<access-key>",
    "AWS_SECRET_KEY" = "<secret-key>",
    "AWS_REGION" = "us-east-1"
);

SHOW LOAD FROM avro_example WHERE LABEL = 'avro_broker_example';
```

Wait for `State` to become `FINISHED`, then run the verification query from Quick Start; it returns the same two rows. Use a new load label when submitting another job. For HDFS connection settings and other options, see [Broker Load](../import-way/broker-load-manual.md).

### INSERT INTO SELECT from S3 TVF

```sql
TRUNCATE TABLE avro_example.example_table;

INSERT INTO avro_example.example_table
SELECT id, label
FROM S3(
    "uri" = "s3://example-bucket/avro/example.avro",
    "s3.endpoint" = "https://s3.example.com",
    "s3.region" = "us-east-1",
    "s3.access_key" = "<access-key>",
    "s3.secret_key" = "<secret-key>",
    "format" = "avro"
);
```

After a successful insert, the verification query returns the same two rows. Use [HDFS TVF](../../../sql-manual/sql-functions/table-valued-functions/hdfs.md) instead when the file is in HDFS. A `WHERE` clause or expressions in `SELECT` can filter or transform rows before insertion.

## Limitations

* Ordinary Stream Load accepts a complete uploaded Avro file. Live `http_stream` input is unsupported; this support does not add Avro decoding to Routine Load.
* Avro writing remains unsupported. Loading Avro into a Doris internal table does not enable Avro output through OUTFILE, EXPORT, or Catalog writes.
* The root must be a record. Recursive schemas, multi-value unions, instant `timestamp-nanos`, ambiguous case-insensitive field names, and nested empty records are unsupported. See [Avro type mapping and restrictions](../../../lakehouse/file-formats/avro.md#limitations).
* Raw Kafka/Confluent Avro messages require a suitable connector and deserializer, such as [Doris Kafka Connector](../../../connection-integration/data-integration/doris-kafka-connector.md), rather than these OCF file-load examples.
* Inspect both the load status and filtered-row counts. A successful HTTP request alone does not establish that every record was loaded.

## Best practices

Use Stream Load for complete files available to a client, Broker Load for asynchronous remote batches, and TVF-based inserts when SQL transformations are needed. Query a representative file first and choose compatible destination types, particularly for binary, decimal, timestamp, and nested columns.
