---
{
    "title": "쿼리 종료 및 세션 연결 해제: KILL 명령어 가이드",
    "sidebar_label": "쿼리 종료 및 세션 연결 해제",
    "language": "ko",
    "description": "KILL 명령어로 실행 중인 쿼리를 취소하거나 세션 연결을 해제합니다. Query ID, Connection ID 또는 Trace ID로 대상 쿼리를 찾을 수 있습니다.",
    "keywords": ["쿼리 강제 종료", "쿼리 종료", "쿼리 취소", "세션 연결 해제", "연결 강제 종료", "Query ID", "Trace ID", "processlist"]
}
---

<!-- Knowledge Type: Operation Guide -->

`KILL` 명령어는 실행 중인 쿼리를 취소하거나 지정한 세션의 연결을 해제합니다. 사용하기 전에 대상 쿼리의 식별자(Query ID, Connection ID 또는 Trace ID)를 확인한 다음, 해당 KILL 문을 실행합니다.

## 쿼리 식별자 확인 {#obtain-query-identifiers}

<!-- Knowledge Type: Concept Definition -->

KILL 명령어는 다음 세 가지 쿼리 식별자를 지원합니다.

| 식별자 유형 | 설명 | 확인 방법 |
|---|---|---|
| Query ID | 시스템이 각 쿼리에 대해 자동으로 생성하는 고유 식별자 | `SHOW PROCESSLIST` 또는 `information_schema.processlist` |
| Connection ID | 세션 연결의 고유 식별자 | `SHOW PROCESSLIST` 또는 `information_schema.processlist` |
| Trace ID | 사용자가 정의하는 쿼리 식별자(2.1.11 / 3.0.7부터 지원) | `session_context` 변수로 설정 |

### PROCESSLIST로 조회 {#view-through-processlist}

<!-- Knowledge Type: Operation Steps -->

`SHOW PROCESSLIST`는 현재 모든 세션 연결과 각 연결에서 실행 중인 쿼리를 Query ID 및 Connection ID와 함께 표시합니다.

```sql
SHOW PROCESSLIST;
```

출력 예시:

```
+------------------+------+------+---------------------+---------------------+----------+------+---------+------+-------+----------------------------------+------------------+---------------+--------------+
| CurrentConnected | Id   | User | Host                | LoginTime           | Catalog  | Db   | Command | Time | State | QueryId                          | Info             | FE            | CloudCluster |
+------------------+------+------+---------------------+---------------------+----------+------+---------+------+-------+----------------------------------+------------------+---------------+--------------+
| No               |    2 | root | 172.20.32.136:54850 | 2025-05-11 10:41:52 | internal |      | Query   |    6 | OK    | 12ccf7f95c1c4d2c-b03fa9c652757c15| select sleep(20) | 172.20.32.152 | NULL         |
| Yes              |    3 | root | 172.20.32.136:54862 | 2025-05-11 10:41:55 | internal |      | Query   |    0 | OK    | b710ed990d4144ee-8b15bb53002b7710| show processlist | 172.20.32.152 | NULL         |
| No               |    1 | root | 172.20.32.136:47964 | 2025-05-11 10:41:54 | internal |      | Sleep   |   11 | EOF   | b60daa992bac4fe4-b29466aacce67d27|                  | 172.20.32.153 | NULL         |
+------------------+------+------+---------------------+---------------------+----------+------+---------+------+-------+----------------------------------+------------------+---------------+--------------+
```

주요 필드 설명:

- `CurrentConnected`: `Yes`는 현재 세션에 해당하는 연결을 나타냅니다.
- `Id`: Connection ID로, 연결의 고유 식별자입니다.
- `QueryId`: Query ID로, 가장 최근에 실행했거나 현재 실행 중인 SQL의 고유 식별자입니다.

**기본 동작**: `SHOW PROCESSLIST`는 현재 연결된 FE 노드의 세션만 표시하며, 다른 FE 노드의 세션은 포함하지 않습니다. 모든 FE 노드의 세션을 보려면 쿼리를 실행하기 전에 다음 변수를 설정합니다.

```sql
SET show_all_fe_connection = true;
SHOW PROCESSLIST;
```

`information_schema` 시스템 테이블을 사용할 수도 있습니다. 이 테이블은 기본적으로 모든 FE 노드의 세션을 표시하므로 별도의 설정이 필요하지 않습니다.

```sql
SELECT * FROM information_schema.processlist;
```

### Trace ID로 쿼리 식별 {#identify-queries-by-trace-id}

<!-- Knowledge Type: Operation Steps -->

> 이 기능은 2.1.11 및 3.0.7 버전부터 지원됩니다.

Trace ID는 쿼리에 미리 할당하는 사용자 정의 식별자입니다. 관리 도구에서 쿼리를 제출하기 전에 고유 식별자를 기록해 두면, 이후 언제든지 Trace ID로 해당 쿼리를 취소할 수 있습니다.

현재 세션의 Trace ID는 다음과 같이 설정합니다.

```sql
SET session_context = "trace_id:your_trace_id";
```

- `your_trace_id`: `;` 문자를 포함할 수 없는 사용자 정의 문자열입니다. 고유성을 보장하려면 UUID를 사용하는 것이 좋습니다.
- Trace ID는 세션 수준의 매개변수로, 현재 세션에만 적용됩니다. 설정 후에는 이 세션의 모든 후속 쿼리가 해당 Trace ID에 매핑됩니다.

세션 변수를 변경하지 않고 개별 쿼리 문의 Hint로 설정할 수도 있습니다.

```sql
SELECT /*+SET_VAR(session_context="trace_id:your_trace_id")*/ * FROM table ...;
```

## KILL 작업 실행 {#execute-the-kill-operation}

<!-- Knowledge Type: Operation Steps -->

**권한 안내**: 일반 사용자는 자신이 제출한 쿼리만 종료할 수 있습니다. ADMIN 사용자는 모든 사용자의 쿼리를 종료할 수 있습니다.

### 쿼리 종료 {#kill-a-query}

`KILL QUERY`는 세션 연결을 해제하지 않고 지정한 실행 중인 쿼리를 취소합니다.

```sql
KILL QUERY "query_id" | "trace_id" | connection_id;
```

세 가지 형식 비교:

| 매개변수 유형 | 예시 | 적용 범위 |
|---|---|---|
| `"query_id"` | `KILL QUERY "d36417cc05ff41ab-9d3afe49be251055";` | 모든 FE 노드에서 일치하는 쿼리를 찾아 취소합니다 |
| `"trace_id"` | `KILL QUERY "your_trace_id";` | 모든 FE 노드에서 일치하는 쿼리를 찾아 취소합니다 |
| `connection_id` | `KILL QUERY 55;` | 현재 연결된 FE 노드에서, 지정한 연결에서 실행 중인 쿼리만 취소합니다 |

참고 사항:

- Query ID와 Trace ID는 따옴표로 감싸야 합니다. Connection ID는 0보다 큰 정수여야 하며 따옴표로 감싸면 안 됩니다.
- Connection ID를 지정한 `KILL QUERY`는 현재 연결된 FE 노드에서만 적용됩니다.

### 연결 종료 {#kill-a-connection}

`KILL CONNECTION`은 지정한 세션의 연결을 해제하고 해당 연결에서 실행 중인 쿼리도 취소합니다.

```sql
KILL [CONNECTION] connection_id;
```

`CONNECTION` 키워드는 생략할 수 있습니다. 다음 두 형식은 동일하게 동작합니다.

```sql
KILL CONNECTION 55;
KILL 55;
```

참고: 서로 다른 FE 노드의 Connection ID는 중복될 수 있습니다. 이 작업은 현재 연결된 FE 노드에서만 적용됩니다.

## 권장 방법: Trace ID로 쿼리 관리 {#best-practice-manage-queries-by-trace-id}

<!-- Knowledge Type: Best Practice -->

관리 시스템이나 비즈니스 플랫폼에서는 Trace ID로 쿼리를 미리 식별하고 정확히 취소하는 것이 좋습니다. 작업 흐름은 다음과 같습니다.

1. **쿼리를 제출하기 전에** 고유한 Trace ID(UUID 권장)를 생성하여 쿼리에 연결합니다.
2. **쿼리가 실행 중일 때** 시스템은 Trace ID를 통해 언제든지 KILL 요청을 보낼 수 있습니다.

Trace ID를 연결하는 방법은 두 가지입니다.

- 쿼리 실행 전에 세션 변수를 설정합니다(단일 연결을 사용하는 경우에 적합).

    ```sql
    SET session_context = "trace_id:your_trace_id";
    SELECT * FROM table ...;
    ```

- 쿼리 문에 Hint를 삽입합니다(연결 풀에서 연결을 재사용하는 경우에 적합).

    ```sql
    SELECT /*+SET_VAR(session_context="trace_id:your_trace_id")*/ * FROM table ...;
    ```

Trace ID를 연결한 후에는 다음 명령어로 언제든지 쿼리를 취소할 수 있습니다.

```sql
KILL QUERY "your_trace_id";
```
