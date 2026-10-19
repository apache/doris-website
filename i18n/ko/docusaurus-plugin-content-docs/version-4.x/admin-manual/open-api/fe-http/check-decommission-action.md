---
{
    "title": "Decommission 작업 확인",
    "language": "ko",
    "description": "지정한 BE의 decommission 가능 여부를 확인합니다. 예를 들어, 노드를 decommission한 후,"
}
---

# Decommission 작업 확인 {#check-decommission-action}

## 요청 {#request}

`GET /api/check_decommission`

## 설명 {#description}

지정한 BE의 decommission 가능 여부를 확인합니다. 예를 들어, 노드를 decommission한 후 나머지 노드가 저장 공간 요구 사항과 복제본 수를 충족할 수 있는지 확인합니다.

## 경로 매개변수 {#path-parameters}

없음

## 쿼리 매개변수 {#query-parameters}

* `host_ports`

    하나 이상의 BE를 쉼표로 구분하여 지정합니다. 예: `ip1:port1,ip2:port2,...`.

    여기서 port는 BE의 heartbeat 포트입니다.

## 요청 본문 {#request-body}

없음

## 응답 {#response}

 decommission이 가능한 노드 목록을 반환합니다.

```
{
	"msg": "OK",
	"code": 0,
	"data": ["192.168.10.11:9050", "192.168.10.12:9050"],
	"count": 0
}
```

## 예제 {#examples}

1. 지정한 BE 노드의 decommission 가능 여부 확인

    ```
    GET /api/check_decommission?host_ports=192.168.10.11:9050,192.168.10.12:9050

    Response:
    {
    	"msg": "OK",
    	"code": 0,
    	"data": ["192.168.10.11:9050", "192.168.10.12:9050"],
    	"count": 0
    }
    ```
