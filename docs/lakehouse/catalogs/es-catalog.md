---
{
    "title": "Elasticsearch Catalog",
    "language": "en"
}
---

Elasticsearch Catalog not only supports automatic mapping of ES metadata, but also combines Doris's distributed query planning capabilities with ES (Elasticsearch)'s full-text search capabilities to provide a more comprehensive OLAP analysis solution:

1. Multi-index distributed Join queries in ES.

2. Joint queries between tables in Doris and ES, with more complex full-text search filtering.

## Prerequisites

Supports Elasticsearch 5.x and above.

## Connecting to Elasticsearch

```sql
CREATE CATALOG es_catalog PROPERTIES (
    'type' = 'es',
    'hosts' = 'http://127.0.0.1:9200'
    {ElasticsearchProperties}
);
```

* {ElasticsearchProperties}

| Parameter              | Required | Default | Description                                                                                    |
| ---------------------- | -------- | ------- | ---------------------------------------------------------------------------------------------- |
| `hosts`                | Yes      |         | ES address, can be one or multiple, or ES load balancer address                               |
| `user`                 | No       | Empty   | ES username                                                                                    |
| `password`             | No       | Empty   | Password for the corresponding user                                                            |
| `doc_value_scan`       | No       | true    | Whether to enable getting query field values through ES/Lucene columnar storage               |
| `keyword_sniff`        | No       | true    | Whether to detect text.fields for string tokenization types in ES and query through keyword. Setting to false will match based on tokenized content |
| `nodes_discovery`      | No       | true    | Whether to enable ES node discovery, default is true. Set to false in network isolated environments to connect only to specified nodes |
| `ssl`                  | No       | false   | Whether ES enables https access mode, currently implemented in fe/be as trust all             |
| `mapping_es_id`        | No       | false   | Whether to map the \_id field in ES index                                                     |
| `like_push_down`       | No       | true    | Whether to convert like to wildcard and push down to ES, will increase ES CPU consumption     |
| `include_hidden_index` | No       | false   | Whether to include hidden indexes, default is false                                           |

Notes:

1. Authentication currently only supports HTTP Basic authentication, and you need to ensure that the user has access to paths like `/_cluster/state/`, `_nodes/http` and Index read permissions; username and password are not required when cluster security authentication is not enabled.

2. In 5.x and 6.x versions, the first type is taken by default for multiple types in one Index.

## Hierarchy Mapping

Since Elasticsearch doesn't have the concept of Database, after connecting to ES, a unique Database will be automatically generated: `default_db`.

After switching to ES Catalog using the SWITCH command, it will automatically switch to `default_db`, no need to execute `USE default_db` command.

## Column Type Mapping

| ES Type           | Doris Type  | Comment                                                                                        |
| ----------------- | ----------- | ---------------------------------------------------------------------------------------------- |
| null              | null        |                                                                                                |
| boolean           | boolean     |                                                                                                |
| byte              | tinyint     |                                                                                                |
| short             | smallint    |                                                                                                |
| integer           | int         |                                                                                                |
| long              | bigint      |                                                                                                |
| unsigned\_long    | largeint    |                                                                                                |
| float             | float       |                                                                                                |
| half\_float       | float       |                                                                                                |
| double            | double      |                                                                                                |
| scaled\_float     | double      |                                                                                                |
| date              | date        | Only supports `default`/`yyyy-MM-dd HH:mm:ss`/`yyyy-MM-dd`/`epoch_millis` formats           |
| keyword           | string      |                                                                                                |
| text              | string      |                                                                                                |
| ip                | string      |                                                                                                |
| constant\_keyword | string      |                                                                                                |
| wildcard          | string      |                                                                                                |
| nested            | json        |                                                                                                |
| object            | json        |                                                                                                |
| flattened         | json        | Supported since version 3.1.4, 4.0.3                                                         |
| other             | UNSUPPORTED |                                                                                                |

### Array Types

Elasticsearch doesn't have an explicit array type, but its fields can contain [0 or more values](https://www.elastic.co/guide/en/elasticsearch/reference/current/array.html).

To indicate that a field is an array type, you can add a specific `doris` structure annotation in the [\_meta](https://www.elastic.co/guide/en/elasticsearch/reference/current/mapping-meta-field.html) section of the index mapping.

For Elasticsearch 6.x and earlier versions, please refer to [\_meta](https://www.elastic.co/guide/en/elasticsearch/reference/6.8/mapping-meta-field.html).

For example, suppose there's an index `doc` containing the following data structure:

```json
{
  "array_int_field": [1, 2, 3, 4],
  "array_string_field": ["doris", "is", "the", "best"],
  "id_field": "id-xxx-xxx",
  "timestamp_field": "2022-11-12T12:08:56Z",
  "array_object_field": [
    {
      "name": "xxx",
      "age": 18
    }
  ]
}
```

The array fields of this structure can be defined by adding field property definitions to the `_meta.doris` property of the target index mapping using the following commands.

```shell
# ES 7.x and above
curl -X PUT "localhost:9200/doc/_mapping?pretty" -H 'Content-Type:application/json' -d '
{
    "_meta": {
        "doris":{
            "array_fields":[
                "array_int_field",
                "array_string_field",
                "array_object_field"
            ]
        }
    }
}'

# ES 6.x and before
curl -X PUT "localhost:9200/doc/_mapping/_doc?pretty" -H 'Content-Type: application/json' -d '
{
    "_meta": {
        "doris":{
            "array_fields":[
                "array_int_field",
                "array_string_field",
                "array_object_field"
            ]
        }
    }
}
```

`array_fields`: Used to indicate fields that are array types.

### flattened Type

For `flattened` type, when the `enable_docvalue_scan` property is `false`, the JSON data format read out is flattened. If the `enable_docvalue_scan` property is `true`, then the original JSON format is read out. Example as follows:

Index definition:

```json
"mappings": {
   "properties": {
      "column1": {
      "type": "keyword"
      },
      "extra": {
      "type": "flattened"
      }
   }
}
```

Data:

```json
{
  "column1": 1,
  "extra": {
    "subcol1": "abc",
    "sub_array": [
      {"k1": "element1"},
      {"k2": "element2"},
      {"k3": "element3"}
    ]
  }
}
```

- When `enable_docvalue_scan` property is `false`

   The query result for `extra` column is:

   ```json
   {
      "subcol1": "abc",
      "sub_array": [
         {"k1": "element1"},
         {"k2": "element2"},
         {"k3": "element3"}
      ]
   }
   ```

- When `enable_docvalue_scan` property is `true`

   The query result for `extra` column is:

   ```json
   ["abc","element1","element2","element3"]
   ```

## Query Operations

After configuring the Catalog, you can query table data in the Catalog through the following methods:

```sql
-- 1. switch to catalog, use database and query
SWITCH es_ctl;
SELECT * FROM es_tbl LIMIT 10;

-- 2. use default_db directly
USE es_ctl.default_db;
SELECT * FROM es_tbl LIMIT 10;

-- 3. use full qualified name to query
SELECT * FROM es_ctl.default_db.es_tbl LIMIT 10;
```

For more advanced query features, please refer to the [Best Practices] section.

## Best Practices

### Filter Predicate Pushdown

ES Catalog supports filter predicate pushdown: filter conditions are pushed down to ES, so only data that truly meets the conditions will be returned, which can significantly improve query performance and reduce CPU, Memory, IO usage of Doris and Elasticsearch.

The following operators will be optimized into the corresponding ES Query:

| SQL syntax              | ES 5.x+ syntax                |
| ----------------------- | ----------------------------- |
| `=`                     | term query                    |
| `in`                    | terms query                   |
| `>` , `<` , `>=` , `<=` | range query                   |
| `and`                   | bool.filter                   |
| `or`                    | bool.should                   |
| `not`                   | bool.must\_not                |
| `not in`                | bool.must\_not + terms query  |
| `is_not_null`           | exists query                  |
| `is_null`               | bool.must\_not + exists query |
| `esquery`               | ES native json form QueryDSL  |

### Enable Columnar Scan to Optimize Query Speed (enable\_docvalue\_scan=true)

Set `"enable_docvalue_scan" = "true"`

After enabling, Doris will follow these two principles when getting data from ES:

* **Best Effort**: Automatically detect whether the fields to be read have columnar storage enabled (doc\_value: true). If all fields have columnar storage, Doris will get all field values from columnar storage.

* **Automatic Degradation**: If any field to be retrieved doesn't have columnar storage, all field values will be parsed and retrieved from row storage `_source`.

**Advantages**:

By default, Doris On ES will get all required columns from row storage, i.e., `_source`. `_source` storage uses row-based + JSON format, which has inferior batch reading performance compared to columnar storage, especially when only a few columns are needed. In cases where only a few columns are needed, docvalue performance is about ten times better than \_source performance.

**Notes**:

1. `text` type fields don't have columnar storage in ES, so if any field value to be retrieved is of `text` type, it will automatically degrade to getting from `_source`.

2. When the number of fields to retrieve is too many (`>= 25`), the performance of getting field values from `docvalue` will be basically the same as getting field values from `_source`.

3. `keyword` type fields may appear empty due to the [`ignore_above`](https://www.elastic.co/guide/en/elasticsearch/reference/current/keyword.html#keyword-params) parameter limitation for long text fields that exceed this limit. In this case, you need to disable `enable_docvalue_scan` and get results from `_source`.

### Detect Keyword Type Fields

Set `"enable_keyword_sniff" = "true"`

In ES, you can import data directly without establishing an index. In this case, ES will automatically create a new index. For string type fields, ES will create fields that have both `text` type and `keyword` type, which is ES's multi fields feature, with mapping as follows:

```json
"k4": {
   "type": "text",
   "fields": {
      "keyword": {   
         "type": "keyword",
         "ignore_above": 256
      }
   }
}
```

When filtering on k4, such as =, Doris On ES will convert the query to ES's TermQuery.

SQL filter condition:

```sql
k4 = "Doris On ES"
```

Converted to ES query DSL:

```json
"term" : {
    "k4": "Doris On ES"

}
```

Because k4's first field type is `text`, during data import it will be tokenized according to k4's configured tokenizer (if not set, it's the standard tokenizer) to get three Terms: doris, on, es, as analyzed by ES analyze API:

```json
POST /_analyze
{
  "analyzer": "standard",
  "text": "Doris On ES"
}
```

The tokenization result is:

```json
{
   "tokens": [
      {
         "token": "doris",
         "start_offset": 0,
         "end_offset": 5,
         "type": "<ALPHANUM>",
         "position": 0
      },
      {
         "token": "on",
         "start_offset": 6,
         "end_offset": 8,
         "type": "<ALPHANUM>",
         "position": 1
      },
      {
         "token": "es",
         "start_offset": 9,
         "end_offset": 11,
         "type": "<ALPHANUM>",
         "position": 2
      }
   ]
}
```

The query uses:

```json
"term" : {
    "k4": "Doris On ES"
}
```

The term `Doris On ES` cannot match any term in the dictionary and won't return any results. Enabling `enable_keyword_sniff: true` will automatically convert `k4 = "Doris On ES"` to `k4.keyword = "Doris On ES"` to completely match SQL semantics. The converted ES query DSL is:

```json
"term" : {
    "k4.keyword": "Doris On ES"
}
```

`k4.keyword` type is `keyword`, and data is written to ES as a complete term, so it can match.

### Enable Node Auto Discovery (nodes\_discovery=true)

Set `"nodes_discovery" = "true"`

When configured as true, Doris will find all available related data nodes (allocated shards above) from ES. If ES data node addresses are not accessible by Doris BE, set to false. ES cluster is deployed in an intranet isolated from the public Internet, and users access through proxy.

### Whether ES Cluster Enables HTTPS Access Mode

Set `"ssl" = "true"`

Currently FE/BE implementation is trust all, this is a temporary solution, real user configured certificates will be used later.

### Extended esquery() Function

Use `esquery(field, QueryDSL)` function to push down some queries that cannot be expressed in SQL, such as `match_phrase`, `geoshape`, etc., to ES for filtering. The first column name parameter of `esquery` is used to associate `index`, and the second parameter is the JSON representation of ES's basic `Query DSL`, enclosed in curly braces `{}`. The JSON `root key` must have one and only one, such as `match_phrase`, `geo_shape`, `bool`, etc.

`match_phrase` query:

```sql
select * from es_table where esquery(k4, '{
        "match_phrase": {
           "k4": "doris on es"
        }
    }');
```

`geo` related queries:

```sql
select * from es_table where esquery(k4, '{
      "geo_shape": {
         "location": {
            "shape": {
               "type": "envelope",
               "coordinates": [
                  [
                     13,
                     53
                  ],
                  [
                     14,
                     52
                  ]
               ]
            },
            "relation": "within"
         }
      }
   }');
```

`bool` query:

```sql
select * from es_table where esquery(k4, ' {
         "bool": {
            "must": [
               {
                  "terms": {
                     "k1": [
                        11,
                        12
                     ]
                  }
               },
               {
                  "terms": {
                     "k2": [
                        100
                     ]
                  }
               }
            ]
         }
      }');
```

### Time Type Field Usage Recommendations

Only applicable to ES external tables. In ES Catalog, date types are automatically mapped to Date or Datetime.

In ES, time type fields are very flexible to use, but in ES external tables, if time type fields are not properly configured, filter conditions cannot be pushed down.

When creating an index, set time type format for maximum format compatibility:

```json
 "dt": {
     "type": "date",
     "format": "yyyy-MM-dd HH:mm:ss||yyyy-MM-dd||epoch_millis"
 }
```

When establishing this field in Doris, it's recommended to set it as `date` or `datetime`, or it can be set as `varchar` type. Using the following SQL statements can directly push filter conditions down to ES:

```sql
select * from doe where k2 > '2020-06-21';

select * from doe where k2 < '2020-06-21 12:00:00'; 

select * from doe where k2 < 1593497011; 

select * from doe where k2 < now();

select * from doe where k2 < date_format(now(), '%Y-%m-%d');
```

**Note**:

* If you don't set `format` for time type fields in ES, the default time type field format is:

  ```sql
  strict_date_optional_time||epoch_millis
  ```

* If date fields imported to ES are timestamps, they need to be converted to `ms`. ES processes timestamps internally in `ms`, otherwise ES external tables will have display errors.

### Getting ES Metadata Field ID

When importing documents without specifying `_id`, ES will assign a globally unique `_id` (primary key) to each document. Users can also specify a `_id` with special business meaning when importing.

If you need to get this field value in ES external tables, you can add a `_id` field of `varchar` type when creating the table:

```sql
CREATE EXTERNAL TABLE `doe` (
  `_id` varchar COMMENT "",
  `city`  varchar COMMENT ""
) ENGINE=ELASTICSEARCH
PROPERTIES (
"hosts" = "http://127.0.0.1:8200",
"user" = "root",
"password" = "root",
"index" = "doe"
}
```

If you need to get this field value in ES Catalog, please set `"mapping_es_id" = "true"`.

**Note**:

1. Filter conditions for `_id` field only support `=` and `in`.

2. `_id` field must be of `varchar` type.

### Getting Globally Ordered Query Results

In scenarios like relevance ranking and priority display of important content, it's very useful for ES query results to be sorted by score. Doris queries ES to fully utilize the advantages of MPP architecture by pulling data according to the shard distribution of ES indexes.
To get globally ordered sorting results, ES needs to be queried from a single point. This can be controlled by the session variable `enable_es_parallel_scroll` (default is true).
When `enable_es_parallel_scroll=false` is set, Doris will send `scroll` queries without `shard_preference` and `sort` information to the ES cluster, thus getting globally ordered results.
Note: Use with caution when the query result set is large.

### Modifying scroll Request batch Size

The default `batch` size for `scroll` requests is 4064. It can be modified through the session variable `batch_size`.

## Frequently Asked Questions

1. **Does it support ES clusters with X-Pack authentication?**

   Supports all ES clusters using HTTP Basic authentication.

2. **Some queries are much slower than requesting ES directly**

   Yes, such as \_count related queries, etc. ES will directly read metadata related to the number of documents that meet the conditions internally, without filtering actual data.

3. **Can aggregation operations be pushed down?**

   Currently Doris On ES doesn't support pushing down aggregation operations like sum, avg, min/max, etc. The calculation method is to batch stream all documents meeting the conditions from ES, then calculate in Doris.

## Appendix

### Principle of Doris Querying ES

```plain text
+----------------------------------------------+
|                                              |
| Doris      +------------------+              |
|            |       FE         +--------------+-------+
|            |                  |  Request Shard Location
|            +--+-------------+-+              |       |
|               ^             ^                |       |
|               |             |                |       |
|  +-------------------+ +------------------+  |       |
|  |            |      | |    |             |  |       |
|  | +----------+----+ | | +--+-----------+ |  |       |
|  | |      BE       | | | |      BE      | |  |       |
|  | +---------------+ | | +--------------+ |  |       |
+----------------------------------------------+       |
   |        |          | |        |         |          |
   |        |          | |        |         |          |
   |    HTTP SCROLL    | |    HTTP SCROLL   |          |
+-----------+---------------------+------------+       |
|  |        v          | |        v         |  |       |
|  | +------+--------+ | | +------+-------+ |  |       |
|  | |               | | | |              | |  |       |
|  | |   DataNode    | | | |   DataNode   +<-----------+
|  | |               | | | |              | |  |       |
|  | |               +<--------------------------------+
|  | +---------------+ | | |--------------| |  |       |
|  +-------------------+ +------------------+  |       |
|   Same Physical Node                         |       |
|                                              |       |
|           +-----------------------+          |       |
|           |                       |          |       |
|           |      MasterNode       +<-----------------+
| ES        |                       |          |
|           +-----------------------+          |
+----------------------------------------------+
```

1. FE will request the hosts specified when creating the table to get HTTP port information of all nodes and shard distribution information of indexes, etc. If the request fails, it will traverse the host list sequentially until success or complete failure.

2. When querying, a query plan will be generated and sent to corresponding BE nodes based on some node information and index metadata information obtained by FE.

3. BE nodes will request ES nodes deployed locally first according to the `proximity principle`. BE gets data concurrently from each shard of ES index through `HTTP Scroll` method streaming from `_source` or `docvalue`.

4. After Doris completes the calculation, it returns the results to the user.
