---
{
    "title": "SHOW ROUTINE LOAD",
    "language": "ko",
    "description": "이 문은 Routine Load 작업의 실행 상태를 표시하는 데 사용됩니다. 특정 작업이나 모든 작업의 상태 정보를 확인할 수 있습니다."
}
---

## 설명 {#description}

이 문은 Routine Load 작업의 실행 상태를 표시하는 데 사용됩니다. 특정 작업이나 모든 작업의 상태 정보를 확인할 수 있습니다.

## 구문 {#syntax}

```sql
SHOW [ALL] ROUTINE LOAD [FOR <jobName>];
```

## 선택적 매개변수 {#optional-parameters}

**1. `[ALL]`**

> 선택적 매개변수입니다. 지정하면 중지되거나 취소된 작업을 포함한 모든 작업이 표시됩니다. 지정하지 않으면 현재 실행 중인 작업만 표시됩니다.

**2. `[FOR <jobName>]`**

> 선택적 매개변수입니다. 조회할 작업 이름을 지정합니다. 지정하지 않으면 현재 데이터베이스의 모든 작업이 표시됩니다.
>
> 다음 형식을 지원합니다.
>
> - `<job_name>`: 현재 데이터베이스에서 지정한 이름의 작업을 표시합니다.
> - `<db_name>.<job_name>`: 지정한 데이터베이스에서 지정한 이름의 작업을 표시합니다.

## 반환 결과 {#return-results}

| 필드 이름           | 설명                                                  |
| :------------------- | :---------------------------------------------------------- |
| Id                   | 작업 ID                                                       |
| Name                 | 작업 이름                                                     |
| CreateTime           | 작업 생성 시각                                            |
| PauseTime            | 가장 최근에 작업이 일시 중지된 시각                                   |
| EndTime              | 작업 종료 시각                                                 |
| DbName               | 해당 데이터베이스 이름                                  |
| TableName            | 해당 테이블 이름(여러 테이블인 경우 'multi-table' 표시) |
| IsMultiTable         | 여러 테이블을 대상으로 하는 작업인지 여부                              |
| State                | 작업 실행 상태                                          |
| DataSourceType       | 데이터 소스 유형: KAFKA                                     |
| CurrentTaskNum       | 현재 하위 작업 수                                  |
| JobProperties        | 작업의 상세 설정                                    |
| DataSourceProperties | 데이터 소스의 상세 설정                            |
| CustomProperties     | 사용자 지정 설정. 민감한 속성은 `******`로 마스킹됨. 아래의 "민감한 속성 마스킹" 참조 |
| Statistic            | 작업 실행 통계                                      |
| Progress            | 작업 진행 상황                                         |
| Lag                 | 작업 지연 상태                                            |
| ReasonOfStateChanged | 작업 상태가 변경된 이유                                 |
| ErrorLogUrls         | 품질 검사를 통과하지 못해 필터링된 데이터를 확인할 수 있는 URL       |
| OtherMsg            | 기타 오류 메시지                                        |
| User                 | 작업을 생성한 사용자                                |
| Comment              | 작업에 대한 주석                                      |
| ComputeGroup         | 작업이 실행되는 컴퓨팅 그룹                           |
| FirstErrorMsg        | 작업 실행 중 처음 발생한 오류 메시지. 4.0.8(4.0 계열) 및 4.1.4(4.1 계열)에서 추가됨. 값은 FE 메모리에 보관되며 FE가 재시작되면 사라짐. 오류 통계가 초기화되면 `ErrorLogUrls`도 지워짐 |

### 민감한 속성 마스킹 {#sensitive-property-masking}

<!-- Knowledge type: Behavior description -->
<!-- Applicable scenarios: Protecting Kafka credentials / Audit compliance -->

:::caution 동작 변경 (4.0.8)

버전 4.0.8부터 Kafka Routine Load 작업의 민감한 속성은 일반 텍스트 대신 `******`로 마스킹되어 `CustomProperties`에 표시됩니다. `SHOW CREATE ROUTINE LOAD`의 출력도 마스킹됩니다.

:::

다음 속성은 민감한 속성으로 인식되어 마스킹됩니다.

| 일치 규칙 | 예시 |
| --- | --- |
| 이름이 `sasl.jaas.config`인 속성 | `sasl.jaas.config` |
| 이름이 `aws.access_key`인 속성 | `aws.access_key` |
| 이름이 `ssl.keystore.key` 또는 `ssl.key.pem`인 속성 | `ssl.keystore.key` |
| 이름이 `.password`, `.secret`, `.secret_key` 또는 `.secret.key`로 끝나는 속성 | `ssl.keystore.password`, `sasl.oauthbearer.client.secret` |
| 이름이 `.session_key` 또는 `.session.token`으로 끝나는 속성 | `aws.session.token` |
| 이름이 `.private.key`, `.private_key` 또는 `.passphrase`로 끝나거나 `.private.key.`를 포함하는 속성 | `sasl.oauthbearer.assertion.private.key.pem` |

마스킹은 값이 표시되는 방식에만 영향을 주며, 작업에서 실제로 사용하는 속성값은 변경되지 않습니다. 이 속성들을 변경하려면 [ALTER ROUTINE LOAD](./ALTER-ROUTINE-LOAD)로 다시 설정해야 합니다. `SHOW` 결과에서는 원래 값을 다시 읽어 올 수 없습니다.

### FirstErrorMsg와 OtherMsg 비교 {#firsterrormsg-versus-othermsg}

- `FirstErrorMsg`: 작업 실행 중 **처음** 발생한 오류로, 근본 원인을 찾는 데 유용합니다. 작업이 오랫동안 실행된 경우, 나중에 발생한 오류는 첫 번째 오류의 여파인 경우가 많습니다.
- `OtherMsg`: 가장 최근의 기타 오류 메시지로, 이후 오류가 발생하면 덮어씁니다.

:::info 참고

이 값들은 [`information_schema.routine_load_job`](../../../../admin-manual/system-tables/information_schema/routine_load_job)에서도 쿼리할 수 있습니다. 버전 4.0.8부터 해당 테이블은 master FE가 제공하므로, `FIRST_ERROR_MSG`와 `ERROR_LOG_URLS`는 쿼리가 master가 아닌 FE에 전달되어도 더 이상 비어 있지 않습니다.

:::

## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 사용자에게는 최소한 다음 권한이 있어야 합니다.

| 권한    | 객체 | 참고 사항                                            |
| :----------- | :----- | :----------------------------------------------- |
| LOAD_PRIV    | 테이블  | SHOW ROUTINE LOAD를 실행하려면 해당 테이블에 대한 LOAD 권한이 필요함 |

## 참고 사항 {#notes}

- State 설명:
  - NEED_SCHEDULE: 작업이 스케줄링을 기다리고 있음
  - RUNNING: 작업이 실행 중임
  - PAUSED: 작업이 일시 중지됨
  - STOPPED: 작업이 종료됨
  - CANCELLED: 작업이 취소됨

- Progress 설명:
  - Kafka 데이터 소스의 경우, 각 파티션에서 소비한 오프셋을 표시합니다.
  - 예를 들어, {"0":"2"}는 Kafka 파티션 0의 소비 진행 위치가 2임을 의미합니다.

- Lag 설명:
  - Kafka 데이터 소스의 경우, 각 파티션의 소비 지연을 표시합니다.
  - 예를 들어, {"0":10}은 Kafka 파티션 0의 소비 지연이 10임을 의미합니다.

## 예제 {#examples}

- 이름이 test1인 모든 Routine Load 작업 표시(중지되거나 취소된 작업 포함)

    ```sql
    SHOW ALL ROUTINE LOAD FOR test1;
    ```

- 이름이 test1이고 현재 실행 중인 Routine Load 작업 표시

    ```sql
    SHOW ROUTINE LOAD FOR test1;
    ```

- example_db의 모든 Routine Load 작업 표시(중지되거나 취소된 작업 포함). 결과는 한 행 또는 여러 행일 수 있습니다.

    ```sql
    use example_db;
    SHOW ALL ROUTINE LOAD;
    ```

- example_db에서 현재 실행 중인 모든 Routine Load 작업 표시

    ```sql
    use example_db;
    SHOW ROUTINE LOAD;
    ```

- example_db에서 이름이 test1이고 현재 실행 중인 Routine Load 작업 표시

    ```sql
    SHOW ROUTINE LOAD FOR example_db.test1;
    ```

- example_db에서 이름이 test1인 모든 Routine Load 작업 표시(중지되거나 취소된 작업 포함). 결과는 한 행 또는 여러 행일 수 있습니다.

    ```sql
    SHOW ALL ROUTINE LOAD FOR example_db.test1;
    ```
