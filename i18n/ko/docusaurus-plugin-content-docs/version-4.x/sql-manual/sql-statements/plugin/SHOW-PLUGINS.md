---
{
    "title": "SHOW PLUGINS",
    "language": "ko",
    "description": "설치된 플러그인을 표시하는 문입니다."
}
---

## 설명 {#description}

설치된 플러그인을 표시하는 문입니다.

## 구문 {#syntax}

```sql
SHOW PLUGINS
```

## 반환 값 {#return-value}

| 열 | 설명 |
| ------ | ----------- |
| Description | 해당 플러그인에 대한 설명 |
| Version | 해당 플러그인의 버전 번호 |
| JavaVersion | 해당 Java 버전 번호 |
| ClassName | 프로그램 클래스 이름 |
| SoName | 프로그램 공유 객체 이름 |
| Sources | 플러그인 소스 |
| Status | 설치 상태 |
| Properties | 플러그인 속성 |

## 권한 관리 {#permission-control}

이 SQL 명령을 실행하는 사용자는 최소한 다음 권한이 있어야 합니다.

| 권한         | 객체   | 비고            |
|:-----------|:-----|:--------------|
| ADMIN_PRIV | 전체 클러스터 | 전체 클러스터에 대한 관리자 권한이 필요합니다. |

## 예제 {#example}

- 설치된 플러그인 표시:

    ```SQL
    SHOW PLUGINS;
    ```

    ```text
    +-------------------------------+---------+-----------------------------------------------------------+---------+-------------+------------------------------------------------------------+--------+---------+-----------+------------+
   | Name                          | Type    | Description                                               | Version | JavaVersion | ClassName                                                  | SoName | Sources | Status    | Properties |
   +-------------------------------+---------+-----------------------------------------------------------+---------+-------------+------------------------------------------------------------+--------+---------+-----------+------------+
   | __builtin_AuditLoader         | AUDIT   | builtin audit loader, to load audit log to internal table | 2.1.0   | 1.8.31      | org.apache.doris.plugin.audit.AuditLoader                  | NULL   | Builtin | INSTALLED | {}         |
   | __builtin_AuditLogBuilder     | AUDIT   | builtin audit logger                                      | 0.12.0  | 1.8.31      | org.apache.doris.plugin.audit.AuditLogBuilder              | NULL   | Builtin | INSTALLED | {}         |
   | __builtin_SqlDialectConverter | DIALECT | builtin sql dialect converter                             | 2.1.0   | 1.8.31      | org.apache.doris.plugin.dialect.HttpDialectConverterPlugin | NULL   | Builtin | INSTALLED | {}         |
   +-------------------------------+---------+-----------------------------------------------------------+---------+-------------+------------------------------------------------------------+--------+---------+-----------+------------+
    ```
