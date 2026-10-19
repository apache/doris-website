---
{
    "title": "SHOW BROKER",
    "language": "ko",
    "description": "현재 존재하는 broker 프로세스의 상태를 확인하는 데 사용되는 문입니다."
}
---

## 설명 {#description}

현재 존재하는 broker 프로세스의 상태를 확인하는 데 사용되는 문입니다.

## 구문 {#syntax}

```sql
SHOW BROKER;
```


## 출력 {#output}
| 열             | 데이터 타입 | 설명                                                           |
|----------------|----------|----------------------------------------------------------------|
| Name           | varchar  | Broker 프로세스 이름                                            |
| Host           | varchar  | Broker 프로세스 노드 IP                                         |
| Port           | varchar  | Broker 프로세스 노드 포트                                       |
| Alive          | varchar  | Broker 프로세스 노드 상태                                       |
| LastStartTime  | varchar  | Broker 프로세스의 마지막 시작 시간                              |
| LastUpdateTime | varchar  | Broker 프로세스의 마지막 업데이트 시간                          |
| ErrMsg         | varchar  | Broker 프로세스가 마지막으로 시작에 실패했을 때의 오류 메시지    |


## 접근 제어 요구 사항 {#access-control-requirements}
이 문을 실행하는 사용자는 `ADMIN/OPERATOR` 권한이 있어야 합니다.

## 예제 {#examples}

1. 현재 존재하는 broker 프로세스의 상태 확인
    ```sql
    show broker;
    ```
    ```text
    +-------------+------------+------+-------+---------------------+---------------------+--------+
    | Name        | Host       | Port | Alive | LastStartTime       | LastUpdateTime      | ErrMsg |
    +-------------+------------+------+-------+---------------------+---------------------+--------+
    | broker_test | 10.10.10.1 | 8196 | true  | 2025-01-21 11:30:10 | 2025-01-21 11:31:40 |        |
    +-------------+------------+------+-------+---------------------+---------------------+--------+
    ```
