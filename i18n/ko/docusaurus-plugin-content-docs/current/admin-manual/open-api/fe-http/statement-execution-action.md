---
{
    "title": "문 실행 액션",
    "language": "ko",
    "description": "문 실행 액션은 문을 실행하고 결과를 반환하는 데 사용됩니다."
}
---

# 문 실행 액션 {#statement-execution-action}


## 요청 {#request}

```
POST /api/query/<ns_name>/<db_name>
```

## 설명 {#description}

문 실행 액션은 문을 실행하고 결과를 반환하는 데 사용됩니다.

## 경로 매개변수 {#path-parameters}

* `<ns_name>`

    네임스페이스를 지정합니다. 현재는 `default_cluster`만 지원합니다.

* `<db_name>`

    데이터베이스 이름을 지정합니다. 이 데이터베이스는 현재 세션의 기본 데이터베이스로 간주됩니다. SQL의 테이블 이름에 데이터베이스 이름이 명시되어 있지 않으면 이 데이터베이스를 사용합니다.

## 쿼리 매개변수 {#query-parameters}

없음

## 요청 본문 {#request-body}

```
{
    "stmt" : "select * from tbl1"
}
```

* `stmt` 필드는 실행할 SQL 문을 지정합니다.

### 응답 {#response}

* 결과 집합 반환

    ```
    {
        "msg": "success",
        "code": 0,
        "data": {
            "type": "result_set",
            "data": [
                [1],
                [2]
            ],
            "meta": [{
                "name": "k1",
                "type": "INT"
            }],
            "status": {},
            "time": 10
        },
        "count": 0
    }
    ```

    * type 필드가 `result_set`이면 결과 집합이 반환되었음을 의미합니다. meta 및 data 필드를 바탕으로 결과를 가져와 표시해야 합니다. meta 필드는 반환된 컬럼 정보를 설명합니다. data 필드는 결과 행을 반환합니다. 각 행의 컬럼 타입은 meta 필드의 내용을 바탕으로 판단해야 합니다. status 필드는 경고 행 수, 상태 코드 등 MySQL의 일부 정보를 반환합니다. time 필드는 실행 시간을 밀리초 단위로 반환합니다.

* 실행 결과 반환

    ```
    {
        "msg": "success",
        "code": 0,
        "data": {
            "type": "exec_status",
            "status": {}
        },
        "count": 0,
        "time": 10
    }
    ```

    * type 필드가 `exec_status`이면 실행 결과가 반환되었음을 의미합니다. 현재는 이 결과를 수신하면 문이 성공적으로 실행되었다는 의미입니다.
