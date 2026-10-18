---
{
    "title": "BE VLOG 변경",
    "language": "ko",
    "description": "이 기능은 BE 측의 VLOG 로그를 동적으로 조정하는 데 사용됩니다."
}
---

## 요청 {#request}

`POST /api/glog/adjust?module=<module_name>&level=<level_number>`

## 설명 {#description}

이 기능은 BE 측의 VLOG 로그를 동적으로 조정하는 데 사용됩니다.

## 쿼리 매개변수 {#query-parameters}

* `module_name`
    VLOG를 설정할 모듈로, BE 파일 이름에서 확장자를 제외한 이름에 해당합니다.

* `level_number`
    VLOG 레벨로, 1~10 사이의 값을 사용합니다. -1로 설정하면 비활성화됩니다.

## 요청 본문 {#request-body}

없음

## 응답 {#response}

    ```json
    {
        msg: "adjust vlog of xxx from -1 to 10 succeed",
        code: 0
    }
    ```

## 예제 {#examples}

    ```bash
    curl -X POST "http://127.0.0.1:8040/api/glog/adjust?module=vrow_distribution&level=-1"
    ```
