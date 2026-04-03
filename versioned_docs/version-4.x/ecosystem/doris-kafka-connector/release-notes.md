---
{
    "title": "Release Notes",
    "language": "en"
}
---

# Doris Kafka Connector Release Notes

## 25.0.0

### Features & Improvements

- Support combine flush async [#74](https://github.com/apache/doris-kafka-connector/pull/74)
- Update config default value and add combine flush mode [#73](https://github.com/apache/doris-kafka-connector/pull/73)
- Change log level to debug [#75](https://github.com/apache/doris-kafka-connector/pull/75)
- Add E2E test for multiple transforms chain [#72](https://github.com/apache/doris-kafka-connector/pull/72)
- Add behavior on null values [#69](https://github.com/apache/doris-kafka-connector/pull/69)
- Check topic mutating SMTs [#68](https://github.com/apache/doris-kafka-connector/pull/68)
- Add retry strategy [#67](https://github.com/apache/doris-kafka-connector/pull/67)
- Add case for Debezium update, delete and Avro convert [#65](https://github.com/apache/doris-kafka-connector/pull/65)
- Add E2E test cases for Kafka Connect Transforms [#64](https://github.com/apache/doris-kafka-connector/pull/64)
- Optimize some code, including querying label transaction status and others [#62](https://github.com/apache/doris-kafka-connector/pull/62)
- Schema change error prompts the table name [#61](https://github.com/apache/doris-kafka-connector/pull/61)
- Add scripts tool for release [#80](https://github.com/apache/doris-kafka-connector/pull/80)

### Bug Fixes

- Fix decimal parse [#70](https://github.com/apache/doris-kafka-connector/pull/70)
- Fix processedOffset update when retry load [#79](https://github.com/apache/doris-kafka-connector/pull/79)
- Ignore schema API response [#77](https://github.com/apache/doris-kafka-connector/pull/77)

### Credits

@chuang-wang-pre @DongLiang-0 @JNSimba @vinlee19
