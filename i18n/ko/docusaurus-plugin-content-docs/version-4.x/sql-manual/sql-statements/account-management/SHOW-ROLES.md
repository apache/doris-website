---
{
    "title": "SHOW ROLES",
    "language": "ko",
    "description": "SHOW ROLES 문은 역할 이름, 소속 사용자, 권한 등 생성된 모든 역할의 정보를 표시하는 데 사용됩니다."
}
---

## 설명 {#description}

`SHOW ROLES` 문은 역할 이름, 소속 사용자, 권한 등 생성된 모든 역할의 정보를 표시하는 데 사용됩니다.

## 구문 {#syntax}

```sql
SHOW ROLES
```

## 반환 값 {#return-value}

| 열                    | 데이터 타입 | 설명                           |
|-----------------------|-------------|--------------------------------|
| Name                  | string      | 역할 이름                      |
| Comment               | string      | 설명                           |
| Users                 | string      | 소속 사용자                    |
| GlobalPrivs           | string      | 전역 권한                      |
| CatalogPrivs          | string      | Catalog 권한                   |
| DatabasePrivs         | string      | 데이터베이스 권한               |
| TablePrivs            | string      | 테이블 권한                    |
| ResourcePrivs         | string      | 리소스 권한                    |
| WorkloadGroupPrivs    | string      | 워크로드 그룹 권한              |

## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 사용자는 최소한 다음 권한을 보유해야 합니다.

| 권한          | 객체      | 설명 |
|:--------------|:----------|:------|
| GRANT_PRIV    | USER 또는 ROLE    | GRANT_PRIV 권한이 있는 사용자 또는 역할만 이 작업을 수행할 수 있습니다.  |

## 사용 시 참고 사항 {#usage-notes}

Doris는 각 사용자에 대해 기본 역할을 생성합니다. 기본 역할을 표시하려면 ```set show_user_default_role=true;``` 명령을 실행하면 됩니다.

## 예제 {#example}

- 생성된 역할 조회

```sql
SHOW ROLES
```
