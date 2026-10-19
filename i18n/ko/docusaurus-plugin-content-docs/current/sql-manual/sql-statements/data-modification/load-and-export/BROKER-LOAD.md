---
{
    "title": "BROKER LOAD",
    "language": "ko",
    "description": "Broker Load는 Doris의 데이터 적재 방식으로, 주로 HDFS나 S3와 같은 원격 스토리지 시스템에서 대규모 데이터를 적재하는 데 사용됩니다."
}
---

## 설명 {#description}

Broker Load는 Doris의 데이터 적재 방식으로, 주로 HDFS나 S3와 같은 원격 스토리지 시스템에서 대규모 데이터를 적재하는 데 사용됩니다. MySQL API를 통해 시작하는 비동기 데이터 적재 방식입니다. `SHOW LOAD` 문을 사용하여 데이터 적재 진행 상황과 결과를 쿼리할 수 있습니다.

이전 버전에서는 S3 Load와 HDFS Load가 Broker 프로세스에 의존했습니다. 현재는 별도의 Broker 프로세스에 의존하지 않고 데이터 소스에서 직접 데이터를 읽습니다. 다만 구문이 유사하므로 S3 Load, HDFS Load, Broker Load를 통틀어 Broker Load라고 합니다.

## 구문 {#syntax}

```sql
LOAD LABEL [<db_name>.]<load_label>
(
[ { MERGE | APPEND | DELETE } ]
DATA INFILE
(
"<file_path>"[, ...]
)
[ NEGATIVE ]
INTO TABLE `<table_name>`
[ PARTITION ( <partition_name> [ , ... ] ) ]
[ COLUMNS TERMINATED BY "<column_separator>" ]
[ LINES TERMINATED BY "<line_delimiter>" ]
[ FORMAT AS "<file_type>" ]
[ COMPRESS_TYPE AS "<compress_type>" ]
[ (<column_list>) ]
[ COLUMNS FROM PATH AS (<column_name> [ , ... ] ) ]
[ SET (<column_mapping>) ]
[ PRECEDING FILTER <predicate> ]
[ WHERE <predicate> ]
[ DELETE ON <expr> ]
[ ORDER BY <source_sequence> ]
[ PROPERTIES ("<key>"="<value>" [, ...] ) ]
)
WITH BROKER "<broker_name>"
(   <broker_properties>
    [ , ... ])
[ PROPERTIES (
    <load_properties>
    [ , ... ]) ]
[COMMENT "<comment>" ];
```

## 필수 매개변수 {#required-parameters}

**1. `<db_name>`**
> 데이터를 적재할 데이터베이스의 이름을 지정합니다.

**2. `<load_label>`**
> 각 데이터 적재 작업에는 고유한 Label을 지정해야 합니다. 이후 이 Label을 사용하여 작업 진행 상황을 쿼리할 수 있습니다.

**3. `<table_name>`**
> 데이터 적재 작업의 대상 테이블을 지정합니다.

**4. `<file_path>`**
> 적재할 파일의 경로를 지정합니다. 여러 경로를 지정할 수 있으며 와일드카드도 사용할 수 있습니다. 경로는 최종적으로 파일과 일치해야 합니다. 디렉터리와만 일치하면 데이터 적재가 실패합니다.

**5. `<broker_name>`**
> 사용할 Broker 서비스의 이름을 지정합니다. 예를 들어 퍼블릭 클라우드 Doris에서 Broker 서비스 이름은 `bos`입니다.

**6. `<broker_properties>`**
> Broker에 필요한 정보를 지정합니다. 일반적으로 이 정보는 Broker가 BOS나 HDFS와 같은 원격 스토리지 시스템에 접근할 수 있도록 하는 데 사용됩니다.
>
>```text
>  (
>      "username" = "user",
>      "password" = "pass",
>      ...
>  )
>```

## 선택 매개변수 {#optional-parameters}

**1. `merge | append | delete`**  
> 데이터 병합 유형입니다. 기본값은 `append`이며, 이번 데이터 적재가 일반적인 추가 쓰기 작업임을 나타냅니다. `merge`와 `delete` 유형은 Unique Key 모델의 테이블에만 적용됩니다. `merge` 유형은 삭제 플래그 컬럼을 표시하기 위해 `[delete on]` 문과 함께 사용해야 합니다. `delete` 유형은 이번에 적재하는 모든 데이터가 삭제 데이터임을 나타냅니다.

**2. `negative`**  
> "음수" 데이터 적재를 나타냅니다. 이 방식은 정수 sum 집계 타입을 사용하는 집계 테이블에만 적용됩니다. 적재할 데이터에서 sum 집계 컬럼에 해당하는 정숫값의 부호를 반전하여 잘못된 데이터를 상쇄하는 데 사용됩니다.

**3. `<partition_name>`**  
> 테이블의 특정 파티션에만 데이터를 적재하도록 지정합니다. 예: `partition (p1, p2,...)`. 파티션 범위 밖의 다른 데이터는 무시됩니다.

**4. `<column_separator>`**  
> 컬럼 구분자를 지정합니다. CSV 형식에서만 유효하며 단일 바이트 구분자만 지정할 수 있습니다.

**5. `<line_delimiter>`**  
> 행 구분자를 지정합니다. CSV 형식에서만 유효하며 단일 바이트 구분자만 지정할 수 있습니다.

**6. `<file_type>`**  
> 파일 형식을 지정하며 `csv`(기본값), `parquet`, `orc` 형식을 지원합니다.

**7. `<compress_type>`**  
> 파일 압축 유형을 지정하며 `gz`, `bz2`, `lz4frame`을 지원합니다.

**8. `<column_list>`**  
> 원본 파일의 컬럼 순서를 지정합니다.

**9. `columns from path as (<c1>, <c2>,...)`**  
> 데이터 적재 파일 경로에서 추출할 컬럼을 지정합니다.

**10. `<column_mapping>`**  
> 컬럼 변환 함수를 지정합니다.

**11. `preceding filter <predicate>`**  
> 먼저 `column list`와 `columns from path as`에 따라 데이터를 원본 데이터 행으로 조합한 뒤, 선행 필터 조건에 따라 필터링합니다.

**12. `where <predicate>`**  
> 조건에 따라 적재할 데이터를 필터링합니다.

**13. `delete on <expr>`**  
> `merge` 데이터 적재 모드와 함께 사용하며, Unique Key 모델의 테이블에만 적용됩니다. 적재할 데이터에서 삭제 플래그를 나타내는 컬럼과 계산 관계를 지정합니다.

**14. `<source_sequence>`**  
> Unique Key 모델의 테이블에만 적용됩니다. 적재할 데이터에서 sequence 컬럼에 해당하는 컬럼을 지정하며, 주로 데이터 적재 시 데이터 순서를 보장하는 데 사용됩니다.

**15. `properties ("<key>"="<value>",...)`**  
> 데이터 적재 파일 형식의 매개변수를 지정하며, CSV, JSON 등의 형식에 적용됩니다. 예를 들어 `json_root`, `jsonpaths`, `fuzzy_parse` 등의 매개변수를 지정할 수 있습니다.  
> `enclose`: 인용 문자입니다. CSV 데이터 필드에 행 구분자나 컬럼 구분자가 포함되어 있으면, 단일 바이트 문자를 인용 문자로 지정하여 데이터가 의도치 않게 잘리는 것을 방지할 수 있습니다. 예를 들어 컬럼 구분자가 ","이고 인용 문자가 "'"이며 데이터가 "a,'b,c'"이면 "b,c"는 하나의 필드로 파싱됩니다.  
> 참고: `enclose`를 `"`로 설정할 때는 `trim_double_quotes`를 `true`로 설정해야 합니다.  
> `escape`: 이스케이프 문자로, 필드에서 인용 문자와 동일한 문자를 이스케이프하는 데 사용됩니다. 예를 들어 데이터가 "a,'b,'c'"이고 인용 문자가 "'"이며 "b,'c"를 하나의 필드로 파싱하려면 `""`와 같은 단일 바이트 이스케이프 문자를 지정한 다음 데이터를 "a,'b,'c'"로 수정해야 합니다.

**16. `<load_properties>`**  
> 선택 매개변수는 다음과 같으며, 실제 환경에 맞게 추가할 수 있습니다.

| 매개변수 | 매개변수 설명 |
| ---------------------- | ------------------------------------------------------------ |
| timeout | 데이터 적재 제한 시간입니다. 기본값은 4시간이며 단위는 초입니다. |
| max_filter_ratio | 데이터 형식 오류 등의 이유로 필터링되는 데이터에 허용되는 최대 비율입니다. 기본적으로 필터링되는 데이터를 허용하지 않으며, 값의 범위는 0부터 1까지입니다. |
| exec_mem_limit | 데이터 적재 메모리 제한입니다. 기본값은 2GB이며 단위는 바이트입니다. |
| strict_mode | 데이터에 엄격한 제약을 적용할지 여부를 지정합니다. 기본값은 `false`입니다. |
| partial_columns | 불리언 타입입니다. `true`로 설정하면 부분 컬럼 업데이트를 사용하며, 기본값은 `false`입니다. 테이블 모델이 Unique이고 Merge on Write를 사용하는 경우에만 설정할 수 있습니다. |
| timezone | 시간대를 지정합니다. 시간대의 영향을 받는 `strftime`, `alignment_timestamp`, `from_unixtime` 등의 함수에 영향을 줍니다. 자세한 내용은 [시간대](../../../../admin-manual/cluster-management/time-zone.md) 문서를 참조하세요. 지정하지 않으면 "Asia/Shanghai"를 사용합니다. |
| load_parallelism | 데이터 적재 동시 실행 수입니다. 기본값은 1입니다. 동시 실행 수를 늘리면 여러 실행 계획이 데이터 적재 작업을 동시에 수행하여 데이터 적재 속도가 빨라집니다. |
| send_batch_parallelism | 배치 데이터를 전송할 때의 병렬 처리 수를 설정합니다. 이 값이 BE 설정의 `max_send_batch_parallelism_per_job` 값보다 크면 `max_send_batch_parallelism_per_job` 값을 사용합니다. |
| load_to_single_tablet | 불리언 타입입니다. `true`로 설정하면 해당 파티션의 단일 tablet으로 데이터를 적재할 수 있으며, 기본값은 `false`입니다. 작업 내 태스크 수는 전체 동시 실행 수에 따라 달라집니다. random bucket을 사용하는 OLAP 테이블에 데이터를 적재할 때만 설정할 수 있습니다. |
| priority | 데이터 적재 작업의 우선순위를 설정합니다. 선택 가능한 값은 `HIGH/NORMAL/LOW`이며 기본값은 `NORMAL`입니다. `PENDING` 상태의 데이터 적재 작업 중 우선순위가 높은 작업이 먼저 `LOADING` 상태로 전환됩니다. |
| comment | 데이터 적재 작업의 비고 정보를 지정합니다. |

## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 사용자는 최소한 다음 권한이 있어야 합니다.

| 권한 | 객체 | 비고 |
| :---------------- | :------------- | :---------------------------- |
| LOAD_PRIV | 테이블 | 지정된 데이터베이스 테이블에 대한 데이터 적재 권한입니다. |

## 예제 {#examples}

S3, HDFS, JSON 형식, Merge 모드, 경로 기반 파티션 추출 등을 다루는 전체 예제는 데이터 적재 가이드의 [Broker Load](../../../../data-operate/import/import-way/broker-load-manual.md)를 참조하세요.
