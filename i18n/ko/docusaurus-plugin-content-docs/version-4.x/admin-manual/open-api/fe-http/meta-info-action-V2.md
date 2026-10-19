---
{
    "title": "메타 정보 작업 V2 | Fe Http",
    "language": "ko",
    "description": "데이터베이스 목록, 테이블 목록, 테이블 스키마 등 클러스터의 메타데이터 정보를 가져오는 데 사용합니다.",
    "sidebar_label": "메타 정보 작업 V2"
}
---

# 메타 정보 작업 {#meta-info-action}

## 요청 {#request}

`GET /api/meta/namespaces/<ns>/databases`
`GET /api/meta/namespaces/<ns>/databases/<db>/tables`
`GET /api/meta/namespaces/<ns>/databases/<db>/tables/<tbl>/schema`


## 설명 {#description}

데이터베이스 목록, 테이블 목록, 테이블 스키마 등 클러스터의 메타데이터 정보를 가져오는 데 사용합니다.


## 경로 매개변수 {#path-parameters}

* `ns`

    클러스터 이름을 지정합니다.

* `db`

    데이터베이스 이름을 지정합니다.

* `tbl`

    테이블 이름을 지정합니다.

## 쿼리 매개변수 {#query-parameters}

없음

## 요청 본문 {#request-body}

없음

## 응답 {#response}

```
{
    "msg":"success",
    "code":0,
    "data":["database list" / "table list" / "table schema"],
    "count":0
}
```
