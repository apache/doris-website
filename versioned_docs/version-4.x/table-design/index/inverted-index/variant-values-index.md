---
{
    "title": "VARIANT Values Index",
    "language": "en",
    "description": "Search across the values in a VARIANT column with MATCH. Create a values index, query nested JSON, and roll out the index on an existing Doris table.",
    "doc_type": "feature"
}
---

## Overview {#overview}

This feature is available starting with Doris 4.2.

Use a VARIANT values index to find a keyword anywhere in a JSON payload when the field that contains it can vary. For example, an application can record `timeout` in a log message or in an array of retry details. With a values index, a single `payload MATCH_ANY 'timeout'` query finds both.

A values index is an inverted index for the whole VARIANT column. It requires the `SNII` storage format and supports Duplicate Key and Merge-on-Write Unique Key tables. Each VARIANT column can have one values index alongside its ordinary subpath indexes.

## Quick start {#quick-start}

In a test database, use an account that can create tables, insert rows, and query them. The example uses one replica so it also runs on a single-BE test cluster.

```sql
CREATE TABLE service_events (
    id BIGINT NOT NULL,
    payload VARIANT<PROPERTIES("variant_enable_nested_group" = "false")>,
    INDEX idx_payload_values (payload) USING INVERTED
        PROPERTIES ("variant_index_scope" = "values", "parser" = "english"),
    INDEX idx_payload_paths (payload) USING INVERTED
        PROPERTIES ("parser" = "english")
) DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("inverted_index_storage_format" = "SNII", "replication_num" = "1");

INSERT INTO service_events VALUES
    (1, PARSE_TO_VARIANT('{"message":"Request timeout","labels":{"service":"checkout"}}')),
    (2, PARSE_TO_VARIANT('{"message":"Request completed","labels":{"service":"checkout"},"details":["retry","timeout"]}')),
    (3, PARSE_TO_VARIANT('{"message":"Request completed","labels":{"service":"billing"},"debugflag":true}')),
    (4, PARSE_TO_VARIANT('{"message":"Upstream timeout","labels":{"service":"billing"}}'));

SELECT id FROM service_events WHERE payload MATCH_ANY 'timeout checkout' ORDER BY id;
```

```text
id
1
2
4
```

`MATCH_ANY` finds any search term in the row. `MATCH` is an alias for `MATCH_ANY`. The second index, `idx_payload_paths`, serves the path query in the examples below.

## Options {#options}

| Setting | Where to set it | Value and effect |
| --- | --- | --- |
| `variant_index_scope` | Index property | Required for a values index. Set it to the string `values`. Omitting it creates an ordinary VARIANT inverted index for subpaths. |
| `parser` or `analyzer` | Index property | Specify a built-in parser or analyzer that tokenizes text, such as `parser = "english"`. The values index requires an explicit choice. Custom analyzer policies and `none` are unsupported. |
| `inverted_index_storage_format` | Table property | The effective format must be `SNII`. Set it explicitly when creating the table. |
| `support_phrase` | Index property | Optional Boolean string. Defaults to `false`. The values index accepts only `false`. |

Other supported tokenization settings, such as `lower_case`, follow the ordinary inverted index defaults.

## Examples {#examples}

### Require every term in the same row {#match-all}

```sql
SELECT id FROM service_events WHERE payload MATCH_ALL 'checkout timeout' ORDER BY id;
```

```text
id
1
2
```

The terms can occur in different fields or array elements. In row 2, `checkout` is in `labels.service` and `timeout` is an element of `details`.

### Limit the search to one field {#match-subpath}

```sql
SELECT id FROM service_events WHERE payload['message'] MATCH_ANY 'timeout' ORDER BY id;
```

```text
id
1
4
```

This query uses the ordinary subpath index. Row 2 has `timeout` only in `details`.

### Add a values index to an existing table {#add-to-existing-table}

Use an existing table that meets the requirements above and has no values index on the target column. To try this example, use the quick-start DDL and inserts with the name `existing_service_events` and omit `idx_payload_values` from the DDL. Your account needs the `ALTER_PRIV` privilege on the existing table, and the FE setting `enable_light_index_change` must be `true` (the default). In compute-storage decoupled mode, all existing and future partitions must use `SNII`.

```sql
SET enable_add_index_for_new_data = true;

CREATE INDEX idx_payload_values ON existing_service_events(payload) USING INVERTED
    PROPERTIES ("variant_index_scope" = "values", "parser" = "english");

SHOW ALTER TABLE COLUMN WHERE TableName = 'existing_service_events';
```

Wait until the index change job shows `FINISHED`. You can also use `ALTER TABLE ... ADD INDEX` with the same properties. New writes get the index. Queries can scan older data that lacks the physical index when scan fallback is enabled. As compaction rewrites that data together with newer writes, it can create the missing index.

```sql
SHOW INDEX FROM existing_service_events;
SELECT id FROM existing_service_events WHERE payload MATCH_ANY 'timeout' ORDER BY id;
```

`SHOW INDEX` lists `idx_payload_values` as soon as the definition is in place. With fallback enabled, the query can already find rows `1`, `2`, and `4` from before the change.

To remove the values index from the entire table, run the following command and wait for the change job to finish. Afterward, use subpath predicates in `WHERE`. A `MATCH` predicate on the whole VARIANT column requires the values index definition.

```sql
DROP INDEX idx_payload_values ON existing_service_events;
```

## Limitations {#limits}

- Apply `MATCH`, `MATCH_ANY`, or `MATCH_ALL` directly to the VARIANT column or its alias, with a constant search string. Phrase, prefix, edge, and regular expression matching are unavailable on the whole column, as is `score()`. If you specify `USING ANALYZER`, use the analyzer of the values index. For `SEARCH()`, use ordinary field indexes.
- NestedGroup, declared Decimal256 paths, `field_pattern`, and `norms = "true"` are unsupported. With a values index on the table, `BUILD INDEX` is unavailable for every index on that table. Dropping a values index is a table-wide operation.
- Legacy segments, such as those restored with a V2 or V3 index file, can use scan fallback. In compute-storage decoupled mode, future partitions must keep the `SNII` format while the table has a values index.

## Best practices {#best-practices}

- Use a values index for keyword searches across fields that can vary between rows. When the field is known, use an ordinary subpath index to restrict the search. For exact numeric predicates, use a typed comparison on the path, such as `CAST(payload['status'] AS INT) = 404`.
- Keep the type of a given path consistent across data sources, especially for Boolean flags and numeric measurements. Indexing the whole payload adds work at write time and consumes space. Index the payload when users need cross-field searches.

## FAQ {#faq}

### What does the index search? {#indexed-values}

It searches the stored scalar values inside objects and arrays, including strings, numbers, and Booleans. Numbers such as `42`, `42.0`, and `42.00` yield the same text, `42`, before tokenization. Object keys and JSON `null` contribute no terms. Values stored as date/time, binary, or UUID types also contribute no terms. Empty objects and arrays have no terms, and a SQL `NULL` value yields `NULL` for the MATCH predicate.

For example, `payload MATCH_ANY 'debugflag'` returns no rows in the quick start. To filter on that key, use a path predicate such as `CAST(payload['debugflag'] AS BOOLEAN) = TRUE`.

Search results for `true` or `false` may be inconsistent if the same path contains both Boolean and numeric values.

### Why can a query scan rows after I add the index? {#scan-fallback}

Rows written before the index change can still be in data segments without the index. Keep `enable_match_without_inverted_index` and `enable_fallback_on_missing_inverted_index` enabled (both default to `true`) to allow fallback. A scan can take longer than index lookup. To see why Doris scanned, run the query with `enable_profile = true` and `profile_level = 2`. In the [Query Profile](../../../query-acceleration/query-profile.md), look for `VariantValuesIndex` with `reason=missing_index` or `reason=legacy_storage_format`.
