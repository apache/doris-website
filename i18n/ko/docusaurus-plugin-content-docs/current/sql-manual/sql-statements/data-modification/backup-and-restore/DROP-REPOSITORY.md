---
{
    "title": "DROP REPOSITORY",
    "language": "ko",
    "description": "생성된 저장소를 삭제하는 데 사용하는 문입니다."
}
---

## 설명 {#description}

생성된 저장소를 삭제하는 데 사용하는 문입니다.

## 구문 {#syntax}

```sql
DROP REPOSITORY <repo_name>;
```

## 필수 매개변수 {#required-parameters}
**<repo_name>**
> 저장소의 고유한 이름입니다.

## 접근 제어 요구 사항 {#access-control-requirements}

| 권한               | 객체                         | 참고 사항                                               |
|:-------------------|:-----------------------------|:----------------------------------------------------|
| ADMIN_PRIV         | 전체 클러스터 관리 권한 | root 또는 superuser만 저장소를 생성할 수 있습니다  |


## 사용 시 참고 사항 {#usage-notes}
- 저장소를 삭제하면 Doris의 매핑만 제거되며 실제 저장소 데이터는 삭제되지 않습니다. 삭제 후 동일한 LOCATION을 지정하여 저장소를 다시 매핑할 수 있습니다.

## 예제 {#examples}

이름이 example_repo인 저장소를 삭제합니다.

```sql
DROP REPOSITORY `example_repo`;
```
