---
{
    "title": "CREATE STORAGE POLICY",
    "language": "ko",
    "description": "스토리지 정책을 생성하려면 먼저 스토리지 리소스를 생성해야 합니다."
}
---

## 설명 {#description}

스토리지 정책을 생성하려면 먼저 스토리지 리소스를 생성한 다음, 마이그레이션 정책을 생성할 때 해당 스토리지 리소스 이름을 연결해야 합니다. 자세한 내용은 RESOURCE 섹션을 참조하세요.

## 구문 {#syntax}

```sql
CREATE STORAGE POLICY <policy_name>
PROPERTIES(
    "storage_resource" = "<storage_resource_name>"
    [{, "cooldown_datetime" = "<cooldown_datetime>"
    | , "cooldown_ttl" = "<cooldown_ttl>"}]
);
```

## 필수 매개변수 {#required-parameters}

1. `<policy_name>`: 생성할 스토리지 정책의 이름
2. `<storage_resource_name>`: 연결할 스토리지 리소스의 이름. 생성 방법에 대한 자세한 내용은 RESOURCE 섹션을 참조하세요.

## 선택적 매개변수 {#optional-parameters}

1. `<cooldown_datetime>`: 데이터 마이그레이션 정책을 생성할 때 쿨다운 시점을 지정합니다.
2. `<cooldown_ttl>`: 데이터 마이그레이션 정책을 생성할 때 데이터를 핫 데이터로 유지할 기간을 지정합니다.

## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 성공적으로 실행하려면 ADMIN_PRIV 권한이 있어야 합니다. 권한 문서를 참조하세요.

| 권한       | 객체                                 | 참고                            |
| :--------- | :----------------------------------- | :------------------------------ |
| ADMIN_PRIV | 전체 클러스터 관리 권한              | NODE_PRIV를 제외한 모든 권한     |

## 예제 {#examples}

1. 데이터 쿨다운 시점을 지정하여 데이터 마이그레이션 정책을 생성합니다.

    ```sql
    CREATE STORAGE POLICY testPolicy
    PROPERTIES(
    "storage_resource" = "s3",
    "cooldown_datetime" = "2022-06-08 00:00:00"
    );
    ```

2. 데이터를 핫 데이터로 유지할 기간을 지정하여 데이터 마이그레이션 정책을 생성합니다.

    ```sql
    CREATE STORAGE POLICY testPolicy
    PROPERTIES(
    "storage_resource" = "s3",
    "cooldown_ttl" = "1d"
    );
    ```
