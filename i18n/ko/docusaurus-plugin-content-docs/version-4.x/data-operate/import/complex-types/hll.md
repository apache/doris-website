---
{
    "title": "HLL",
    "language": "ko",
    "description": "Stream Load와 hll_hash 함수를 함께 사용하여 Doris HLL 컬럼에 데이터를 적재하고, 대용량 데이터의 고유값 수를 빠르게 근사 집계하는 방법을 설명합니다.",
    "keywords": [
        "HLL",
        "HyperLogLog",
        "근사 고유값 수 집계",
        "근사 중복 제거",
        "hll_hash",
        "hll_cardinality",
        "Stream Load",
        "Count Distinct",
        "UV 통계",
        "Doris 복합 타입 데이터 적재"
    ]
}
---

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Approximate distinct counting on large data volumes / UV statistics / HLL column data import -->

HLL (HyperLogLog)은 Doris에서 **근사 고유값 수 집계**를 위해 제공하는 데이터 타입입니다. 대용량 데이터에서 HLL은 `Count Distinct`보다 중복 제거 성능이 훨씬 뛰어나며, UV 통계와 순 사용자 수 집계 등에 널리 사용됩니다.

원시 값을 HLL 컬럼에 직접 기록할 수 없으므로, 데이터를 적재할 때 `hll_hash` 등의 함수로 해시 처리해야 합니다. HLL 타입에 대한 자세한 내용은 [HLL](../../../sql-manual/basic-element/sql-data-types/aggregate/HLL)을 참조하세요.

## 적용 시나리오 {#applicable-scenarios}

| 시나리오 | 설명 |
| --- | --- |
| 대규모 데이터의 UV 통계 | 예를 들어, 일간 및 월간 활성 순 사용자 수 추정 |
| 대용량 데이터의 고유값 수 집계 | 데이터 규모가 백만 건을 넘고 약간의 오차를 허용할 수 있는 경우 |
| Count Distinct 대체 | 오차를 허용 범위 내로 유지하면서 연산 비용을 크게 절감 |

## 작업 흐름 개요 {#workflow-overview}

HLL 데이터 적재의 전체 작업 흐름은 다음 4단계로 구성됩니다.

1. 적재할 원본 데이터 파일을 준비합니다.
2. Doris에 HLL 컬럼이 포함된 대상 테이블을 생성합니다.
3. Stream Load와 `hll_hash` 함수를 함께 사용하여 데이터를 적재합니다.
4. `hll_cardinality`로 적재 결과를 확인합니다.

## 예제 {#example}

### 1단계: 데이터 준비 {#step-1-prepare-the-data}

다음 내용으로 원본 데이터 파일 `test_hll.csv`를 생성합니다.

```sql
1001|koga
1002|nijg
1003|lojn
1004|lofn
1005|jfin
1006|kon
1007|nhga
1008|nfubg
1009|huang
1010|buag
```

### 2단계: 데이터베이스에 테이블 생성 {#step-2-create-the-table-in-the-database}

대상 데이터베이스에 HLL 컬럼이 포함된 집계 모델 테이블을 생성합니다.

```sql
CREATE TABLE testdb.test_hll(
    typ_id           BIGINT          NULL   COMMENT "ID",
    typ_name         VARCHAR(10)     NULL   COMMENT "NAME",
    pv               hll hll_union   NOT NULL   COMMENT "hll"
)
AGGREGATE KEY(typ_id,typ_name)
DISTRIBUTED BY HASH(typ_id) BUCKETS 10;
```

참고:

- HLL 컬럼은 집계 함수 `hll_union`과 함께 사용해야 합니다.
- 테이블 모델은 `AGGREGATE KEY`여야 합니다.

### 3단계: 데이터 적재 {#step-3-import-the-data}

Stream Load로 데이터를 적재합니다. `columns` 파라미터를 사용하여 `hll_hash`를 원본 컬럼 `typ_id`에 적용하고 그 결과를 `pv` 컬럼에 기록합니다.

```sql
curl --location-trusted -u <doris_user>:<doris_password> \
    -H "column_separator:|" \
    -H "columns:typ_id,typ_name,pv=hll_hash(typ_id)" \
    -T test_hll.csv \
    -XPUT http://<fe_ip>:<fe_http_port>/api/testdb/test_hll/_stream_load
```

주요 파라미터 설명:

| 파라미터 | 설명 |
| --- | --- |
| `column_separator` | 원본 파일의 컬럼 구분자입니다. 이 예제에서는 `|`를 사용합니다. |
| `columns` | 필드 매핑 표현식입니다. HLL 컬럼은 `hll_hash()`로 변환해야 합니다. |
| `<doris_user>` / `<doris_password>` | Doris 사용자 이름과 비밀번호입니다. |
| `<fe_ip>` / `<fe_http_port>` | FE 노드의 IP 주소와 HTTP 포트입니다. |

### 4단계: 적재된 데이터 확인 {#step-4-verify-the-imported-data}

`hll_cardinality` 함수를 사용하여 HLL 컬럼의 고유값 수 집계 결과를 쿼리합니다.

```sql
mysql> select typ_id,typ_name,hll_cardinality(pv) from testdb.test_hll;
+--------+----------+---------------------+
| typ_id | typ_name | hll_cardinality(pv) |
+--------+----------+---------------------+
|   1010 | buag     |                   1 |
|   1002 | nijg     |                   1 |
|   1001 | koga     |                   1 |
|   1008 | nfubg    |                   1 |
|   1005 | jfin     |                   1 |
|   1009 | huang    |                   1 |
|   1004 | lofn     |                   1 |
|   1007 | nhga     |                   1 |
|   1003 | lojn     |                   1 |
|   1006 | kon      |                   1 |
+--------+----------+---------------------+
10 rows in set (0.06 sec)
```

결과에서 모든 행의 HLL 컬럼 카디널리티가 1임을 확인할 수 있습니다. 이는 데이터가 올바르게 적재되었으며 `hll_hash`로 해시 처리되었음을 의미합니다.

## 자주 묻는 질문 {#faq}

### HLL 컬럼에 hll_hash를 사용해야 하는 이유는 무엇인가요? {#why-must-hll-columns-use-hll_hash}

HLL은 특수한 바이너리 집계 타입으로, 원시 값을 직접 저장할 수 없습니다. 원시 값은 먼저 `hll_hash`를 통해 HLL 내부 표현으로 변환한 후 HLL 컬럼에 기록해야 합니다.

### HLL과 Count Distinct의 차이점은 무엇인가요? {#what-is-the-difference-between-hll-and-count-distinct}

| 비교 항목 | HLL | Count Distinct |
| --- | --- | --- |
| 정확도 | 근사값(약간의 오차 존재) | 정확한 값 |
| 성능 | 대용량 데이터에서 훨씬 뛰어남 | 대용량 데이터에서 성능이 눈에 띄게 저하됨 |
| 저장 공간 | 고정된 크기의 비교적 적은 공간 사용 | 추가 저장 공간 불필요 |
| 적용 시나리오 | UV 추정 등 일부 오차를 허용할 수 있는 경우 | 정확한 고유값 수 집계가 필요한 경우 |

### HLL 컬럼을 생성할 때 어떤 테이블 모델을 사용해야 하나요? {#what-table-model-is-required-when-creating-an-hll-column}

HLL 컬럼은 집계 함수 `hll_union`에 의존하므로 `AGGREGATE KEY` 집계 모델 테이블에서 사용해야 합니다.
