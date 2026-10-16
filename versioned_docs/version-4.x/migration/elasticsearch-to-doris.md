---
{
    "title": "Elasticsearch to Doris",
    "language": "en",
    "description": "Copy indexes through an ES Catalog and validate fields, document IDs, and search semantics."
}
---

Use an ES Catalog to query Elasticsearch indexes, then copy selected columns into Doris internal tables with `INSERT INTO ... SELECT`. This example is a small one-time migration and does not continuously propagate later updates or deletes. Search workloads also require separate validation of analyzers, scoring, nested objects, and query semantics.

## Prerequisites

This example uses the typeless mapping API in Elasticsearch 7.x or 8.x. Adapt index setup for other source versions and check the catalog support range.

- An accessible Elasticsearch cluster and an account that can create, write, and read the sample index. A production migration account also needs catalog metadata permissions; see [ES Catalog](../lakehouse/catalogs/es-catalog.md).
- Connectivity from every Doris FE/BE to ES, and a Doris account allowed to create catalogs/databases/tables, read external tables, and load the target.
- An empty target table. Replace connection addresses and credentials. One replica and one bucket are used only to keep the example small.

## Basic usage

### 1. Prepare the source index

Run in Elasticsearch Dev Tools or an equivalent HTTP client:

```http
PUT /migration_demo
{
  "mappings": {
    "properties": {
      "title": { "type": "keyword" }
    }
  }
}

PUT /migration_demo/_doc/one?refresh=true
{ "title": "first" }

PUT /migration_demo/_doc/two?refresh=true
{ "title": "second" }
```

Expected result: the index contains two searchable documents with IDs `one` and `two`.

### 2. Create the catalog and preserve document IDs

```sql
CREATE CATALOG migration_es PROPERTIES (
    'type' = 'es',
    'hosts' = 'http://es-host:9200',
    'user' = '<es_user>',
    'password' = '<es_password>',
    'mapping_es_id' = 'true'
);
DESC migration_es.default_db.migration_demo;

CREATE DATABASE IF NOT EXISTS migration_target;
CREATE TABLE migration_target.es_demo (
    doc_id VARCHAR(512),
    title STRING
)
DUPLICATE KEY(doc_id)
DISTRIBUTED BY HASH(doc_id) BUCKETS 1
PROPERTIES ('replication_num' = '1');

INSERT INTO migration_target.es_demo (doc_id, title)
SELECT _id, title FROM migration_es.default_db.migration_demo;

SELECT doc_id, title FROM migration_target.es_demo ORDER BY doc_id;
```

```text
+--------+--------+
| doc_id | title  |
+--------+--------+
| one    | first  |
| two    | second |
+--------+--------+
```

## Options reference

| Parameter | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `hosts` | STRING | Yes | None | ES HTTP addresses reachable from every FE/BE |
| `user` / `password` | STRING | Depends on ES authentication | Empty | Credentials when Basic authentication is enabled |
| `mapping_es_id` | boolean | No | `false` | Exposes document `_id`; enabled in this example |
| `doc_value_scan` | boolean | No | `true` | Attempts doc-values reads for supported fields |
| `nodes_discovery` | boolean | No | `true` | Discovers nodes; may need disabling in isolated networks |

See [ES Catalog](../lakehouse/catalogs/es-catalog.md) for all parameters, authentication, and array annotations.

## Types and search semantics

- The ES Catalog maps `object` and `nested` to JSON, not automatically to VARIANT. Convert explicitly and test before using a different target type.
- ES fields may contain both scalars and arrays. Configure `_meta.doris.array_fields` as documented, inspect `DESC`, and examine real samples rather than inferring the entire column from one document.
- Validate date formats, time zones, numeric ranges, and missing fields. An analyzed `text` field differs from a `keyword` field used for exact matching.
- Doris [inverted indexes](../table-design/index/inverted-index/overview.md) support full-text search, but ES DSL, scoring, nested queries, and analyzers are not automatically equivalent. Test real query results rather than mechanically replacing syntax.

## Validation and errors

During a write-free source window, compare document counts and distinct `_id` counts; both should be 2 in this example. Compare original `_source` samples with target columns, including missing values, JSON arrays, and dates.

For metadata errors, check index-read, cluster-state, and node HTTP permissions. For paging failures, check source-node connectivity and node-discovery settings. Index changes during migration can affect consistency; establish a stable snapshot or a defined write-free window. Repeating INSERT appends rows, so establish the imported ranges before resuming.

## Best practices

Verify field reads and search semantics before scaling to batches. Continuous mirrors need separately designed updates, deletes, ordering, and replay by document ID; a catalog is not a CDC task. See [Migration Overview](./overview.md) for cutover guidance.
