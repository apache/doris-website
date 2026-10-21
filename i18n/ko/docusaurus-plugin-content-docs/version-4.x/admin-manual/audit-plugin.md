---
{
    "title": "감사 로그",
    "language": "ko",
    "description": "Doris는 데이터베이스 작업에 대한 감사 기능을 제공하여 사용자 로그인, 쿼리 등을 기록할 수 있습니다."
}
---

Doris는 데이터베이스 작업에 대한 감사 기능을 제공하여 사용자 로그인, 쿼리 및 데이터베이스 수정 작업을 기록할 수 있습니다. Doris에서는 내장 시스템 테이블을 통해 감사 로그를 직접 쿼리하거나 Doris의 감사 로그 파일을 열어 볼 수 있습니다.

## 감사 로그 활성화 {#enabling-audit-logs}

Doris에는 2.1.0 버전부터 감사 로그 플러그인이 내장되어 있어 별도로 설치할 필요가 없습니다. 전역 변수 `enable_audit_plugin`은 감사 로그를 `__internal_schema.audit_log`에 기록할지 여부를 제어합니다. 기본값은 Doris 버전에 따라 다릅니다.

| Doris 버전 | `enable_audit_plugin`의 기본값 |
| --- | --- |
| 2.1.x, 3.0.x, 3.1.0 및 3.1.1 | `false` (비활성화) |
| 3.1.2 및 이후 3.1.x 릴리스 | `true` (활성화) |
| 4.0.0 및 이후 릴리스 | `true` (활성화) |

감사 로그 플러그인은 3.1.2 및 이후 3.1.x 릴리스에서 기본적으로 활성화됩니다. 4.0.0 및 이후 릴리스에서도 기본적으로 활성화됩니다. 이 버전들에서는 `enable_audit_plugin`의 기본값이 `true`입니다.

클러스터의 현재 값을 확인합니다.

```sql
SHOW GLOBAL VARIABLES LIKE 'enable_audit_plugin';
```

값이 `false`이면 언제든지 다음과 같이 활성화할 수 있습니다.

```sql
SET GLOBAL enable_audit_plugin = true;
```

활성화하면 Doris는 이후에 생성되는 감사 로그를 `__internal_schema.audit_log`에 기록합니다.

감사 로그 테이블에 대한 기록을 비활성화하려면 다음을 실행합니다.

```sql
SET GLOBAL enable_audit_plugin = false;
```

플러그인을 비활성화하면 `__internal_schema.audit_log`에 대한 새로운 기록은 중단되며 기존 레코드는 유지됩니다. 이 변수는 아래에서 설명하는 `fe.audit.log` 파일을 제어하지 않습니다.

## 감사 로그 테이블 조회 {#viewing-the-audit-log-table}

:::caution 참고

2.1.8 이전 버전에서는 시스템 버전이 업그레이드되면서 감사 로그 테이블의 필드가 늘어날 수 있습니다. 업그레이드 후에는 감사 로그 테이블의 필드에 맞춰 `audit_log` 테이블에 `ALTER TABLE` 명령으로 필드를 추가해야 합니다.

:::

Doris 2.1 버전부터 감사 로그 기능을 활성화하면 Doris는 사용자 작업을 [`audit_log`](../admin-manual/system-tables/internal_schema/audit_log) 테이블에 기록할 수 있습니다. 이 테이블은 `__internal_schema` 데이터베이스에 있습니다.

감사 로그 테이블은 기본적으로 일 단위로 파티션이 생성되는 동적 파티션 테이블이며, 최근 30일간의 데이터를 보관합니다. `dynamic_partition.start` 속성을 `ALTER TABLE` 문으로 수정하여 동적 파티션의 보관 기간을 조정할 수 있습니다.

## 감사 로그 파일 {#audit-log-files}

`fe.conf`의 `LOG_DIR` 설정은 FE 로그의 저장 경로를 지정합니다. 이 FE 노드에서 실행한 모든 데이터베이스 작업은 `${LOG_DIR}/fe.audit.log`에 기록됩니다. 클러스터의 모든 작업을 확인하려면 각 FE 노드의 감사 로그를 모두 살펴봐야 합니다.

## 감사 로그 형식 {#audit-log-format}

3.0.7 이전 버전에서는 문에 포함된 `\n`, `\t`, `\r` 기호를 `\\n`, `\\t`, `\\r`로 대체했습니다. 이렇게 수정된 문은 `fe.audit.log` 파일과 `audit_log` 테이블에 저장되었습니다.

3.0.7 버전부터는 `fe.audit.log` 파일에 기록할 때 문에 포함된 `\n`만 `\\n`으로 대체합니다. `audit_log` 테이블에는 문을 원래 형식 그대로 저장합니다.

## 감사 로그 설정 {#audit-log-configuration}

**전역 변수:**

감사 로그 변수는 `set [global] <var_name> = <var_value>`로 수정할 수 있습니다.

| 변수                               | 기본값 | 설명                                     |
| -------------------------------------- | ------------- | ----------------------------------------------- |
| `audit_plugin_max_batch_interval_sec`  | 60초    | 감사 로그 테이블에 기록하는 최대 시간 간격입니다. |
| `audit_plugin_max_batch_bytes`         | 50MB          | 감사 로그 테이블에 배치당 기록할 수 있는 최대 데이터 크기입니다. |
| `audit_plugin_max_sql_length`          | 4096          | 감사 로그 테이블에 기록되는 SQL 문의 최대 길이입니다. |
| `audit_plugin_load_timeout`            | 600초   | 감사 로그 데이터 적재 작업의 기본 제한 시간입니다.      |
| `audit_plugin_max_insert_stmt_length` | Int.MAX | `INSERT` 문의 최대 길이 제한입니다. `audit_plugin_max_sql_length`보다 크면 `audit_plugin_max_sql_length` 값을 사용합니다. 이 매개변수는 3.0.6부터 지원됩니다. |

일부 `INSERT INTO VALUES` 문은 길이가 매우 길고 자주 제출되어 감사 로그의 크기가 지나치게 커질 수 있습니다. 이를 방지하기 위해 Doris는 3.0.6 버전에서 `audit_plugin_max_insert_stmt_length`를 추가하여 `INSERT` 문의 감사 로그 기록 길이를 별도로 제한할 수 있도록 했습니다. 이렇게 하면 감사 로그가 과도하게 커지는 것을 방지하고 SQL 문을 빠짐없이 감사할 수 있습니다.

**FE 설정 항목:**

FE 설정 항목은 `fe.conf` 디렉터리를 편집하여 수정할 수 있습니다.

| 설정 항목         | 설명                                                                                                                                                                 |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `skip_audit_user_list`     | 특정 사용자의 작업이 감사 로그에 기록되지 않도록 하려면 이 설정을 수정하면 됩니다(3.0.01 버전부터 지원). 예를 들어 다음과 같이 설정하면 `user1`과 `user2`를 감사 로그 기록 대상에서 제외할 수 있습니다: `skip_audit_user_list=user1,user2`|
