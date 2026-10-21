---
{
    "title": "DROP FOLLOWER",
    "language": "ko",
    "description": "이 명령문은 FRONTEND의 FOLLOWER 역할을 가진 노드를 삭제합니다. (관리자 전용!)"
}
---

## 설명 {#description}

이 명령문은 FRONTEND의 FOLLOWER 역할을 가진 노드를 삭제합니다. (관리자 전용!)

## 구문 {#syntax}

```sql
ALTER SYSTEM DROP FOLLOWER "<follower_host>:<edit_log_port>"
```

## 필수 매개변수 {#required-parameters}

**1. `<follower_host>`**

> FE 노드의 호스트 이름 또는 IP 주소를 지정할 수 있습니다.

**2. `<edit_log_port>`**

> FE 노드의 bdbje 통신 포트이며, 기본값은 9010입니다.

## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 사용자는 최소한 다음 권한을 가지고 있어야 합니다.

| 권한 | 객체 | 비고 |
|-----------|----|-------|
| NODE_PRIV |    |       |

## 사용 시 주의 사항 {#usage-notes}

1. FOLLOWER 노드를 삭제하기 전에 오프라인으로 전환할 노드가 Master 노드가 아닌지 확인하세요.
2. FOLLOWER 노드를 삭제하기 전에 해당 노드가 오프라인으로 전환된 후 클러스터의 FOLLOWER 노드 수가 홀수가 되는지 확인하세요.
3. FOLLOWER 노드를 삭제한 후 [`SHOW FRONTENDS`](./SHOW-FRONTENDS.md) 명령을 사용하여 노드가 정상적으로 삭제되었는지 확인하세요.

## 예제 {#examples}

1. FOLLOWER 노드 삭제

   ```sql
   ALTER SYSTEM DROP FOLLOWER "host_ip:9010"
   ```
   이 명령은 클러스터의 FOLLOWER 노드(IP host_ip, 포트 9010)를 삭제합니다.
