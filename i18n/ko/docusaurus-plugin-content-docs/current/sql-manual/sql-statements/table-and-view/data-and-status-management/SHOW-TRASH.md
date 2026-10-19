---
{
    "title": "SHOW TRASH",
    "language": "ko",
    "description": "백엔드에서 가비지 데이터가 차지하는 공간을 확인하는 데 사용하는 문입니다."
}
---

## 설명 {#description}

백엔드에서 가비지 데이터가 차지하는 공간을 확인하는 데 사용하는 문입니다.

## 구문 {#syntax}

```sql
SHOW TRASH [ON ("<be_host>:<be_heartbeat_port>" [, ...])];
```

## 선택적 매개변수 {#optional-parameters}

**1. `[ON ("<be_host>:<be_heartbeat_port>" [, ...])]`**

확인할 백엔드를 지정합니다. ON을 추가하지 않으면 기본적으로 모든 백엔드가 표시됩니다.


## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 사용자는 최소한 다음 권한을 보유해야 합니다.


| 권한  | 객체 | 참고 사항                                        |
| :--------- | :----- | :------------------------------------------- |
| ADMIN_PRIV 또는 NODE_PRIV | 사용자 또는 역할  | ADMIN_PRIV 또는 NODE_PRIV 권한이 있는 사용자 또는 역할만 SHOW TRASH 작업을 수행할 수 있습니다. |


## 예제 {#examples}

1. 모든 BE 노드의 가비지 데이터 공간 사용량을 확인합니다.


```sql
SHOW TRASH;
```

2. '192.168.0.1:9050'의 가비지 데이터 공간 사용량을 확인합니다(디스크 정보가 표시됩니다).


```sql
SHOW TRASH ON "192.168.0.1:9050";
```
