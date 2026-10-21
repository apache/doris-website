---
{
    "title": "Backends 액션",
    "language": "ko",
    "description": "Backends 액션은 Backend의 IP, PORT 등의 정보를 포함한 Backend 목록을 반환합니다."
}
---

# Backends 액션 {#backends-action}

## 요청 {#request}

```
GET /api/backends
```

## 설명 {#description}

Backends 액션은 Backend의 IP, PORT 등의 정보를 포함한 Backend 목록을 반환합니다.

## 경로 매개변수 {#path-parameters}

없음

## 쿼리 매개변수 {#query-parameters}

* `is_alive`

    활성 상태인 BE 노드만 반환할지 지정하는 선택적 매개변수입니다. 기본값은 false이며, 이 경우 모든 BE 노드를 반환합니다.

## 요청 본문 {#request-body}

없음

## 응답 {#response}

```
{
    "msg": "success",
    "code": 0,
    "data": {
        "backends": [
            {
                "ip": "192.1.1.1",
                "http_port": 8040,
                "is_alive": true
            }
        ]
    },
    "count": 0
}
```
