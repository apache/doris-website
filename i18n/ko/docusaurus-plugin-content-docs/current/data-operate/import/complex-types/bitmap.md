---
{
    "title": "BITMAP",
    "language": "ko",
    "description": "Apache Doris에서 BITMAP 데이터를 적재하는 방법을 알아봅니다. 테이블 설계 규칙, Stream Load 예제, 여러 원소가 포함된 비트맵을 적재하는 두 가지 방법을 설명합니다.",
    "keywords": [
        "Doris BITMAP",
        "BITMAP 데이터 적재",
        "BITMAP_UNION",
        "to_bitmap",
        "bitmap_from_string",
        "bitmap_from_array",
        "Stream Load Bitmap",
        "Aggregate 테이블 Bitmap"
    ]
}
---

<!-- Knowledge type: Procedure + Configuration parameters -->
<!-- Applicable scenarios: BITMAP data loading / exact deduplication / user profile tags -->

BITMAP 타입은 정확한 중복 제거, 사용자 프로필 태그 등의 시나리오에서 흔히 사용됩니다. 이 문서에서는 Apache Doris의 BITMAP 컬럼에 대한 테이블 설계 규칙을 설명하고, Stream Load를 통해 단일 값과 여러 원소를 적재하는 두 가지 방법을 보여 줍니다.

## BITMAP 타입 제약 사항 {#bitmap-type-constraints}

BITMAP 데이터를 적재하기 전에 다음 제약 사항을 확인하세요.

| 제약 사항 | 설명 |
| --- | --- |
| 지원하는 테이블 모델 | Duplicate 테이블, Unique 테이블, Aggregate 테이블 |
| 컬럼 위치 | Value 컬럼으로만 사용할 수 있으며, Key 컬럼으로는 사용할 수 없음 |
| Aggregate 테이블 요구 사항 | Aggregate 테이블의 BITMAP 컬럼은 집계 타입으로 `BITMAP_UNION`을 사용해야 함 |
| 길이 및 기본값 | 길이나 기본값을 지정할 필요가 없으며, 시스템이 집계 수준에 따라 길이를 자동으로 조정함 |

타입에 대한 자세한 내용은 [BITMAP 데이터 타입](../../../sql-manual/basic-element/sql-data-types/aggregate/BITMAP)을 참조하세요.

## 시나리오 1: 단일 값 BITMAP 데이터 적재 {#scenario-1-loading-single-value-bitmap-data}

원본 데이터의 각 행에 정수 값이 하나만 포함된 경우에 적용됩니다. `to_bitmap` 함수를 사용하여 정수를 BITMAP으로 변환합니다.

### 단계 1: 데이터 준비 {#step-1-prepare-the-data}

각 행에 정수 값이 하나씩 포함된 CSV 파일 `test_bitmap.csv`를 생성합니다.

```text
1|koga|17723
2|nijg|146285
3|lojn|347890
4|lofn|489871
5|jfin|545679
6|kon|676724
7|nhga|767689
8|nfubg|879878
9|huang|969798
10|buag|97997
```

### 단계 2: 대상 테이블 생성 {#step-2-create-the-target-table}

`testdb` 데이터베이스에 BITMAP 컬럼이 있는 Aggregate 테이블을 생성합니다.

```sql
CREATE TABLE testdb.test_bitmap(
    typ_id     BIGINT                NULL   COMMENT "ID",
    hou        VARCHAR(10)           NULL   COMMENT "one",
    arr        BITMAP  BITMAP_UNION  NOT NULL   COMMENT "two"
)
AGGREGATE KEY(typ_id,hou)
DISTRIBUTED BY HASH(typ_id,hou) BUCKETS 10;
```

### 단계 3: Stream Load 실행 {#step-3-run-stream-load}

`to_bitmap` 함수를 사용하여 정수 컬럼을 BITMAP으로 변환합니다.

```shell
curl --location-trusted -u <doris_user>:<doris_password> \
    -H "column_separator:|" \
    -H "columns:typ_id,hou,arr,arr=to_bitmap(arr)" \
    -T test_bitmap.csv \
    -XPUT http://<fe_ip>:<fe_http_port>/api/testdb/test_bitmap/_stream_load
```

### 단계 4: 데이터 적재 결과 확인 {#step-4-verify-the-load-result}

`bitmap_to_string`을 사용하여 BITMAP을 다시 문자열로 변환하고 적재된 데이터를 확인합니다.

```sql
mysql> select typ_id,hou,bitmap_to_string(arr) from testdb.test_bitmap;
+--------+-------+-----------------------+
| typ_id | hou   | bitmap_to_string(arr) |
+--------+-------+-----------------------+
|      4 | lofn  | 489871                |
|      6 | kon   | 676724                |
|      9 | huang | 969798                |
|      3 | lojn  | 347890                |
|      8 | nfubg | 879878                |
|      7 | nhga  | 767689                |
|      1 | koga  | 17723                 |
|      2 | nijg  | 146285                |
|      5 | jfin  | 545679                |
|     10 | buag  | 97997                 |
+--------+-------+-----------------------+
10 rows in set (0.07 sec)
```

## 시나리오 2: 여러 원소가 포함된 BITMAP 데이터 적재 {#scenario-2-loading-multi-element-bitmap-data}

원본 데이터의 각 행에 여러 정수(예: 여러 사용자 ID)가 포함된 경우, 원본 파일 형식에 따라 다음 두 가지 방법 중 하나를 선택합니다. 두 방법의 차이점은 다음과 같습니다.

| 방법 | 원본 파일 형식 | 타입 변환 필요 여부 | 참고 사항 |
| --- | --- | --- | --- |
| `bitmap_from_string` | 쉼표로 구분하며, 대괄호는 **허용되지 않음** | 불필요 | 대괄호는 데이터 품질 오류로 처리됨 |
| `bitmap_from_array` | 쉼표로 구분하며, 대괄호가 **허용됨** | `cast`를 사용해 `array<int>`로 변환해야 함 | 타입 변환을 하지 않으면 함수 시그니처가 일치하지 않아 데이터 적재에 실패함 |

### 방법 A: bitmap_from_string 사용 {#method-a-using-bitmap_from_string}

#### 데이터 형식 요구 사항 {#data-format-requirements}

원본 파일의 `arr` 컬럼은 쉼표를 구분자로 사용하며, 대괄호를 포함해서는 안 됩니다.

```text
1|koga|17,723
2|nijg|146,285
3|lojn|347,890
4|lofn|489,871
5|jfin|545,679
6|kon|676,724
7|nhga|767,689
8|nfubg|879,878
9|huang|969,798
10|buag|97,997
```

#### Stream Load 명령 {#stream-load-command}

```shell
curl --location-trusted -u <doris_user>:<doris_password> \
    -H "column_separator:|" \
    -H "columns:typ_id,hou,arr,arr=bitmap_from_string(arr)" \
    -T test_bitmap.csv \
    -XPUT http://<fe_ip>:<fe_http_port>/api/testdb/test_bitmap/_stream_load
```

### 방법 B: bitmap_from_array 사용 {#method-b-using-bitmap_from_array}

#### 데이터 형식 요구 사항 {#data-format-requirements-1}

원본 파일의 `arr` 컬럼에는 대괄호를 포함할 수 있습니다.

```text
1|koga|[17,723]
2|nijg|[146,285]
3|lojn|[347,890]
4|lofn|[489,871]
5|jfin|[545,679]
6|kon|[676,724]
7|nhga|[767,689]
8|nfubg|[879,878]
9|huang|[969,798]
10|buag|[97,997]
```

#### Stream Load 명령 {#stream-load-command-1}

Stream Load에서는 먼저 `cast`를 사용하여 문자열을 `array<int>`로 변환한 다음, `bitmap_from_array`로 변환해야 합니다.

```shell
curl --location-trusted -u <doris_user>:<doris_password> \
    -H "column_separator:|" \
    -H "columns:typ_id,hou,arr_str,arr=bitmap_from_array(cast(arr_str as array<int>))" \
    -T test_bitmap.csv \
    -XPUT http://<fe_ip>:<fe_http_port>/api/testdb/test_bitmap/_stream_load
```

## 문제 해결 {#troubleshooting}

### bitmap_from_array 사용 시 함수가 존재하지 않는다는 오류 {#function-does-not-exist-error-when-using-bitmap_from_array}

오류 예시:

```text
[ANALYSIS_ERROR]TStatus: errCode = 2, detailMessage = Does not support non-builtin functions, or function does not exist: bitmap_from_array(<slot 8>)
```

- **원인**: 문자열을 `array<int>`로 명시적으로 변환하지 않아 `bitmap_from_array`에 일치하는 함수 시그니처를 찾을 수 없습니다.
- **해결 방법**: Stream Load의 `columns` 매개변수에서 `cast(arr_str as array<int>)`를 사용하여 명시적으로 변환합니다.

### 쿼리에서 BITMAP 컬럼의 내용을 확인하는 방법 {#how-to-view-bitmap-column-contents-in-queries}

BITMAP은 바이너리 집계 타입이므로 `SELECT`로 직접 내용을 확인할 수 없습니다. 다음 함수를 사용하여 변환해야 합니다.

- `bitmap_to_string(col)`: BITMAP을 쉼표로 구분된 문자열로 변환합니다.
- `bitmap_count(col)`: BITMAP에 포함된 고유 원소의 개수를 반환합니다.

### BITMAP을 Key 컬럼으로 사용할 수 없는 이유 {#why-bitmap-cannot-be-used-as-a-key-column}

BITMAP은 집계용 바이너리 타입입니다. 정렬이나 중복 제거를 위한 Key 컬럼으로는 사용할 수 없으며, 집계 결과를 담는 Value 컬럼으로만 저장할 수 있습니다.
