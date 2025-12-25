---
{
    "title": "ORC | File Format",
    "language": "en",
    "description": "This document explains how to load ORC format data files in Doris."
}
---

# ORC

This document explains how to load ORC format data files in Doris.

## Supported Loading Methods

The following loading methods support ORC format data:

- [Stream Load](../import-way/stream-load-manual.md)
- [Broker Load](../import-way/broker-load-manual.md)
- [INSERT INTO FROM S3 TVF](../../../sql-manual/sql-functions/table-valued-functions/s3)
- [INSERT INTO FROM HDFS TVF](../../../sql-manual/sql-functions/table-valued-functions/hdfs)

## Usage Examples

This section demonstrates the usage of ORC format in different loading methods.

### Stream Load

```shell
curl --location-trusted -u <user>:<passwd> \
    -H "format: orc" \
    -T example.orc \
    http://<fe_host>:<fe_http_port>/api/example_db/example_table/_stream_load
```

### Broker Load

```sql
LOAD LABEL example_db.example_label
(
    DATA INFILE("s3://bucket/example.orc")
    INTO TABLE example_table
    FORMAT AS "orc"
)
WITH S3 
(
    ...
);
```

### TVF Load

```sql
INSERT INTO example_table
SELECT *
FROM S3
(
    "path" = "s3://bucket/example.orc",
    "format" = "orc",
    ...
);

