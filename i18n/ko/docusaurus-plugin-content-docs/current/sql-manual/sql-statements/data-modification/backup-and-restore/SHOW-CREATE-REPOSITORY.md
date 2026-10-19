---
{
    "title": "SHOW CREATE REPOSITORY",
    "language": "ko",
    "description": "이 문은 저장소의 생성문을 표시하는 데 사용됩니다."
}
---

## 설명 {#description}

이 문은 저장소의 생성문을 표시하는 데 사용됩니다.

## 구문 {#syntax}

```sql
SHOW CREATE REPOSITORY for <repo_name>;
```

## 필수 매개변수 {#required-parameters}
**<repo_name>**
> 저장소의 고유한 이름입니다.

## 예제 {#examples}

지정한 저장소의 생성문 표시

```sql
SHOW CREATE REPOSITORY for test_repository;
```
