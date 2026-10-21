---
{
    "title": "UNINSTALL PLUGIN",
    "language": "ko",
    "description": "이 문은 플러그인을 제거하는 데 사용됩니다."
}
---

## 설명 {#description}

이 문은 플러그인을 제거하는 데 사용됩니다.

## 구문 {#syntax}

```sql
UNINSTALL PLUGIN <plugin_name>;
```

## 필수 매개변수 {#required-parameters}

** 1. `<plugin_name>`**
>  제거할 플러그인의 이름

## 권한 제어 {#permission-control}

이 SQL 명령을 실행하는 사용자는 최소한 다음 권한을 보유해야 합니다.

| 권한         | 객체   | 참고 사항            |
|:-----------|:-----|:--------------|
| ADMIN_PRIV | 전체 클러스터 | 전체 클러스터에 대한 관리자 권한이 필요합니다 |

## 주의 사항 {#precautions}

내장 플러그인이 아닌 플러그인만 제거할 수 있습니다.

## 예제 {#example}

- 플러그인 제거:

    ```sql
    UNINSTALL PLUGIN auditdemo;
    ```
