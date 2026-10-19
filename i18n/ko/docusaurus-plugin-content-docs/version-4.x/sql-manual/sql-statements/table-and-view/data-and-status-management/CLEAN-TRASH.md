---
{
    "title": "ADMIN CLEAN TRASH",
    "language": "ko",
    "description": "이 문은 백엔드의 불필요한 데이터를 정리하는 데 사용됩니다."
}
---

## 설명 {#description}

이 문은 백엔드의 불필요한 데이터를 정리하는 데 사용됩니다.

## 구문 {#syntax}

```sql
ADMIN CLEAN TRASH [ON ("<be_host>:<be_heartbeat_port>" [, ...])]
```

## 선택적 매개변수 {#optional-parameters}

**1. `[ON ("<be_host>:<be_heartbeat_port>" [, ...])]`**

정리할 백엔드를 지정합니다. ON을 지정하지 않으면 기본적으로 모든 백엔드의 불필요한 데이터를 정리합니다.


## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 사용자는 최소한 다음 권한이 있어야 합니다.


| 권한  | 객체 | 참고                                        |
| :--------- | :----- | :------------------------------------------- |
| ADMIN_PRIV | 사용자 또는 역할  | ADMIN_PRIV 권한이 있는 사용자 또는 역할만 CLEAN TRASH 작업을 수행할 수 있습니다. |


## 예제 {#examples}

```sql
-- Clean up the junk data of all be nodes.
ADMIN CLEAN TRASH;
```

```sql
-- Clean up garbage data for '192.168.0.1:9050' and '192.168.0.2:9050'.
ADMIN CLEAN TRASH ON ("192.168.0.1:9050", "192.168.0.2:9050");
```
