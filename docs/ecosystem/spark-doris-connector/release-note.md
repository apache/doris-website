---
{

    "title": "Release Note",
    "language": "en"

}
---

## Release 25.1.0

### Improvement
1. support overwrite for datasource v2 
2. support read DECIMAL128 type 
3. compatible with read ip data type 
4. improve be thrift read log and stream load log
5. add doris source sink itcase and spark 3.2/3.4/3.5 ci 
6. enhance the FE nodes port check and improve write performace 
7. add retry interval when load fail 
8. add code check for fe request
9. remove unused code after refractor 

### Bug Fixes
1. fix filter in clause compilation
2. fix ut for row convertor and schema convertor 
3. fix npe when empty partition commit txn
4. fix prune column result isn't pushed down issue
5. fix performance degradation caused by interval mistake
6. fix the issue when Spark pushes down in 'case when' 
7. fixed the issue where the loading task got stuck when stream load ended unexpectedly
8. fixed the problem that the query could not be performed when pushing utf8 encoding
9. fix the conflict for rename arrowwriter and arrowutil

## More
More Release Notes can be found [here](https://github.com/apache/doris-spark-connector/issues?q=state%3Aopen%20label%3A%22release-note%22).