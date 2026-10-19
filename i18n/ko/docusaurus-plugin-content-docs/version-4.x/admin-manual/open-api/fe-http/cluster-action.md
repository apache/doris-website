---
{
    "title": "클러스터 작업",
    "language": "ko",
    "description": "클러스터의 HTTP 및 MySQL 연결 정보를 가져오는 데 사용됩니다."
}
---

# 클러스터 작업 {#cluster-action}

## 요청 {#request}

`GET /rest/v2/manager/cluster/cluster_info/conn_info`

## 클러스터 연결 정보 {#cluster-connection-information}

`GET /rest/v2/manager/cluster/cluster_info/conn_info`

### 설명 {#description}

클러스터의 HTTP 및 MySQL 연결 정보를 가져오는 데 사용됩니다.

## 경로 매개변수 {#path-parameters}

없음

## 쿼리 매개변수 {#query-parameters}

없음

## 요청 본문 {#request-body}

없음

### 응답 {#response}

```
{
    "msg": "success",
    "code": 0,
    "data": {
        "http": [
            "fe_host:http_ip"
        ],
        "mysql": [
            "fe_host:query_ip"
        ]
    },
    "count": 0
}
```

### 예시 {#examples}
```
GET /rest/v2/manager/cluster/cluster_info/conn_info

Response:
{
    "msg": "success",
    "code": 0,
    "data": {
        "http": [
            "127.0.0.1:8030"
        ],
        "mysql": [
            "127.0.0.1:9030"
        ]
    },
    "count": 0
}
```
