---
{
    "title": "SHOW RESOURCES",
    "language": "ko",
    "description": "이 문은 사용자에게 사용 권한이 있는 리소스를 표시하는 데 사용됩니다. 일반 사용자는 사용 권한이 있는 리소스만 표시할 수 있습니다."
}
---

## 설명 {#description}

이 문은 사용자에게 사용 권한이 있는 리소스를 표시하는 데 사용됩니다. 일반 사용자는 사용 권한이 있는 리소스만 표시할 수 있으며, root 또는 admin 사용자는 모든 리소스를 표시합니다.

## 구문 {#syntax}

```sql
SHOW RESOURCES
[
  WHERE
  [NAME [ = "<your_resource_name>" | LIKE "<name_matcher>"]]
  [RESOURCETYPE = "<type>"]
] | [LIKE "<pattern>"]
[ORDER BY ...]
[LIMIT <limit>][OFFSET <offset>];
```

## 사용 시 참고 사항 {#usage-notes}

1. NAME LIKE를 사용하면 RESOURCES에서 Name에 name_matcher가 포함된 리소스를 찾습니다.
2. NAME =를 사용하면 지정한 Name과 정확히 일치하는 리소스를 찾습니다.
3. RESOURCETYPE을 지정하면 해당 리소스 유형과 일치하는 리소스를 찾습니다. 지원되는 RESOURCETYPE은 [CREATE-RESOURCE](./CREATE-RESOURCE.md)를 참조하세요.
4. ORDER BY를 사용하여 원하는 열 조합으로 정렬할 수 있습니다.
5. LIMIT을 지정하면 일치하는 레코드를 limit개까지 표시합니다. 지정하지 않으면 모두 표시합니다.
6. OFFSET을 지정하면 offset만큼 건너뛴 위치부터 쿼리 결과를 표시합니다. 기본 오프셋은 0입니다.
7. LIKE를 사용하면 WHERE 절은 무시됩니다.

## 예시 {#example}

1. 현재 사용자에게 사용 권한이 있는 모든 리소스 표시

   ```sql
   SHOW RESOURCES;
   ```

2. 이름에 문자열 "20140102"가 포함된 리소스를 찾아 속성 10개 표시

   ```sql
   SHOW RESOURCES WHERE NAME LIKE "2014_01_02" LIMIT 10;
   ```

3. 이름이 "20140102"인 리소스를 찾아 KEY 기준으로 내림차순 정렬

   ```sql
   SHOW RESOURCES WHERE NAME = "20140102" ORDER BY `KEY` DESC;
   ```

3. LIKE를 사용하여 패턴과 일치하는 리소스 찾기

   ```sql
   SHOW RESOURCES LIKE "jdbc%";
   ```
