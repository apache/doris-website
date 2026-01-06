---
{
    "title": "Release 3.1.1",
    "language": "en",
    "description": "Apache Doris 3.1.1 is a maintenance release that focuses on critical bug fixes, performance optimizations, and stability improvements."
}
---

## Overview

Apache Doris 3.1.1 is a maintenance release that focuses on critical bug fixes, performance optimizations, and stability improvements. This release includes numerous fixes for compaction, loading, query processing, and cloud functionality, making it more robust for production environments.

## New Features

### Core Features

- **`[feature](function)`** Support count_substrings functions ([#42055](https://github.com/apache/doris/pull/42055), [#55847](https://github.com/apache/doris/pull/55847))


### Data Integration & Storage

- **`[feat](hdfs)`** Add HDFS HA Configuration Validation ([#55675](https://github.com/apache/doris/pull/55675), [#55764](https://github.com/apache/doris/pull/55764))
- **`[feat](checker)`** Add tablet stats key consistency checking for checker ([#54754](https://github.com/apache/doris/pull/54754), [#55663](https://github.com/apache/doris/pull/55663))
- **`[feat](outfile)`** Support compression type for CSV format in outfile and export ([#55392](https://github.com/apache/doris/pull/55392), [#55561](https://github.com/apache/doris/pull/55561))
- **`[feat](cloud)`** Support cloud group commit stream load BE forward mode ([#55326](https://github.com/apache/doris/pull/55326), [#55527](https://github.com/apache/doris/pull/55527))


### Performance & Optimization

- **`[support](orc)`** Support ORC file meta cache ([#54591](https://github.com/apache/doris/pull/54591), [#55584](https://github.com/apache/doris/pull/55584))
- **`[Exec](vec)`** Support SIMD cal KNN distance ([#55275](https://github.com/apache/doris/pull/55275))


## Improvements

### Performance Optimizations

- **`[opt](cloud)`** Reduce empty rowset pressure on meta service ([#54395](https://github.com/apache/doris/pull/54395), [#55171](https://github.com/apache/doris/pull/55171), [#55604](https://github.com/apache/doris/pull/55604), [#55742](https://github.com/apache/doris/pull/55742), [#55837](https://github.com/apache/doris/pull/55837), [#55934](https://github.com/apache/doris/pull/55934))
- **`[Opt](mow)`** Optimize MOW load performance and CPU usage ([#55073](https://github.com/apache/doris/pull/55073), [#55733](https://github.com/apache/doris/pull/55733), [#55771](https://github.com/apache/doris/pull/55771), [#55767](https://github.com/apache/doris/pull/55767))
- **`[opt](hive)`** Set hive.recursive_directories default to true ([#55737](https://github.com/apache/doris/pull/55737), [#55905](https://github.com/apache/doris/pull/55905))
- **`[opt](recycler)`** Avoid doing many `Aws::Internal::GetEC2MetadataClient` HTTP calls ([#55546](https://github.com/apache/doris/pull/55546), [#55682](https://github.com/apache/doris/pull/55682))
- **`[opt](mow)`** Do not capture stack to reduce CPU usage ([#55368](https://github.com/apache/doris/pull/55368), [#55526](https://github.com/apache/doris/pull/55526))
- **`[opt](txn lazy commit)`** Make convert tmp rowsets batch more adaptive ([#55035](https://github.com/apache/doris/pull/55035), [#55573](https://github.com/apache/doris/pull/55573))
- **`[opt](nereids)`** Improve performance of cast big string to complex type ([#55476](https://github.com/apache/doris/pull/55476), [#55521](https://github.com/apache/doris/pull/55521))
- **`[opt](nereids)`** Support simplify string range ([#55378](https://github.com/apache/doris/pull/55378), [#55456](https://github.com/apache/doris/pull/55456))
- **`[opt](nereids)`** Optimize normalize window ([#54947](https://github.com/apache/doris/pull/54947), [#55046](https://github.com/apache/doris/pull/55046))
- **`[opt](nereids)`** Optimize parallel of insert command when OLAP table has auto partitions ([#54983](https://github.com/apache/doris/pull/54983), [#55030](https://github.com/apache/doris/pull/55030))


### System Enhancements

- **`[enhancement](Log)`** Change some logs from info to debug ([#55808](https://github.com/apache/doris/pull/55808), [#55841](https://github.com/apache/doris/pull/55841))
- **`[enhancement](filecache)`** Parallel clear cache between multiple cache instances ([#55259](https://github.com/apache/doris/pull/55259), [#55437](https://github.com/apache/doris/pull/55437))
- **`[enhancement](sc)`** Reject schema change on hidden columns ([#53376](https://github.com/apache/doris/pull/53376), [#55385](https://github.com/apache/doris/pull/55385))
- **`[enhancement](backup)`** Handle dropped tables and partitions during backup ([#52935](https://github.com/apache/doris/pull/52935), [#54989](https://github.com/apache/doris/pull/54989))
- **`[enhancement](cloud)`** Fix cloud restore from Doris version 2.1 to 3.1 ([#55110](https://github.com/apache/doris/pull/55110))
- **`[enhancement](type)`** Support cast between time and datetime ([#53734](https://github.com/apache/doris/pull/53734), [#54985](https://github.com/apache/doris/pull/54985))


### Infrastructure Improvements

- **`[refactor](credential)`** Refactor vended credentials system with unified architecture ([#55912](https://github.com/apache/doris/pull/55912))
- **`[refactor](cloud)`** Separate cloud restore create tablet RPC into multiple batches ([#55691](https://github.com/apache/doris/pull/55691))
- **`[opt](editlog)`** Added the ability to skip certain editlog exceptions when FE is abnormal ([#54090](https://github.com/apache/doris/pull/54090), [#55204](https://github.com/apache/doris/pull/55204))


## Critical Bug Fixes

### Compaction & Storage

- **`[fix](sc)`** Skip empty rowset version hole filling for versions <= alter_version ([#56209](https://github.com/apache/doris/pull/56209), [#56212](https://github.com/apache/doris/pull/56212))
- **`[fix](compaction)`** Fix the issue where input rowsets are prematurely evicted after compaction, causing query failures ([#55382](https://github.com/apache/doris/pull/55382), [#55966](https://github.com/apache/doris/pull/55966))
- **`[fix](compaction)`** Make creating tablet idempotently to keep compaction job idempotent ([#56061](https://github.com/apache/doris/pull/56061), [#56108](https://github.com/apache/doris/pull/56108))
- **`[fix](compaction)`** Use rowset meta FS in segcompaction and add RPC client ready check ([#55951](https://github.com/apache/doris/pull/55951), [#55988](https://github.com/apache/doris/pull/55988))
- **`[fix](compaction)`** Skip tablets with compaction score 0 during compaction ([#55550](https://github.com/apache/doris/pull/55550), [#55570](https://github.com/apache/doris/pull/55570))


### Query Processing & Functions

- **`[fix](fold constant)`** abs's return type should be argument type ([#56190](https://github.com/apache/doris/pull/56190), [#56210](https://github.com/apache/doris/pull/56210))
- **`[fix](fold constant)`** Do not do BE constant fold when float/double is NaN ([#55425](https://github.com/apache/doris/pull/55425), [#55874](https://github.com/apache/doris/pull/55874))
- **`[Fix](function)`** Fix wrong decimal of unix_timestamp ([#55013](https://github.com/apache/doris/pull/55013), [#55962](https://github.com/apache/doris/pull/55962))
- **`[fix](nereids)`** Fix simplify compare predicate caused by loss precision or cast null ([#55884](https://github.com/apache/doris/pull/55884), [#56110](https://github.com/apache/doris/pull/56110))
- **`[fix](nereids)`** Fix execute error which throws eq function not exist exception when join reorder ([#54953](https://github.com/apache/doris/pull/54953), [#55667](https://github.com/apache/doris/pull/55667))
- **`[fix](nereids)`** Fix window expression alias reuse expr id ([#55286](https://github.com/apache/doris/pull/55286), [#55486](https://github.com/apache/doris/pull/55486))
- **`[fix](nereids)`** Use bigint instead of int literal to compare with count() agg function ([#55545](https://github.com/apache/doris/pull/55545), [#55590](https://github.com/apache/doris/pull/55590))
- **`[fix](nereids)`** Stop merge project when generating huge expression ([#55293](https://github.com/apache/doris/pull/55293), [#55519](https://github.com/apache/doris/pull/55519))


### Data Loading & Import

- **`[fix](load)`** Fix S3 load connection check failed ([#56123](https://github.com/apache/doris/pull/56123))
- **`[fix](load)`** Fix incorrect progress on finished loads ([#55509](https://github.com/apache/doris/pull/55509), [#55530](https://github.com/apache/doris/pull/55530))
- **`[fix](load)`** Fix ingestion load error case causing BE core ([#55500](https://github.com/apache/doris/pull/55500))
- **`[fix](load)`** Fix routine load task failed with MEM_LIMIT_EXCEED never being scheduled again ([#55481](https://github.com/apache/doris/pull/55481), [#55616](https://github.com/apache/doris/pull/55616))


### Cloud & Distributed Features

- **`[fix](cloud)`** Delete useless table lock in replayUpdateCloudReplica ([#55579](https://github.com/apache/doris/pull/55579), [#55955](https://github.com/apache/doris/pull/55955))
- **`[fix](cloud)`** `calc_sync_versions` should consider full compaction ([#55630](https://github.com/apache/doris/pull/55630), [#55710](https://github.com/apache/doris/pull/55710))
- **`[fix](warmup)`** Fix `CloudTablet::complete_rowset_segment_warmup` coredump ([#55932](https://github.com/apache/doris/pull/55932))


### Database Operations

- **`[fix](database)`** Fix rename db and create table race ([#55054](https://github.com/apache/doris/pull/55054), [#55991](https://github.com/apache/doris/pull/55991))
- **`[fix](create table)`** Concurrent rename database causes table creation and replay failure ([#54614](https://github.com/apache/doris/pull/54614), [#56039](https://github.com/apache/doris/pull/56039))
- **`[fix](table)`** Move drop editlog in table lock ([#55705](https://github.com/apache/doris/pull/55705), [#55947](https://github.com/apache/doris/pull/55947))
- **`[fix](schema change)`** Tablet columns are not rebuilt after enabling light schema change ([#55909](https://github.com/apache/doris/pull/55909), [#55939](https://github.com/apache/doris/pull/55939))


### Data Types & Serialization

- **`[fix](variant)`** Fix null value handling when serializing to JSON string ([#55876](https://github.com/apache/doris/pull/55876), [#56138](https://github.com/apache/doris/pull/56138))
- **`[fix](variant)`** Compatibility error when the sparse column is empty ([#55817](https://github.com/apache/doris/pull/55817))
- **`[fix](variant)`** Enhance max_sparse_column_statistics_size for variant ([#55124](https://github.com/apache/doris/pull/55124), [#55752](https://github.com/apache/doris/pull/55752))


### External Data Sources

- **`[fix](paimon)`** Fix Paimon native reader doesn't use late materialization ([#55894](https://github.com/apache/doris/pull/55894), [#55917](https://github.com/apache/doris/pull/55917))
- **`[fix](paimon)`** Fix Paimon DLF catalog caching issue by adding dlf.catalog.id to cache key ([#55875](https://github.com/apache/doris/pull/55875), [#55888](https://github.com/apache/doris/pull/55888))
- **`[fix](paimon)`** Handle oversized CHAR/VARCHAR fields in Paimon to Doris type mapping ([#55051](https://github.com/apache/doris/pull/55051), [#55531](https://github.com/apache/doris/pull/55531))
- **`[fix](maxcompute)`** Fix the NereidsException caused by non-existent table columns when pushing down MC predicates ([#55635](https://github.com/apache/doris/pull/55635), [#55746](https://github.com/apache/doris/pull/55746))
- **`[fix](maxcompute)`** Fix MaxCompute catalog international user cannot access ([#55256](https://github.com/apache/doris/pull/55256), [#55560](https://github.com/apache/doris/pull/55560))
- **`[fix](hudi)`** Fix querying Hudi JNI table where only partition columns (and no data fields) are required ([#55466](https://github.com/apache/doris/pull/55466), [#55662](https://github.com/apache/doris/pull/55662))
- **`[fix](hive)`** Fix querying Hive text table with NULL DEFINED AS '' ([#55626](https://github.com/apache/doris/pull/55626), [#55661](https://github.com/apache/doris/pull/55661))
- **`[fix](iceberg)`** Add missing iceberg-aws dependency to metadata scanner ([#55741](https://github.com/apache/doris/pull/55741), [#55743](https://github.com/apache/doris/pull/55743))
- **`[fix](iceberg rest)`** OAuth2 Token refresh using Iceberg default value ([#55578](https://github.com/apache/doris/pull/55578), [#55624](https://github.com/apache/doris/pull/55624))


### Memory & Resource Management

- **`[fix](memtracker)`** Memory not consumed by memtracker ([#55796](https://github.com/apache/doris/pull/55796), [#55823](https://github.com/apache/doris/pull/55823))
- **`[fix](mow)`** Fix MOW coredump in `BaseTablet::get_rowset_by_ids()` ([#55539](https://github.com/apache/doris/pull/55539), [#55601](https://github.com/apache/doris/pull/55601))
- **`[fix](mow)`** Fix MOW agg cache version check ([#55330](https://github.com/apache/doris/pull/55330), [#55475](https://github.com/apache/doris/pull/55475))
- **`[fix](move-memtable)`** Fix segment number mismatch for erroneously skipped segments ([#55092](https://github.com/apache/doris/pull/55092), [#55471](https://github.com/apache/doris/pull/55471))
- **`[fix](filecache)`** No fd num limit for segment cache when cloud mode ([#55610](https://github.com/apache/doris/pull/55610), [#55638](https://github.com/apache/doris/pull/55638))


### Security & Encryption

- **`[fix](tde)`** Correct encryption key version display ([#56092](https://github.com/apache/doris/pull/56092), [#56068](https://github.com/apache/doris/pull/56068))
- **`[fix](tde)`** Fix issues related to TDE ([#55692](https://github.com/apache/doris/pull/55692))


### Additional Fixes

- **`[fix](mtmv)`** Fix MTMV cannot refresh when a partition table doesn't have partition ([#55468](https://github.com/apache/doris/pull/55468), [#56085](https://github.com/apache/doris/pull/56085))
- **`[fix](plugin)`** Fix plugin dir compatible issue ([#56060](https://github.com/apache/doris/pull/56060))
- **`[fix](http stream)`** HTTP stream should throw exception if parse SQL failed ([#55863](https://github.com/apache/doris/pull/55863), [#55891](https://github.com/apache/doris/pull/55891))
- **`[fix](backup)`** Support backup meta/job info exceeds 2GB ([#55608](https://github.com/apache/doris/pull/55608), [#55867](https://github.com/apache/doris/pull/55867))
- **`[fix](mysql protocol)`** Set more stmt exists flag correctly when forwarding to master ([#55711](https://github.com/apache/doris/pull/55711), [#55871](https://github.com/apache/doris/pull/55871))
- **`[fix](connection)`** Fix session-related data not cleared when connection is disconnected due to timeout ([#55008](https://github.com/apache/doris/pull/55008), [#55809](https://github.com/apache/doris/pull/55809), [#55396](https://github.com/apache/doris/pull/55396))
- **`[fix](wal)`** Replay WAL abort txn failed when execute failed ([#55881](https://github.com/apache/doris/pull/55881), [#55924](https://github.com/apache/doris/pull/55924))
- **`[fix](restore)`** Clear restored table/partition/resource to reduce overhead ([#55757](https://github.com/apache/doris/pull/55757), [#55784](https://github.com/apache/doris/pull/55784))
- **`[fix](index)`** Remove unused update index ([#55514](https://github.com/apache/doris/pull/55514), [#55704](https://github.com/apache/doris/pull/55704))
- **`[fix](txn lazy commit)`** Fix txn lazy commit conflict with schema change ([#55349](https://github.com/apache/doris/pull/55349), [#55701](https://github.com/apache/doris/pull/55701))
- **`[fix](qe)`** Fix query error in SSL mode ([#53134](https://github.com/apache/doris/pull/53134), [#55628](https://github.com/apache/doris/pull/55628))
- **`[fix](catalog)`** Replace Math.abs with bitwise AND to ensure non-negative ID generation ([#55183](https://github.com/apache/doris/pull/55183), [#55689](https://github.com/apache/doris/pull/55689))
- **`[fix](function)`** Fix wrong result about array_agg_foreach ([#55075](https://github.com/apache/doris/pull/55075), [#55420](https://github.com/apache/doris/pull/55420))


## Infrastructure & Development

### Build & Dependencies

- **`[chore](build)`** Optimize build script ([#56027](https://github.com/apache/doris/pull/56027), [#56028](https://github.com/apache/doris/pull/56028))
- **`[chore](thirdparty)`** Upgrade aws-sdk-cpp from 1.11.119 to 1.11.219 ([#54780](https://github.com/apache/doris/pull/54780), [#54971](https://github.com/apache/doris/pull/54971))
- **`[chore](build)`** Update libevent dependency with openssl ([#54652](https://github.com/apache/doris/pull/54652), [#54857](https://github.com/apache/doris/pull/54857))
- **`[chore](config)`** Add config for brpc::usercode_in_pthread to let ASAN work ([#54656](https://github.com/apache/doris/pull/54656), [#54829](https://github.com/apache/doris/pull/54829))


### Testing & Quality

- **`[chore](case)`** Fix some failure cases ([#56140](https://github.com/apache/doris/pull/56140), [#56167](https://github.com/apache/doris/pull/56167))
- **`[fix](case)`** Fix some failure cases ([#56019](https://github.com/apache/doris/pull/56019), [#56035](https://github.com/apache/doris/pull/56035))
- **`[fix](test)`** Modify regression test to make stable and change expected log level ([#55169](https://github.com/apache/doris/pull/55169), [#55898](https://github.com/apache/doris/pull/55898))
- **`[fix](case)`** Fix some failure cases ([#55739](https://github.com/apache/doris/pull/55739), [#55769](https://github.com/apache/doris/pull/55769))
- **`[fix](case)`** Fix regression case: cse.groovy ([#53434](https://github.com/apache/doris/pull/53434), [#55897](https://github.com/apache/doris/pull/55897))
- **`[fix](cases)`** Fix case test_hudi_snapshot fail ([#55761](https://github.com/apache/doris/pull/55761), [#55791](https://github.com/apache/doris/pull/55791))
- **`[fix](case)`** Fix some failure cases ([#55811](https://github.com/apache/doris/pull/55811), [#55835](https://github.com/apache/doris/pull/55835))
- **`[fix](case)`** Waiting MV task should just care the latest one ([#55802](https://github.com/apache/doris/pull/55802), [#55830](https://github.com/apache/doris/pull/55830))
- **`[fix](case)`** Fix case: variant build index ([#55613](https://github.com/apache/doris/pull/55613), [#55648](https://github.com/apache/doris/pull/55648))
- **`[Fix](case)`** Fix show data p2 cases ([#55449](https://github.com/apache/doris/pull/55449), [#55494](https://github.com/apache/doris/pull/55494))
- **`[fix](test)`** Failed to show create table for async MV ([#55278](https://github.com/apache/doris/pull/55278), [#55480](https://github.com/apache/doris/pull/55480))
- **`[fix](test)`** Skip some test in cloud mode ([#55448](https://github.com/apache/doris/pull/55448), [#55535](https://github.com/apache/doris/pull/55535))
- **`[Fix](case)`** Fix some cases ([#55606](https://github.com/apache/doris/pull/55606), [#55656](https://github.com/apache/doris/pull/55656))
- **`[test](export)`** Add export parallelism where expr case ([#55636](https://github.com/apache/doris/pull/55636), [#55659](https://github.com/apache/doris/pull/55659))
- **`[test](iceberg)`** Add Polaris test ([#55484](https://github.com/apache/doris/pull/55484), [#55557](https://github.com/apache/doris/pull/55557))
- **`[test](nereids)`** Add UT for SQL cache/sorted partition cache ([#55520](https://github.com/apache/doris/pull/55520), [#55536](https://github.com/apache/doris/pull/55536))
- **`[test](docker)`** Adapt Paimon on HMS and GCS ([#55473](https://github.com/apache/doris/pull/55473), [#55512](https://github.com/apache/doris/pull/55512))
- **`[test](warmup)`** Fix flaky periodic warmup cases ([#55365](https://github.com/apache/doris/pull/55365), [#55453](https://github.com/apache/doris/pull/55453))


### Security & Configuration

- **`[chore](sk)`** Encrypt `secret key` and hide `access key` for log ([#55241](https://github.com/apache/doris/pull/55241), [#55619](https://github.com/apache/doris/pull/55619))
- **`[chore](security)`** user_files_secure_path cannot be changed ([#55395](https://github.com/apache/doris/pull/55395), [#55504](https://github.com/apache/doris/pull/55504))
- **`[chore](tablet)`** ignore_load_tablet_failure default to be true ([#55109](https://github.com/apache/doris/pull/55109), [#55441](https://github.com/apache/doris/pull/55441))


### Cloud Infrastructure

- **`[chore](cloud)`** Update build and start script ([#56031](https://github.com/apache/doris/pull/56031), [#56064](https://github.com/apache/doris/pull/56064))
- **`[chore](cloud)`** Support reporting conflicting ranges during commit txn ([#55340](https://github.com/apache/doris/pull/55340), [#55714](https://github.com/apache/doris/pull/55714))
- **`[chore](recycler)`** Improve recycler metrics ([#55455](https://github.com/apache/doris/pull/55455), [#55479](https://github.com/apache/doris/pull/55479))
- **`[chore](logs)`** Print logs of Export split tablet IDs ([#55170](https://github.com/apache/doris/pull/55170), [#55646](https://github.com/apache/doris/pull/55646))


### Third-party & Patches

- **`[thirdparty](patch)`** BRPC force SSL for all connections ([#55658](https://github.com/apache/doris/pull/55658), [#55696](https://github.com/apache/doris/pull/55696))
- **`[thirdparty](patch)`** Fix BRPC core when enable SSL ([#55649](https://github.com/apache/doris/pull/55649), [#55695](https://github.com/apache/doris/pull/55695))
- **`[fix](docker)`** Update Kafka docker image to internal src ([#55460](https://github.com/apache/doris/pull/55460), [#55487](https://github.com/apache/doris/pull/55487))


### CI & Performance

- **`[ci](perf)`** Update docker image references for target branches ([#55511](https://github.com/apache/doris/pull/55511))


## Behavior Changes

### Configuration Changes

- **`[opt](hive)`** Default value for `hive.recursive_directories` changed to `true`
- **`[chore](tablet)`** `ignore_load_tablet_failure` default changed to `true`
- **`[chore](security)`** `user_files_secure_path` configuration can no longer be changed at runtime


### Security Enhancements

- **`[chore](sk)`** Secret keys are now encrypted and access keys are hidden in logs for improved security


## Compatibility Notes

- This release maintains backward compatibility with Apache Doris 3.1.0
- Cloud restore functionality now supports migration from Doris version 2.1 to 3.1
- Enhanced type casting support between time and datetime types


## Contributors

This release includes contributions from the Apache Doris community. We thank all contributors who helped make this release possible through bug reports, code contributions, documentation improvements, and testing efforts.

@924060929 @amorynan @BiteTheDDDDt @bobhan1 @CalvinKirs @codeDing18 @csun5285 @dataroaring @deardeng @eldenmoon @englefly @felixwluo @freemandealer @gavinchou @HappenLee @hello-stephen @hubgeter @Jibing-Li @kaijchen @kaka11chen @koarz @liaoxin01 @luwei16 @MoanasDaddyXu @morningman @morrySnow @mymeiyi @peterylh @seawinde @sollhui @starocean999 @suxiaogang223 @SWJTU-ZhangLei @TangSiyang2001 @vinlee19 @w41ter @wyxxxcat @xy720 @yiguolei @yujun777 @Yukang-Lian @zclllyybb @zddr @zgxme @zhangstar333 @zy-kkk