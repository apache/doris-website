---
{
    "title": "SHOW BACKEND CONFIG",
    "language": "ko",
    "description": "BACKEND(즉, BE)의 설정 항목과 현재 값을 표시합니다."
}
---

## 설명 {#description}

BACKEND(즉, BE)의 설정 항목과 현재 값을 표시합니다.

## 구문 {#syntax}

```sql
[ ADMIN ] SHOW BACKEND CONFIG [ LIKE <config_key_pattern> ] [ FROM <backend_id> ]
```

## 선택적 매개변수 {#optional-parameters}

**<config_key_pattern>**

> BE 설정 항목과 일치시킬 와일드카드 패턴을 지정합니다. 일치 규칙은 LIKE 표현식과 동일합니다. 작성 규칙은 "일치 표현식" 절을 참조하세요.

**<backend_id>**

> BE의 ID입니다. 지정된 ID를 가진 BE의 설정을 조회하는 데 사용합니다. BE의 ID는 SHOW BACKENDS 명령으로 확인할 수 있습니다. 자세한 내용은 "SHOW BACKENDS" 명령을 참조하세요.

## 반환 값 {#return-value}

- BackendId: BE의 ID
- Host: BE의 호스트 주소
- Key: 설정 항목의 이름
- Value: 설정 항목에 해당하는 값
- Type: 설정 값의 타입

## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 사용자는 최소한 ADMIN_PRIV 권한이 있어야 합니다.

## 예제 {#examples}

### 모든 설정 항목 쿼리 {#query-all-configuration-items}

```sql
SHOW BACKEND CONFIG
```
결과:

```sql
+-----------+--------------+--------------------------------+-------+--------------------------+-----------+
| BackendId | Host         | Key                            | Value | Type                     | IsMutable |
+-----------+--------------+--------------------------------+-------+--------------------------+-----------+
| 12793     | 172.16.123.1 | LZ4_HC_compression_level       | 9     | int64_t                  | true      |
| 12793     | 172.16.123.1 | agent_task_trace_threshold_sec | 2     | int32_t                  | true      |
...
| 12794     | 172.16.123.2 | zone_map_row_num_threshold     | 20    | int32_t                  | true      |
+-----------+--------------+--------------------------------+-------+--------------------------+-----------+
```

### 지정된 BE ID의 설정 항목 쿼리 {#query-configuration-items-for-a-specified-be-id}

```sql
SHOW BACKEND CONFIG FROM 12793
```

결과:

```sql
+-----------+--------------+--------------------------------+-------+--------------------------+-----------+
| BackendId | Host         | Key                            | Value | Type                     | IsMutable |
+-----------+--------------+--------------------------------+-------+--------------------------+-----------+
| 12793     | 172.16.123.1 | LZ4_HC_compression_level       | 9     | int64_t                  | true      |
| 12793     | 172.16.123.1 | agent_task_trace_threshold_sec | 2     | int32_t                  | true      |
...
| 12793     | 172.16.123.1 | zone_map_row_num_threshold     | 20    | int32_t                  | true      |
+-----------+--------------+--------------------------------+-------+--------------------------+-----------+
```

### 지정된 패턴과 일치하는 설정 항목 쿼리 {#query-configuration-items-matching-a-specified-pattern}

```sql
SHOW BACKEND CONFIG LIKE '%compression_level%'
```

결과:

```sql
+-----------+--------------+--------------------------+-------+---------+-----------+
| BackendId | Host         | Key                      | Value | Type    | IsMutable |
+-----------+--------------+--------------------------+-------+---------+-----------+
| 12793     | 172.16.123.1 | LZ4_HC_compression_level | 9     | int64_t | true      |
| 12794     | 172.16.123.2 | LZ4_HC_compression_level | 9     | int64_t | true      |
+-----------+--------------+--------------------------+-------+---------+-----------+
```
