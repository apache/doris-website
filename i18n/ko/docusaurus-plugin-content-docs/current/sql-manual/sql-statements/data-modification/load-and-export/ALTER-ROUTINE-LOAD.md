---
{
    "title": "ALTER ROUTINE LOAD",
    "language": "ko",
    "description": "이 구문은 기존 Routine Load 작업을 수정하는 데 사용됩니다. PAUSED 상태의 작업만 수정할 수 있습니다."
}
---

## 설명 {#description}

이 구문은 기존 Routine Load 작업을 수정하는 데 사용됩니다. PAUSED 상태의 작업만 수정할 수 있습니다.

## 구문 {#syntax}

```sql
ALTER ROUTINE LOAD FOR [<db>.]<job_name>
[<job_properties>]
FROM [<data_source>]
[<data_source_properties>]
```

## 필수 매개변수 {#required-parameters}

**1. `[<db>.]<job_name>`**

> 수정할 작업의 이름을 지정합니다. 식별자는 영문자로 시작해야 하며, 식별자 문자열 전체를 백틱으로 감싸지 않으면 공백이나 특수 문자를 포함할 수 없습니다.
>
> 식별자에는 예약 키워드를 사용할 수 없습니다. 자세한 내용은 식별자 요구 사항과 예약 키워드를 참조하세요.

## 선택 매개변수 {#optional-parameters}

**1. `<job_properties>`**

> 수정할 작업 매개변수를 지정합니다. 현재 지원되는 매개변수는 다음과 같습니다:
> 
> - desired_concurrent_number
> - max_error_number
> - max_batch_interval
> - max_batch_rows
> - max_batch_size
> - jsonpaths
> - json_root
> - strip_outer_array
> - strict_mode
> - timezone
> - num_as_string
> - fuzzy_parse
> - partial_columns
> - max_filter_ratio

**2. `<data_source_properties>`**

> 데이터 소스 관련 속성입니다. 현재 지원되는 속성은 다음과 같습니다:
> 
> - `<kafka_partitions>`
> - `<kafka_offsets>`
> - `<kafka_broker_list>`
> - `<kafka_topic>`
> - 사용자 정의 속성(예: `<property.group.id>`)

**3. `<data_source>`**

> 데이터 소스의 유형입니다. 현재 지원되는 유형은 다음과 같습니다:
> 
> - KAFKA

## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 사용자는 최소한 다음 권한을 보유해야 합니다:

| 권한 | 객체 | 참고 사항 |
| :-------- | :----- | :---- |
| LOAD_PRIV | 테이블 | ALTER ROUTINE LOAD를 실행하려면 해당 테이블에 대한 LOAD 권한이 필요합니다 |

## 참고 사항 {#notes}

- `kafka_partitions`와 `kafka_offsets`는 소비할 kafka 파티션의 오프셋을 수정하는 데 사용되며, 현재 소비 중인 파티션만 수정할 수 있습니다. 새 파티션은 추가할 수 없습니다.

## 예제 {#examples}

- `desired_concurrent_number`를 1로 수정

    ```sql
    ALTER ROUTINE LOAD FOR db1.label1
    PROPERTIES
    (
        "desired_concurrent_number" = "1"
    );
    ```

- `desired_concurrent_number`를 10으로 수정하고, 파티션 오프셋과 group id를 수정

    ```sql
    ALTER ROUTINE LOAD FOR db1.label1
    PROPERTIES
    (
        "desired_concurrent_number" = "10"
    )
    FROM kafka
    (
        "kafka_partitions" = "0, 1, 2",
        "kafka_offsets" = "100, 200, 100",
        "property.group.id" = "new_group"
    );
    ```
