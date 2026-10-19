---
{
    "title": "DROP BROKER",
    "language": "ko",
    "description": "이 문은 BROKER 노드를 삭제하는 데 사용됩니다."
}
---

## 설명 {#description}

이 문은 BROKER 노드를 삭제하는 데 사용됩니다.

## 구문 {#syntax}

1. 모든 Broker 삭제
    ```sql
    ALTER SYSTEM DROP ALL BROKER broker_name;
    ```

2. 하나 이상의 Broker 노드 삭제
    ```sql
    ALTER SYSTEM DROP BROKER <broker_name> "<host>:<ipc_port>"[, "<host>:<ipc_port>" [, ...] ];
    ```
## 필수 매개변수 {#required-parameters}

**1. `<broker_name>`**

삭제할 broker 프로세스의 이름입니다.

**2. `<host>`**

삭제할 broker 프로세스가 실행되는 노드의 IP입니다. FQDN이 활성화되어 있으면 해당 노드의 FQDN을 사용합니다.

**3. `<ipc_port>`**
삭제할 broker 프로세스가 실행되는 노드의 PORT이며, 이 포트의 기본값은 8000입니다.


## 접근 제어 요구 사항 {#access-control-requirements}
이 작업을 실행하는 사용자에게는 NODE_PRIV 권한이 필요합니다.

## 예제 {#examples}

1. 모든 Broker 삭제

    ```sql
    ALTER SYSTEM DROP ALL BROKER broker_name;
    ```

2. 특정 Broker 노드 삭제

    ```sql
    ALTER SYSTEM DROP BROKER broker_name "10.10.10.1:8000";
    ```
