---
{
    "title": "통계 작업",
    "language": "ko",
    "description": "데이터베이스 및 테이블 수와 같은 클러스터 통계를 조회합니다."
}
---

# 통계 작업 {#statistic-action}

## 요청 {#request}

`GET /rest/v2/api/cluster_overview`

## 설명 {#description}

데이터베이스 및 테이블 수와 같은 클러스터 통계를 조회합니다.

## 경로 매개변수 {#path-parameters}

없음

## 쿼리 매개변수 {#query-parameters}

없음

## 요청 본문 {#request-body}

없음

## 응답 {#response}

```
{
    "msg":"success",
    "code":0,
    "data":{"diskOccupancy":0,"remainDisk":5701197971457,"feCount":1,"tblCount":27,"beCount":1,"dbCount":2},
    "count":0
}
```
