---
{
    "title": "Release 4.0.4",
    "language": "en",
    "description": "Here's the Apache Doris 4.0.4 release notes:"
}
---

### Features

- Enable system table all_manifests for Iceberg tables ([#60279](https://github.com/apache/doris/pull/60279))
- Support bucket-domain-name for OSS ([#59755](https://github.com/apache/doris/pull/59755))
- Support flexible partial update for routine load ([#60128](https://github.com/apache/doris/pull/60128))
- Implement expire_snapshots procedure for Iceberg tables ([#59979](https://github.com/apache/doris/pull/59979))
- Support PREVIOUS_DAY function ([#60680](https://github.com/apache/doris/pull/60680))
- Support 3 spatial functions: ST_Distance, ST_GeometryType, ST_Length ([#60170](https://github.com/apache/doris/pull/60170))
- Support more INTERVAL time-unit ([#60347](https://github.com/apache/doris/pull/60347))
- Add OzoneProperties to support Apache Ozone ([#60809](https://github.com/apache/doris/pull/60809))
- Support MaxCompute ram_role_arn and ecs_ram_role ([#60649](https://github.com/apache/doris/pull/60649))
- Support schema change for complex types in Iceberg external tables ([#60169](https://github.com/apache/doris/pull/60169))
- Support score range filter pushdown (min_score semantics) ([#60997](https://github.com/apache/doris/pull/60997))
- Support multiple tokenize index in one column ([#60415](https://github.com/apache/doris/pull/60415))
- Add x509 cert based auth framework ([#60098](https://github.com/apache/doris/pull/60098))
- Support dfs.client.use.datanode.hostname for libhdfs3 ([#59915](https://github.com/apache/doris/pull/59915))

### Improvements

- Improve password validation to align with MySQL STRONG policy ([#60188](https://github.com/apache/doris/pull/60188))
- Optimize the performance of parquet dict decoder ([#59681](https://github.com/apache/doris/pull/59681))
- Supports dynamically changing the rate limiter config ([#59465](https://github.com/apache/doris/pull/59465))
- Split metadata scan ranges per split ([#60257](https://github.com/apache/doris/pull/60257))
- Optimize Iceberg rewrite_data_files to avoid generating excessive small files ([#60063](https://github.com/apache/doris/pull/60063))
- Use COUNT_ON_INDEX on variant subcolumns ([#60404](https://github.com/apache/doris/pull/60404))
- Optimize file split size for multi-catalog ([#60637](https://github.com/apache/doris/pull/60637))
- Limit the download rate of warmup task ([#60180](https://github.com/apache/doris/pull/60180))
- Optimize performance of certain time field functions used with FROM_UNIXTIME ([#60843](https://github.com/apache/doris/pull/60843))
- Add fold constant for PREVIOUS_DAY ([#60755](https://github.com/apache/doris/pull/60755))
- Support PostgreSQL partition table sync for streaming job ([#60560](https://github.com/apache/doris/pull/60560))

### Bugfixes

- Fix crash caused by concurrent compaction accessing shared sample_infos ([#60376](https://github.com/apache/doris/pull/60376))
- Fix unnecessary conflict range in lazy commit ([#60274](https://github.com/apache/doris/pull/60274))
- Fix routine load task schedule stuck after create task fail ([#60143](https://github.com/apache/doris/pull/60143))
- Fix DELETE/UPDATE cannot resolve column when table alias uses AS keyword ([#60335](https://github.com/apache/doris/pull/60335))
- Fix boolean query AllScorer combination handling ([#60438](https://github.com/apache/doris/pull/60438))
- Fix query cache not hit when use sort and one phase aggregation ([#60298](https://github.com/apache/doris/pull/60298))
- Modify ORC reader to make error reporting more accurate ([#60234](https://github.com/apache/doris/pull/60234))
- Fix prune nested column maybe throw NullPointerException ([#60395](https://github.com/apache/doris/pull/60395))
- Fix partitions function throw error when query internal table without specifying catalog condition ([#60247](https://github.com/apache/doris/pull/60247))
- Fix backends udf return rows incompatible with show backends command ([#60210](https://github.com/apache/doris/pull/60210))
- Fix AggregateNode compute digest of query cache should consider sortByGroupKey ([#60431](https://github.com/apache/doris/pull/60431))
- Fix predicate should be pushed down when conjunct contains CAST for Variant ([#60485](https://github.com/apache/doris/pull/60485))
- Treat no such key as empty response when listing objects (part 2) for S3 ([#60286](https://github.com/apache/doris/pull/60286))
- Fix empty string MATCH on keyword index returning wrong results ([#60500](https://github.com/apache/doris/pull/60500))
- Fix PhysicalDictionarySink.resetLogicalProperties() does not reset logical properties properly ([#60495](https://github.com/apache/doris/pull/60495))
- Fix %f (microseconds) format specifier in str_to_date ([#60632](https://github.com/apache/doris/pull/60632))
- Throw exception for date_floor/ceil instead of return NULL ([#60633](https://github.com/apache/doris/pull/60633))
- Fix S3-compatible storage must support temporary credentials when vendor credentials are configured at catalog level ([#60232](https://github.com/apache/doris/pull/60232))
- Fix empty InsertIntoDictionaryCommand originSql ([#60631](https://github.com/apache/doris/pull/60631))
- Fix width_bucket did not enforce that the fourth argument must be a constant ([#60643](https://github.com/apache/doris/pull/60643))
- Validate mode parameter in search() DSL options ([#60785](https://github.com/apache/doris/pull/60785))
- Fix range search prepare failed on NULL literal for ANN ([#60564](https://github.com/apache/doris/pull/60564))
- Make dot match newline in regexp_fn by default ([#60831](https://github.com/apache/doris/pull/60831))
- Fix Azure Storage Vault endpoint always using HTTP instead of HTTPS ([#60854](https://github.com/apache/doris/pull/60854))
- Add rest external catalog for gson compatibility for Paimon ([#60917](https://github.com/apache/doris/pull/60917))
- Disable strict mode for variant internal cast to fix INSERT INTO SELECT returning all NULLs ([#60900](https://github.com/apache/doris/pull/60900))
- Default to the Default chain when S3 role_arn is set without provider_type ([#60822](https://github.com/apache/doris/pull/60822))
- Fix parquet reader lazy materialization cannot filter ([#60474](https://github.com/apache/doris/pull/60474))
- Fix point query ignoring session timezone for functions like from_unixtime ([#60913](https://github.com/apache/doris/pull/60913))
- Make AND/OR/NOT operators case-sensitive in search DSL ([#59747](https://github.com/apache/doris/pull/59747))
- Decouple min pipeline executor size from ConnectContext ([#60958](https://github.com/apache/doris/pull/60958))
- Fix Azure endpoint detection for sovereign clouds with force-global config support ([#60903](https://github.com/apache/doris/pull/60903))
- Backport search() function improvements and bug fixes ([#61028](https://github.com/apache/doris/pull/61028))
- Fix encrypt key is not case sensitive ([#60288](https://github.com/apache/doris/pull/60288))
- Make hive compress split assertion BE-aware ([#60947](https://github.com/apache/doris/pull/60947))
- Support CLIENT_DEPRECATE_EOF to fix empty result with MySQL driver 9.5.0 ([#61050](https://github.com/apache/doris/pull/61050))
- Fix basic and icu tokenizer can not be customized in custom analyzer ([#60506](https://github.com/apache/doris/pull/60506))