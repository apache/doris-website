---
{
    "title": "USE DATABASE",
    "language": "ko",
    "description": "지정한 데이터베이스 또는 컴퓨트 그룹으로 전환하는 데 사용합니다."
}
---

## 설명 {#description}

지정한 데이터베이스 또는 컴퓨트 그룹으로 전환하는 데 사용합니다.

## 구문 {#syntax}

```SQL
USE { [<catalog_name>.]<database_name>[@<compute_group_name>] | @<compute_group_name> }
```

## 필수 매개변수 {#required-parameters}

지정한 데이터베이스로 전환합니다.

**1. `<database_name>`**
> 전환할 데이터베이스의 이름입니다.
> Catalog를 지정하지 않으면 기본적으로 현재 Catalog를 사용합니다.

지정한 컴퓨트 그룹으로만 전환합니다.

**1. `<compute_group_name>`**
> 전환할 컴퓨트 그룹의 이름입니다.

## 선택적 매개변수 {#optional-parameters}

지정한 데이터베이스로 전환합니다.

**1. `<catalog_name>`**
> 전환할 Catalog의 이름입니다.

**2. `<compute_group_name>`**
> 전환할 컴퓨트 그룹의 이름입니다.

## 접근 제어 요구 사항 {#access-control-requirements}

| 권한        | 객체                  | 비고                                                                 |
|-------------|-----------------------|----------------------------------------------------------------------|
| SELECT_PRIV | Catalog, 데이터베이스 | 전환할 Catalog 또는 데이터베이스에 대한 SELECT_PRIV 권한이 필요합니다. |
| USAGE_PRIV  | 컴퓨트 그룹           | 전환할 컴퓨트 그룹에 대한 USAGE_PRIV 권한이 필요합니다. |

## 예시 {#examples}

1. `demo` 데이터베이스가 있으면 다음과 같이 사용해 봅니다:

   ```sql
   use demo;
   ```

2. `demo` 데이터베이스가 `hms_catalog` Catalog에 있으면 다음과 같이 `hms_catalog`로 전환하여 해당 데이터베이스를 사용해 봅니다:

    ```sql
    use hms_catalog.demo;
    ```

3. `demo` 데이터베이스가 현재 Catalog에 있고 'cg1'이라는 컴퓨트 그룹을 사용하려면 다음과 같이 접근해 봅니다:

    ```sql
    use demo@cg1;
    ```

4. 'cg1'이라는 컴퓨트 그룹만 사용하려면 다음과 같이 접근해 봅니다:

    ```sql
    use @cg1;
    ```
