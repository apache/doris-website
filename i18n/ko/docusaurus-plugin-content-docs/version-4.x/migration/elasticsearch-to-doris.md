---
{
    "title": "Elasticsearch에서 Doris로",
    "language": "ko",
    "description": "ES Catalog를 통해 인덱스를 복사하고 필드, 문서 ID, 검색 동작을 검증합니다."
}
---

ES Catalog로 Elasticsearch 인덱스를 쿼리한 다음, `INSERT INTO ... SELECT`로 선택한 컬럼을 Doris 내부 테이블에 복사합니다. 이 예제는 소규모 일회성 마이그레이션이며, 이후 발생하는 업데이트나 삭제를 지속적으로 반영하지 않습니다. 검색 워크로드에서는 분석기, 점수 산정, 중첩 객체, 쿼리 동작도 별도로 검증해야 합니다.

## 사전 요구 사항 {#prerequisites}

이 예제는 Elasticsearch 7.x 또는 8.x의 typeless mapping API를 사용합니다. 다른 소스 버전에서는 인덱스 설정을 조정하고 Catalog가 지원하는 버전 범위를 확인하세요.

- 접근 가능한 Elasticsearch 클러스터와 예제 인덱스를 생성하고 쓰고 읽을 수 있는 계정. 운영 환경의 마이그레이션 계정에는 Catalog 메타데이터 권한도 필요합니다. [ES Catalog](../lakehouse/catalogs/es-catalog.md)를 참조하세요.
- 모든 Doris FE/BE에서 ES로 연결할 수 있는 네트워크 환경과 Catalog, 데이터베이스, 테이블 생성, 외부 테이블 읽기, 대상에 대한 데이터 적재 권한이 있는 Doris 계정.
- 비어 있는 대상 테이블. 연결 주소와 인증 정보를 환경에 맞게 바꾸세요. 예제를 간단하게 유지하기 위해 복제본과 버킷은 각각 하나만 사용합니다.

## 기본 사용법 {#basic-usage}

### 1. 소스 인덱스 준비 {#1-prepare-the-source-index}

Elasticsearch Dev Tools 또는 이에 준하는 HTTP 클라이언트에서 실행하세요.

```http
PUT /migration_demo
{
  "mappings": {
    "properties": {
      "title": { "type": "keyword" }
    }
  }
}

PUT /migration_demo/_doc/one?refresh=true
{ "title": "first" }

PUT /migration_demo/_doc/two?refresh=true
{ "title": "second" }
```

예상 결과: 인덱스에 ID가 `one`과 `two`인 검색 가능한 문서 두 개가 있습니다.

### 2. Catalog 생성 및 문서 ID 보존 {#2-create-the-catalog-and-preserve-document-ids}

```sql
CREATE CATALOG migration_es PROPERTIES (
    'type' = 'es',
    'hosts' = 'http://es-host:9200',
    'user' = '<es_user>',
    'password' = '<es_password>',
    'mapping_es_id' = 'true'
);
DESC migration_es.default_db.migration_demo;

CREATE DATABASE IF NOT EXISTS migration_target;
CREATE TABLE migration_target.es_demo (
    doc_id VARCHAR(512),
    title STRING
)
DUPLICATE KEY(doc_id)
DISTRIBUTED BY HASH(doc_id) BUCKETS 1
PROPERTIES ('replication_num' = '1');

INSERT INTO migration_target.es_demo (doc_id, title)
SELECT _id, title FROM migration_es.default_db.migration_demo;

SELECT doc_id, title FROM migration_target.es_demo ORDER BY doc_id;
```

```text
+--------+--------+
| doc_id | title  |
+--------+--------+
| one    | first  |
| two    | second |
+--------+--------+
```

## 옵션 참조 {#options-reference}

| 매개변수 | 타입 | 필수 여부 | 기본값 | 설명 |
| --- | --- | --- | --- | --- |
| `hosts` | STRING | 예 | 없음 | 모든 FE/BE에서 접근할 수 있는 ES HTTP 주소 |
| `user` / `password` | STRING | ES 인증 방식에 따라 다름 | 빈 값 | Basic 인증이 활성화된 경우 사용할 인증 정보 |
| `mapping_es_id` | boolean | 아니요 | `false` | 문서의 `_id`를 노출하며, 이 예제에서는 활성화됨 |
| `enable_docvalue_scan` | boolean | 아니요 | `true` | 지원되는 필드에 대해 doc-values 읽기를 시도함 |
| `nodes_discovery` | boolean | 아니요 | `true` | 노드를 검색하며, 격리된 네트워크에서는 비활성화해야 할 수 있음 |

전체 매개변수, 인증, 배열 어노테이션에 대한 내용은 [ES Catalog](../lakehouse/catalogs/es-catalog.md)를 참조하세요.

## 데이터 타입과 검색 동작 {#types-and-search-semantics}

- ES Catalog는 `object`와 `nested`를 JSON으로 매핑하며, VARIANT로 자동 매핑하지 않습니다. 다른 대상 타입을 사용하려면 명시적으로 변환하고 테스트하세요.
- ES 필드에는 스칼라와 배열이 모두 포함될 수 있습니다. 문서에 따라 `_meta.doris.array_fields`를 설정하고, `DESC`를 확인하고, 문서 하나로 전체 컬럼을 추론하기보다 실제 샘플을 살펴보세요.
- 날짜 형식, 시간대, 숫자 범위, 누락된 필드를 검증하세요. 분석기를 거친 `text` 필드는 정확한 일치 검색에 사용되는 `keyword` 필드와 다릅니다.
- Doris의 [역색인](../table-design/index/inverted-index/overview.md)은 전문 검색을 지원하지만, ES DSL, 점수 산정, 중첩 쿼리, 분석기의 동작이 자동으로 동일해지는 것은 아닙니다. 구문을 기계적으로 치환하기보다 실제 쿼리 결과를 테스트하세요.

## 검증 및 오류 {#validation-and-errors}

소스에 쓰기가 발생하지 않는 시간대에 문서 수와 고유한 `_id` 수를 비교하세요. 이 예제에서는 둘 다 2여야 합니다. 원본 `_source` 샘플을 대상 컬럼과 비교하고, 누락된 값, JSON 배열, 날짜도 확인하세요.

메타데이터 오류가 발생하면 index-read, cluster-state 및 노드 HTTP 권한을 확인하세요. 페이징에 실패하면 소스 노드 연결과 노드 검색 설정을 확인하세요. 마이그레이션 중 인덱스가 변경되면 일관성에 영향을 줄 수 있으므로, 안정적인 스냅샷을 확보하거나 쓰기가 발생하지 않는 시간대를 정하세요. INSERT를 반복하면 행이 추가되므로, 재개하기 전에 이미 가져온 범위를 확인하세요.

## 권장 사항 {#best-practices}

배치 처리로 규모를 확장하기 전에 필드 읽기와 검색 동작을 검증하세요. 지속적으로 미러링하려면 업데이트, 삭제, 처리 순서, 문서 ID를 기준으로 한 재처리 방식을 별도로 설계해야 합니다. Catalog는 CDC 작업이 아닙니다. 전환 지침은 [마이그레이션 개요](./overview.md)를 참조하세요.
