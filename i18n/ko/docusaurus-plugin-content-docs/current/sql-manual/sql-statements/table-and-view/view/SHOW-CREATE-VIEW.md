---
{
    "title": "SHOW CREATE VIEW",
    "language": "ko",
    "description": "지정된 뷰를 생성할 때 사용한 CREATE VIEW 문을 표시합니다."
}
---

## 설명 {#description}

지정된 뷰를 생성할 때 사용한 CREATE VIEW 문을 표시합니다.

## 구문 {#syntax}

```sql
SHOW CREATE VIEW <name>
```

## 필수 매개변수 {#required-parameters}

`**<name>**`  조회할 뷰의 이름입니다.

## 결과 설명 {#result-description}

- View: 쿼리한 뷰의 이름입니다.
- Create View: 데이터베이스에 저장된 SQL 문입니다.
- character_set_client: 뷰 생성 시 세션의 character_set_client 시스템 변수 값입니다.
- collation_connection: 뷰 생성 시 세션의 collation_connection 시스템 변수 값입니다.

## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 사용자는 최소한 다음 권한을 보유해야 합니다:

| 권한             | 객체   | 비고  |
| ---------------- | ------ | ----- |
| SHOW_VIEW_PRIV   | 테이블 |       |

뷰 정보는 INFORMATION_SCHEMA.VIEWS 테이블을 쿼리하여 확인할 수도 있습니다.

## 예제 {#examples}

```sql
CREATE VIEW vtest AS SELECT 1, 'test';
SHOW CREATE VIEW vtest;
```

쿼리 결과:

```sql
+-------+------------------------------------------+----------------------+----------------------+
| View  | Create View                              | character_set_client | collation_connection |
+-------+------------------------------------------+----------------------+----------------------+
| vtest | CREATE VIEW `vtest` AS SELECT 1, 'test'; | utf8mb4              | utf8mb4_0900_bin     |
+-------+------------------------------------------+----------------------+----------------------+
```
