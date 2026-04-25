---
{
    "title": "Native",
    "language": "en",
    "description": "This document explains how to load Native format data files in Doris.It is suitable as an internal data exchange and backup format ,"
}
---

This document explains how to load Native format data files in Doris.It is suitable as an ** internal data exchange and backup format **, rather than a general-purpose file exchange format. When data is circulated only within Doris, Native should be preferred to achieve the highest efficiency.

## Supported Loading Methods

The following loading methods support Native format data:

- [Stream Load](../import-way/stream-load-manual.md)
- [Broker Load](../import-way/broker-load-manual.md)
- [INSERT INTO FROM S3 TVF](../../../sql-manual/sql-functions/table-valued-functions/s3)
- [INSERT INTO FROM HDFS TVF](../../../sql-manual/sql-functions/table-valued-functions/hdfs)

## Usage Examples

This section demonstrates the usage of Native format in different loading methods.

### Stream Load

```shell
curl --location-trusted -u <user>:<passwd> \
    -H "format: native" \
    -T example.native \
    http://<fe_host>:<fe_http_port>/api/example_db/example_table/_stream_load
```

### Broker Load

```sql
LOAD LABEL example_db.example_label
(
    DATA INFILE("s3://bucket/example.native")
    INTO TABLE example_table
    FORMAT AS "native"
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
    "path" = "s3://bucket/example.native",
    "format" = "native",
    ...
);