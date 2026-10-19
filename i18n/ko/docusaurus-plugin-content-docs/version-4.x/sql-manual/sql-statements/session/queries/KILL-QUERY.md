---
{
    "title": "KILL QUERY",
    "language": "ko",
    "description": "각 Doris 연결은 별도의 스레드에서 실행됩니다. 이 문을 사용하여 스레드를 종료합니다."
}
---

## 설명 {#description}

각 Doris 연결은 별도의 스레드에서 실행됩니다. 이 문을 사용하여 스레드를 종료합니다.

## 구문 {#syntax}

```SQL
KILL [CONNECTION] <processlist_id>
```

## 변형 구문 {#varaint-syntax}

```SQL
KILL QUERY [ { <processlist_id> | <query_id> } ]
```

## 필수 매개변수 {#required-parameters}

**1. `<processlist_id>`**

> 종료할 연결 스레드의 ID를 나타냅니다.

**2. `<query_id>`**

> 종료할 쿼리의 ID를 나타냅니다.

## 선택적 매개변수 {#optional-parameters}

**1. `CONNECTION`**

> 스레드의 현재 연결 여부를 나타냅니다.

## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 사용자는 최소한 다음 권한이 있어야 합니다.

| 권한    | 객체    | 참고 사항                      |
|:--------------|:-----------|:-----------------------|
| ADMIN_PRIV | 전역 | 다른 사용자의 쿼리/연결을 종료하려면 ADMIN 권한이 필요합니다. 자신의 쿼리를 종료하는 데는 권한이 필요하지 않습니다. |

## 사용 시 참고 사항 {#usage-notes}

- 스레드의 프로세스 목록 식별자는 SHOW PROCESSLIST 출력의 Id 열에서 확인할 수 있습니다.

- 연결 ID는 SELECT CONNECTION_ID()로 확인할 수 있습니다.

## 예제 {#examples}

```sql
select connection_id()
```

```text
+-----------------+
| connection_id() |
+-----------------+
| 48              |
+-----------------+
```

```sql
SHOW PROCESSLIST
```

```text
+------------------+------+------+--------------------+---------------------+----------+---------+---------+------+-------+-----------------------------------+---------------------------------------------------------------------------------------+
| CurrentConnected | Id   | User | Host               | LoginTime           | Catalog  | Db      | Command | Time | State | QueryId                           | Info                                                                                  |
+------------------+------+------+--------------------+---------------------+----------+---------+---------+------+-------+-----------------------------------+---------------------------------------------------------------------------------------+
| Yes              |   48 | root | 10.16.xx.xx:44834   | 2025-01-21 16:49:47 | internal | test | Query   |    0 | OK    | e6e4ce9567b04859-8eeab8d6b5513e38 | SHOW PROCESSLIST                                                                      |
|                  |   50 | root | 192.168.xx.xx:52837 | 2025-01-21 16:51:34 | internal |      | Sleep   | 1837 | EOF   | deaf13c52b3b4a3b-b25e8254b50ff8cb | SELECT @@session.transaction_isolation                                                |
|                  |   51 | root | 192.168.xx.xx:52843 | 2025-01-21 16:51:35 | internal |      | Sleep   |  907 | EOF   | 437f219addc0404f-9befe7f6acf9a700 | /* ApplicationName=DBeaver Ultimate 23.1.3 - Metadata */ SHOW STATUS                  |
|                  |   55 | root | 192.168.xx.xx:55533 | 2025-01-21 17:09:32 | internal | test | Sleep   |  271 | EOF   | f02603dc163a4da3-beebbb5d1ced760c | /* ApplicationName=DBeaver Ultimate 23.1.3 - SQLEditor <Console> */ SELECT DATABASE() |
|                  |   47 | root | 10.16.xx.xx:35678   | 2025-01-21 16:21:56 | internal | test | Sleep   | 3528 | EOF   | f4944c543dc34a99-b0d0f3986c8f1c98 | select * from test                                                                    |
+------------------+------+------+--------------------+---------------------+----------+---------+---------+------+-------+-----------------------------------+---------------------------------------------------------------------------------------+
```

```sql
kill 51
```
