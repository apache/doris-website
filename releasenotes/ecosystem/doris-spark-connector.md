---
{
    "title": "Doris Spark Connector",
    "language": "en",
    "description": "Doris Spark Connector release notes."
}
---

# Doris Spark Connector

This document lists Doris Spark Connector release notes in reverse chronological order.

## 26.0.0

Source: [Spark Doris Connector 26.0.0](https://github.com/apache/doris-spark-connector/issues/358)

### Spark Connector

#### Features and Improvements

- Enabled gzip compression by default for Stream Load writes. [#356](https://github.com/apache/doris-spark-connector/pull/356)
- Added logs for Arrow Flight reads. [#354](https://github.com/apache/doris-spark-connector/pull/354)
- Supported HTTP requests with UTF-8 charset encoding. [#347](https://github.com/apache/doris-spark-connector/pull/347)

#### Bug Fixes

- Fixed column projection issues in Spark 3.3, 3.4, and 3.5. [#353](https://github.com/apache/doris-spark-connector/pull/353)

### Thanks

- @JNSimba
- @gnehil

## 25.2.0

Source: [Spark Doris Connector 25.2.0](https://github.com/apache/doris-spark-connector/issues/342)

### Spark Connector

#### Features and Improvements

- Added FE retry and load balancing strategy for Doris Flight SQL Reader. [#318](https://github.com/apache/doris-spark-connector/pull/318)
- Added load balancing strategy for frontends and backends. [#329](https://github.com/apache/doris-spark-connector/pull/329)
- Added schema-less option. [#332](https://github.com/apache/doris-spark-connector/pull/332)

#### Bug Fixes

- Fixed filter pushdown issues with `OR` in SQL. [#317](https://github.com/apache/doris-spark-connector/pull/317)
- Fixed an issue where retries might get stuck when an FE hangs. [#331](https://github.com/apache/doris-spark-connector/pull/331)
- Improved `accept_any_schema` option handling. [#326](https://github.com/apache/doris-spark-connector/pull/326)
- Fixed V2Expression build errors. [#339](https://github.com/apache/doris-spark-connector/pull/339)
- Fixed an issue where `doris.benodes` did not take effect. [#346](https://github.com/apache/doris-spark-connector/pull/346)

### Thanks

- @JNSimba
- @wanggx
- @wary

## 25.1.0

Source: [Spark Doris Connector Release Note 25.1.0](https://github.com/apache/doris-spark-connector/issues/319)

### Spark Connector

#### Features and Improvements

- Supported overwrite for DataSource V2. [#281](https://github.com/apache/doris-spark-connector/pull/281)
- Supported reading the `DECIMAL128` type. [#290](https://github.com/apache/doris-spark-connector/pull/290)
- Added compatibility for reading the IP data type. [#289](https://github.com/apache/doris-spark-connector/pull/289)
- Improved BE Thrift read logs and Stream Load logs. [#279](https://github.com/apache/doris-spark-connector/pull/279) [#313](https://github.com/apache/doris-spark-connector/pull/313)
- Added Doris source and sink integration test cases, and added Spark 3.2, 3.4, and 3.5 CI coverage. [#296](https://github.com/apache/doris-spark-connector/pull/296) [#297](https://github.com/apache/doris-spark-connector/pull/297) [#302](https://github.com/apache/doris-spark-connector/pull/302) [#312](https://github.com/apache/doris-spark-connector/pull/312)
- Enhanced FE node port checks and improved write performance. [#303](https://github.com/apache/doris-spark-connector/pull/303)
- Added retry intervals when load fails. [#307](https://github.com/apache/doris-spark-connector/pull/307)
- Added code checks for FE requests. [#309](https://github.com/apache/doris-spark-connector/pull/309)
- Removed unused code after refactoring. [#295](https://github.com/apache/doris-spark-connector/pull/295)

#### Bug Fixes

- Fixed compilation for filter `IN` clauses. [#277](https://github.com/apache/doris-spark-connector/pull/277)
- Fixed unit tests for row converter and schema converter. [#278](https://github.com/apache/doris-spark-connector/pull/278)
- Fixed a null pointer exception when committing a transaction for an empty partition. [#286](https://github.com/apache/doris-spark-connector/pull/286)
- Fixed an issue where pruned column results were not pushed down. [#287](https://github.com/apache/doris-spark-connector/pull/287)
- Fixed performance degradation caused by an interval configuration mistake. [#294](https://github.com/apache/doris-spark-connector/pull/294)
- Fixed issues when Spark pushes down `CASE WHEN` expressions. [#300](https://github.com/apache/doris-spark-connector/pull/300)
- Fixed an issue where loading tasks got stuck when Stream Load ended unexpectedly. [#305](https://github.com/apache/doris-spark-connector/pull/305)
- Fixed an issue where queries could not run when UTF-8 encoding was pushed down. [#311](https://github.com/apache/doris-spark-connector/pull/311)
- Fixed rename conflicts for `ArrowWriter` and `ArrowUtil`. [#315](https://github.com/apache/doris-spark-connector/pull/315)

### Spark Load

#### Features and Improvements

- Supported loading Hadoop configuration from resources. [#280](https://github.com/apache/doris-spark-connector/pull/280)

### Thanks

- @aoyuEra
- @gnehil
- @JNSimba
- @IsmailTosunTnyl
- @qg-lin
- @vinlee19
- @wary

## 25.0.1

Source: [Spark Doris Connector Release Note 25.0.1](https://github.com/apache/doris-spark-connector/issues/276)

### Spark Connector

#### Features and Improvements

- Supported accepting tables with any schema. [#269](https://github.com/apache/doris-spark-connector/pull/269)
- Added logs for Stream Load responses. [#271](https://github.com/apache/doris-spark-connector/pull/271)
- Improved log messages. [#274](https://github.com/apache/doris-spark-connector/pull/274)
- Added release scripts. [#275](https://github.com/apache/doris-spark-connector/pull/275)

#### Bug Fixes

- Fixed write issues in Arrow format. [#270](https://github.com/apache/doris-spark-connector/pull/270)
- Fixed read issues caused by column prune pushdown. [#273](https://github.com/apache/doris-spark-connector/pull/273)

### Spark Load

#### Bug Fixes

- Fixed unit test cases and added CI build checks. [#272](https://github.com/apache/doris-spark-connector/pull/272)

### Thanks

- @gnehil
- @JNSimba

## 25.0.0

Source: [Spark Doris Connector Release Note 25.0.0](https://github.com/apache/doris-spark-connector/issues/268)

### Spark Connector

#### Features and Improvements

- Supported Spark DataSource V2 API pushdown. [#250](https://github.com/apache/doris-spark-connector/pull/250)
- Supported partial limit pushdown for Spark 3.2 and later. [#257](https://github.com/apache/doris-spark-connector/pull/257)
- Added compatibility for FE API changes. [#260](https://github.com/apache/doris-spark-connector/pull/260)
- Supported `CREATE TABLE` statements for Spark 3.3 and later. [#264](https://github.com/apache/doris-spark-connector/pull/264)

#### Bug Fixes

- Fixed a driver exception when the Spark catalog gets a JDBC connection. [#251](https://github.com/apache/doris-spark-connector/pull/251)
- Fixed a data conversion exception when reading the date type. [#253](https://github.com/apache/doris-spark-connector/pull/253)
- Fixed an exception caused by loading the Arrow JDBC driver when loading the MySQL driver. [#254](https://github.com/apache/doris-spark-connector/pull/254)
- Fixed an issue where schema column order was inconsistent with data column order. [#256](https://github.com/apache/doris-spark-connector/pull/256)
- Fixed an exception when reading JSON type data through Flight SQL. [#263](https://github.com/apache/doris-spark-connector/pull/263)
- Fixed an exception when reading date type data with `spark.sql.datetime.java8API.enabled` enabled. [#265](https://github.com/apache/doris-spark-connector/pull/265)

### Spark Load

#### Features and Improvements

- Supported job execution based on object storage. [#266](https://github.com/apache/doris-spark-connector/pull/266)

### Thanks

- @gnehil
- @JNSimba
