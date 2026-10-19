---
{
    "title": "DROP VIEW",
    "language": "ko",
    "description": "현재 데이터베이스 또는 지정한 데이터베이스에서 뷰를 삭제합니다."
}
---

## 설명 {#description}

현재 데이터베이스 또는 지정한 데이터베이스에서 뷰를 삭제합니다.

## 구문 {#syntax}

```sql
DROP VIEW [ IF EXISTS ] <name>
```
## 필수 매개변수 {#required-parameters}

삭제할 뷰의 이름입니다.

## 선택적 매개변수 {#optional-parameters}

**[ IF EXISTS ]**

이 매개변수를 지정하면 뷰가 존재하지 않아도 오류가 발생하지 않으며, 삭제 작업을 바로 건너뜁니다.

## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 사용자는 최소한 다음 권한을 보유해야 합니다.

| 권한 | 객체 | 비고 |
| :-------- | :----- | :---- |
| DROP_PRIV | 테이블  |       |

## 사용 시 참고 사항 {#usage-notes}

삭제한 뷰는 복원할 수 없으며 다시 생성해야 합니다.

## 예제 {#examples}

```sql
CREATE VIEW vtest AS SELECT 1, 'test';
DROP VIEW IF EXISTS vtest;
```
