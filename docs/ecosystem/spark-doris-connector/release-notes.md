---
{
    "title": "Release Notes",
    "language": "en"
}
---

# Spark Doris Connector Release Notes

## 25.2.0

### Improvements

- Add FE retry and load balancing strategy for Doris Flight SQL Reader [#318](https://github.com/apache/doris-spark-connector/pull/318)
- Add load balance strategy for frontends and backends [#329](https://github.com/apache/doris-spark-connector/pull/329)
- Add schema-less option [#332](https://github.com/apache/doris-spark-connector/pull/332)

### Bug Fixes

- Fix filter push issue with OR in SQL [#317](https://github.com/apache/doris-spark-connector/pull/317)
- Fix the problem that retry may get stuck when FE hangs up [#331](https://github.com/apache/doris-spark-connector/pull/331)
- Improve accept_any_schema to options [#326](https://github.com/apache/doris-spark-connector/pull/326)
- Fix V2Expression build error [#339](https://github.com/apache/doris-spark-connector/pull/339)
- Fix the issue where configuring doris.benodes is not working [#346](https://github.com/apache/doris-spark-connector/pull/346)

### Credits

@JNSimba @wanggx @wary

## 25.1.0

### Improvements

- Support overwrite for DataSource V2 [#281](https://github.com/apache/doris-spark-connector/pull/281)
- Support read DECIMAL128 type [#290](https://github.com/apache/doris-spark-connector/pull/290)
- Compatible with read IP data type [#289](https://github.com/apache/doris-spark-connector/pull/289)
- Improve BE Thrift read log and stream load log [#279](https://github.com/apache/doris-spark-connector/pull/279) [#313](https://github.com/apache/doris-spark-connector/pull/313)
- Add Doris source/sink itcase and Spark 3.2/3.4/3.5 CI [#296](https://github.com/apache/doris-spark-connector/pull/296) [#297](https://github.com/apache/doris-spark-connector/pull/297) [#302](https://github.com/apache/doris-spark-connector/pull/302) [#312](https://github.com/apache/doris-spark-connector/pull/312)
- Enhance the FE nodes port check and improve write performance [#303](https://github.com/apache/doris-spark-connector/pull/303)
- Add retry interval when load fails [#307](https://github.com/apache/doris-spark-connector/pull/307)
- Add code check for FE request [#309](https://github.com/apache/doris-spark-connector/pull/309)
- Remove unused code after refactor [#295](https://github.com/apache/doris-spark-connector/pull/295)

### Bug Fixes

- Fix filter IN clause compilation [#277](https://github.com/apache/doris-spark-connector/pull/277)
- Fix UT for row convertor and schema convertor [#278](https://github.com/apache/doris-spark-connector/pull/278)
- Fix NPE when empty partition commit txn [#286](https://github.com/apache/doris-spark-connector/pull/286)
- Fix prune column result isn't pushed down issue [#287](https://github.com/apache/doris-spark-connector/pull/287)
- Fix performance degradation caused by interval mistake [#294](https://github.com/apache/doris-spark-connector/pull/294)
- Fix the issue when Spark pushes down in 'case when' [#300](https://github.com/apache/doris-spark-connector/pull/300)
- Fix the issue where the loading task got stuck when stream load ended unexpectedly [#305](https://github.com/apache/doris-spark-connector/pull/305)
- Fix the problem that the query could not be performed when pushing UTF-8 encoding [#311](https://github.com/apache/doris-spark-connector/pull/311)
- Fix the conflict for rename ArrowWriter and ArrowUtil [#315](https://github.com/apache/doris-spark-connector/pull/315)

### Credits

@aoyuEra @gnehil @JNSimba @IsmailTosunTnyl @qg-lin @vinlee19 @wary
