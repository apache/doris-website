---
{
    "title": "BITMAP을 사용한 정확한 중복 제거",
    "language": "ko",
    "description": "정확한 중복 제거를 위해 COUNT DISTINCT를 Bitmap으로 대체하려면 어떻게 해야 할까요? 이 문서에서는 테이블 생성, 데이터 적재, 쿼리의 전체 과정을 설명합니다.",
    "keywords": [
        "BITMAP 정확한 중복 제거",
        "COUNT DISTINCT 최적화",
        "BITMAP_UNION",
        "bitmap_union_count",
        "Doris 중복 제거 가속",
        "RoaringBitmap"
    ]
}
---

<!-- Knowledge type: Capability definition / Procedure -->
<!-- Applicable scenario: Precise deduplication on large data volumes / Query performance tuning -->

BITMAP을 사용한 정확한 중복 제거는 비트맵 데이터 구조로 `COUNT DISTINCT`를 대체하여 대용량 데이터에서 정확한 중복 제거를 빠르게 수행하는 기능입니다. `COUNT DISTINCT`와 비교하면 Bitmap을 사용한 정확한 중복 제거는 다음과 같은 장점이 있습니다.

- 더 빠른 쿼리 속도
- 더 적은 메모리 및 디스크 사용량

## COUNT DISTINCT 구현 방식 {#how-count-distinct-is-implemented}

<!-- Knowledge type: Background and principles -->

기존의 정확한 중복 제거는 `count distinct`를 사용합니다. 원본 데이터가 다음과 같고, `name` 컬럼에서 정확한 중복 제거를 수행해야 한다고 가정해 보겠습니다.

| id   | name |
| ---- | ---- |
| 1    | bob  |
| 2    | alex |
| 3    | jack |
| 4    | tom  |
| 5    | bob  |
| 6    | alex |

`select count(distinct name) from t`를 실행하면 Doris는 다음 그림과 같이 결과를 계산합니다. 먼저 `group by`를 `name` 컬럼에 적용하여 첫 번째 단계의 중복 제거를 수행합니다. 그런 다음 데이터를 셔플하여 두 번째 단계의 중복 제거를 수행하고, 마지막으로 `count`를 계산합니다.

![고유 값 개수 계산](/images/next/query-acceleration/count-distinct.jpg)

`COUNT DISTINCT`는 계산 중에 상세 데이터를 유지해야 하고 셔플이 필요하므로 데이터 양이 늘어날수록 쿼리가 느려집니다. Bitmap을 사용한 정확한 중복 제거는 대용량 데이터에서 발생하는 `COUNT DISTINCT`의 성능 문제를 해결하기 위해 설계되었습니다.

### 활용 사례 {#use-cases}

<!-- Knowledge type: Architectural decision -->
<!-- Applicable scenario: Selection decision -->

Bitmap은 상세 데이터를 비트 위치에 매핑합니다. 상세 데이터를 유연하게 활용하는 데는 제약이 생기지만 계산 효율은 크게 높아집니다. 다음과 같은 상황에서 Bitmap을 사용한 정확한 중복 제거를 고려할 수 있습니다.

| 활용 사례 | 설명 |
| --- | --- |
| 쿼리 가속 | Bitmap은 비트 연산으로 쿼리를 계산하므로 높은 성능을 제공합니다 |
| 압축 저장 | 각 상세 레코드를 하나의 비트로 압축하므로 상세 데이터를 그대로 저장할 때보다 디스크 및 메모리 사용량이 훨씬 적습니다 |

**제약 사항**:

- Bitmap은 `TINYINT`, `SMALLINT`, `INT`, `BIGINT` 데이터 타입에 대해서만 정확한 중복 제거를 지원합니다
- 다른 데이터 타입에서 정확한 중복 제거를 수행하려면 전역 딕셔너리를 추가로 구축해야 합니다
- Bitmap 타입의 컬럼은 Key 컬럼으로 사용할 수 없습니다

> Doris는 RoaringBitmap을 기반으로 Bitmap의 정확한 중복 제거를 구현합니다. 기반 원리와 자세한 내용은 [RoaringBitmap](https://roaringbitmap.org/)을 참조하세요.

## BITMAP을 사용한 정확한 중복 제거 수행 {#performing-precise-deduplication-with-bitmap}

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Create table -> Load data -> Query -->

전체 과정은 **테이블 생성 -> 데이터 적재 -> 데이터 쿼리**의 세 단계로 구성됩니다.

### 1단계: 테이블 생성 {#step-1-create-the-table}

**목표**: 대상 컬럼을 Bitmap 타입으로 선언하고 집계 함수 `BITMAP_UNION`을 설정합니다.

**참고 사항**:

1. Bitmap으로 중복을 제거할 때는 대상 컬럼의 타입을 `Bitmap`으로, 집계 함수를 `BITMAP_UNION`으로 설정해야 하며, 이는 `CREATE TABLE` 문에서 지정합니다
2. Bitmap 타입의 컬럼은 Key 컬럼으로 사용할 수 없습니다

**예제**: 집계 테이블 `test_bitmap`을 생성합니다. 여기서 `id` 컬럼은 방문 사용자 ID를 나타내며, `uv` 컬럼은 `BITMAP` 타입이고 집계 함수 `BITMAP_UNION`을 사용하여 데이터를 집계합니다.

```SQL
create table test_bitmap(
        dt date,
        id int,
        name char(10),
        province char(10),
        os char(10),
        uv bitmap bitmap_union
)
Aggregate KEY (dt,id,name,province,os)
distributed by hash(id) buckets 10;
```

### 2단계: 데이터 적재 {#step-2-load-data}

**목표**: Stream Load로 원본 상세 데이터를 적재하고, 적재 중에 `to_bitmap(id)`를 사용하여 Bitmap 타입으로 변환합니다.

**샘플 데이터** (`test_bitmap.csv`):

```SQL
2022-05-05,10001,test 01,Beijing,windows 
2022-05-05,10002,test 01,Beijing,linux 
2022-05-05,10003,test 01,Beijing,macos 
2022-05-05,10004,test 01,Hebei,windows 
2022-05-06,10001,test 01,Shanghai,windows 
2022-05-06,10002,test 01,Shanghai,linux 
2022-05-06,10003,test 01,Jiangsu,macos 
2022-05-06,10004,test 01,Shaanxi,windows
```

**Stream Load 명령어**:

```SQL
curl --location-trusted -u root: -H "label:label_test_bitmap_load" \
    -H "column_separator:," \
    -H "columns:dt,id,name,province,os, uv=to_bitmap(id)" -T test_bitmap.csv http://fe_IP:8030/api/demo/test_bitmap/_stream_load
```

### 3단계: 데이터 쿼리 {#step-3-query-the-data}

**목표**: 집계 함수 `bitmap_union_count`를 사용하여 Bitmap 컬럼의 중복 제거 결과를 읽습니다.

> Bitmap 컬럼의 원시 값은 직접 쿼리할 수 없으며, 집계 함수 `bitmap_union_count`를 통해서만 쿼리할 수 있습니다.

**시나리오 1: 전체 UV**

```SQL
mysql> select bitmap_union_count(uv) from test_bitmap;
+---------------------+
| bitmap_union_count(`uv`) |
+---------------------+
|                   4 |
+---------------------+
1 row in set (0.00 sec)
```

이는 다음과 동일합니다.

```SQL
mysql> SELECT COUNT(DISTINCT id) FROM test_bitmap;
+----------------------+
| count(DISTINCT `id`) |
+----------------------+
|                    4 |
+----------------------+
1 row in set (0.01 sec)
```

**시나리오 2: 일별 UV**

```SQL
mysql> select bitmap_union_count(uv) from test_bitmap group by dt;
+---------------------+
| bitmap_union_count(`uv`) |
+---------------------+
|                   4 |
|                   4 |
+---------------------+
2 rows in set (0.01 sec)
```

## 자주 묻는 질문 {#faq}

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenario: Common issues -->

**질문1: Bitmap은 어떤 데이터 타입의 정확한 중복 제거를 지원하나요?**

`TINYINT`, `SMALLINT`, `INT`, `BIGINT`만 지원합니다. 문자열이나 다른 타입의 중복을 제거하려면 전역 딕셔너리를 추가로 구축해야 합니다.

**질문2: Bitmap 컬럼을 Key 컬럼으로 사용할 수 있나요?**

아니요. Bitmap 타입의 컬럼은 Value 컬럼으로만 사용할 수 있으며, 반드시 집계 함수 `BITMAP_UNION`과 함께 사용해야 합니다.

**질문3: Bitmap 컬럼의 원시 값을 직접 쿼리할 수 없는 이유는 무엇인가요?**

Bitmap은 비트맵 구조로, 상세 데이터를 저장하지 않습니다. `bitmap_union_count`와 같은 집계 함수를 통해 중복 제거 결과를 읽어야 합니다.

**질문4: Bitmap은 COUNT DISTINCT에 비해 어떤 장점이 있나요?**

| 비교 항목 | COUNT DISTINCT | BITMAP을 사용한 정확한 중복 제거 |
| --- | --- | --- |
| 계산 방식 | 상세 데이터 유지 + 셔플을 통한 중복 제거 | 비트 연산 |
| 쿼리 속도 | 대용량 데이터에서 느려짐 | 훨씬 빠름 |
| 리소스 사용량 | 상세 데이터가 많은 리소스를 사용함 | 디스크 및 메모리 사용량이 적음 |
| 데이터 타입 | 모든 타입 | 정수 타입만 지원하며, 다른 타입은 전역 딕셔너리가 필요함 |
