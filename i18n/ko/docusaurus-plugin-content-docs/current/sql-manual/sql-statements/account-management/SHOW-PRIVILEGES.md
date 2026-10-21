---
{
    "title": "SHOW PRIVILEGES",
    "language": "ko",
    "description": "SHOW PRIVILEGES 문은 데이터베이스 시스템에서 현재 사용할 수 있는 권한 목록을 표시하는 데 사용됩니다."
}
---

## 설명 {#description}

`SHOW PRIVILEGES` 문은 데이터베이스 시스템에서 현재 사용할 수 있는 권한 목록을 표시하는 데 사용됩니다. 이를 통해 사용자는 시스템에서 지원하는 권한 유형과 각 권한의 세부 정보를 파악할 수 있습니다.

## 구문 {#syntax}

```sql
SHOW PRIVILEGES
```

## 반환 값 {#return-value}

  | 열 | 설명 |
  | -- | -- |
  | Privilege | 권한 이름 |
  | Context | 적용 범위 |
  | Comment | 설명 |

## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 사용자에게는 특정 권한이 필요하지 않습니다.

## 예제 {#examples}

모든 권한 조회

```sql
SHOW PRIVILEGES
```

```text
+-------------+-------------------------------------------------------+-----------------------------------------------+
| Privilege   | Context                                               | Comment                                       |
+-------------+-------------------------------------------------------+-----------------------------------------------+
| Node_priv   | GLOBAL                                                | Privilege for cluster node operations         |
| Admin_priv  | GLOBAL                                                | Privilege for admin user                      |
| Grant_priv  | GLOBAL,CATALOG,DATABASE,TABLE,RESOURCE,WORKLOAD GROUP | Privilege for granting privilege              |
| Select_priv | GLOBAL,CATALOG,DATABASE,TABLE                         | Privilege for select data in tables           |
| Load_priv   | GLOBAL,CATALOG,DATABASE,TABLE                         | Privilege for loading data into tables        |
| Alter_priv  | GLOBAL,CATALOG,DATABASE,TABLE                         | Privilege for alter database or table         |
| Create_priv | GLOBAL,CATALOG,DATABASE,TABLE                         | Privilege for creating database or table      |
| Drop_priv   | GLOBAL,CATALOG,DATABASE,TABLE                         | Privilege for dropping database or table      |
| Usage_priv  | RESOURCE,WORKLOAD GROUP                               | Privilege for using resource or workloadGroup |
+-------------+-------------------------------------------------------+-----------------------------------------------+
```
