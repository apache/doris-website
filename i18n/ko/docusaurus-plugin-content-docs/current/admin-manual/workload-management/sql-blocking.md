---
{
    "title": "쿼리 차단: SQL Block Rule 및 Workload Policy 구성 가이드",
    "sidebar_label": "쿼리 차단",
    "language": "ko",
    "description": "SQL Block Rule과 Workload Policy를 사용하여 전체 테이블 스캔을 차단하고, 쿼리 리소스 소비를 제한하며, 비정상적인 대규모 쿼리가 클러스터에 과부하를 일으키지 않도록 하는 방법을 알아봅니다.",
    "keywords": ["쿼리 차단", "SQL Block Rule", "Workload Policy", "전체 테이블 스캔 제한", "대규모 쿼리 관리", "클러스터 안정성"]
}
---

<!-- Knowledge type: concept + procedure -->

쿼리 차단은 실행 시간이 길거나 리소스를 많이 사용하는 쿼리가 클러스터 안정성에 영향을 주지 않도록 하는 보호 메커니즘입니다. 쿼리가 미리 설정된 리소스 또는 시간 제한을 초과하면 차단 기능이 해당 쿼리를 자동으로 종료하여, 단일 쿼리가 시스템 리소스를 소진하거나 다른 워크로드의 속도를 저하시키는 것을 방지합니다.

Doris는 쿼리 수명 주기의 서로 다른 단계에서 동작하는 두 가지 차단 전략을 제공합니다.

| 구분 | SQL Block Rule(계획 수립 시 차단) | Workload Policy(실행 중 차단) |
|---------|--------------------------|---------------------------|
| 적용 단계 | 쿼리 계획 수립 단계에서 실행 전에 차단 | 쿼리 실행 단계에서 실행 중 중단 |
| 판단 기준 | 예상 스캔량, SQL 패턴 매칭 | 실제 실행 시간, 메모리 사용량, 스캔량 등의 실시간 지표 |
| 정확도 | 비용 추정에 기반하므로 잘못 차단할 수 있음 | 실시간 모니터링에 기반하므로 더 정확함 |
| 사용 사례 | 알려진 위험한 SQL 패턴 및 전체 테이블 스캔 차단 | 실행 중 예상 범위를 초과하는 쿼리 중단 |
| 지원하는 문 | 모든 문(DDL, DML) | select, insert into select, stream load, routine load |

## SQL Block Rule {#sql-block-rule}

<!-- Knowledge type: concept -->

SQL Block Rule은 **계획 수립 단계**에서 특정 패턴과 일치하는 문을 차단하여 실행 단계로 넘어가지 못하게 합니다. 일반적으로 DBA가 전체 테이블 스캔이나 위험한 함수 호출처럼 이미 알려진 위험 작업을 방지하기 위해 구성합니다.

### 규칙 속성 {#rule-properties}

각 규칙은 동작과 적용 범위를 결정하는 다음 속성으로 정의됩니다.

| 속성 | 설명 | 값 |
|------|------|------|
| `sql` | 쿼리 문과 매칭할 정규 표현식 | Java 정규 표현식 문자열 |
| `sqlHash` | 쿼리 문과 매칭할 해시 값 | SQL 해시 값 문자열 |
| `cardinality` | 스캔을 허용할 최대 행 수 | 양의 정수 |
| `partition_num` | 스캔을 허용할 최대 파티션 수 | 양의 정수 |
| `tablet_num` | 스캔을 허용할 최대 tablet 수 | 양의 정수 |
| `global` | 전역 규칙 여부 | `"true"`(전역) / `"false"`(연결된 사용자에게만 적용) |
| `enable` | 규칙 활성화 여부 | `"true"` / `"false"` |

### 사용 사례 및 예시 {#use-cases-and-examples}

<!-- Knowledge type: procedure -->

#### 시나리오 1: 스캔하는 행 수 제한 {#scenario-1-limit-the-number-of-scanned-rows}

**문제**: `SELECT * FROM t`와 같은 전체 테이블 스캔 작업은 BE의 IO 및 CPU 리소스를 많이 소비합니다.

**해결 방법**: 단일 테이블에서 스캔하는 행 수의 상한을 설정합니다. 임계값을 초과하는 쿼리는 차단됩니다.

```sql
CREATE SQL_BLOCK_RULE rule_card 
PROPERTIES
(
    "cardinality" = "1000",
    "global" = "true",
    "enable" = "true"
);
```

단일 테이블에서 스캔하는 행 수가 1000개를 초과하면 쿼리가 거부됩니다.

#### 시나리오 2: 스캔하는 파티션 수 제한 {#scenario-2-limit-the-number-of-scanned-partitions}

**문제**: 너무 많은 파티션을 스캔하면 BE의 CPU 소비가 크게 증가합니다. 외부 테이블을 쿼리할 때는 네트워크 및 메타데이터 조회에 따른 오버헤드도 추가로 발생합니다. 이러한 문제는 대개 파티션 필터 조건이 누락되었거나 잘못 작성되어 발생합니다.

**해결 방법**: 단일 쿼리가 스캔할 수 있는 최대 파티션 수를 설정합니다.

```sql
CREATE SQL_BLOCK_RULE rule_part_num 
PROPERTIES
(
    "partition_num" = "30",
    "global" = "true",
    "enable" = "true"
);
```

단일 테이블에서 스캔하는 파티션 수가 30개를 초과하면 쿼리가 거부됩니다.

#### 시나리오 3: 스캔하는 tablet 수 제한 {#scenario-3-limit-the-number-of-scanned-tablets}

**문제**: 너무 많은 tablet을 스캔하는 경우에도 BE의 CPU 소비가 크게 증가합니다.

**해결 방법**: 단일 쿼리가 스캔할 수 있는 최대 tablet 수를 설정합니다.

```sql
CREATE SQL_BLOCK_RULE rule_tablet_num 
PROPERTIES
(
    "tablet_num" = "200",
    "global" = "true",
    "enable" = "true"
);
```

단일 테이블에서 스캔하는 tablet 수가 200개를 초과하면 쿼리가 거부됩니다.

#### 시나리오 4: 특정 SQL 패턴 차단 {#scenario-4-block-specific-sql-patterns}

**문제**: 특정 함수 호출이나 위험 작업 수행과 같은 일부 쿼리 패턴은 계산 복잡도를 지나치게 높이거나 계획 수립 시간을 길어지게 할 수 있습니다.

**해결 방법**: 정규 표현식 매칭을 통해 이러한 쿼리를 차단합니다.

**예시 1: 특정 함수 사용 차단**

다음 규칙은 `abs` 함수가 포함된 모든 쿼리를 차단합니다.

```sql
CREATE SQL_BLOCK_RULE rule_abs
PROPERTIES(
    "sql"="(?i)abs\\s*\\(.+\\)",
    "global"="true",
    "enable"="true"
);
```

정규 표현식 설명:

- `(?i)`: 대소문자를 구분하지 않고 매칭
- `abs`: 대상 함수 이름
- `\\s*`: 함수 이름과 여는 괄호 사이에 공백 문자가 있거나 없어도 허용
- `\\(.+\\)`: 함수 인수와 매칭

**예시 2: 위험 작업 차단**

같은 방식으로 정규 표현식을 사용하여 `set global`을 차단하거나(의도하지 않은 변수 수정 방지), `truncate table`을 차단할 수 있습니다(의도하지 않은 데이터 삭제 방지).

> 정규 표현식은 Java 규칙을 따릅니다. 자세한 내용은 [Pattern 문서](https://docs.oracle.com/javase/8/docs/api/java/util/regex/Pattern.html)를 참조하세요.

#### 시나리오 5: 특정 사용자에 대한 규칙 설정 {#scenario-5-set-rules-for-specific-users}

**문제**: 기본 규칙은 전역으로 적용되지만, 경우에 따라 특정 사용자에게만 제한을 적용해야 합니다.

**해결 방법**: 전역이 아닌 규칙을 생성하고 대상 사용자에게 연결합니다.

1. 규칙을 생성할 때 `global`을 `"false"`로 설정합니다.

    ```sql
    CREATE SQL_BLOCK_RULE rule_001
    PROPERTIES (
        "sql"="select \\* from t",
        "global" = "false",
        "enable" = "true"
    );
    ```

2. 대상 사용자에게 규칙을 연결합니다.

    ```sql
    SET PROPERTY FOR 'root' 'SQL_block_rules' = 'rule_001';
    ```

3. 규칙이 적용되었는지 확인합니다.

    ```sql
    MySQL root@127.0.0.1:test> select * from t;
    (1105, 'errCode = 2, detailMessage = errCode = 2, detailMessage = SQL match regex SQL block rule: rule_001')
    ```

**여러 규칙 관리**:

- 사용자에게 여러 규칙을 연결하려면 규칙 목록의 모든 규칙 이름을 쉼표로 구분합니다. 예: `'rule_001,rule_002'`.
- 사용자에게 연결된 모든 규칙을 제거하려면 규칙 목록을 빈 문자열로 설정합니다. 예: `SET PROPERTY FOR 'root' 'SQL_block_rules' = '';`.

### 참고 사항 {#notes}

- **추정 방식**: 스캔하는 행, 파티션, tablet 수는 계획 수립 단계에서 최악의 경우를 기준으로 추정합니다(파티션 프루닝과 tablet 프루닝만 고려하며, 다른 필터 조건은 고려하지 않습니다). 실제 스캔량이 설정값보다 적은 쿼리도 차단될 수 있습니다.
- **성능 영향**: 정규 표현식 매칭은 연산을 많이 사용하는 작업입니다. 정규 표현식 규칙이 너무 많거나 지나치게 복잡하면 FE CPU에 큰 부하를 주므로 신중하게 추가하세요.
- **규칙 일시 비활성화**: 규칙의 `"enable"` 속성을 `"false"`로 변경하면 규칙을 삭제하지 않고 일시적으로 비활성화할 수 있습니다.

## Workload Policy {#workload-policy}

<!-- Knowledge type: concept -->

Workload Policy는 쿼리 **실행 중** 실시간 지표를 모니터링하고, 예상 범위를 초과하는 쿼리에 차단이나 변수 조정 등의 작업을 적용합니다. SQL Block Rule의 계획 수립 시점 정적 추정과 비교하면, Workload Policy는 실제 실행 데이터를 바탕으로 판단하므로 더 정확합니다.

Workload Policy는 Doris 2.1부터 지원됩니다. 워크로드 유형별 지원 여부는 다음과 같습니다.

| 워크로드 유형 | 지원 여부 |
|---------|---------|
| select | 예 |
| insert into select | 예 |
| insert into values | 아니요 |
| stream load | 예 |
| routine load | 예 |
| backup | 아니요 |
| compaction | 아니요 |

### 생성 및 구성 {#creation-and-configuration}

<!-- Knowledge type: procedure -->

`CREATE WORKLOAD POLICY` 명령으로 정책을 생성합니다. `admin_priv` 권한이 필요합니다.

**기본 구문**:

```sql
CREATE WORKLOAD POLICY <policy_name>
CONDITIONS(<condition_expr>)
ACTIONS(<action_expr>) 
PROPERTIES('<key>'='<value>');
```

다음 예시는 실행 시간이 1000 ms를 초과하는 쿼리를 취소하는 정책을 생성합니다.

```sql
CREATE WORKLOAD POLICY test_cancel_policy
CONDITIONS(query_time > 1000)
ACTIONS(cancel_query) 
PROPERTIES('enabled'='true'); 
```

#### 트리거 조건 {#trigger-conditions}

조건은 정책이 언제 발동하는지 지정합니다. 여러 조건은 쉼표(`,`)로 구분하며, 이는 "AND" 관계를 의미합니다.

| 조건 | 설명 |
|-----------|------|
| `username` | 쿼리에 포함된 사용자 이름입니다. Doris 4.1.3부터는 `query_time`, `be_scan_rows`, `be_scan_bytes`, `query_be_memory_bytes` 등의 BE 측 실행 지표와 결합하여 `cancel_query`를 실행할 수 있습니다. 이 조건은 동등 연산자(`=`)만 지원하며, 사용자 이름은 비워 둘 수 없습니다 |
| `be_scan_rows` | 단일 BE 프로세스 내에서 SQL이 스캔한 행 수입니다. 동시 실행 시 누적값입니다 |
| `be_scan_bytes` | 단일 BE 프로세스 내에서 SQL이 스캔한 바이트 수입니다. 동시 실행 시 누적값입니다(단위: 바이트) |
| `query_time` | 단일 BE 프로세스에서 SQL의 실행 시간입니다(단위: 밀리초) |
| `query_be_memory_bytes` | 단일 BE 프로세스 내에서 SQL이 사용한 메모리입니다. 동시 실행 시 누적값입니다(단위: 바이트) |

#### 작업 {#actions}

작업은 조건이 충족되었을 때 수행할 동작을 지정합니다. 현재 정책에는 작업을 하나만 정의할 수 있습니다.

| 작업 | 설명 |
|--------|------|
| `cancel_query` | 쿼리 취소 |

#### 정책 속성 {#policy-properties}

| 속성 | 설명 | 기본값 |
|----------|------|--------|
| `enabled` | 정책 활성화 여부입니다. 값은 `true` 또는 `false`입니다 | `true` |
| `priority` | 우선순위로, 범위는 0부터 100까지입니다. 값이 클수록 우선순위가 높습니다. 여러 정책이 일치하면 우선순위가 가장 높은 정책만 적용됩니다 | `0` |
| `workload_group` | 연결할 Workload Group의 이름입니다. 지정하면 해당 Workload Group의 쿼리에만 정책이 적용됩니다. 비어 있으면 모든 쿼리에 적용됩니다 | 비어 있음(전역) |

#### Workload Group에 연결 {#binding-to-a-workload-group}

정책을 특정 Workload Group에만 적용하려면 `workload_group` 속성을 통해 연결합니다.

```sql
CREATE WORKLOAD POLICY test_cancel_big_query
CONDITIONS(query_time > 1000)
ACTIONS(cancel_query) 
PROPERTIES('workload_group'='normal');
```

:::caution 클라우드 모드에서는 완전히 한정된 형식이 필요합니다
위의 `'workload_group'='normal'` 형식은 **비클라우드(스토리지와 컴퓨팅이 결합된) 모드**에서만 유효합니다. **클라우드(스토리지와 컴퓨팅이 분리된) 모드에서는 완전히 한정된 `<compute_group>.<workload_group>` 형식이 필요합니다**. 예: `'workload_group'='compute_group_a.normal'`. 그렇지 않으면 다음 오류와 함께 문이 실패합니다: `workload_group must be '<compute_group>.<workload_group>' in cloud mode`. 자세한 내용은 [CREATE WORKLOAD POLICY](../../sql-manual/sql-statements/cluster-management/compute-management/CREATE-WORKLOAD-POLICY)를 참조하세요.
:::

### 예시 {#examples}

<!-- Knowledge type: procedure -->

#### 예시 1: 장시간 실행되는 쿼리 중단 {#example-1-break-long-running-queries}

다음 감사 로그는 SQL 실행에 일반적으로 4.5초가 걸린다는 것을 보여 줍니다.

```sql
MySQL [hits]> SELECT REGEXP_REPLACE(Referer, '^https?://(?:www\\.)?([^/]+)/.*$', '\\1') AS k, AVG(length(Referer)) AS l, COUNT(*) AS c, MIN(Referer) FROM hits WHERE Referer <> '' GROUP BY k HAVING COUNT(*) > 100000 ORDER BY l DESC LIMIT 25;
+-----------------------------------------------------------------------+------------------+----------+---------------------------------------------------------------------------------------------------------------------+
| k                                                                     | l                | c        | min(Referer)                                                                                                        |
+-----------------------------------------------------------------------+------------------+----------+---------------------------------------------------------------------------------------------------------------------+
| 1                                                                     | 85.4611926713085 | 67259319 | http://%26ad%3D1%25EA%25D0%26utm_source=web&cd=19590&input_onlist/би-2 место будущей кондицин                       |
| http:%2F%2Fwwww.regnancies/search&evL8gE&where=all&filmId=bEmYZc_WTDE |               69 |   207347 | http:%2F%2Fwwww.regnancies/search&evL8gE&where=all&filmId=bEmYZc_WTDE                                               |
| http://новострашная                                                   |               31 |   740277 | http://новострашная                                                                                                 |
| http://loveche.html?ctid                                              |               24 |   144901 | http://loveche.html?ctid                                                                                            |
| http://rukodeliveresult                                               |               23 |   226135 | http://rukodeliveresult                                                                                             |
| http://holodilnik.ru                                                  |               20 |   133893 | http://holodilnik.ru                                                                                                |
| http://smeshariki.ru                                                  |               20 |   210736 | http://smeshariki.ru                                                                                                |
| http:%2F%2Fviewtopic                                                  |               20 |   391115 | http:%2F%2Fviewtopic                                                                                                |
| http:%2F%2Fwwww.ukr                                                   |               19 |   655178 | http:%2F%2Fwwww.ukr                                                                                                 |
| http:%2F%2FviewType                                                   |               19 |   148907 | http:%2F%2FviewType                                                                                                 |
| http://state=2008                                                     |               17 |   139630 | http://state=2008                                                                                                   |
+-----------------------------------------------------------------------+------------------+----------+---------------------------------------------------------------------------------------------------------------------+
11 rows in set (4.50 sec)
```

실행 시간이 3초를 초과하는 모든 쿼리를 취소하는 정책을 생성합니다.

```sql
CREATE WORKLOAD POLICY test_cancel_3s_query
CONDITIONS(query_time > 3000)
ACTIONS(cancel_query); 
```

동일한 SQL을 다시 실행하면 쿼리가 중단됩니다.

```sql
MySQL [hits]> SELECT REGEXP_REPLACE(Referer, '^https?://(?:www\\.)?([^/]+)/.*$', '\\1') AS k, AVG(length(Referer)) AS l, COUNT(*) AS c, MIN(Referer) FROM hits WHERE Referer <> '' GROUP BY k HAVING COUNT(*) > 100000 ORDER BY l DESC LIMIT 25;
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[CANCELLED]query cancelled by workload policy,id:12345
```

#### 예시 2: 특정 사용자의 대규모 쿼리를 실행 중 중단 {#example-2-break-runtime-large-queries-for-a-specific-user}

Doris 4.1.3부터는 `username`을 BE 측 실행 지표와 결합하여 특정 사용자의 쿼리만 취소할 수 있습니다. 다음 정책은 `test_user`가 제출한 쿼리의 단일 BE 실행 시간이 3000 ms를 초과하면 해당 쿼리를 취소합니다.

```sql
CREATE WORKLOAD POLICY cancel_user_long_query
CONDITIONS(username='test_user', query_time > 3000)
ACTIONS(cancel_query);
```

같은 방식으로 `username`을 `be_scan_rows`, `be_scan_bytes` 또는 `query_be_memory_bytes`와 결합하여 특정 사용자의 스캔량이나 BE 메모리 사용량을 제한할 수 있습니다.

### 참고 사항 {#notes-1}
- **비동기 실행 지연**: 비동기 스레드가 500 ms마다 정책을 확인하므로 정책 적용에는 약간의 지연이 있습니다. 실행 시간이 매우 짧은 쿼리는 확인이 이루어지기 전에 완료되어 정책이 적용되지 않을 수 있습니다.
- **우선순위 메커니즘**: 쿼리가 여러 정책과 일치할 수 있지만, 우선순위가 가장 높은 정책(`priority` 값이 가장 큰 정책)만 적용됩니다.
- **수정 제한**: 현재 기존 정책의 작업과 조건을 직접 수정하는 기능은 지원되지 않습니다. 정책을 삭제한 뒤 다시 생성하세요.
