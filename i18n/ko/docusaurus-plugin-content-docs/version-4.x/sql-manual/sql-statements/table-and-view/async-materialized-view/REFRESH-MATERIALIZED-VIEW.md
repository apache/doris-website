---
{
    "title": "REFRESH MATERIALIZED VIEW",
    "language": "ko",
    "description": "이 문은 지정된 비동기 구체화된 뷰를 수동으로 새로 고치는 데 사용됩니다"
}
---

## 설명 {#description}

이 문은 지정된 비동기 구체화된 뷰를 수동으로 새로 고치는 데 사용됩니다

## 구문 {#syntax}

```sql
REFRESH MATERIALIZED VIEW <mv_name> <refresh_type>
```

각 항목의 정의는 다음과 같습니다:
```sql
refresh_type
  : { <partitionSpec> | COMPLETE | AUTO }
```

```sql
partitionSpec
  : PARTITIONS (<partition_name> [, <partition_name> [, ... ] ])
```

## 필수 매개변수 {#required-parameters}
**1. `<mv_name>`**
> 구체화된 뷰의 이름을 지정합니다.
>
> 구체화된 뷰 이름은 영문자(또는 unicode 이름 지원이 활성화된 경우 모든 언어의 문자)로 시작해야 하며, 이름 문자열 전체를 백틱으로 감싼 경우(예: `My Object`)를 제외하고 공백이나 특수 문자를 포함할 수 없습니다.
>
> 구체화된 뷰 이름에는 예약 키워드를 사용할 수 없습니다.
>
> 자세한 내용은 예약 키워드를 참조하세요.

**2. `<refresh_type>`**
> 이 구체화된 뷰의 새로 고침 유형을 지정합니다.
>
> 새로 고침 유형은 partitionSpec, COMPLETE 또는 AUTO 중 하나일 수 있습니다.

## 선택적 매개변수 {#optional-parameters}
**1. `<partition_name>`**
> 파티션을 새로 고칠 때 파티션 이름을 지정합니다
>

## 접근 제어 요구 사항 {#access-control-requirements}
이 SQL 명령을 실행하는 사용자는 최소한 다음 권한을 보유해야 합니다:

| 권한  | 객체 | 참고 사항                                        |
| :--------- | :----- | :------------------------------------------- |
| ALTER_PRIV | 구체화된 뷰  | REFRESH는 구체화된 뷰에 대한 ALTER 작업입니다 |


## 사용 시 참고 사항 {#usage-notes}

- AUTO: 계산을 통해 구체화된 뷰의 파티션 중 기본 테이블과 동기화되지 않은 파티션을 확인합니다. (현재 기본 테이블이 외부 테이블이면 구체화된 뷰와 항상 동기화되어 있는 것으로 간주됩니다. 따라서 기본 테이블이 외부 테이블이면 `COMPLETE`를 지정하거나 새로 고칠 파티션을 지정해야 합니다.) 그런 다음 해당 파티션을 새로 고칩니다.
- COMPLETE: 파티션이 기본 테이블과 동기화되어 있는지 확인하지 않고 구체화된 뷰의 모든 파티션을 강제로 새로 고칩니다.
- partitionSpec: 파티션이 기본 테이블과 동기화되어 있는지 확인하지 않고 지정된 파티션을 강제로 새로 고칩니다.

## 예제 {#examples}

- 구체화된 뷰 mv1 새로 고침(새로 고칠 파티션을 자동으로 계산)

    ```sql
    REFRESH MATERIALIZED VIEW mv1 AUTO;
    ```


- 이름이 p_19950801_19950901 및 p_19950901_19951001인 파티션 새로 고침

    ```sql
    REFRESH MATERIALIZED VIEW mv1 partitions(p_19950801_19950901,p_19950901_19951001);
    ```
 

- 구체화된 뷰의 모든 데이터 강제 새로 고침

    ```sql
    REFRESH MATERIALIZED VIEW mv1 complete;
    ```
