---
{
    "title": "시간대 관리",
    "language": "ko",
    "description": "Doris의 시간대 매개변수, 설정 방법, 서머타임 처리, 데이터 적재 시 시간대 변환에 대해 알아봅니다. 시간대에 민감한 데이터를 다루는 권장 방법을 익힙니다.",
    "keywords": [
        "Doris 시간대",
        "time_zone",
        "system_time_zone",
        "set time_zone",
        "Asia/Shanghai",
        "시간대 설정",
        "서머타임",
        "tzdata",
        "IANA 시간대",
        "Stream Load 시간대",
        "DATETIME 시간대",
        "TIMESTAMPTZ"
    ]
}
---

<!-- Knowledge type: Configuration parameter / Operational procedure -->
<!-- Applicable scenarios: Cluster initialization time zone configuration / Cross-time-zone data ingestion / Daylight saving time adjustment -->

Doris는 사용자 지정 시간대 설정을 지원합니다. 이 문서에서는 Doris의 시간대 관련 매개변수의 의미, 조회 및 설정 방법, 시간대가 함수와 데이터 유형에 미치는 영향, 서머타임 처리 방식, 시간대에 민감한 데이터를 다루는 권장 방법을 설명합니다.

## 적용 시나리오 {#applicable-scenarios}

| 시나리오 | 설명 |
| --- | --- |
| 클러스터 초기화 | 배포 후 비즈니스 지역이나 통일된 기준에 따라 `time_zone` 설정 |
| 서로 다른 시간대의 데이터 적재 | Stream Load, Broker Load 등의 방식으로 시간대 정보가 있거나 없는 데이터 적재 |
| 함수 결과 일치 | `NOW()`, `CURTIME()`, `FROM_UNIXTIME` 등의 함수가 반환하는 값의 시간대 조정 |
| 서머타임 처리 | 서머타임 전환이 있는 명명된 시간대(예: `America/Los_Angeles`) 처리 |
| 시간대 데이터 업데이트 | IANA에서 새 tzdata 버전을 릴리스한 후 BE 머신의 시간대 데이터 업데이트 |

## 기본 개념 {#basic-concepts}

Doris에는 다음 두 가지 시간대 관련 매개변수가 있습니다.

| 매개변수 | 수정 가능 여부 | 설명 |
| --- | --- | --- |
| `system_time_zone` | 불가 | 서버가 시작될 때 머신의 로컬 시간대를 기준으로 시스템이 자동으로 설정합니다. 설정된 후에는 수정할 수 없습니다. |
| `time_zone` | 가능 | 클러스터의 현재 시간대입니다. 클러스터가 시작될 때는 `system_time_zone`과 같으며, 수동으로 수정하지 않으면 변경되지 않습니다. |

## 시간대 조회 및 설정 {#view-and-set-the-time-zone}

### 현재 시간대 조회 {#view-the-current-time-zone}

다음 SQL 문을 실행하여 시간대 관련 변수를 조회합니다.

```sql
show variables like '%time_zone%';
```

### 시간대 설정 {#set-the-time-zone}

`time_zone`은 `SET` 문으로 변경합니다.

```sql
SET [global] time_zone = 'Asia/Shanghai';
```

- `global` 키워드가 없는 경우: 현재 세션에만 적용됩니다.
- `global` 키워드가 있는 경우: Doris FE가 매개변수를 영구 저장하며, 이후 생성되는 모든 새 세션에 적용됩니다.

### 시간대 데이터 소스 {#time-zone-data-source}

시간대 데이터에는 시간대 이름, 해당 시간 오프셋, 서머타임 변경 사항 등의 정보가 포함됩니다. BE 머신에서는 `TZDIR` 명령이 반환하는 디렉터리에서 데이터를 가져옵니다. 이 명령을 지원하지 않는 경우에는 `/usr/share/zoneinfo` 디렉터리를 사용합니다.

## 시간대 값 형식 {#time-zone-value-formats}

시간대 값은 여러 형식으로 지정할 수 있습니다. 다음은 Doris가 완전히 지원하는 표준 형식입니다.

| 유형 | 예 | 설명 |
| --- | --- | --- |
| 표준 명명된 시간대 | `Asia/Shanghai`, `America/Los_Angeles`, `Etc/GMT+3` | [로컬 시간대 데이터](#time-zone-data-source)에서 가져옴 |
| 표준 오프셋 형식 | `+02:30`, `-10:00` | `+12:03`과 같은 특수 오프셋은 지원하지 않음 |
| 시간대 약어 | `GMT`, `UTC` | `+00:00` 시간대와 동일 |
| 시간대 약어 | `CST` | `Asia/Shanghai` 시간대와 동일 |
| 단일 문자 Z | `Z` | Zulu 시간대를 나타내며, `+00:00` 시간대와 동일 |

또한 문자를 파싱할 때 대소문자를 구분하지 않습니다.

:::caution 참고
구현상의 차이로 인해 일부 데이터 적재 방식에서는 현재 다른 형식도 지원합니다. **프로덕션 환경에서는 여기에 나열되지 않은 형식에 의존해서는 안 됩니다. 해당 형식의 동작은 언제든지 변경될 수 있습니다.** 관련 업데이트는 각 릴리스의 변경 로그를 확인하세요.
:::

## 시간대의 영향 {#effects-of-the-time-zone}

### 함수에 미치는 영향 {#effect-on-functions}

시간대는 `NOW()`, `CURTIME()` 등의 시간 함수가 반환하는 값과 `SHOW LOAD`, `SHOW BACKENDS`에 표시되는 시간 값에 영향을 줍니다.

그러나 시간 유형 파티션 열의 `LESS THAN` 값(`CREATE TABLE` 문에서 지정)에는 영향을 주지 **않으며**, `DATE` 또는 `DATETIME` 유형으로 저장된 데이터의 표시 값에도 영향을 주지 않습니다.

시간대의 영향을 받는 함수는 다음과 같습니다.

| 함수 | 동작 |
| --- | --- |
| `FROM_UNIXTIME` | UTC 타임스탬프가 주어지면 Doris 세션의 `time_zone`으로 지정한 시간대의 날짜와 시간을 반환합니다. 예를 들어 `time_zone`이 `CST`이면 `FROM_UNIXTIME(0)`은 `1970-01-01 08:00:00`을 반환합니다. |
| `UNIX_TIMESTAMP` | 날짜와 시간이 주어지면 Doris 세션의 `time_zone`으로 지정한 시간대를 기준으로 UTC 타임스탬프를 반환합니다. 예를 들어 `time_zone`이 `CST`이면 `UNIX_TIMESTAMP('1970-01-01 08:00:00')`는 `0`을 반환합니다. |
| `CURTIME` | Doris 세션의 `time_zone`으로 지정한 시간대의 현재 시간을 반환합니다. |
| `NOW` | Doris 세션의 `time_zone`으로 지정한 시간대의 현재 날짜와 시간을 반환합니다. |
| `CONVERT_TZ` | 날짜와 시간을 지정된 한 시간대에서 다른 시간대로 변환합니다. |

### 시간 유형에 미치는 영향 {#effect-on-time-types}

#### DATE / DATETIME 유형 {#date--datetime-types}

`DATE` 및 `DATETIME` 유형은 데이터 적재 시 시간대 변환을 지원합니다.

- **시간대가 있는 데이터**: 예를 들어 입력값이 `2020-12-12 12:12:12+08:00`이고 Stream Load 헤더 `timezone`이 `+00:00`이면 Doris에 실제로 저장되는 값은 `2020-12-12 04:12:12`입니다.
- **시간대가 없는 데이터**: 예를 들어 `2020-12-12 12:12:12`는 절대 시간으로 취급되며 변환되지 않습니다.

#### TIMESTAMPTZ 유형 {#timestamptz-type}

`TIMESTAMPTZ` 유형도 데이터 적재 시 시간대 변환을 지원합니다. 입력 시간 값은 일괄적으로 UTC(협정 세계시)로 변환되며, 출력 시에는 현재 세션의 시간대가 적용됩니다.

- **시간대가 있는 데이터**: 예를 들어 입력값이 `2020-12-12 12:12:12+08:00`이면 Doris는 제공된 시간대 정보를 사용하여 변환합니다.
- **시간대가 없는 데이터**: 예를 들어 입력값이 `2020-12-12 12:12:12`이면 Doris는 현재 세션의 시간대 설정을 사용하여 변환합니다.

현재 세션의 `time_zone`은 `TIMESTAMPTZ` 유형의 출력에 영향을 줍니다. 예를 들어 현재 세션의 설정이 `time_zone="+08:00"`이고 `TIMESTAMPTZ` 값이 `2020-12-12 12:12:12+08:00`인 경우, `time_zone`을 변경하면 출력 값이 달라집니다.

```sql
set time_zone = "+08:00";

select * from tz_test;
+---------------------------+
| tz                        |
+---------------------------+
| 2020-12-12 12:12:12+08:00 |
+---------------------------+

set time_zone = "+07:00";

select * from tz_test;
+---------------------------+
| tz                        |
+---------------------------+
| 2020-12-12 11:12:12+07:00 |
+---------------------------+
```

### 서머타임 {#daylight-saving-time}

서머타임은 특정 날짜 범위 내에서 명명된 시간대의 실제 오프셋이 변경되는 것을 의미합니다.

예를 들어 `America/Los_Angeles` 시간대에는 매년 한 차례 서머타임이 적용되며, 삼월 무렵에 시작해 십일월 무렵에 끝납니다. 삼월에 서머타임이 시작되면 `America/Los_Angeles`의 실제 오프셋이 `-08:00`에서 `-07:00`으로 변경됩니다. 십일월에 서머타임이 끝나면 `-07:00`에서 `-08:00`으로 돌아갑니다.

서머타임을 사용하지 않으려면 `time_zone`을 `-08:00`으로 설정하고 `America/Los_Angeles`는 사용하지 마세요.

## 권장 사항 {#best-practices}

### 시간대에 민감한 데이터 처리 {#handling-time-zone-sensitive-data}

<!-- Knowledge type: Best practice -->
<!-- Applicable scenarios: Cross-time-zone data ingestion and queries -->

시간대 문제에는 다음 세 가지 주요 요소가 관련됩니다.

1. **클러스터 시간대**: 세션 변수 `time_zone`입니다.
2. **데이터 적재 시간대**: Stream Load, Broker Load 등의 데이터 적재 방식에서 지정하는 헤더 `timezone`입니다.
3. **데이터 시간대**: 데이터에 포함된 시간대 리터럴입니다. 예를 들어 `+08:00`은 `2023-12-12 08:00:00+08:00`의 시간대 리터럴입니다.

Doris는 현재 모든 시간대의 데이터를 Doris로 적재할 수 있습니다. `DATETIME`과 같은 Doris 시간 유형은 내부적으로 시간대 정보를 포함하지 않으며, 적재 후에는 시간대가 변경되어도 저장된 데이터가 바뀌지 않습니다. 따라서 Doris에 적재하는 시간 데이터는 다음 두 가지로 나뉩니다.

1. **절대 시간**

    절대 시간은 데이터가 사용되는 시나리오가 시간대와 무관한 경우를 의미합니다. 이러한 데이터는 적재 시 시간대 접미사를 포함하지 마세요. 데이터는 그대로 저장됩니다.

2. **특정 시간대의 시간**

    특정 시간대의 시간은 데이터가 사용되는 시나리오가 시간대에 의존하는 경우를 의미합니다. 이러한 데이터는 적재 시 해당 시간대 접미사를 포함하세요. 데이터 적재 과정에서 Doris 클러스터의 `time_zone` 또는 Stream Load나 Broker Load의 헤더 `timezone`으로 지정한 시간대로 변환됩니다.

    적재 후 이러한 데이터는 적재 시 지정한 시간대의 절대 시간으로 저장됩니다. 이후 데이터 적재와 쿼리에서도 같은 시간대를 유지해야 데이터의 의미가 달라지는 것을 방지할 수 있습니다.

#### Insert 문 예제 {#insert-statement-example}

```sql
Doris > select @@time_zone;
+---------------+
| @@time_zone   |
+---------------+
| Asia/Shanghai |
+---------------+

Doris > insert into dt values('2020-12-12 12:12:12+02:00'); --- The ingested data specifies the time zone as +02:00

Doris > select * from dt;
+---------------------+
| dt                  |
+---------------------+
| 2020-12-12 18:12:12 | --- Converted to the Doris cluster time zone Asia/Shanghai. Subsequent ingestion and queries must keep this time zone.
+---------------------+

Doris > set time_zone = 'America/Los_Angeles';

Doris > select * from dt;
+---------------------+
| dt                  |
+---------------------+
| 2020-12-12 18:12:12 | --- If time_zone is changed, the time value does not change, and its meaning at query time becomes inconsistent.
+---------------------+
```

#### Stream Load 예제 {#stream-load-example}

Stream Load, Broker Load 등의 데이터 적재 방식에서는 헤더 `timezone`을 지정하여 시간대를 변환할 수 있습니다. 예를 들면 다음과 같습니다.

```shell
cat dt.csv
2020-12-12 12:12:12+02:00

curl --location-trusted -u root: \
    -H "Expect:100-continue" \
    -H "strict_mode: true" \
    -H "timezone: Asia/Shanghai" \
    -T dt.csv -XPUT \
    http://127.0.0.1:8030/api/test/dt/_stream_load
```

```sql
Doris > select @@time_zone;
+---------------+
| @@time_zone   |
+---------------+
| Asia/Shanghai |
+---------------+

Doris > select * from dt;
+---------------------+
| dt                  |
+---------------------+
| 2020-12-12 18:12:12 | --- Converted to the Doris cluster time zone Asia/Shanghai. Subsequent ingestion and queries must keep this time zone.
+---------------------+
```

:::tip
- Stream Load, Broker Load 등의 데이터 적재 방식에서는 헤더 `timezone`이 Doris 클러스터의 `time_zone`보다 우선하므로, 데이터 적재 시 두 설정을 일치시키세요.
- Stream Load, Broker Load 등의 데이터 적재 방식에서는 헤더 `timezone`이 적재 중 데이터 변환에 사용되는 함수에 영향을 줍니다.
- 데이터 적재 시 헤더 `timezone`을 지정하지 않으면 기본적으로 현재 클러스터 시간대를 사용합니다.
:::

#### 권장 사항 요약 {#best-practice-summary}

:::info 권장 사항
1. 사용 전에 클러스터가 기준으로 삼을 시간대를 확인하고 `time_zone`을 설정한 후에는 변경하지 마세요.
2. 데이터 적재 시 헤더 `timezone`을 클러스터의 `time_zone`과 일치시키세요.
3. 절대 시간은 데이터 적재 시 시간대 접미사를 포함하지 마세요. 시간대 정보가 있는 시간은 데이터 적재 시 해당 시간대 접미사를 포함하세요. 적재 후 데이터는 Doris의 `time_zone` 시간대로 변환됩니다.
:::

### 서머타임 관련 권장 사항 {#daylight-saving-time-recommendations}

서머타임의 시작 및 종료 시각은 [현재 시간대 데이터 소스](#time-zone-data-source)에서 가져오며, 해당 지역에서 올해 공식적으로 확정한 시각과 정확히 일치하지 않을 수 있습니다. 이 데이터는 ICANN에서 관리합니다.

서머타임 동작이 올해의 공식 규칙과 일치하도록 하려면 Doris가 사용하는 데이터 소스가 ICANN에서 게시한 최신 시간대 데이터인지 확인하세요. 다운로드 방법은 아래를 참고하세요.

## 시간대 정보 업데이트 {#update-time-zone-information}

<!-- Knowledge type: Operational procedure -->
<!-- Applicable scenarios: Time zone data synchronization / IANA tzdata update -->

실제 시간대 및 서머타임 데이터는 여러 이유로 수시로 변경됩니다. IANA는 이러한 변경 사항을 정기적으로 기록하고 해당 시간대 파일을 업데이트합니다. Doris의 시간대 정보를 최신 IANA 데이터와 일치시키려면 다음 두 가지 방법 중 하나를 사용하세요.

### 방법 1: 패키지 관리자로 업데이트 {#method-1-update-with-a-package-manager}

현재 운영 체제에서 사용하는 패키지 관리자에 따라 해당 명령으로 시간대 데이터를 직접 업데이트합니다.

```shell
# yum
sudo yum update tzdata
# apt
sudo apt update tzdata
```

이 방법으로 업데이트한 데이터는 시스템의 `$TZDIR` 아래에 저장됩니다. 일반적으로 `/usr/share/zoneinfo`입니다.

### 방법 2: IANA 시간대 데이터베이스 직접 가져오기(권장) {#method-2-pull-the-iana-time-zone-database-directly-recommended}

대부분의 Linux 배포판에서는 패키지 관리자를 통한 tzdata 동기화가 제때 이루어지지 않습니다. 시간대 데이터의 정확도가 더 중요하다면 IANA가 정기적으로 게시하는 데이터를 직접 가져오세요.

```shell
wget https://www.iana.org/time-zones/repository/tzdb-latest.tar.lz
```

그런 다음 압축을 푼 폴더의 README에 따라 필요한 zoneinfo 데이터를 생성합니다. 생성한 데이터를 `$TZDIR` 디렉터리에 복사하여 기존 파일을 덮어씁니다.

:::caution 중요
BE 머신에서 위 작업을 모두 완료한 후에는 변경 사항을 적용하기 위해 **해당 BE를 반드시 재시작해야 합니다**.
:::

## 자주 묻는 질문 {#faq}

### 질문: `time_zone`을 변경한 후 기존 데이터의 쿼리 결과가 예상과 다르게 바뀌는 이유는 무엇인가요? {#q-after-changing-time_zone-the-query-results-for-existing-data-change-unexpectedly}

`DATETIME`과 같은 유형은 내부적으로 시간대 정보를 포함하지 않으며, 데이터 적재 후 클러스터 시간대를 변경해도 저장된 값은 바뀌지 않습니다. 사용 전에 클러스터 시간대를 확인하고 `time_zone`을 설정한 후에는 변경하지 마세요.

### 질문: Stream Load로 적재한 데이터의 시간 오프셋이 예상과 다른 이유는 무엇인가요? {#q-the-time-offset-of-stream-load-ingested-data-does-not-match-expectations}

헤더 `timezone`이 클러스터의 `time_zone`과 일치하지 않기 때문입니다. 헤더 `timezone`을 클러스터의 `time_zone`과 일치시키세요.

### 질문: `NOW()`가 반환하는 시간이 로컬 시간과 다른 이유는 무엇인가요? {#q-the-time-returned-by-now-does-not-match-the-local-time}

클러스터의 `time_zone`이 로컬 시간대와 일치하지 않기 때문입니다. `SET global time_zone = 'Asia/Shanghai'`로 조정하세요.

### 질문: 명명된 시간대의 서머타임 전환이 올해의 규칙과 일치하지 않는 이유는 무엇인가요? {#q-the-daylight-saving-time-transition-of-a-named-time-zone-does-not-match-the-current-year-rules}

BE 머신의 tzdata가 오래되었기 때문입니다. 패키지 관리자를 사용하거나 IANA tzdata를 직접 가져와 업데이트한 후 BE를 재시작하세요.

### 질문: `America/Los_Angeles`를 사용하고 있지만 서머타임은 적용하고 싶지 않다면 어떻게 해야 하나요? {#q-i-am-using-americalos_angeles-but-do-not-want-to-enable-daylight-saving-time}

명명된 시간대에는 서머타임 규칙이 포함됩니다. 대신 `-08:00`과 같은 고정 오프셋 형식을 사용하세요.

## 추가 자료 {#further-reading}

- 시간대 형식 목록: [tz 데이터베이스 시간대 목록](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)
- IANA 시간대 데이터베이스: [IANA 시간대 데이터베이스](https://www.iana.org/time-zones)
- ICANN 시간대 데이터베이스: [tz-announce 아카이브](https://mm.icann.org/pipermail/tz-announce/)
