---
{
    "title": "상태 확인 액션",
    "language": "ko",
    "description": "현재 클러스터에서 정상 동작 중인 BE 노드 수와 중단된 BE 노드 수를 반환합니다."
}
---

# 상태 확인 액션 {#health-action}

## 요청 {#request}

`GET /api/health`

## 설명 {#description}

현재 클러스터에서 정상 동작 중인 BE 노드 수와 중단된 BE 노드 수를 반환합니다.

## 경로 매개변수 {#path-parameters}

없음

## 쿼리 매개변수 {#query-parameters}

없음

## 요청 본문 {#request-body}

없음

## 응답 {#response}

```
{
	"msg": "success",
	"code": 0,
	"data": {
		"online_backend_num": 10,
		"total_backend_num": 10
	},
	"count": 0
}
```
