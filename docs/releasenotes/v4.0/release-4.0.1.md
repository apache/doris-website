---
{
    "title": "Release 4.0.1",
    "language": "en",
    "description": "Others"
}
---

# Behavior Changes

- The SHOW PARTITIONS command no longer supports Iceberg tables. Please directly use Iceberg's $partitions system table to view partitions. [#56985](https://github.com/apache/doris/pull/56985)

# New Features

- Added the mmh64_v2 function to generate hash results consistent with those from other third-party libraries. [#57180](https://github.com/apache/doris/pull/57180)
- Added the json_hash function to generate hash values for jsonb types. [#56962](https://github.com/apache/doris/pull/56962)
- Added the binary data type, along with a series of related functions: length, from_base64_binary, to_base64_binary, and sub_binary. [#56648](https://github.com/apache/doris/pull/56648)
- Added the sort_json_object_keys/normalize_json_numbers_to_double function for sorting the keys of jsonb.
- Added several MySQL-compatible time functions: UTC_DATE, UTC_TIME, and UTC_TIMESTAMP. [#57443](https://github.com/apache/doris/pull/57443)
- Added support for MaxCompute Schema hierarchy. [#56874](https://github.com/apache/doris/pull/56874) Documentation: https://doris.apache.org/docs/3.x/lakehouse/catalogs/maxcompute-catalog#hierarchical-mapping
- The JSON_OBJECT function now supports using * as a parameter. [#57256](https://github.com/apache/doris/pull/57256)

# Improvement

## AI & Search

- Added support for phrase queries, wildcard queries, and regular expression queries to the SEARCH function. [#57372](https://github.com/apache/doris/pull/57372) [#57007](https://github.com/apache/doris/pull/57007)
- Extended the SEARCH function with 2 new parameters: an optional default_field parameter (default column) and a default_operator parameter (specifying the boolean operator for multi-column queries as "and" or "or"). [#57312](https://github.com/apache/doris/pull/57312)
- The SEARCH function now supports searching sub-columns of the variant type, allowing direct search of specific fields in JSON paths via dot notation (e.g., variantColumn.subcolumn:keyword).
- Upgraded the default storage format of the inverted index from V2 to V3. [#57140](https://github.com/apache/doris/pull/57140)
- Enhanced support for custom tokenizer pipelines by adding the char_filter component; introduced two built-in tokenizers (basic tokenizer and ICU tokenizer) in the analyzer framework; added aliases for built-in tokenizers and supported component configuration with the same name to optimize the unified analyzer framework. [#56243](https://github.com/apache/doris/pull/56243) [#57055](https://github.com/apache/doris/pull/57055)

## Lakehouse

- Added the session variable merge_io_read_slice_size_bytes to address the issue of severe read amplification in external table Merge IO under certain conditions. Documentation: https://doris.apache.org/docs/3.x/lakehouse/best-practices/optimization#merge-io-optimization

## Query

- Optimized the JOIN shuffle selection algorithm. [#56279](https://github.com/apache/doris/pull/56279)

Others

- Optimized the size of Runtime Filter serialization information in physical plans. [#57108](https://github.com/apache/doris/pull/57108) [#56978](https://github.com/apache/doris/pull/56978)

# Bugfix

## AI & Search

- Fixed the issue with search query results for non-tokenized fields and enabled the execution of the search function on MOW tables. [#56914](https://github.com/apache/doris/pull/56914) [#56927](https://github.com/apache/doris/pull/56927)
- Fixed the calculation error in the inverted index when filtering with the IS NULL predicate. [#56964](https://github.com/apache/doris/pull/56964)

## Lakehouse

- Fixed the issue where predicate pushdown could not use the Parquet Page Index under certain conditions. [#55795](https://github.com/apache/doris/pull/55795)
- Fixed the issue of missing shard reads in external table queries under certain conditions. [#57071](https://github.com/apache/doris/pull/57071)
- Fixed the issue where modifying Catalog properties did not take effect when the Hadoop file system cache was enabled under certain conditions. [#57063](https://github.com/apache/doris/pull/57063)
- Fixed the issue of metadata replay failure due to connection property validation during upgrades from older versions under certain conditions. [#56929](https://github.com/apache/doris/pull/56929)
- Fixed the issue of FE thread deadlock caused by Refresh Catalog under certain conditions. [#56639](https://github.com/apache/doris/pull/56639)
- Fixed the issue of being unable to read Iceberg tables converted from Hive. [#56918](https://github.com/apache/doris/pull/56918)
- Fixed the issue of BE crashes caused by collecting Query Profiles under certain conditions. [#56806](https://github.com/apache/doris/pull/56806)

## Query

- Fixed the incorrect result of datetime type during timezone-related cast operations under boundary conditions. [#57422](https://github.com/apache/doris/pull/57422)
- Fixed the incorrect precision derivation of results for some datetime-related functions. [#56671](https://github.com/apache/doris/pull/56671)
- Fixed the core dump issue when inf is used as a predicate condition for float types. [#57100](https://github.com/apache/doris/pull/57100)
- Fixed the core dump issue of the explode function with variable parameters. [#56991](https://github.com/apache/doris/pull/56991)
- Fixed the instability issue when casting decimal256 to float types. [#56848](https://github.com/apache/doris/pull/56848)
- Fixed the potential core dump issue caused by repeated scheduling during spill disk operations. [#56755](https://github.com/apache/doris/pull/56755)
- Fixed the occasional incorrect adjustment of the order between mark join and other joins. [#56837](https://github.com/apache/doris/pull/56837)
- Fixed the issue where some commands were not correctly forwarded to the master frontend for execution. [#55185](https://github.com/apache/doris/pull/55185)
- Fixed the occasional incorrect generation of partition topn by window functions. [#56622](https://github.com/apache/doris/pull/56622)
- Fixed the potential query error when synchronized mv definitions contain keywords. [#57052](https://github.com/apache/doris/pull/57052)

## Others

- Prohibited creating another synchronized mv based on a synchronized mv. [#56912](https://github.com/apache/doris/pull/56912)
- Fixed the issue of delayed memory release in profiles. [#57257](https://github.com/apache/doris/pull/57257)