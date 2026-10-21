---
{
    "title": "와이드 테이블 스토리지 포맷 V3",
    "language": "ko",
    "description": "Doris 4.1.0부터 V3 와이드 테이블 스토리지 포맷은 컬럼 메타데이터를 필요할 때 불러와 와이드 테이블에서 Segment를 여는 속도를 16배 높이고 메모리 사용량을 60배 줄입니다.",
    "keywords": [
        "와이드 테이블 스토리지 포맷",
        "스토리지 포맷 V3",
        "VARIANT 와이드 테이블 쿼리",
        "Segment 열기 지연",
        "와이드 테이블 쿼리 지연",
        "와이드 테이블의 높은 메모리 사용량",
        "필요할 때 컬럼 메타데이터 불러오기",
        "객체 스토리지 쿼리 지연 시간"
    ]
}
---

<!-- Knowledge type: Feature introduction / Performance tuning / Configuration parameter -->
<!-- Applicable scenario: Wide table query tuning / VARIANT column performance tuning / Object storage cold query -->

:::tip
이 기능은 Apache Doris 4.1.0부터 지원됩니다. `"storage_format" = "V3"`를 테이블 생성문의 `PROPERTIES` 절에 설정하여 활성화할 수 있습니다.
:::

**와이드 테이블 스토리지 포맷 V3**는 컬럼 수가 매우 많은 테이블을 위해 Segment 메타데이터 레이아웃을 재구성합니다. 컬럼 메타데이터를 Footer에서 분리하고 필요할 때 불러오므로, V3는 Segment 열기 지연 시간과 메모리 사용량을 크게 줄입니다.

## 적용 시나리오 {#applicable-scenarios}

쿼리에서 **"Segment 열기" 단계가 매우 느리고 메모리 사용량이 비정상적으로 높으며**, 아래 표의 시나리오 중 하나에 해당한다면 V3 스토리지 포맷을 활성화하는 것이 좋습니다.

| 사용 시나리오                                  | 일반적인 증상                                                                  | V3 권장 여부 |
| ---------------------------------------------- | -------------------------------------------------------------------------------- | --------------- |
| 와이드 테이블(수백~수천 개의 컬럼) | 몇 개의 컬럼만 쿼리해도 Segment를 여는 데 많은 시간과 메모리가 소요됨 | 권장     |
| `VARIANT` 컬럼이 있는 테이블                  | 동적 하위 컬럼 확장 후 실제 저장되는 컬럼 수가 테이블 정의에 명시된 수를 훨씬 초과함 | 권장     |
| 객체 스토리지 / 계층형 스토리지에 배포된 환경    | 데이터가 S3 또는 OSS와 같은 원격 스토리지에 저장되어 콜드 쿼리 지연 시간에 민감함 | 권장     |
| 일반 테이블(수십 개 이하의 컬럼)  | Segment 열기 오버헤드가 미미함                                           | 전환 불필요 |

> **대표적인 문제 사례**: 컬럼이 7,000개이고 Segment가 총 10,000개인 와이드 테이블에서는 Segment를 여는 데 약 **65초**가 걸리며, 이 과정의 최대 메모리 사용량은 **60 GB**에 달합니다. 이 오버헤드는 쿼리에서 해당 컬럼을 실제로 사용하는지와 무관하게 발생하는 순수한 "초기 진입 비용"입니다.

## 근본 원인 {#root-cause}

기존 포맷은 모든 컬럼의 메타데이터(`ColumnMetaPB`)를 Segment 파일 끝부분의 Footer에 한데 저장하므로 다음과 같은 문제가 발생합니다.

1. **전체 메타데이터 불러오기**: Segment를 열려면 먼저 Footer 전체를 역직렬화해야 합니다. 쿼리가 두 컬럼만 사용하더라도 전체 비용이 발생합니다.
2. **Footer 크기 증가**: 컬럼 수가 수천 개에 이르면 Footer 자체의 크기가 수 MB까지 커질 수 있습니다.
3. **원격 스토리지에서의 오버헤드 증폭**: 객체 스토리지의 네트워크 지연과 높은 읽기 비용은 위의 오버헤드를 더욱 키웁니다.

즉, SQL 문이 2개의 컬럼만 쿼리하더라도 Doris는 스캔을 시작하기 전에 Segment에 있는 **모든 컬럼의 메타데이터**를 메모리로 읽어 들이고 역직렬화해야 합니다. 컬럼과 Segment가 많을수록 이 오버헤드는 더욱 커집니다.

## V3의 주요 최적화 {#key-v3-optimizations}

V3는 다음 세 가지 측면에서 스토리지 포맷을 재구성합니다.

### 최적화 1: 필요할 때 컬럼 메타데이터 불러오기 {#optimization-1-on-demand-column-metadata-loading}

V3는 컬럼 메타데이터를 Footer에서 분리하여 파일의 별도 영역에 배치합니다. Footer에는 각 컬럼의 메타데이터를 가리키는 작은 포인터만 유지합니다.

![와이드 테이블 스토리지 포맷 - Segment 파일 레이아웃 비교](/images/variant/storage-format-v3-layout.png)

Segment를 열 때 시스템은 크기가 작은 Footer만 읽으며, 실제로 사용하는 컬럼의 메타데이터는 필요할 때만 가져옵니다. **이것이 와이드 테이블 시나리오에서 성능이 향상되는 주된 이유**이며, 객체 스토리지에서 특히 효과가 두드러집니다.

### 최적화 2: 숫자 타입의 기본 인코딩을 Plain 인코딩으로 변경 {#optimization-2-plain-encoding-by-default-for-numeric-types}

V3는 `INT`, `BIGINT`와 같은 숫자 타입의 기본 인코딩을 BitShuffle에서 `PLAIN_ENCODING`(원시 바이너리)으로 변경합니다. LZ4 / ZSTD 압축과 함께 사용하면 대규모 일괄 스캔 시 읽기 속도가 빨라지고 CPU 오버헤드가 줄어듭니다.

### 최적화 3: 문자열을 위한 더 간결한 Plain 인코딩 {#optimization-3-more-compact-plain-encoding-for-strings}

문자열과 JSONB를 위해 V3는 `BINARY_PLAIN_ENCODING_V2`를 도입하며, 이 인코딩은 `[length(varuint)][raw data]`의 스트리밍 레이아웃을 사용합니다. 기존 인코딩에 필요했던 끝부분의 오프셋 테이블을 제거하여 저장 공간을 더 효율적으로 사용합니다.

## 측정 결과 {#measured-results}

테스트 조건: 컬럼이 7,000개이고 Segment가 총 10,000개인 와이드 테이블.

![와이드 테이블 스토리지 포맷 - 메타데이터 열기 성능](/images/variant/storage-format-v3-benchmark.png)

| 지표                       | 기존 포맷 | V3 포맷 | 개선 효과     |
| ---------------------------- | ---------: | --------: | --------------- |
| Segment 열기 시간         |       65 s |       4 s | **16배 빠름**  |
| 열기 작업 중 메모리 사용량    |      60 GB |    < 1 GB | **60배 감소**   |

## 활성화 방법 {#how-to-enable}

`storage_format` 값을 `V3`로 명시적으로 지정합니다. 이 설정은 CREATE TABLE 문의 `PROPERTIES` 절에 추가합니다.

```sql
CREATE TABLE table_v3 (
    id BIGINT,
    name VARCHAR(128),
    attrs VARIANT
)
DISTRIBUTED BY HASH(id) BUCKETS 32
PROPERTIES (
    "storage_format" = "V3"
);
```

## 권장 사항 {#recommendations}

- **활성화 권장**: 컬럼이 많은 와이드 테이블(수백 개 이상), `VARIANT` 컬럼이 있는 테이블, 객체 스토리지 또는 계층형 스토리지에 배포된 테이블.
- **전환 불필요**: 컬럼이 적은 일반 테이블(수십 개 이하)은 기존 포맷으로도 충분합니다.

## 관련 문서 {#related-documentation}

- [데이터 압축](./column-compression): 숫자 및 문자열 타입을 위한 V3의 인코딩 및 압축 연계 최적화를 알아봅니다.
