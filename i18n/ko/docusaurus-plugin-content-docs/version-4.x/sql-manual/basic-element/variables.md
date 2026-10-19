---
{
    "title": "변수",
    "language": "ko",
    "description": "Doris에서 변수는 시스템 변수와 사용자 변수로 나뉩니다. 둘 다 대소문자를 구분하지 않습니다."
}
---

## 설명 {#description}

Doris에서 변수는 시스템 변수와 사용자 변수로 나뉩니다. 둘 다 대소문자를 구분하지 않습니다.

시스템 변수는 Doris의 동작에 영향을 줍니다. 시스템 변수와 사용자 변수 모두 사용자 쿼리에서 사용할 수 있습니다.

## 시스템 변수 {#system-variables}

시스템 변수는 데이터베이스의 동작과 성능을 제어하기 위해 Doris에서 미리 정의한 변수 집합입니다. 주요 특징은 다음과 같습니다.

- 변수 유형:

    - 읽기 전용 변수: 시스템에서 설정하며 사용자가 수정할 수 없는 변수입니다. 예를 들어 `version`, `current_timestamp` 등이 있습니다.

    - 수정 가능한 변수: 사용자가 실행 중에 값을 수정할 수 있는 변수입니다. 예를 들어 `exec_mem_limit`, `time_zone` 등이 있습니다.

- 적용 범위:

    - 전역 변수(Global): 모든 세션에 영향을 주며 `SET GLOBAL`로 설정합니다.

    - 세션 변수(Session): 현재 세션에만 영향을 주며 `SET`으로 설정합니다.

    - 일부 변수는 전역 범위와 세션 범위를 모두 지원합니다.

- 조회 방법:

    - `SHOW VARIABLES`를 사용하여 모든 시스템 변수를 조회합니다.

    - `SHOW VARIABLES LIKE 'pattern'`을 사용하여 패턴과 일치하는 특정 변수를 조회합니다.

    - 개별 세션 변수의 값과 효과는 [세션 변수 목록](./session-variables.md)을 참조하세요.

- 지속성:

    - 전역 변수의 변경 사항은 시스템을 다시 시작하면 기본값으로 재설정됩니다. 세션을 다시 시작해도 기본값으로 재설정되지는 않습니다.

    - 세션 변수의 변경 사항은 세션이 종료되면 사라집니다.

## 사용자 정의 변수 {#user-defined-variables}

사용자 정의 변수는 세션 내에서 데이터를 임시로 저장하는 기능입니다. 주요 특징은 다음과 같습니다.

- 이름 지정 규칙:

    - 이름 앞에 `@`를 붙여야 합니다.

    - 변수 이름에는 문자, 숫자, 밑줄을 사용할 수 있습니다.

    - 대소문자를 구분하지 않습니다.

- 적용 범위:

    - 현재 세션 내에서만 유효합니다.

    - 세션이 종료되면 자동으로 삭제됩니다.

    - 서로 다른 세션에서 이름이 같은 변수는 서로 독립적입니다.

- 값 할당 방법:

    - `SET @var_name = value` 구문을 사용하여 값을 할당합니다.

    - 표현식의 결과를 값으로 할당할 수 있습니다.

- 데이터 유형:

    - 숫자(정수, 부동 소수점 수)를 저장할 수 있습니다.

    - 문자열을 저장할 수 있습니다.

    - 날짜 및 시간 값을 저장할 수 있습니다.

    - NULL 값을 저장할 수 있습니다.

    - 유형은 값을 할당할 때 자동으로 결정됩니다.

## 시스템 변수 정의 및 쿼리 구문 {#system-variable-definitions-and-query-statements}

- SHOW VARIABLES

    `SHOW VARIABLES LIKE 'variable_name'`으로 변수를 조회할 수 있습니다.

    ```sql
    SHOW VARIABLES LIKE '%time_zone%';
    +------------------+----------------+----------------+---------+
    | Variable_name    | Value          | Default_Value  | Changed |
    +------------------+----------------+----------------+---------+
    | system_time_zone | Asia/Hong_Kong | Asia/Hong_Kong | 0       |
    | time_zone        | Asia/Hong_Kong | Asia/Hong_Kong | 0       |
    +------------------+----------------+----------------+---------+
    ```

    또는 `SHOW VARIABLES`로 모든 변수를 조회할 수 있습니다.

    ```sql
    SHOW VARIABLES
    +------------------------------------------------------------------+---------------------------------------+---------------------------------------+---------+
    | Variable_name                                                    | Value                                 | Default_Value                         | Changed |
    +------------------------------------------------------------------+---------------------------------------+---------------------------------------+---------+
    | DML_PLAN_RETRY_TIMES                                             | 3                                     | 3                                     | 0       |
    | adaptive_pipeline_task_serial_read_on_limit                      | 10000                                 | 10000                                 | 0       |
    | allow_modify_materialized_view                              | false                                 | false                                 | 0       |
    | allow_partition_column_nullable                            | true                                  | true                                  | 0       |
    | analyze_timeout                                           | 43200                                 | 43200                                 | 0       |
    | version                                                      | 5.7.99                                | 5.7.99                                | 0       |
    | version_comment                                                | Doris version doris-0.0.0--de61c58223 | Doris version doris-0.0.0--de61c58223 | 0       |
    | wait_full_block_schedule_times                                 | 2                                     | 2                                     | 0       |
    | wait_timeout                                               | 28800                                 | 28800                                 | 0       |
    | workload_group                                                 |                                       |                                       | 0       |
    +------------------------------------------------------------------+---------------------------------------+---------------------------------------+---------+
    360 rows in set (0.01 sec)
    ```

- SET

    일부 변수는 전역으로 적용되거나 현재 세션에만 적용되도록 설정할 수 있습니다.

    `SET`을 사용하면 현재 세션에만 적용되도록 설정합니다. 예를 들면 다음과 같습니다.

    ```sql
    SET exec_mem_limit = 137438953472;
    SHOW VARIABLES LIKE '%exec_mem_limit%';
    +----------------+--------------+---------------+---------+
    | Variable_name  | Value        | Default_Value | Changed |
    +----------------+--------------+---------------+---------+
    | exec_mem_limit | 137438953472 | 2147483648    | 1       |
    +----------------+--------------+---------------+---------+
    1 row in set (0.01 sec)
    SET forward_to_master = true;
    SHOW VARIABLES LIKE '%forward_to_master%';
    +-------------------+-------+---------------+---------+
    | Variable_name     | Value | Default_Value | Changed |
    +-------------------+-------+---------------+---------+
    | forward_to_master | true  | true          | 0       |
    +-------------------+-------+---------------+---------+
    1 row in set (0.00 sec)
    SET time_zone = "Asia/Shanghai";
    SHOW VARIABLES LIKE '%time_zone%';
    +------------------+----------------+----------------+---------+
    | Variable_name    | Value          | Default_Value  | Changed |
    +------------------+----------------+----------------+---------+
    | time_zone        | Asia/Shanghai  | Asia/Hong_Kong | 1       |
    | system_time_zone | Asia/Hong_Kong | Asia/Hong_Kong | 0       |
    +------------------+----------------+----------------+---------+
    2 rows in set (0.00 sec)
    ```

    전역으로 설정

    ```sql
    SET GLOBAL exec_mem_limit = 137438953472;
    SHOW VARIABLES LIKE '%exec_mem_limit%';
    +----------------+--------------+---------------+---------+
    | Variable_name  | Value        | Default_Value | Changed |
    +----------------+--------------+---------------+---------+
    | exec_mem_limit | 137438953472 | 2147483648    | 1       |
    +----------------+--------------+---------------+---------+
    1 row in set (0.01 sec)
    ```

- UNSET

    구문:

    ```sql
    UNSET (GLOBAL | SESSION | LOCAL)? VARIABLE (ALL | identifier)
    unset global variable exec_mem_limit;
    SHOW VARIABLES LIKE '%exec_mem_limit%';
    +----------------+------------+---------------+---------+
    | Variable_name  | Value      | Default_Value | Changed |
    +----------------+------------+---------------+---------+
    | exec_mem_limit | 2147483648 | 2147483648    | 0       |
    +----------------+------------+---------------+---------+
    1 row in set (0.00 sec)
    ```

## 사용자 변수 정의 및 쿼리 구문 {#user-variable-definition-and-query-statements}

사용자 정의 변수는 다음 구문으로 정의할 수 있습니다.

```sql
SET @var_name = constant_value|constant_expr;
```

설정 예시:

```sql
SET @v1 = "A";
SET @v2 = 32+33;
SET @v3 = str_to_date("2024-12-29 10:11:12", '%Y-%m-%d %H:%i:%s');
```

쿼리에서 사용할 수 있습니다.

```sql
SELECT @v1, @v2, @v3;
+------+------+--------------------+
| @v1  | @v2  | @v3                 |
+------+------+--------------------+
| A    |   65 | 2024-12-29 10:11:12 |
+------+------+--------------------+
1 row in set (0.01 sec)
```
