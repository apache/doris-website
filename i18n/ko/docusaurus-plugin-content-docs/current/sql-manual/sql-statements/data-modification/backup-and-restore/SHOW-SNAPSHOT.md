---
{
    "title": "SHOW SNAPSHOT",
    "language": "ko",
    "description": "이 문은 리포지토리에 이미 존재하는 백업을 조회하는 데 사용됩니다."
}
---

## 설명 {#description}

이 문은 리포지토리에 이미 존재하는 백업을 조회하는 데 사용됩니다.

## 구문 {#syntax}

```sql
SHOW SNAPSHOT ON `<repo_name>`
[WHERE SNAPSHOT = "<snapshot_name>" [AND TIMESTAMP = "<backup_timestamp>"]];
```

## 매개변수 {#parameters}

**1.`<repo_name>`**

선택한 백업 리포지토리의 이름입니다.

**2.`<snapshot_name>`**

백업 이름입니다.

**3.`<backup_timestamp>`**

백업 타임스탬프입니다.

## 반환 값 {#return-value}

| 열 | 설명 |
| -- | -- |
| Snapshot | 백업 이름 |
| Timestamp | 백업의 시간 버전에 해당합니다 |
| Status | 백업의 시간 버전에 해당합니다 |
| Database | 백업 데이터가 원래 속했던 데이터베이스의 이름 |
| Details | 전체 백업의 데이터 디렉터리와 파일 구조를 JSON 형식으로 표시합니다 |

## 예제 {#example}

1. example_repo 리포지토리에 존재하는 백업을 조회합니다

```sql
SHOW SNAPSHOT ON example_repo;
```

2. example_repo 리포지토리에서 이름이 backup1인 백업만 조회합니다:

```sql
SHOW SNAPSHOT ON example_repo WHERE SNAPSHOT = "backup1";
```

3. example_repo 리포지토리에서 이름이 backup1이고 시간 버전이 "2018-05-05-15-34-26"인 백업의 세부 정보를 조회합니다:

```sql
SHOW SNAPSHOT ON example_repo WHERE SNAPSHOT = "backup1" AND TIMESTAMP = "2018-05-05-15-34-26";
```
