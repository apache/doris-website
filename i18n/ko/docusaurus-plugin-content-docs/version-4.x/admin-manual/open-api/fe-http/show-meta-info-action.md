---
{
    "title": "메타데이터 정보 조회 액션",
    "language": "ko",
    "description": "일부 메타데이터 정보를 표시하는 데 사용합니다"
}
---

# 메타데이터 정보 조회 액션 {#show-meta-info-action}

## 요청 {#request}

`GET /api/show_meta_info`

## 설명 {#description}

일부 메타데이터 정보를 표시하는 데 사용합니다

## 경로 매개변수 {#path-parameters}

없음

## 쿼리 매개변수 {#query-parameters}

* action

    가져올 메타데이터 정보의 유형을 지정합니다. 현재 다음 유형을 지원합니다.

    * `SHOW_DB_SIZE`

        지정한 데이터베이스의 데이터 크기를 바이트 단위로 가져옵니다.

    * `SHOW_HA`

        FE 메타데이터 로그의 재생 상태와 선출 가능 그룹의 상태를 가져옵니다.

## 요청 본문 {#request-body}

없음

## 응답 {#response}


* `SHOW_DB_SIZE`

    ```
    {
    	"msg": "success",
    	"code": 0,
    	"data": {
    		"default_cluster:information_schema": 0,
    		"default_cluster:db1": 381
    	},
    	"count": 0
    }
    ```

* `SHOW_HA`

    ```
    {
    	"msg": "success",
    	"code": 0,
    	"data": {
    		"can_read": "true",
    		"role": "MASTER",
    		"is_ready": "true",
    		"last_checkpoint_version": "1492",
    		"last_checkpoint_time": "1596465109000",
    		"current_journal_id": "1595",
    		"electable_nodes": "",
    		"observer_nodes": "",
    		"master": "10.81.85.89"
    	},
    	"count": 0
    }
    ```

## 예시 {#examples}

1. 클러스터 내 각 데이터베이스의 데이터 크기 확인

    ```
    GET /api/show_meta_info?action=show_db_size

    Response:
    {
    	"msg": "success",
    	"code": 0,
    	"data": {
    		"default_cluster:information_schema": 0,
    		"default_cluster:db1": 381
    	},
    	"count": 0
    }
    ```

2. FE 선출 그룹의 상태 확인

    ```
    GET /api/show_meta_info?action=show_ha

    Response:
    {
    	"msg": "success",
    	"code": 0,
    	"data": {
    		"can_read": "true",
    		"role": "MASTER",
    		"is_ready": "true",
    		"last_checkpoint_version": "1492",
    		"last_checkpoint_time": "1596465109000",
    		"current_journal_id": "1595",
    		"electable_nodes": "",
    		"observer_nodes": "",
    		"master": "10.81.85.89"
    	},
    	"count": 0
    }
    ```
