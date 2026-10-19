---
{
    "title": "MODIFY FRONTEND HOSTNAME",
    "language": "ko",
    "description": "FRONTEND(이하 FE)의 속성을 수정합니다. 현재 이 명령으로는 FE의 HOSTNAME만 수정할 수 있습니다."
}
---

## 설명 {#description}

FRONTEND(이하 FE)의 속성을 수정합니다. 현재 이 명령으로는 FE의 HOSTNAME만 수정할 수 있습니다. 클러스터의 특정 FE 인스턴스가 실행 중인 호스트의 호스트 이름을 변경해야 하는 경우, 이 명령을 사용하여 해당 FE가 클러스터에 등록한 호스트 이름을 변경하고 정상 동작을 유지할 수 있습니다.

이 명령은 DORIS 클러스터를 FQDN 배포 방식으로 전환하는 데만 사용합니다. FQDN 배포에 대한 자세한 내용은 "FQDN" 장을 참조하세요.

## 구문 {#syntax}

```sql
ALTER SYSTEM MODIFY FRONTEND "<frontend_hostname_port>" HOSTNAME "<frontend_new_hostname>"
```
## 필수 매개변수 {#required-parameters}

**<frontend_hostname_port>**

> 호스트 이름을 변경할 FE가 등록한 호스트 이름과 edit log 포트입니다. SHOW FRONTENDS 명령을 사용하여 클러스터의 모든 FE에 대한 정보를 확인할 수 있습니다. 자세한 사용법은 "SHOW FRONTENDS" 장을 참조하세요.

**<frontend_new_hostname>**

> FE의 새 호스트 이름입니다.

## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 사용자는 최소한 NODE_PRIV 권한이 있어야 합니다.

## 예제 {#examples}

클러스터의 FE 인스턴스의 호스트 이름을 10.10.10.1에서 172.22.0.1로 변경합니다.

```sql
ALTER SYSTEM
MODIFY FRONTEND "10.10.10.1:9010"
HOSTNAME "172.22.0.1"
```
