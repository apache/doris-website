---
{
    "title": "Doris Kafka Connector",
    "language": "en",
    "description": "Doris Kafka Connector release notes."
}
---

# Doris Kafka Connector

This document lists Doris Kafka Connector release notes in reverse chronological order.

## 26.0.0

Source: [Release Note 26.0.0](https://github.com/apache/doris-kafka-connector/issues/98)

### Features and Improvements

- Enabled gzip compression by default for Stream Load. [#95](https://github.com/apache/doris-kafka-connector/pull/95)
- Fixed JDBC connection surges caused by improper connection reuse during schema evolution. [#94](https://github.com/apache/doris-kafka-connector/pull/94)
- Added Confluent build scripts. [#86](https://github.com/apache/doris-kafka-connector/pull/86)
- Updated configuration for `ConfigDef`. [#85](https://github.com/apache/doris-kafka-connector/pull/85)

### Bug Fixes

- Fixed validation for the `topic2table` configuration. [#83](https://github.com/apache/doris-kafka-connector/pull/83)
- Fixed the website documentation link in the README. [#84](https://github.com/apache/doris-kafka-connector/pull/84)

### Thanks

- @JNSimba
- @rnb-tron

## 25.0.0

Source: [Release Note 25.0.0](https://github.com/apache/doris-kafka-connector/issues/81)

### Features and Improvements

- Supported async combine flush. [#74](https://github.com/apache/doris-kafka-connector/pull/74)
- Updated configuration default values and added combine flush mode. [#73](https://github.com/apache/doris-kafka-connector/pull/73)
- Changed log level to debug. [#75](https://github.com/apache/doris-kafka-connector/pull/75)
- Added end-to-end tests for multiple transform chains. [#72](https://github.com/apache/doris-kafka-connector/pull/72)
- Added behavior handling for null values. [#69](https://github.com/apache/doris-kafka-connector/pull/69)
- Added checks for topic-mutating SMTs. [#68](https://github.com/apache/doris-kafka-connector/pull/68)
- Added retry strategy. [#67](https://github.com/apache/doris-kafka-connector/pull/67)
- Added cases for Debezium update, delete, and Avro conversion. [#65](https://github.com/apache/doris-kafka-connector/pull/65)
- Added end-to-end test cases for Kafka Connect transforms. [#64](https://github.com/apache/doris-kafka-connector/pull/64)
- Optimized code, including label transaction status queries. [#62](https://github.com/apache/doris-kafka-connector/pull/62)
- Added table names to schema change error messages. [#61](https://github.com/apache/doris-kafka-connector/pull/61)
- Added release scripts. [#80](https://github.com/apache/doris-kafka-connector/pull/80)

### Bug Fixes

- Fixed decimal parsing. [#70](https://github.com/apache/doris-kafka-connector/pull/70)
- Fixed `processedOffset` updates when retrying loads. [#79](https://github.com/apache/doris-kafka-connector/pull/79)
- Ignored schema API responses where appropriate. [#77](https://github.com/apache/doris-kafka-connector/pull/77)

### Thanks

- @chuang-wang-pre
- @DongLiang-0
- @JNSimba
- @vinlee19
