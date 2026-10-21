---
{
    "title": "실행 상태 확인",
    "language": "ko",
    "description": "모니터링 서비스가 BE의 실행 상태를 확인할 수 있도록 제공됩니다. BE가 실행 중이면 응답합니다."
}
---

# 실행 상태 확인 {#check-alive}

## 요청 {#request}

`GET /api/health`

## 설명 {#description}

모니터링 서비스가 BE의 실행 상태를 확인할 수 있도록 제공됩니다. BE가 실행 중이면 응답합니다.

## 쿼리 매개변수 {#query-parameters}

없음

## 요청 본문 {#request-body}

없음

## 응답 {#response}

    ```
    {"status": "OK","msg": ""}
    ```

## 예제 {#examples}


    ```
    curl http://127.0.0.1:8040/api/health
    ```
