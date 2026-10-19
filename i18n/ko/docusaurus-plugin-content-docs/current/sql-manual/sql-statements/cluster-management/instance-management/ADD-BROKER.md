---
{
    "title": "ADD BROKER",
    "language": "ko",
    "description": "이 문은 하나 이상의 BROKER 노드를 추가하는 데 사용됩니다."
}
---

## 설명 {#description}

이 문은 하나 이상의 BROKER 노드를 추가하는 데 사용됩니다.

## 구문 {#syntax}

```sql
ALTER SYSTEM ADD BROKER <broker_name> "<host>:<ipc_port>" [, "<host>:<ipc_port>" [, ... ] ];
```

## 필수 매개변수 {#required-parameters}

**1. `<broker_name>`**

추가할 broker 프로세스에 부여할 이름입니다. 같은 클러스터 내에서는 broker_name을 일관되게 유지하는 것이 좋습니다.

**2. `<host>`**

broker 프로세스를 추가할 노드의 IP입니다. FQDN이 활성화되어 있으면 해당 노드의 FQDN을 사용합니다.

**3. `<ipc_port>`**

broker 프로세스를 추가할 노드의 PORT이며, 이 포트의 기본값은 8000입니다.


## 접근 제어 요구 사항 {#access-control-requirements}
이 작업을 실행하는 사용자는 NODE_PRIV 권한이 있어야 합니다.

## 예제 {#examples}

1. Broker 두 개 추가

    ```sql
    ALTER SYSTEM ADD BROKER broker1 "host1:port", "host2:port";
    ```
2. FQDN을 사용하여 Broker 추가

    ```sql
    ALTER SYSTEM ADD BROKER broker1 "broker_fqdn1:port";
    ```
