---
{
    "title": "로그인 작업",
    "language": "ko",
    "description": "서비스에 로그인하는 데 사용합니다."
}
---

# 로그인 작업 {#login-action}

## 요청 {#request}

`POST /rest/v1/login`

## 설명 {#description}

서비스에 로그인하는 데 사용합니다.

## 경로 매개변수 {#path-parameters}

없음

## 쿼리 매개변수 {#query-parameters}

없음

## 요청 본문 {#request-body}

없음

## 응답 {#response}

* 로그인 성공

    ```
    {
    	"msg": "Login success!",
    	"code": 200
    }
    ```

* 로그인 실패

    ```
    {
    	"msg": "Error msg...",
    	"code": xxx,
    	"data": "Error data...",
    	"count": 0
    }
    ```
