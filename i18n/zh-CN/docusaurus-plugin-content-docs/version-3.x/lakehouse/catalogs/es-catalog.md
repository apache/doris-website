---
{
    "title": "Elasticsearch Catalog",
    "language": "zh-CN",
    "description": "Elasticsearch Catalog 除了支持自动映射 ES 元数据外，还可以利用 Doris 的分布式查询规划能力和 ES（Elasticsearch）的全文检索能力相结合，提供更完善的 OLAP 分析场景解决方案："
}
---

Elasticsearch Catalog 除了支持自动映射 ES 元数据外，还可以利用 Doris 的分布式查询规划能力和 ES（Elasticsearch）的全文检索能力相结合，提供更完善的 OLAP 分析场景解决方案：

1. ES 中的多 index 分布式 Join 查询。

2. Doris 和 ES 中的表联合查询，更复杂的全文检索过滤。

## 使用须知

支持 Elasticsearch 5.x 及以上版本。

## 连接 Elasticsearch

```sql
CREATE CATALOG es_catalog PROPERTIES (
    'type' = 'es',
    'hosts' = 'http://127.0.0.1:9200'
    {ElasticsearchProperties}
);
```

* {ElasticsearchProperties}

| 参数                     | 是否必须 | 默认值   | 说明                                                                     |
| ---------------------- | ---- | ----- | ---------------------------------------------------------------------- |
| `hosts`                | 是    |       | ES 地址，可以是一个或多个，也可以是 ES 的负载均衡地址                                         |
| `user`                 | 否    | 空     | ES 用户名                                                                 |
| `password`             | 否    | 空     | 对应用户的密码信息                                                              |
| `doc_value_scan`       | 否    | true  | 是否开启通过 ES/Lucene 列式存储获取查询字段的值                                          |
| `keyword_sniff`        | 否    | true  | 是否对 ES 中字符串分词类型 text.fields 进行探测，通过 keyword 进行查询。设置为 false 会按照分词后的内容匹配 |
| `nodes_discovery`      | 否    | true  | 是否开启 ES 节点发现，默认为 true。在网络隔离环境下设置为 false，只连接指定节点                        |
| `ssl`                  | 否    | false | ES 是否开启 https 访问模式，目前在 fe/be 实现方式为信任所有                                 |
| `mapping_es_id`        | 否    | false | 是否映射 ES 索引中的 \_id 字段                                                   |
| `like_push_down`       | 否    | true  | 是否将 like 转化为 wildcard 下推到 ES，会增加 ES CPU 消耗                            |
| `include_hidden_index` | 否    | false | 是否包含隐藏的索引，默认为 false                                                   |

说明：

1. 认证方式目前仅支持 HTTP Basic 认证，并且需要确保该用户有访问 `/_cluster/state/`、`_nodes/http` 等路径和 Index 的读权限；集群未开启安全认证时，用户名和密码不需要设置。

2. 在 5.x 和 6.x 版本中，一个 Index 中的多个 type 默认取第一个。

## 层级映射

由于 Elasticsearch 没有 Database 的概念，所以连接 ES 后，会自动生成一个唯一的 Database：`default_db`。

在通过 SWITCH 命令切换到 ES Catalog 后，会自动切换到 `default_db`，无需再执行 `USE default_db` 命令。

## 列类型映射

| ES Type           | Doris Type  | Comment                                                            |
| ----------------- | ----------- | ------------------------------------------------------------------ |
| null              | null        |                                                                    |
| boolean           | boolean     |                                                                    |
| byte              | tinyint     |                                                                    |
| short             | smallint    |                                                                    |
| integer           | int         |                                                                    |
| long              | bigint      |                                                                    |
| unsigned\_long    | largeint    |                                                                    |
| float             | float       |                                                                    |
| half\_float       | float       |                                                                    |
| double            | double      |                                                                    |
| scaled\_float     | double      |                                                                    |
| date              | date        | 仅支持 `default`/`yyyy-MM-dd HH:mm:ss`/`yyyy-MM-dd`/`epoch_millis` 格式 |
| keyword           | string      |                                                                    |
| text              | string      |                                                                    |
| ip                | string      |                                                                    |
| constant\_keyword | string      |                                                                    |
| wildcard          | string      |                                                                    |
| nested            | json        |                                                                    |
| object            | json        |                                                                    |
| flattened         | json        |  自 3.1.4, 4.0.3 版本后支持                                          |
| other             | UNSUPPORTED |                                                                    |

### Array 类型

Elasticsearch 没有明确的数组类型，但是它的某个字段可以含有 [0 个或多个值](https://www.elastic.co/guide/en/elasticsearch/reference/current/array.html)。

为了表示一个字段是数组类型，可以在索引映射的 [\_meta](https://www.elastic.co/guide/en/elasticsearch/reference/current/mapping-meta-field.html) 部分添加特定的 `doris` 结构注释。

对于 Elasticsearch 6.x 及之前版本，请参考 [\_meta](https://www.elastic.co/guide/en/elasticsearch/reference/6.8/mapping-meta-field.html)。

举例说明，假设有一个索引 `doc` 包含以下的数据结构：

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

该结构的数组字段可以通过使用以下命令将字段属性定义添加到目标索引映射的 `_meta.doris` 属性中来定义。

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

`array_fields`：用来表示是数组类型的字段。

### flattened 类型

对于 `flattened` 类型，在 `enable_docvalue_scan` 属性为 `false` 的情况下，读取出来的 JSON 数据格式是打平的。若 `enable_docvalue_scan` 属性为 `true`，则读取出来的是原始 JSON 格式。举例如下：

Index 定义：

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

数据：

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

- 当 `enable_docvalue_scan` 属性为 `false` 时

   `extra` 列的查询结果为：

   ```
   {
      "subcol1": "abc",
      "sub_array": [
         {"k1": "element1"},
         {"k2": "element2"},
         {"k3": "element3"}
      ]
   }
   ```

- 当 `enable_docvalue_scan` 属性为 `true` 时

   `extra` 列的查询结果为：

   ```json
   ["abc","element1","element2","element3"]
   ```

## 查询操作

配置好 Catalog 后，可以通过以下方式查询 Catalog 中的表数据：

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

更多高级查询功能，请参阅【最佳实践】部分。

## 最佳实践

### 过滤条件下推

ES Catalog 支持过滤条件的下推：过滤条件下推给 ES，这样只有真正满足条件的数据才会被返回，能够显著提高查询性能和降低 Doris 和 Elasticsearch 的 CPU、Memory、IO 使用量。

下面的操作符（Operators）会被优化成如下 ES Query：

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
| `esquery`               | ES 原生 json 形式的 QueryDSL       |

### 启用列式扫描优化查询速度（enable\_docvalue\_scan=true）

设置 `"enable_docvalue_scan" = "true"`

开启后，Doris 从 ES 中获取数据会遵循以下两个原则：

* **尽力而为**：自动探测要读取的字段是否开启列式存储（doc\_value: true），如果获取的字段全部有列存，Doris 会从列式存储中获取所有字段的值。

* **自动降级**：如果要获取的字段只要有一个字段没有列存，所有字段的值都会从行存 `_source` 中解析获取。

**优势**：

默认情况下，Doris On ES 会从行存也就是 `_source` 中获取所需的所有列，`_source` 的存储采用的行式+JSON 的形式存储，在批量读取性能上要劣于列式存储，尤其在只需要少数列的情况下尤为明显。只获取少数列的情况下，docvalue 的性能大约是 \_source 性能的十几倍。

**注意事项**：

1. `text` 类型的字段在 ES 中是没有列式存储的，因此如果要获取的字段值有 `text` 类型字段会自动降级为从 `_source` 中获取。

2. 在获取的字段数量过多的情况下（`>= 25`），从 `docvalue` 中获取字段值的性能会和从 `_source` 中获取字段值基本一样。

3. `keyword` 类型字段由于 [`ignore_above`](https://www.elastic.co/guide/en/elasticsearch/reference/current/keyword.html#keyword-params) 参数的限制，对于超过该限制的长文本字段会忽略，所以可能会出现结果为空的情况。此时需要关闭 `enable_docvalue_scan`，从 `_source` 中获取结果。

### 探测 Keyword 类型字段

设置 `"enable_keyword_sniff" = "true"`

在 ES 中可以不建立 index 直接进行数据导入，这时候 ES 会自动创建一个新的索引，针对字符串类型的字段 ES 会创建一个既有 `text` 类型的字段又有 `keyword` 类型的字段，这就是 ES 的 multi fields 特性，mapping 如下：

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

对 k4 进行条件过滤时比如 =，Doris On ES 会将查询转换为 ES 的 TermQuery。

SQL 过滤条件：

```sql
k4 = "Doris On ES"
```

转换成 ES 的 query DSL 为：

```json
"term" : {
    "k4": "Doris On ES"

}
```

因为 k4 的第一字段类型为 `text`，在数据导入的时候就会根据 k4 设置的分词器（如果没有设置，就是 standard 分词器）进行分词处理得到 doris、on、es 三个 Term，如下 ES analyze API 分析：

```json
POST /_analyze
{
  "analyzer": "standard",
  "text": "Doris On ES"
}
```

分词的结果是：

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

查询时使用的是：

```json
"term" : {
    "k4": "Doris On ES"
}
```

`Doris On ES` 这个 term 匹配不到词典中的任何 term，不会返回任何结果，而启用 `enable_keyword_sniff: true` 会自动将 `k4 = "Doris On ES"` 转换成 `k4.keyword = "Doris On ES"` 来完全匹配 SQL 语义，转换后的 ES query DSL 为：

```json
"term" : {
    "k4.keyword": "Doris On ES"
}
```

`k4.keyword` 的类型是 `keyword`，数据写入 ES 中是一个完整的 term，所以可以匹配。

### 开启节点自动发现（nodes\_discovery=true）

设置 `"nodes_discovery" = "true"`

当配置为 true 时，Doris 将从 ES 找到所有可用的相关数据节点（在上面分配的分片）。如果 ES 数据节点的地址没有被 Doris BE 访问，则设置为 false。ES 集群部署在与公共 Internet 隔离的内网，用户通过代理访问。

### ES 集群是否开启 HTTPS 访问模式

设置 `"ssl" = "true"`

目前 FE/BE 实现方式为信任所有，这是临时解决方案，后续会使用真实的用户配置证书。

### 扩展的 esquery() 函数

通过 `esquery(field, QueryDSL)` 函数将一些无法用 SQL 表述的 query 如 `match_phrase`、`geoshape` 等下推给 ES 进行过滤处理，`esquery` 的第一个列名参数用于关联 `index`，第二个参数是 ES 的基本 `Query DSL` 的 JSON 表述，使用花括号 `{}` 包含，JSON 的 `root key` 有且只能有一个，如 `match_phrase`、`geo_shape`、`bool` 等。

`match_phrase` 查询：

```plain&#x20;text
select * from es_table where esquery(k4, '{
        "match_phrase": {
           "k4": "doris on es"
        }
    }');
```

`geo` 相关查询：

```plain&#x20;text
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

`bool` 查询：

```plain&#x20;text
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

### 时间类型字段使用建议

仅 ES 外表适用，ES Catalog 中自动映射日期类型为 Date 或 Datetime。

在 ES 中，时间类型的字段使用十分灵活，但是在 ES 外表中如果对时间类型字段的类型设置不当，则会造成过滤条件无法下推。

创建索引时对时间类型格式的设置做最大程度的格式兼容：

```json
 "dt": {
     "type": "date",
     "format": "yyyy-MM-dd HH:mm:ss||yyyy-MM-dd||epoch_millis"
 }
```

在 Doris 中建立该字段时建议设置为 `date` 或 `datetime`，也可以设置为 `varchar` 类型，使用如下 SQL 语句都可以直接将过滤条件下推至 ES：

```sql
select * from doe where k2 > '2020-06-21';

select * from doe where k2 < '2020-06-21 12:00:00'; 

select * from doe where k2 < 1593497011; 

select * from doe where k2 < now();

select * from doe where k2 < date_format(now(), '%Y-%m-%d');
```

**注意**：

* 在 ES 中如果不对时间类型的字段设置 `format`，默认的时间类型字段格式为：

  ```sql
  strict_date_optional_time||epoch_millis
  ```

* 导入到 ES 的日期字段如果是时间戳需要转换成 `ms`，ES 内部处理时间戳都是按照 `ms` 进行处理的，否则 ES 外表会出现显示错误。

### 获取 ES 元数据字段 ID

导入文档在不指定 `_id` 的情况下，ES 会给每个文档分配一个全局唯一的 `_id` 即主键，用户也可以在导入时为文档指定一个含有特殊业务意义的 `_id`；

如果需要在 ES 外表中获取该字段值，建表时可以增加类型为 `varchar` 的 `_id` 字段：

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

如果需要在 ES Catalog 中获取该字段值，请设置 `"mapping_es_id" = "true"`。

**注意**：

1. `_id` 字段的过滤条件仅支持 `=` 和 `in` 两种。

2. `_id` 字段必须为 `varchar` 类型。

### 获取全局有序的查询结果

在相关性排序、优先展示重要内容等场景中，ES 查询结果按照 score 来排序非常有用。Doris 查询 ES 为了充分利用 MPP 的架构优势，是按照 ES 索引的 shard 的分布情况来拉取数据。
为了得到全局有序的排序结果，需要对 ES 进行单点查询。可以通过 session 变量 `enable_es_parallel_scroll`（默认为 true）来控制。
当设置 `enable_es_parallel_scroll=false` 时，Doris 将会向 ES 集群发送不带 `shard_preference` 和 `sort` 信息的 `scroll` 查询，从而得到全局有序的结果。
注意：在查询结果集较大时，谨慎使用。

### 修改 scroll 请求的 batch 大小

`scroll` 请求的 `batch` 默认为 4064。可以通过 session 变量 `batch_size` 来修改。

## 常见问题

1. **是否支持 X-Pack 认证的 ES 集群？**

   支持所有使用 HTTP Basic 认证方式的 ES 集群。

2. **一些查询比请求 ES 慢很多**

   是的，比如 \_count 相关的 query 等，ES 内部会直接读取满足条件的文档个数相关的元数据，不需要对真实的数据进行过滤。

3. **聚合操作是否可以下推？**

   目前 Doris On ES 不支持聚合操作如 sum、avg、min/max 等下推，计算方式是批量流式的从 ES 获取所有满足条件的文档，然后在 Doris 中进行计算。

## 附录

### Doris 查询 ES 原理

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

1. FE 会请求建表指定的主机，获取所有节点的 HTTP 端口信息以及 index 的 shard 分布信息等，如果请求失败会顺序遍历 host 列表直至成功或完全失败。

2. 查询时会根据 FE 得到的一些节点信息和 index 的元数据信息，生成查询计划并发给对应的 BE 节点。

3. BE 节点会根据`就近原则`即优先请求本地部署的 ES 节点，BE 通过`HTTP Scroll`方式流式的从 ES index 的每个分片中并发的从`_source`或`docvalue`中获取数据。

4. Doris 计算完结果后，返回给用户。
