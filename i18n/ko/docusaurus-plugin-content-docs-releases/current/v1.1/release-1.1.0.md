---
{
    "title": "1.1.0 릴리스",
    "language": "ko",
    "description": "버전 1.1에서는 컴퓨팅 계층과 스토리지 계층의 완전한 벡터화를 구현했습니다,"
}
---

버전 1.1에서는 컴퓨팅 계층과 스토리지 계층의 완전한 벡터화를 구현하고, 벡터화 실행 엔진을 안정적인 기능으로 정식 활성화했습니다. 이제 모든 쿼리가 기본적으로 벡터화 실행 엔진에서 실행되며, 성능은 이전 버전보다 3-5배 높습니다. Apache Iceberg 외부 테이블에 접근하는 기능을 추가해 Doris와 Iceberg의 데이터를 함께 조회하는 연합 쿼리를 지원하고, 데이터 레이크에 대한 Apache Doris의 분석 역량을 확장했습니다. 기존 LZ4에 더해 ZSTD 압축 알고리즘을 추가하여 데이터 압축률을 높였습니다. 또한 이전 버전의 여러 성능 및 안정성 문제를 수정해 시스템 안정성을 크게 개선했습니다. 다운로드하여 사용해 보시기 바랍니다.

## 업그레이드 참고 사항 {#upgrade-notes}

### 벡터화 실행 엔진 기본 활성화 {#the-vectorized-execution-engine-is-enabled-by-default}

버전 1.0에서는 벡터화 실행 엔진을 실험적 기능으로 도입했습니다. 쿼리를 실행할 때 사용자가 `set batch_size = 4096`과 `set enable_vectorized_engine = true`로 세션 변수를 설정하여 직접 활성화해야 했습니다.

버전 1.1에서는 벡터화 실행 엔진을 안정적인 기능으로 정식 활성화했습니다. 세션 변수 `enable_vectorized_engine`의 기본값이 true로 설정되며, 모든 쿼리가 기본적으로 벡터화 실행 엔진을 통해 실행됩니다.

### BE 바이너리 파일 이름 변경 {#be-binary-file-renaming}

BE 바이너리 파일의 이름이 palo_be에서 doris_be로 변경되었습니다. 클러스터 관리 등의 작업에서 프로세스 이름에 의존하는 스크립트를 사용했다면 관련 스크립트를 수정하시기 바랍니다.

### Segment 스토리지 형식 업그레이드 {#segment-storage-format-upgrade}

이전 버전의 Apache Doris는 Segment V1 스토리지 형식을 사용했습니다. 버전 0.12에서는 Bitmap 인덱스, 메모리 테이블, 페이지 캐시, 사전 압축, 지연 구체화 등 여러 기능을 도입한 새로운 스토리지 형식 Segment V2를 구현했습니다. 버전 0.13부터는 Segment V1 형식과의 호환성을 유지하면서 새로 생성하는 테이블의 기본 스토리지 형식을 Segment V2로 설정했습니다.

코드 구조를 유지보수하기 쉽게 만들고 오래된 중복 코드로 인한 추가 학습 및 개발 비용을 줄이기 위해, 다음 버전부터는 Segment v1 스토리지 형식을 지원하지 않기로 했습니다. 관련 코드는 Apache Doris 1.2 버전에서 삭제될 예정입니다.

### 일반 업그레이드 {#normal-upgrade}

일반적인 업그레이드는 공식 웹사이트의 클러스터 업그레이드 문서에 따라 롤링 업그레이드로 진행할 수 있습니다.

[https://doris.apache.org//docs/admin-manual/cluster-management/upgrade](https://doris.apache.org//docs/admin-manual/cluster-management/upgrade)

## 기능 {#features}

### 데이터의 무작위 분산 지원 [실험적] {#support-random-distribution-of-data-experimental}

로그 데이터 분석과 같은 일부 상황에서는 데이터 편중을 피할 적절한 버킷 키를 찾기 어려울 수 있습니다. 이를 해결하기 위해 시스템에서 다른 분산 방식을 제공해야 합니다.

따라서 테이블을 생성할 때 `DISTRIBUTED BY random BUCKETS number`를 설정하여 무작위 분산을 사용할 수 있습니다. 데이터를 적재할 때 단일 태블릿에 무작위로 기록하므로 적재 과정에서 데이터가 여러 곳으로 퍼지는 정도를 줄일 수 있습니다. 이를 통해 리소스 사용량을 줄이고 시스템 안정성을 높입니다.

### Iceberg 외부 테이블 생성 지원[실험적] {#support-for-creating-iceberg-external-tablesexperimental}

Iceberg 외부 테이블을 사용하면 Apache Doris에서 Iceberg에 저장된 데이터에 직접 접근할 수 있습니다. 로컬 스토리지와 Iceberg에 저장된 데이터를 함께 조회하는 연합 쿼리를 구현할 수 있어 번거로운 데이터 적재 작업이 줄어들고, 데이터 분석을 위한 시스템 구조가 단순해지며, 더 복잡한 분석을 수행할 수 있습니다.

버전 1.1에서는 Apache Doris에서 Iceberg 외부 테이블을 생성하고 데이터를 쿼리할 수 있습니다. REFRESH 명령을 사용하면 Iceberg 데이터베이스에 있는 모든 테이블의 스키마를 자동으로 동기화할 수도 있습니다.

### ZSTD 압축 알고리즘 추가 {#added-zstd-compression-algorithm}

현재 Apache Doris의 데이터 압축 방식은 시스템에서 일괄 지정하며 기본값은 LZ4입니다. 데이터 저장 비용에 민감한 일부 상황에서는 기존 방식의 압축률이 요구 사항을 충족하지 못할 수 있습니다.

버전 1.1에서는 테이블을 생성할 때 테이블 속성에 "compression"="zstd"를 설정하여 압축 방식으로 ZSTD를 지정할 수 있습니다. 25GB 규모의 110 million줄 텍스트 로그 테스트 데이터에서 최대 압축률은 거의 10배에 달해 기존 압축률보다 53% 높았으며, 디스크에서 데이터를 읽고 압축을 해제하는 속도는 30% 향상되었습니다.

## 개선 사항 {#improvements}

### 더욱 폭넓은 벡터화 지원 {#more-comprehensive-vectorization-support}

버전 1.1에서는 다음을 포함하여 컴퓨팅 계층과 스토리지 계층의 완전한 벡터화를 구현했습니다.

모든 내장 함수의 벡터화를 구현했습니다.

스토리지 계층의 벡터화를 구현하고 카디널리티가 낮은 문자열 열에 대한 사전 최적화를 지원합니다.

벡터화 엔진의 여러 성능 및 안정성 문제를 최적화하고 해결했습니다.

SSB와 TPC-H 표준 테스트 데이터 세트에서 Apache Doris 버전 1.1과 버전 0.15의 성능을 테스트했습니다.

SSB 테스트 데이터 세트의 모든 13개 SQL에서 버전 1.1이 버전 0.15보다 성능이 좋았습니다. 전체 성능은 약 3배 향상되었으며, 버전 1.0에서 일부 상황에 발생하던 성능 저하 문제도 해결했습니다.

TPC-H 테스트 데이터 세트의 모든 22개 SQL에서 버전 1.1이 버전 0.15보다 성능이 좋았습니다. 전체 성능은 약 4.5배 향상되었고, 일부 상황에서는 성능이 열 배 이상 향상되었습니다.

![release-note-1.1.0-SSB](/images/release-note-1.1.0-SSB.png)

<p align='center'>SSB 벤치마크</p>

![release-note-1.1.0-TPC-H](/images/release-note-1.1.0-TPC-H.png)


<p align='center'>TPC-H 벤치마크</p>

**성능 테스트 보고서**

[https://doris.apache.org//docs/benchmark/ssb](https://doris.apache.org//docs/benchmark/ssb)

[https://doris.apache.org//docs/benchmark/tpch](https://doris.apache.org//docs/benchmark/tpch)

### Compaction 로직 최적화 및 실시간 처리 보장 {#compaction-logic-optimization-and-real-time-guarantee}

Apache Doris에서는 커밋할 때마다 데이터 버전이 생성됩니다. 동시 쓰기가 많은 상황에서는 데이터 버전이 지나치게 쌓이고 compaction이 제때 이루어지지 않아 -235 오류가 발생하기 쉽습니다. 이에 따라 쿼리 성능도 저하됩니다.

버전 1.1에서는 데이터 버전이 늘어나면 compaction을 능동적으로 시작하는 QuickCompaction을 도입했습니다. 동시에 fragment 메타데이터의 스캔 기능을 개선하여 데이터 버전이 지나치게 많은 fragment를 빠르게 찾아 compaction을 시작할 수 있게 했습니다. 능동적인 시작과 주기적인 스캔을 통해 데이터 병합이 지연되는 문제를 해결했습니다.

또한 작은 파일이 자주 생성되어 cumulative compaction이 필요한 경우를 위해 compaction 작업의 스케줄링과 격리를 구현했습니다. 이로써 리소스를 많이 사용하는 base compaction이 새 데이터의 병합에 영향을 주지 않도록 했습니다.

마지막으로 작은 파일의 병합 전략을 최적화하여 단계적 병합 방식을 적용했습니다. 매번 비슷한 크기의 파일끼리 병합해 크기 차이가 큰 버전이 함께 병합되지 않도록 하고, 계층적으로 병합을 진행합니다. 그 결과 개별 파일이 병합에 참여하는 횟수가 줄어 시스템의 CPU 사용량을 크게 절약할 수 있습니다.

상위 데이터 소스에서 초당 10w의 쓰기 빈도(동시 쓰기 작업 20개, 작업당 5000행, 체크포인트 간격 1s)를 유지할 때 버전 1.1의 동작은 다음과 같습니다.

-   빠른 데이터 병합: Tablet 버전이 50 미만으로 유지되고 compaction 점수가 안정적입니다. 이전 버전에서 동시 쓰기가 많을 때 -235 문제가 자주 발생했던 것과 비교하면 compaction 병합 효율이 10배 이상 향상되었습니다.

-   CPU 리소스 사용량 대폭 감소: 작은 파일의 Compaction 전략을 최적화했습니다. 위와 같이 동시 쓰기가 많은 상황에서 CPU 리소스 사용량이 25% 줄었습니다.

-   안정적인 쿼리 소요 시간: 데이터의 전반적인 정렬 상태가 개선되어 쿼리 소요 시간의 변동이 크게 줄었습니다. 동시 쓰기가 많은 상황에서도 쿼리 소요 시간은 쿼리만 실행할 때와 같으며, 쿼리 성능은 이전 버전보다 3-4배 향상되었습니다.

### Parquet 및 ORC 파일 읽기 효율 최적화 {#read-efficiency-optimization-for-parquet-and-orc-files}

Arrow 매개변수를 조정해 Arrow의 멀티스레드 읽기 기능으로 각 row_group을 더 빠르게 읽고, SPSC 모델로 변경해 미리 읽기를 통한 네트워크 대기 비용을 줄였습니다. 최적화 후 Parquet 파일 적재 성능이 4~5배 향상되었습니다.

### 더 안전한 메타데이터 체크포인트 {#safer-metadata-checkpoint}

메타데이터 체크포인트 후 생성된 이미지 파일을 재차 확인하고 이전 이미지 파일을 보관할 수 있도록 하여, 이미지 파일 오류로 인한 메타데이터 손상 문제를 해결했습니다.

## 버그 수정 {#bugfix}

### 데이터 버전 누락으로 데이터를 쿼리할 수 없는 문제 수정(심각) {#fix-the-problem-that-the-data-cannot-be-queried-due-to-the-missing-data-versionserious}

이 문제는 버전 1.0에서 도입되었으며 여러 복제본의 데이터 버전이 손실될 수 있습니다.

### 데이터 적재 작업의 리소스 사용량 제한에 리소스 격리가 적용되지 않는 문제 수정(보통) {#fix-the-problem-that-the-resource-isolation-is-invalid-for-the-resource-usage-limit-of-loading-tasks-moderate}

버전 1.1에서는 broker load와 Routine Load가 지정된 리소스 태그를 가진 Backends를 사용하여 데이터를 적재합니다.

### HTTP BRPC를 사용해 2GB가 넘는 네트워크 데이터 패킷 전송(보통) {#use-http-brpc-to-transfer-network-data-packets-over-2gb-moderate}

이전 버전에서는 Backends 사이에서 BRPC로 전송하는 데이터가 2GB를 초과하면 데이터 전송 오류가 발생할 수 있었습니다.

## 기타 {#others}

### Mini Load 비활성화 {#disabling-mini-load}

`/_load` 인터페이스는 기본적으로 비활성화됩니다. `the /_stream_load` 인터페이스를 사용하시기 바랍니다.
FE 설정 항목 `disable_mini_load`를 꺼서 다시 활성화할 수 있습니다.

Mini Load 인터페이스는 버전 1.2에서 완전히 제거될 예정입니다.

### SegmentV1 스토리지 형식 완전 비활성화 {#completely-disable-the-segmentv1-storage-format}

SegmentV1 형식의 데이터는 더 이상 생성할 수 없습니다. 기존 데이터에는 계속 정상적으로 접근할 수 있습니다.
`ADMIN SHOW TABLET STORAGE FORMAT` 문으로 클러스터에 SegmentV1 형식의 데이터가 남아 있는지 확인할 수 있습니다. 데이터 변환 명령을 사용하여 SegmentV2로 변환할 수 있습니다.

버전 1.2부터는 SegmentV1 데이터에 접근할 수 없습니다.

### String 타입의 최대 길이 제한 {#limit-the-maximum-length-of-string-type}

이전 버전에서는 String 타입의 최대 길이가 2GB였습니다.
버전 1.1에서는 String 타입의 최대 길이를 1MB로 제한합니다. 이보다 긴 문자열은 더 이상 쓸 수 없습니다.
또한 String 타입을 테이블의 파티션 열이나 버킷 열로 사용하는 방식도 더 이상 지원하지 않습니다.

이미 기록된 String 타입 데이터에는 정상적으로 접근할 수 있습니다.

### fastjson 관련 취약점 수정 {#fix-fastjson-related-vulnerabilities}

fastjson 보안 취약점을 수정하기 위해 Canal 버전을 업데이트했습니다.

### `ADMIN DIAGNOSE TABLET` 명령 추가 {#added-admin-diagnose-tablet-command}

지정한 태블릿의 문제를 빠르게 진단하는 데 사용합니다.

## 다운로드 및 사용 {#download-to-use}

### 다운로드 링크 {#download-link}

[hhttps://doris.apache.org/download](https://doris.apache.org/download)

### 피드백 {#feedback}

사용 중 문제가 발생하면 언제든지 GitHub 토론 포럼이나 Dev 이메일 그룹으로 문의해 주세요.

GitHub 포럼: [https://github.com/apache/doris/discussions](https://github.com/apache/doris/discussions)

메일링 리스트: dev@doris.apache.org

## 감사의 말씀 {#thanks}

이번 릴리스에 기여해 주신 모든 분께 감사드립니다.

```

@adonis0147

@airborne12

@amosbird

@aopangzi

@arthuryangcs

@awakeljw

@BePPPower

@BiteTheDDDDt

@bridgeDream

@caiconghui

@cambyzju

@ccoffline

@chenlinzhong

@daikon12

@DarvenDuan

@dataalive

@dataroaring

@deardeng

@Doris-Extras

@emerkfu

@EmmyMiao87

@englefly

@Gabriel39

@GoGoWen

@gtchaos

@HappenLee

@hello-stephen

@Henry2SS

@hewei-nju

@hf200012

@jacktengg

@jackwener

@Jibing-Li

@JNSimba

@kangshisen

@Kikyou1997

@kylinmac

@Lchangliang

@leo65535

@liaoxin01

@liutang123

@lovingfeel

@luozenglin

@luwei16

@luzhijing

@mklzl

@morningman

@morrySnow

@nextdreamblue

@Nivane

@pengxiangyu

@qidaye

@qzsee

@SaintBacchus

@SleepyBear96

@smallhibiscus

@spaces-X

@stalary

@starocean999

@steadyBoy

@SWJTU-ZhangLei

@Tanya-W

@tarepanda1024

@tianhui5

@Userwhite

@wangbo

@wangyf0555

@weizuo93

@whutpencil

@wsjz

@wunan1210

@xiaokang

@xinyiZzz

@xlwh

@xy720

@yangzhg

@Yankee24

@yiguolei

@yinzhijian

@yixiutt

@zbtzbtzbt

@zenoyang

@zhangstar333

@zhangyifan27

@zhannngchen

@zhengshengjun

@zhengshiJ

@zingdle

@zuochunwei

@zy-kkk
```
