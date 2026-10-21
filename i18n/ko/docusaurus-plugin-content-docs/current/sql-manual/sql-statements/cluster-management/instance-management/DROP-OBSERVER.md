---
{
    "title": "DROP OBSERVER",
    "language": "ko",
    "description": "이 문은 FRONTEND에서 OBSERVER 역할을 가진 노드를 삭제합니다(관리자만 사용 가능!)."
}
---

## 설명 {#description}

이 문은 FRONTEND에서 OBSERVER 역할을 가진 노드를 삭제합니다(관리자만 사용 가능!).

## 구문 {#syntax}

```sql
ALTER SYSTEM DROP OBSERVER "<observer_host>:<edit_log_port>"
```

## 필수 매개변수 {#required-parameters}

**1. `<observer_host>`**

> FE 노드의 호스트 이름 또는 IP 주소를 지정할 수 있습니다.

**2. `<edit_log_port>`**

> FE 노드의 bdbje 통신 포트이며, 기본값은 9010입니다.

## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 사용자는 최소한 다음 권한을 보유해야 합니다.

| 권한 | 객체 | 참고 사항 |
|-----------|----|-------|
| NODE_PRIV |    |       |

## 사용 시 참고 사항 {#usage-notes}

1. OBSERVER 노드를 삭제한 후 [`SHOW FRONTENDS`](./SHOW-FRONTENDS.md) 명령을 사용하여 노드가 성공적으로 삭제되었는지 확인합니다.

## 예제 {#examples}

1. OBSERVER 노드 삭제

   ```sql
   ALTER SYSTEM DROP OBSERVER "host_ip:9010"
   ```
   이 명령은 클러스터에서 OBSERVER 노드(IP host_ip, 포트 9010)를 삭제합니다.
