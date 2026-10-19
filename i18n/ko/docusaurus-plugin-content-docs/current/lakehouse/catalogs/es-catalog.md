---
{
    "title": "Elasticsearch Catalog",
    "language": "ko",
    "description": "Elasticsearch Catalog는 ES 메타데이터의 자동 매핑을 지원할 뿐만 아니라,"
}
---

Elasticsearch Catalog는 ES 메타데이터의 자동 매핑을 지원할 뿐만 아니라, Doris의 분산 쿼리 계획 기능과 ES(Elasticsearch)의 전문 검색 기능을 결합하여 더욱 포괄적인 OLAP 분석 솔루션을 제공합니다:

1. ES에서 여러 인덱스에 걸친 분산 Join 쿼리.

2. Doris와 ES의 테이블 간 통합 쿼리 및 더 복잡한 전문 검색 필터링.

## 사전 요구 사항 {#prerequisites}

Elasticsearch 5.x 이상을 지원합니다.

## Elasticsearch 연결 {#connecting-to-elasticsearch}

```sql
CREATE CATALOG es_catalog PROPERTIES (
    'type' = 'es',
    'hosts' = 'http://127.0.0.1:9200'
    {ElasticsearchProperties}
);
```

* {ElasticsearchProperties}

| 매개변수              | 필수 여부 | 기본값 | 설명                                                                                    |
| ---------------------- | -------- | ------- | ---------------------------------------------------------------------------------------------- |
| `hosts`                | 예       |         | 하나 이상의 ES 주소 또는 ES 로드 밸런서 주소                               |
| `user`                 | 아니요   | 비어 있음 | ES 사용자 이름                                                                                    |
| `password`             | 아니요   | 비어 있음 | 해당 사용자의 비밀번호                                                            |
| `doc_value_scan`       | 아니요   | true    | ES/Lucene의 컬럼 기반 스토리지를 통해 쿼리 필드 값을 가져올지 여부               |
| `keyword_sniff`        | 아니요   | true    | ES에서 문자열 토큰화 타입의 text.fields를 감지하고 keyword를 통해 쿼리할지 여부. false로 설정하면 토큰화된 내용을 기준으로 일치 여부를 판단합니다 |
| `nodes_discovery`      | 아니요   | true    | ES 노드 검색을 활성화할지 여부. 기본값은 true입니다. 네트워크가 격리된 환경에서는 false로 설정하여 지정된 노드에만 연결합니다 |
| `ssl`                  | 아니요   | false   | ES에서 https 접근 모드를 활성화했는지 여부. 현재 fe/be는 trust all 방식으로 구현되어 있습니다             |
| `mapping_es_id`        | 아니요   | false   | ES 인덱스의 \_id 필드를 매핑할지 여부                                                     |
| `like_push_down`       | 아니요   | true    | like를 wildcard로 변환하여 ES로 푸시다운할지 여부. ES의 CPU 사용량이 증가합니다     |
| `include_hidden_index` | 아니요   | false   | 숨겨진 인덱스를 포함할지 여부. 기본값은 false입니다                                           |

참고:

1. 현재 인증은 HTTP Basic 인증만 지원하며, 사용자에게 `/_cluster/state/`, `_nodes/http` 등의 경로에 대한 접근 권한과 인덱스 읽기 권한이 있어야 합니다. 클러스터 보안 인증이 활성화되어 있지 않으면 사용자 이름과 비밀번호가 필요하지 않습니다.

2. 5.x 및 6.x 버전에서는 하나의 인덱스에 여러 타입이 있을 경우 기본적으로 첫 번째 타입을 사용합니다.

## 계층 매핑 {#hierarchy-mapping}

Elasticsearch에는 데이터베이스라는 개념이 없으므로, ES에 연결하면 유일한 데이터베이스인 `default_db`가 자동으로 생성됩니다.

SWITCH 명령을 사용하여 ES Catalog로 전환하면 자동으로 `default_db`로 전환되므로 `USE default_db` 명령을 실행할 필요가 없습니다.

## 컬럼 타입 매핑 {#column-type-mapping}

| ES 타입           | Doris 타입  | 비고                                                                                        |
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
| date              | date        | `default`/`yyyy-MM-dd HH:mm:ss`/`yyyy-MM-dd`/`epoch_millis` 형식만 지원           |
| keyword           | string      |                                                                                                |
| text              | string      |                                                                                                |
| ip                | string      |                                                                                                |
| constant\_keyword | string      |                                                                                                |
| wildcard          | string      |                                                                                                |
| nested            | json        |                                                                                                |
| object            | json        |                                                                                                |
| flattened         | json        | 3.1.4, 4.0.3 버전부터 지원                                                         |
| 기타              | UNSUPPORTED |                                                                                                |

### 배열 타입 {#array-types}

Elasticsearch에는 명시적인 배열 타입이 없지만, 필드에는 [0개 이상의 값](https://www.elastic.co/guide/en/elasticsearch/reference/current/array.html)이 포함될 수 있습니다.

필드가 배열 타입임을 나타내려면, 특정 `doris` 구조 주석을 인덱스 매핑의 [\_meta](https://www.elastic.co/guide/en/elasticsearch/reference/current/mapping-meta-field.html) 섹션에 추가할 수 있습니다.

Elasticsearch 6.x 이하 버전은 [\_meta](https://www.elastic.co/guide/en/elasticsearch/reference/6.8/mapping-meta-field.html)를 참조하세요.

예를 들어, 다음 데이터 구조를 포함하는 인덱스 `doc`가 있다고 가정합니다:

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

다음 명령으로 대상 인덱스 매핑의 `_meta.doris` 속성에 필드 속성 정의를 추가하여 이 구조의 배열 필드를 정의할 수 있습니다.

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

`array_fields`: 배열 타입인 필드를 지정하는 데 사용합니다.

### flattened 타입 {#flattened-type}

`flattened` 타입의 경우, `enable_docvalue_scan` 속성이 `false`이면 읽어 온 JSON 데이터가 평탄화된 형식입니다. `enable_docvalue_scan` 속성이 `true`이면 원본 JSON 형식으로 읽어 옵니다. 예시는 다음과 같습니다:

인덱스 정의:

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

데이터:

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

- `enable_docvalue_scan` 속성이 `false`인 경우

   `extra` 컬럼의 쿼리 결과는 다음과 같습니다:

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

- `enable_docvalue_scan` 속성이 `true`인 경우

   `extra` 컬럼의 쿼리 결과는 다음과 같습니다:

   ```json
   ["abc","element1","element2","element3"]
   ```

## 쿼리 실행 {#query-operations}

Catalog를 구성한 후 다음 방법으로 Catalog 내 테이블 데이터를 쿼리할 수 있습니다:

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

더 고급 쿼리 기능은 [모범 사례] 섹션을 참조하세요.

## 모범 사례 {#best-practices}

### 필터 조건자 푸시다운 {#filter-predicate-pushdown}

ES Catalog는 필터 조건자 푸시다운을 지원합니다. 필터 조건을 ES로 전달하여 조건을 실제로 충족하는 데이터만 반환하므로 쿼리 성능을 크게 높이고 Doris와 Elasticsearch의 CPU, 메모리, IO 사용량을 줄일 수 있습니다.

다음 연산자는 해당 ES 쿼리로 최적화됩니다:

| SQL 구문              | ES 5.x+ 구문                |
| ----------------------- | ----------------------------- |
| `=`                     | term 쿼리                    |
| `in`                    | terms 쿼리                   |
| `>` , `<` , `>=` , `<=` | range 쿼리                   |
| `and`                   | bool.filter                   |
| `or`                    | bool.should                   |
| `not`                   | bool.must\_not                |
| `not in`                | bool.must\_not + terms 쿼리  |
| `is_not_null`           | exists 쿼리                  |
| `is_null`               | bool.must\_not + exists 쿼리 |
| `esquery`               | ES 네이티브 JSON 형식의 QueryDSL  |

### 컬럼 기반 스캔을 활성화하여 쿼리 속도 최적화 (enable\_docvalue\_scan=true) {#enable-columnar-scan-to-optimize-query-speed-enable_docvalue_scantrue}

`"enable_docvalue_scan" = "true"`로 설정합니다.

활성화하면 Doris는 다음 두 가지 원칙에 따라 ES에서 데이터를 가져옵니다:

* **최대한 활용**: 읽을 필드에 컬럼 기반 스토리지(doc\_value: true)가 활성화되어 있는지 자동으로 감지합니다. 모든 필드가 컬럼 기반 스토리지에 저장되어 있으면 Doris는 모든 필드 값을 컬럼 기반 스토리지에서 가져옵니다.

* **자동 전환**: 가져올 필드 중 하나라도 컬럼 기반 스토리지에 저장되어 있지 않으면, 모든 필드 값을 행 기반 스토리지인 `_source`에서 파싱하여 가져옵니다.

**장점**:

기본적으로 Doris On ES는 행 기반 스토리지인 `_source`에서 필요한 모든 컬럼을 가져옵니다. `_source` 스토리지는 행 기반 + JSON 형식을 사용하므로 컬럼 기반 스토리지보다 배치 읽기 성능이 떨어지며, 특히 소수의 컬럼만 필요할 때 차이가 큽니다. 소수의 컬럼만 필요한 경우 docvalue 성능이 \_source보다 약 열 배 우수합니다.

**참고**:

1. `text` 타입 필드는 ES에서 컬럼 기반 스토리지에 저장되지 않으므로, 가져올 필드 값 중 하나라도 `text` 타입이면 자동으로 `_source`에서 가져오는 방식으로 전환됩니다.

2. 가져올 필드 수가 너무 많으면(`>= 25`), `docvalue`에서 필드 값을 가져오는 성능은 `_source`에서 가져오는 성능과 거의 같습니다.

3. `keyword` 타입 필드는 긴 텍스트가 [`ignore_above`](https://www.elastic.co/guide/en/elasticsearch/reference/current/keyword.html#keyword-params) 매개변수의 제한을 초과하면 비어 있는 것처럼 나타날 수 있습니다. 이 경우 `enable_docvalue_scan`을 비활성화하고 `_source`에서 결과를 가져와야 합니다.

### Keyword 타입 필드 감지 {#detect-keyword-type-fields}

`"enable_keyword_sniff" = "true"`로 설정합니다.

ES에서는 인덱스를 생성하지 않고도 데이터를 직접 적재할 수 있습니다. 이 경우 ES가 새 인덱스를 자동으로 생성합니다. 문자열 타입 필드에 대해서는 `text` 타입과 `keyword` 타입을 모두 가진 필드를 생성합니다. 이는 ES의 multi fields 기능이며, 매핑은 다음과 같습니다:

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

=와 같이 k4에 필터를 적용하면 Doris On ES는 쿼리를 ES의 TermQuery로 변환합니다.

SQL 필터 조건:

```sql
k4 = "Doris On ES"
```

ES 쿼리 DSL로 변환한 결과:

```json
"term" : {
    "k4": "Doris On ES"

}
```

k4의 첫 번째 필드 타입이 `text`이므로 데이터 적재 시 k4에 설정된 토크나이저(설정하지 않았다면 표준 토크나이저)에 따라 토큰화되어 doris, on, es라는 세 개의 Term이 생성됩니다. ES analyze API로 분석하면 다음과 같습니다:

```json
POST /_analyze
{
  "analyzer": "standard",
  "text": "Doris On ES"
}
```

토큰화 결과는 다음과 같습니다:

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

쿼리에서는 다음을 사용합니다:

```json
"term" : {
    "k4": "Doris On ES"
}
```

Term `Doris On ES`는 사전의 어떤 Term과도 일치하지 않아 결과를 반환하지 않습니다. `enable_keyword_sniff: true`를 활성화하면 `k4 = "Doris On ES"`가 자동으로 `k4.keyword = "Doris On ES"`로 변환되어 SQL 의미와 완전히 일치하게 됩니다. 변환된 ES 쿼리 DSL은 다음과 같습니다:

```json
"term" : {
    "k4.keyword": "Doris On ES"
}
```

`k4.keyword`의 타입은 `keyword`이며, 데이터가 완전한 하나의 Term으로 ES에 기록되므로 일치하는 결과를 얻을 수 있습니다.

### 노드 자동 검색 활성화 (nodes\_discovery=true) {#enable-node-auto-discovery-nodes_discoverytrue}

`"nodes_discovery" = "true"`로 설정합니다.

true로 설정하면 Doris는 ES에서 사용 가능한 모든 관련 데이터 노드(샤드가 할당된 노드)를 찾습니다. Doris BE에서 ES 데이터 노드 주소에 접근할 수 없다면 false로 설정하세요. ES 클러스터가 공용 인터넷과 격리된 인트라넷에 배포되어 사용자가 프록시를 통해 접근하는 경우가 이에 해당합니다.

### ES 클러스터의 HTTPS 접근 모드 활성화 여부 {#whether-es-cluster-enables-https-access-mode}

`"ssl" = "true"`로 설정합니다.

현재 FE/BE는 trust all 방식으로 구현되어 있습니다. 이는 임시 방안이며, 향후에는 사용자가 구성한 실제 인증서를 사용할 예정입니다.

### esquery() 확장 함수 {#extended-esquery-function}

`esquery(field, QueryDSL)` 함수를 사용하면 `match_phrase`, `geoshape` 등 SQL로 표현할 수 없는 일부 쿼리를 ES로 푸시다운하여 필터링할 수 있습니다. `esquery`의 첫 번째 컬럼 이름 매개변수는 `index`를 연결하는 데 사용되며, 두 번째 매개변수는 ES의 기본 `Query DSL`을 JSON으로 표현한 것으로 중괄호 `{}`로 묶습니다. JSON의 `root key`는 정확히 하나만 있어야 하며, `match_phrase`, `geo_shape`, `bool` 등이 여기에 해당합니다.

`match_phrase` 쿼리:

```sql
select * from es_table where esquery(k4, '{
        "match_phrase": {
           "k4": "doris on es"
        }
    }');
```

`geo` 관련 쿼리:

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

`bool` 쿼리:

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

### 시간 타입 필드 사용 권장 사항 {#time-type-field-usage-recommendations}

ES 외부 테이블에만 적용됩니다. ES Catalog에서는 날짜 타입이 Date 또는 Datetime으로 자동 매핑됩니다.

ES에서는 시간 타입 필드를 매우 유연하게 사용할 수 있지만, ES 외부 테이블에서는 시간 타입 필드를 올바르게 구성하지 않으면 필터 조건을 푸시다운할 수 없습니다.

인덱스를 생성할 때 형식 호환성을 최대한 확보하려면 시간 타입 형식을 다음과 같이 설정하세요:

```json
 "dt": {
     "type": "date",
     "format": "yyyy-MM-dd HH:mm:ss||yyyy-MM-dd||epoch_millis"
 }
```

이 필드를 Doris에 정의할 때는 `date` 또는 `datetime`으로 설정하는 것을 권장하며, `varchar` 타입으로 설정할 수도 있습니다. 다음 SQL 문을 사용하면 필터 조건을 ES로 직접 푸시다운할 수 있습니다:

```sql
select * from doe where k2 > '2020-06-21';

select * from doe where k2 < '2020-06-21 12:00:00'; 

select * from doe where k2 < 1593497011; 

select * from doe where k2 < now();

select * from doe where k2 < date_format(now(), '%Y-%m-%d');
```

**참고**:

* ES에서 시간 타입 필드의 `format`을 설정하지 않으면 기본 시간 타입 필드 형식은 다음과 같습니다:

  ```sql
  strict_date_optional_time||epoch_millis
  ```

* ES에 적재한 날짜 필드가 타임스탬프인 경우 `ms`로 변환해야 합니다. ES는 내부적으로 타임스탬프를 `ms` 단위로 처리하므로, 변환하지 않으면 ES 외부 테이블에서 표시 오류가 발생합니다.

### ES 메타데이터 필드 ID 가져오기 {#getting-es-metadata-field-id}

문서 데이터 적재 시 `_id`를 지정하지 않으면 ES가 각 문서에 전역적으로 고유한 `_id`(기본 키)를 할당합니다. 사용자가 데이터 적재 시 비즈니스상 특별한 의미가 있는 `_id`를 직접 지정할 수도 있습니다.

ES 외부 테이블에서 이 필드 값을 가져오려면 테이블 생성 시 `_id` 필드를 `varchar` 타입으로 추가하면 됩니다:

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

ES Catalog에서 이 필드 값을 가져오려면 `"mapping_es_id" = "true"`로 설정하세요.

**참고**:

1. `_id` 필드의 필터 조건은 `=`와 `in`만 지원합니다.

2. `_id` 필드는 반드시 `varchar` 타입이어야 합니다.

### 전역적으로 정렬된 쿼리 결과 가져오기 {#getting-globally-ordered-query-results}

관련도 순위나 중요한 콘텐츠의 우선 표시 같은 상황에서는 ES 쿼리 결과를 점수순으로 정렬하면 매우 유용합니다. Doris는 MPP 아키텍처의 이점을 충분히 활용하기 위해 ES 인덱스의 샤드 분포에 따라 데이터를 가져와 쿼리합니다.
전역적으로 정렬된 결과를 얻으려면 단일 지점에서 ES를 쿼리해야 합니다. 이는 세션 변수 `enable_es_parallel_scroll`로 제어할 수 있습니다(기본값은 true).
`enable_es_parallel_scroll=false`를 설정하면 Doris는 `scroll` 쿼리를 `shard_preference` 및 `sort` 정보 없이 ES 클러스터에 전송하여 전역적으로 정렬된 결과를 얻습니다.
참고: 쿼리 결과 집합이 클 때는 주의해서 사용하세요.

### scroll 요청의 batch 크기 변경 {#modifying-scroll-request-batch-size}

기본 `batch` 크기는 `scroll` 요청의 경우 4064입니다. 세션 변수 `batch_size`로 변경할 수 있습니다.

## 자주 묻는 질문 {#frequently-asked-questions}

1. **X-Pack 인증을 사용하는 ES 클러스터를 지원하나요?**

   HTTP Basic 인증을 사용하는 모든 ES 클러스터를 지원합니다.

2. **일부 쿼리가 ES에 직접 요청할 때보다 훨씬 느립니다**

   그렇습니다. 예를 들어 \_count 관련 쿼리가 그렇습니다. ES는 실제 데이터를 필터링하지 않고 조건에 맞는 문서 수와 관련된 메타데이터를 내부에서 직접 읽습니다.

3. **집계 연산을 푸시다운할 수 있나요?**

   Doris On ES는 현재 sum, avg, min/max 등의 집계 연산 푸시다운을 지원하지 않습니다. 조건에 맞는 모든 문서를 ES에서 배치로 스트리밍한 후 Doris에서 계산합니다.

## 부록 {#appendix}

### Doris의 ES 쿼리 원리 {#principle-of-doris-querying-es}

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

1. FE는 테이블 생성 시 지정한 hosts에 요청하여 모든 노드의 HTTP 포트 정보, 인덱스의 샤드 분포 정보 등을 가져옵니다. 요청이 실패하면 성공하거나 모든 요청이 실패할 때까지 호스트 목록을 순서대로 탐색합니다.

2. 쿼리 시 FE가 가져온 노드 정보와 인덱스 메타데이터 정보를 바탕으로 쿼리 계획을 생성하여 해당 BE 노드로 전송합니다.

3. BE 노드는 `proximity principle`에 따라 먼저 로컬에 배포된 ES 노드에 요청합니다. BE는 `HTTP Scroll` 방식으로 `_source` 또는 `docvalue`에서 데이터를 스트리밍하여 ES 인덱스의 각 샤드에서 동시에 데이터를 가져옵니다.

4. Doris는 계산을 완료한 후 사용자에게 결과를 반환합니다.
