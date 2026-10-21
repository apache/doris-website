---
{
    "title": "SHOW PROPERTY",
    "language": "ko",
    "description": "이 문은 사용자의 속성을 조회하는 데 사용됩니다."
}
---

## 설명 {#description}

이 문은 사용자의 속성을 조회하는 데 사용됩니다.

## 구문 {#syntax}

```sql
SHOW {ALL PROPERTIES | PROPERTY [FOR <user_name>]} [LIKE <key>]
```

## 선택적 매개변수 {#optional-parameters}
**1. `[ALL PROPERTIES]`**

   모든 사용자의 속성을 조회할지 여부입니다.

**2. `<user_name>`**

   지정한 사용자의 속성을 조회합니다. 지정하지 않으면 현재 사용자의 속성을 조회합니다.

**3. `<key>`**

   속성 이름을 기준으로 유사 일치 검색을 수행할 수 있습니다.

## 반환 값 {#return-value}
- 문에서 `PROPERTY`를 사용하는 경우

   | 열 | 설명 |
   | -- | -- |
   | Key | 속성 이름 |
   | Value | 속성 값 |

- 문에서 `PROPERTIES`를 사용하는 경우

   | 열 | 설명 |
   | -- | -- |
   | User | 사용자 이름 |
   | Properties | 해당 사용자의 각 `property`에 대한 `key:value` |

## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 사용자는 최소한 다음 권한을 보유해야 합니다.

| 권한 | 객체 | 참고 사항                 |
| :---------------- | :------------- | :---------------------------- |
| GRANT_PRIV        | 사용자 또는 역할    | 모든 사용자의 속성을 조회하려면 사용자 또는 역할에 `GRANT_PRIV` 권한이 있어야 합니다. `SHOW PROPERTY`로 현재 사용자의 속성을 조회할 때는 `GRANT_PRIV` 권한이 필요하지 않습니다. |

## 사용 시 참고 사항 {#usage-notes}
-  `SHOW ALL PROPERTIES`를 사용하면 모든 사용자의 속성을 조회할 수 있습니다.
- `user_name`을 지정하면 지정한 사용자의 속성을 조회합니다.
- `user_name`을 지정하지 않으면 현재 사용자의 속성을 조회합니다.
- `SHOW PROPERTY`로 현재 사용자의 속성을 조회할 때는 `GRANT_PRIV` 권한이 필요하지 않습니다.

## 예제 {#examples}

- jack 사용자의 속성 조회

   ```sql
   SHOW PROPERTY FOR 'jack';
   ```
   ```text
   +-------------------------------------+--------+
   | Key                                 | Value  |
   +-------------------------------------+--------+
   | cpu_resource_limit                  | -1     |
   | default_load_cluster                |        |
   | default_workload_group              | normal |
   | exec_mem_limit                      | -1     |
   | insert_timeout                      | -1     |
   | max_query_instances                 | 3000   |
   | max_user_connections                | 1000   |
   | parallel_fragment_exec_instance_num | -1     |
   | query_timeout                       | -1     |
   | resource_tags                       |        |
   | sql_block_rules                     |        |
   +-------------------------------------+--------+
   ```

- jack 사용자의 제한 관련 속성 조회

   ```sql
   SHOW PROPERTY FOR 'jack' LIKE '%limit%';
   ```

   ```text
   +--------------------+-------+
   | Key                | Value |
   +--------------------+-------+
   | cpu_resource_limit | -1    |
   | exec_mem_limit     | -1    |
   +--------------------+-------+
   ```

- 모든 사용자의 제한 관련 속성 조회

   ```sql
   SHOW ALL PROPERTIES LIKE '%limit%';
   ```

   ```text
   +-------+------------------------------------------------------------+
   | User  | Properties                                                 |
   +-------+------------------------------------------------------------+
   | root  | {
     "cpu_resource_limit": "-1",
     "exec_mem_limit": "-1"
   } |
   | admin | {
     "cpu_resource_limit": "-1",
     "exec_mem_limit": "-1"
   } |
   | jack  | {
     "cpu_resource_limit": "-1",
     "exec_mem_limit": "-1"
   } |
   +-------+------------------------------------------------------------+
   ```
