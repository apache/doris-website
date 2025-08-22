---
{

    "title": "Release Note",
    "language": "zh-CN"

}
---

## Release 25.1.0

### Features & Improvements
1. Automatically create new synchronization tables in the scenario of sharding
2. DorisSource uses ArrowFlightSQL to read by default
3. Add itcase e2ecase 
4. Compatible with IP type reading after doris2.1.3
5. Add release script 
6. Increase retry interval in batch mode 
7. Automatically create new tables for mongodbcdc synchronization
8. Add some usage examples

### Bug Fixes
1. Flink task stuck after streamload thread exits abnormally
2. Fix pgcdc synchronization type conversion problem
3. Schema Length Mismatch for ObjectId Non-id Fields in Collections in mongodbcdc synchronization


## Release 25.0.0

### Features & Improvements
1. Support catalog table read by arrowflightsql
2. Support insert overwrite
3. Support partial limit push down
4. Concat doris.filter.query option when push down
5. Compatible with FE API changes with add resposne ignore field config 
6. Optimize MongoCDC sampleSize calculation logic
7. Ignore when mongodb schema change fails
8. Add prefix for lookup query and ArrowFlight Query
9. support catalog table read by arrowflightsql

### Bug Fixes
1. Fixed the issue that write error bypasses checkpoint in extreme cases 
2. Fixed the issue where writing may get stuck when HTTP error occurs 
3. Fix the issue with parsing MongoDB timestamp and array types 
4. Fix the ora-12733 issue when there are many sync tables 
5. Fix timestamp format push down error 
6. Fix sql_parse schema table annotation and field type parsing inaccuracies 
7. Fix error with Transfer-encoding header already present 
8. Fix multi database sync npe error 


## More
More Release Notes can be found [here](https://github.com/apache/doris-flink-connector/issues?q=state%3Aopen%20label%3A%22release%20notes%22).