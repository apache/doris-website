---
{
    "title": "Release Notes",
    "language": "en"
}
---

# Flink Doris Connector Release Notes

## 26.1.0

### Features & Improvements

- Enable gz compression by default for StreamLoad [#648](https://github.com/apache/doris-flink-connector/pull/648)

### Credits

@JNSimba

## 26.0.0

### Features & Improvements

- Support Doris DECIMAL256 type [#628](https://github.com/apache/doris-flink-connector/pull/628)
- Support nested type fields in ArrayData [#606](https://github.com/apache/doris-flink-connector/pull/606)
- Support http request with UTF-8 charset encoding [#623](https://github.com/apache/doris-flink-connector/pull/623)
- Add configurable Thrift max message size [#593](https://github.com/apache/doris-flink-connector/pull/593)
- Optimize MongoDB CDC type inference to avoid unnecessary decimal conversion [#596](https://github.com/apache/doris-flink-connector/pull/596)
- Improve error message when FE host is invalid [#629](https://github.com/apache/doris-flink-connector/pull/629)
- Support Flink 2.x [#636](https://github.com/apache/doris-flink-connector/pull/636)

### Bug Fixes

- Fix label being set during group commit retries [#635](https://github.com/apache/doris-flink-connector/pull/635)
- Fix batch stream load handling for types that do not have line delimiters [#619](https://github.com/apache/doris-flink-connector/pull/619)
- Fix incorrect DDL generation when a Doris field has an empty string as its default value [#600](https://github.com/apache/doris-flink-connector/pull/600)
- Fix typo in BackendClient that could affect Arrow Flight reads [#622](https://github.com/apache/doris-flink-connector/pull/622)

### Credits

@QuakeWang @JNSimba @jqcc @potterhe @kwonder0926 @gnehil @keytouch @AlexRiedler

## 25.1.0

### Features & Improvements

- Automatically create new synchronization tables in the scenario of sharding [#564](https://github.com/apache/doris-flink-connector/pull/564)
- DorisSource uses ArrowFlightSQL to read by default [#574](https://github.com/apache/doris-flink-connector/pull/574)
- Add itcase e2ecase [#569](https://github.com/apache/doris-flink-connector/pull/569) [#577](https://github.com/apache/doris-flink-connector/pull/577) [#580](https://github.com/apache/doris-flink-connector/pull/580)
- Compatible with IP type reading after Doris 2.1.3 [#576](https://github.com/apache/doris-flink-connector/pull/576)
- Add release script [#567](https://github.com/apache/doris-flink-connector/pull/567)
- Increase retry interval in batch mode [#579](https://github.com/apache/doris-flink-connector/pull/579)
- Automatically create new tables for MongoDB CDC synchronization [#573](https://github.com/apache/doris-flink-connector/pull/573)
- Add some usage examples [#589](https://github.com/apache/doris-flink-connector/pull/589)

### Bug Fixes

- Flink task stuck after stream load thread exits abnormally [#578](https://github.com/apache/doris-flink-connector/pull/578)
- Fix PostgreSQL CDC synchronization type conversion problem [#582](https://github.com/apache/doris-flink-connector/pull/582)
- Schema length mismatch for ObjectId non-id fields in collections in MongoDB CDC synchronization [#588](https://github.com/apache/doris-flink-connector/pull/588)

### Credits

@Aalron @JNSimba @kwonder0926 @vinlee19
