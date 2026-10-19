---
{
    "title": "SET DEFAULT STORAGE VAULT",
    "language": "ko",
    "description": "이 문은 Doris에서 기본 storage vault를 설정하는 데 사용됩니다. 기본 storage vault는 내부 테이블이나 시스템 테이블의 데이터를 저장하는 데 사용됩니다."
}
---

## 설명 {#description}

이 문은 Doris에서 기본 storage vault를 설정하는 데 사용됩니다. 기본 storage vault는 내부 테이블이나 시스템 테이블의 데이터를 저장하는 데 사용됩니다. 기본 storage vault를 설정하지 않으면 Doris가 정상적으로 작동할 수 없습니다. 기본 storage vault는 한 번 설정하면 제거할 수 없습니다.


## 구문 {#syntax}

```sql
SET <vault_name> AS DEFAULT STORAGE VAULT
```

## 필수 매개변수 {#required-parameters}

| 매개변수 이름          | 설명                                                         |
|-------------------|--------------------------------------------------------------|
| `<vault_name>`    | storage vault의 이름입니다. 기본 storage vault로 설정할 vault의 고유 식별자입니다.           |

## 사용 시 참고 사항: {#usage-notes}
> 1. ADMIN 사용자만 기본 storage vault를 설정할 수 있습니다.

## 예제 {#examples}

1. 이름이 s3_vault인 storage vault를 기본 storage vault로 설정합니다.

   ```sql
   SET s3_vault AS DEFAULT STORAGE VAULT;
   ```
