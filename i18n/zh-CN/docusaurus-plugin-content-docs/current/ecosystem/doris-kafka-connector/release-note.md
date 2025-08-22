---
{

    "title": "Release Note",
    "language": "zh-CN"

}
---

## Release 25.0.0

### Feature & Improve
1. support combine flush async 
2. update config default value and add combine flush mode  
3. change log level to debug  
4. add e2e test for multiple transforms chain 
5. add behavior on null values 
6. check topic mutating SMTs 
7. add retry strategy 
8. add case for debezium update, delete and avro convert  
9. Add E2E Test Cases for Kafka Connect Transforms  
10. Optimize some code, including querying label transaction status and others  
11. Schema change error prompts the table name  
12. Add scripts tool for release  

### Bug Fixes
1. fix deciaml parse 
2. Fix processedOffset update when retry load  
3. ignore schema api response 

## More
More Release Notes can be found [here](https://github.com/apache/doris-kafka-connector/issues?q=is%3Aissue%20state%3Aopen%20label%3Arelease-note).