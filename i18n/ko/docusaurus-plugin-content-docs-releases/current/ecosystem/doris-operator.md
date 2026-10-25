---
{
    "title": "Doris Operator",
    "language": "ko",
    "description": "Doris Operator 릴리스 노트."
}
---

# Doris Operator {#doris-operator}

이 문서는 Doris Operator 릴리스 노트를 최신 버전부터 나열합니다.

## 26.0.1 {#2601}

출처: [릴리스 노트 26.0.1](https://github.com/apache/doris-operator/issues/512)

이 패치 릴리스에서는 Doris 4.1.3과의 DDC 축소 호환성을 개선하고, 저장소에서 관리하는 릴리스 자동화 도구를 추가했으며, 외부 기여자의 풀 리퀘스트에 대해서도 라이선스 검사를 안전하게 수행하도록 했습니다.

### 기능 및 개선 사항 {#features-and-improvements}

- 환경 검사, 소스 패키징, 서명 및 업로드, 투표 이메일 생성, 릴리스 완료를 위한 저장소 관리 릴리스 도구와 자동화된 워크플로 테스트를 추가했습니다. [#507](https://github.com/apache/doris-operator/pull/507)

### 버그 수정 {#bug-fixes}

- 확장된 `SHOW FRONTENDS` 및 `SHOW BACKENDS` 결과를 처리하고, 노드를 하나씩 제거하며, 정상적인 백엔드 정리를 재시도해도 안전하게 만들어 Doris 4.1.3에서 DDC FE 및 컴퓨트 그룹 축소가 작동하도록 수정했습니다. [#510](https://github.com/apache/doris-operator/pull/510)

### 안정성 {#reliability}

- 권한이 낮은 `pull_request` 워크플로에서 라이선스 검사를 실행하고 체크아웃 처리 방식을 업데이트하여 포크에서 생성된 풀 리퀘스트도 안전하게 검사할 수 있도록 했습니다. [#511](https://github.com/apache/doris-operator/pull/511)

### 감사의 말 {#thanks}

- [morningman](https://github.com/morningman)
- [Al-assad](https://github.com/Al-assad)

## 26.0.0 {#2600}

출처: [릴리스 노트 26.0.0](https://github.com/apache/doris-operator/issues/506)

이 버전에서는 컴퓨트 그룹의 정상 종료 롤아웃, 설정 가능한 준비 상태 프로브 정책, DCR mTLS 지원, 더 명확한 DDC 상태 보고를 포함해 DDC 수명 주기 관리와 안정성을 개선했습니다. Helm 차트 설정도 강화하고 여러 유효성 검사 및 안정성 관련 문제를 수정했습니다.

### 기능 및 개선 사항 {#features-and-improvements-1}

- 롤링 업데이트, 축소, 삭제 작업 중 DDC 컴퓨트 그룹이 정상적으로 종료되도록 롤아웃 기능을 추가했습니다. 지원하지 않는 이미지에서는 일반 StatefulSet 흐름으로 돌아가도록 sentinel 호환성 게이트도 적용했습니다. [#502](https://github.com/apache/doris-operator/pull/502)
- `DorisCluster` 및 `DorisDisaggregatedCluster` Pod에 설정 가능한 준비 상태 프로브 정책을 지원합니다. [#486](https://github.com/apache/doris-operator/pull/486)
- DCR에 mTLS를 지원합니다. [#483](https://github.com/apache/doris-operator/pull/483)
- 더 원활한 업그레이드와 트래픽 전환을 위해 DDC 컴퓨트 그룹 서비스를 내부 headless 서비스와 외부 서비스로 분리했습니다. [#484](https://github.com/apache/doris-operator/pull/484)
- Helm 차트에 구성 요소별 secret 지원을 추가했습니다. [#465](https://github.com/apache/doris-operator/pull/465)
- Helm 차트에서 배포된 Pod의 `serviceAccount` 설정을 구성할 수 있도록 했습니다. [#470](https://github.com/apache/doris-operator/pull/470)

### 버그 수정 {#bug-fixes-1}

- MetaService의 성능 저하가 클러스터 상태에 반영되도록 DDC MetaService 상태 집계를 수정했습니다. [#500](https://github.com/apache/doris-operator/pull/500)
- `CompareConfigmapAndTriggerRestart`에서 `dcr.Annotations`가 nil일 때 발생하는 nil 맵 패닉을 수정했습니다. [#493](https://github.com/apache/doris-operator/pull/493)
- FE 엔드포인트 주소의 JSON 태그를 수정하고 `DorisCluster` CRD를 다시 생성했습니다. [#497](https://github.com/apache/doris-operator/pull/497)
- `feSpec.replicas < feSpec.electionNumber`인 잘못된 `DorisDisaggregatedCluster` FE 사양을 거부하도록 했습니다. [#498](https://github.com/apache/doris-operator/pull/498)
- 변경할 수 없는 StatefulSet 볼륨 클레임 템플릿을 적용하기 전에 DDC 컴퓨트 그룹 스토리지 템플릿 변경을 거부하도록 했습니다. [#496](https://github.com/apache/doris-operator/pull/496)
- `DorisDisaggregatedCluster` BE Helm 설정의 기본 `storage_root_path`를 수정했습니다. [#477](https://github.com/apache/doris-operator/pull/477)

### 안정성 {#reliability-1}

- `DorisCluster` 및 `DorisDisaggregatedCluster` 웹훅에서 내장 `admin` 계정을 Operator 관리 사용자로 사용하는 것을 거부하도록 했습니다. [#499](https://github.com/apache/doris-operator/pull/499)
- Go 포맷, vet/lint 검사, Operator 빌드, 생성된 매니페스트 및 아티팩트에 대한 풀 리퀘스트 검사를 추가했습니다. [#501](https://github.com/apache/doris-operator/pull/501)

### 감사의 말 {#thanks-1}

- [ecniiv](https://github.com/ecniiv)
- [jonasbrami](https://github.com/jonasbrami)
- [catpineapple](https://github.com/catpineapple)
- [JinVei](https://github.com/JinVei)
- [Al-assad](https://github.com/Al-assad)

## 25.8.0 {#2580}

출처: [릴리스 노트 25.8.0](https://github.com/apache/doris-operator/issues/472)

이 버전에서는 TLS 지원, PVC 확장, Pod 디버깅 등 중요한 DDC 기능을 추가했습니다. Helm 지원, Pod 리소스 설정, 안정성도 개선했습니다.

### 기능 및 개선 사항 {#features-and-improvements-2}

- `dorisctl`의 TLS 접근을 지원합니다. [#432](https://github.com/apache/doris-operator/pull/432)
- Operator의 노드 제거 시나리오에서 TLS 사용을 지원합니다. [#434](https://github.com/apache/doris-operator/pull/434)
- Helm 차트 템플릿을 개선했습니다. [#452](https://github.com/apache/doris-operator/pull/452)
- Helm 및 Operator 차트에서 `values.yaml`을 통해 Deployment 리소스 할당량을 설정할 수 있도록 했습니다. [#462](https://github.com/apache/doris-operator/pull/462)
- Helm 차트의 `kubeVersion`이 EKS 및 GKE 버전처럼 시험판 접미사가 포함된 Kubernetes 버전과 호환되도록 했습니다. [#463](https://github.com/apache/doris-operator/pull/463)
- DDC 디버깅 기능을 추가했습니다. [#460](https://github.com/apache/doris-operator/pull/460) [#471](https://github.com/apache/doris-operator/pull/471)
- BE Pod에 CPU 리소스 인식 매개변수를 전달하는 기능을 추가했습니다. [#464](https://github.com/apache/doris-operator/pull/464)
- DDC의 PVC 확장을 지원합니다. [#467](https://github.com/apache/doris-operator/pull/467)
- 사용자 지정 초기화 컨테이너 동작에 대한 리소스 제한 설정을 지원합니다. [#469](https://github.com/apache/doris-operator/pull/469)

### 버그 수정 {#bug-fixes-2}

- 단위 테스트 케이스의 문제를 수정했습니다. [#430](https://github.com/apache/doris-operator/pull/430) [#433](https://github.com/apache/doris-operator/pull/433)
- 닫히지 않은 SQL 연결로 인한 리소스 누수를 수정했습니다. [#437](https://github.com/apache/doris-operator/pull/437)
- FE PVC 정보 수집을 수정했습니다. [#438](https://github.com/apache/doris-operator/pull/438)
- 오류 로그 메시지, 중복 환경 변수 및 기타 코드 결함을 수정했습니다. [#440](https://github.com/apache/doris-operator/pull/440) [#442](https://github.com/apache/doris-operator/pull/442) [#449](https://github.com/apache/doris-operator/pull/449)
- CVE를 수정하고 보안 관련 의존성을 업데이트했습니다. [#453](https://github.com/apache/doris-operator/pull/453)
- MySQL SQL 클라이언트 구조체 정의의 매핑을 수정했습니다. [#468](https://github.com/apache/doris-operator/pull/468)

### 안정성 {#reliability-2}

- DDC MetaService 컨트롤러에서 PVC를 생성할 때 `BuildVolumesVolumeMountsAndPVCs`를 재사용하여 로직의 일관성을 높였습니다. [#436](https://github.com/apache/doris-operator/pull/436)

### 다운로드 {#downloads}

이미지 형식은 이미지 저장소 설명을 참조하세요.

### 감사의 말 {#thanks-2}

- [intelligentfu8](https://github.com/intelligentfu8)
- [ztonny](https://github.com/ztonny)
- [matiasbertani](https://github.com/matiasbertani)
- [jonasbrami](https://github.com/jonasbrami)
- [gohalo](https://github.com/gohalo)
- [catpineapple](https://github.com/catpineapple)

## 25.7.0 {#2570}

출처: [릴리스 노트 25.7.0](https://github.com/apache/doris-operator/issues/423)

이 버전에서는 노드 제거 작업의 호환성과 디버그 이미지 빌드를 개선했습니다. DDC Pod 정보 마운트, PVC 테스트, 이벤트 처리 문제도 수정했습니다.

### 기능 및 개선 사항 {#features-and-improvements-3}

- 이름이 변경된 컴퓨트 그룹과 노드 제거 작업이 호환되도록 했습니다. [#417](https://github.com/apache/doris-operator/pull/417)
- 디버그 이미지 빌드에 사용하는 Go 버전을 업그레이드했습니다. [#424](https://github.com/apache/doris-operator/pull/424)

### 버그 수정 {#bug-fixes-3}

- 철자 오류를 수정했습니다. [#413](https://github.com/apache/doris-operator/pull/413)
- DDC 컨테이너에서 누락된 Pod 정보 마운트를 수정했습니다. [#415](https://github.com/apache/doris-operator/pull/415)
- 실패하던 PVC 생성 단위 테스트를 수정했습니다. [#420](https://github.com/apache/doris-operator/pull/420)
- `EventString`이 nil일 때 nil 포인터 오류가 발생하지 않도록 했습니다. [#422](https://github.com/apache/doris-operator/pull/422)

### 감사의 말 {#thanks-3}

- [intelligentfu8](https://github.com/intelligentfu8)
- [ztonny](https://github.com/ztonny)

## 25.6.0 {#2560}

출처: [릴리스 노트 25.6.0](https://github.com/apache/doris-operator/issues/414)

이 버전에서는 `dorisctl`을 스토리지와 컴퓨트를 분리한 클러스터까지 확장하고, 초기 배포 중 PVC가 생성되지 않는 문제를 수정했습니다.

### 기능 및 개선 사항 {#features-and-improvements-4}

- `dorisctl`을 사용해 스토리지와 컴퓨트를 분리한 Doris 클러스터를 관리할 수 있도록 했습니다. [#412](https://github.com/apache/doris-operator/pull/412)

### 버그 수정 {#bug-fixes-4}

- 초기 배포 중 PVC가 생성되지 않는 문제를 수정했습니다. [#410](https://github.com/apache/doris-operator/pull/410)

### 감사의 말 {#thanks-4}

- [intelligentfu8](https://github.com/intelligentfu8)

## 25.5.3 {#2553}

출처: [릴리스 노트 25.5.3](https://github.com/apache/doris-operator/issues/408)

이 버전에서는 DDC 배포의 기본 이미지와 문서를 개선하고, 내부 조정용 어노테이션이 사용자 지정 리소스에 표시되지 않도록 했습니다.

### 기능 및 개선 사항 {#features-and-improvements-5}

- BE 이미지를 기본 초기화 컨테이너 이미지로 사용하도록 했습니다. [#405](https://github.com/apache/doris-operator/pull/405)
- README에 기능 설명 두 가지를 추가했습니다. [#406](https://github.com/apache/doris-operator/pull/406)
- 다양한 시나리오에 대한 FoundationDB 사용 예제를 추가했습니다. [#407](https://github.com/apache/doris-operator/pull/407)

### 버그 수정 {#bug-fixes-5}

- 조정 상태 검사에만 사용하는 어노테이션이 사용자 지정 리소스에 표시되지 않도록 했습니다. [#404](https://github.com/apache/doris-operator/pull/404)

### 감사의 말 {#thanks-5}

- [intelligentfu8](https://github.com/intelligentfu8)

## 25.5.2 {#2552}

출처: [릴리스 노트 25.5.2](https://github.com/apache/doris-operator/issues/403)

이 버전에서는 DDC 조정과 디버깅 동작을 개선했습니다.

### 기능 및 개선 사항 {#features-and-improvements-6}

- `DorisDisaggregatedCluster` 상태가 이미 일치하면 불필요한 조정을 수행하지 않도록 했습니다. [#399](https://github.com/apache/doris-operator/pull/399)
- 디버그 모드 진입을 위한 `apache.com.doris/runmode` 어노테이션을 추가했습니다. [#400](https://github.com/apache/doris-operator/pull/400)
- `DorisDisaggregatedCluster` 조정을 기본 모드로 설정했습니다. [#402](https://github.com/apache/doris-operator/pull/402)

### 감사의 말 {#thanks-6}

- [intelligentfu8](https://github.com/intelligentfu8)

## 25.5.1 {#2551}

출처: [릴리스 노트 25.5.1](https://github.com/apache/doris-operator/issues/398)

이 버전에서는 DDC에 Kerberos 지원을 추가하고 분리형 릴리스 버전을 Operator 버전과 일치시켰습니다.

### 기능 및 개선 사항 {#features-and-improvements-7}

- DDC에 Kerberos 지원을 추가했습니다. [#396](https://github.com/apache/doris-operator/pull/396)

### 버그 수정 {#bug-fixes-6}

- 분리형 릴리스 버전을 Operator 버전과 일치시켰습니다. [#395](https://github.com/apache/doris-operator/pull/395)

### 감사의 말 {#thanks-7}

- [intelligentfu8](https://github.com/intelligentfu8)

## 25.5.0 {#2550}

출처: [릴리스 노트 25.5.0](https://github.com/apache/doris-operator/issues/394)

이 버전에서는 스토리지와 컴퓨트를 분리한 클러스터에 워크로드 그룹 및 Helm 차트 지원을 추가했습니다. DDC 초기화도 개선하고 이미지, 권한, MetaService 설정 문제를 수정했습니다.

### 기능 및 개선 사항 {#features-and-improvements-8}

- 스토리지와 컴퓨트를 분리한 Doris 클러스터에 워크로드 그룹 지원을 추가했습니다. [#378](https://github.com/apache/doris-operator/pull/378)
- `DorisDisaggregatedCluster` 리소스 조정을 추가했습니다. [#379](https://github.com/apache/doris-operator/pull/379)
- 스토리지와 컴퓨트를 분리한 Doris 클러스터에 Helm 차트 지원을 추가했습니다. [#379](https://github.com/apache/doris-operator/pull/379) [#386](https://github.com/apache/doris-operator/pull/386) [#388](https://github.com/apache/doris-operator/pull/388) [#393](https://github.com/apache/doris-operator/pull/393)
- DDC가 기본 시스템 초기화 검사를 건너뛸 수 있도록 했습니다. [#389](https://github.com/apache/doris-operator/pull/389)

### 버그 수정 {#bug-fixes-7}

- 기본 Operator 이미지를 조정했습니다. [#377](https://github.com/apache/doris-operator/pull/377)
- 집계된 `ClusterRole`을 추가했습니다. [#380](https://github.com/apache/doris-operator/pull/380)
- 분리형 클러스터의 MetaService 복제본 수를 수정했습니다. [#382](https://github.com/apache/doris-operator/pull/382)

### 감사의 말 {#thanks-8}

- [wdxxl](https://github.com/wdxxl)
- [catpineapple](https://github.com/catpineapple)
- [intelligentfu8](https://github.com/intelligentfu8)

## 25.4.0 {#2540}

출처: [릴리스 노트 25.4.0](https://github.com/apache/doris-operator/issues/376)

이 버전에서는 주로 DCR에서 공유 디스크를 마운트하고 Helm 차트에서 Pod 어노테이션을 설정할 수 있도록 했습니다.

### 기능 및 개선 사항 {#features-and-improvements-9}

- Pod에 마운트해야 하는 공유 PVC를 설정할 수 있도록 했습니다. [#375](https://github.com/apache/doris-operator/pull/375)
- Doris Helm 차트에 Pod 어노테이션 지원을 추가했습니다. [#327](https://github.com/apache/doris-operator/pull/327)

### 감사의 말 {#thanks-9}

- [catpineapple](https://github.com/catpineapple)
- [bluicezhen](https://github.com/bluicezhen)

## 25.3.0 {#2530}

출처: [릴리스 노트 25.3.0](https://github.com/apache/doris-operator/issues/371)

이 버전에서는 `DorisCluster`와 `DorisDisaggregatedCluster`의 PersistentVolume 기능을 개선하고, 버그를 수정했으며, 프로젝트 예제와 Helm 빌드 방식을 개선했습니다.

### 기능 및 개선 사항 {#features-and-improvements-10}

- Helm 릴리스를 위해 Makefile에 Helm `make` 지원을 추가했습니다. [#362](https://github.com/apache/doris-operator/pull/362)
- DCR PersistentVolume 템플릿 설정과 설정 파일 간 연결을 추가했습니다. [#364](https://github.com/apache/doris-operator/pull/364)
- DDC PersistentVolume 사용자 지정 및 `PersistentVolume` 호환성을 추가했습니다. [#369](https://github.com/apache/doris-operator/pull/369)

### 버그 수정 {#bug-fixes-8}

- PVC 이름에 유효하지 않은 문자열이 들어갈 가능성을 방지했습니다. [#368](https://github.com/apache/doris-operator/pull/368)
- 분리형 Doris에서 `adminUser`를 설정했을 때 확장에 실패하는 문제를 수정했습니다. [#367](https://github.com/apache/doris-operator/pull/367)

### 기타 변경 사항 {#other-changes}

- 어피니티 및 비밀번호 설정을 보여 주는 새로운 DDC 예제를 추가했습니다. [#366](https://github.com/apache/doris-operator/pull/366)
- 사용하지 않는 API 문서를 제거했습니다. [#370](https://github.com/apache/doris-operator/pull/370)

### 감사의 말 {#thanks-10}

- [catpineapple](https://github.com/catpineapple)
- [intelligentfu8](https://github.com/intelligentfu8)

## 25.2.1 {#2521}

출처: [릴리스 노트 25.2.1](https://github.com/apache/doris-operator/issues/360)

이 버전에서는 Helm 차트에 분리형 클러스터 리소스를 추가하고, 릴리스 시 버전 치환과 이미지 저장소를 개선했으며, Helm 차트 문제를 수정했습니다.

### 기능 및 개선 사항 {#features-and-improvements-11}

- 분리형 클러스터를 배포할 수 있도록 Helm 차트에 분리형 사용자 지정 리소스를 추가했습니다. [#355](https://github.com/apache/doris-operator/pull/355)
- 릴리스 과정에서 버전 필드를 치환 가능한 변수로 만들었습니다. [#354](https://github.com/apache/doris-operator/pull/354)
- 이미지를 SelectDB 저장소에서 Apache 저장소로 이전했습니다. [#357](https://github.com/apache/doris-operator/pull/357)

### 버그 수정 {#bug-fixes-9}

- PR 354의 일부 변경 사항을 되돌렸습니다. [#358](https://github.com/apache/doris-operator/pull/358)
- Helm 차트의 `apiVersion`을 수정했습니다. [#359](https://github.com/apache/doris-operator/pull/359)

### 감사의 말 {#thanks-11}

- [xiacongling](https://github.com/xiacongling)
- [intelligentfu8](https://github.com/intelligentfu8)

## 25.2.0 {#2520}

출처: [릴리스 노트 25.2.0](https://github.com/apache/doris-operator/issues/351)

이 버전에서는 Kerberos로 보호되는 데이터 시스템에 접근하는 기능을 추가하고, Go 및 controller-runtime 버전을 업그레이드했으며, 런타임 동작을 개선하고 버그와 문서를 수정했습니다.

### 기능 및 개선 사항 {#features-and-improvements-12}

- Kerberos로 보호되는 데이터 시스템에 접근할 수 있도록 Operator에 Kerberos 지원을 추가했습니다. [#336](https://github.com/apache/doris-operator/pull/336) [#348](https://github.com/apache/doris-operator/pull/348)
- BE 초기화 건너뛰기 동작을 개선하고 Doris Core에 환경 변수를 추가했습니다. [#338](https://github.com/apache/doris-operator/pull/338)

### 버그 수정 {#bug-fixes-10}

- BE 배포를 기다리는 동안 조정이 발생할 수 있는 버그를 수정했습니다. [#341](https://github.com/apache/doris-operator/pull/341)

### 기타 변경 사항 {#other-changes-1}

- Operator Dockerfile의 기본 이미지를 업데이트하고 Go 버전을 1.23으로 변경했습니다. [#337](https://github.com/apache/doris-operator/pull/337) [#346](https://github.com/apache/doris-operator/pull/346)
- Go와 controller-runtime을 alpha v1에서 v1로 업데이트했습니다. [#340](https://github.com/apache/doris-operator/pull/340)
- `golang.org/x/net`을 0.30.0에서 0.33.0으로 올렸습니다. [#343](https://github.com/apache/doris-operator/pull/343)
- README 파일을 업데이트했습니다. [#344](https://github.com/apache/doris-operator/pull/344) [#345](https://github.com/apache/doris-operator/pull/345) [#347](https://github.com/apache/doris-operator/pull/347) [#349](https://github.com/apache/doris-operator/pull/349) [#350](https://github.com/apache/doris-operator/pull/350)

### 다운로드 {#downloads-1}

- Operator 이미지: `operator` 접두사가 붙은 태그를 사용합니다. [Docker Hub](https://hub.docker.com/r/apache/doris/tags)
- Doris 이미지: `ms`, `fe`, `be` 접두사가 붙은 태그를 사용합니다. [Docker Hub](https://hub.docker.com/r/apache/doris/tags)

### 감사의 말 {#thanks-12}

- [catpineapple](https://github.com/catpineapple)
- [intelligentfu8](https://github.com/intelligentfu8)

## 25.1.0 {#2510}

출처: [릴리스 노트 25.1.0](https://github.com/apache/doris-operator/issues/333)

이 버전에서는 BE 스케줄링과 설정 업데이트를 개선하고, 컨트롤러 테스트를 추가했으며, StatefulSet 준비 과정을 수정하고 이미지 태그를 Apache 저장소로 이전했습니다.

### 기능 및 개선 사항 {#features-and-improvements-13}

- Operator가 FE를 실행하는 노드에 BE를 우선 배치하도록 BE와 FE 간 어피니티를 추가했습니다. [#328](https://github.com/apache/doris-operator/pull/328)
- ConfigMap 변경을 감시하고 시작 설정이 변경되면 Doris를 다시 시작하도록 했습니다. [#331](https://github.com/apache/doris-operator/pull/331)
- BE가 기본 시스템 초기화를 건너뛸 수 있도록 했습니다. [#321](https://github.com/apache/doris-operator/pull/321)
- 컨트롤러 단위 테스트를 추가했습니다. [#322](https://github.com/apache/doris-operator/pull/322)

### 버그 수정 {#bug-fixes-11}

- `prepareStatefulsetApply`에 전달되는 매개변수를 수정했습니다. [#326](https://github.com/apache/doris-operator/pull/326)

### 기타 변경 사항 {#other-changes-2}

- 모든 이미지 태그를 SelectDB 저장소에서 Apache 저장소로 이전했습니다. [#329](https://github.com/apache/doris-operator/pull/329)

### 감사의 말 {#thanks-13}

- [catpineapple](https://github.com/catpineapple)
- [intelligentfu8](https://github.com/intelligentfu8)

## 24.2.0 {#2420}

출처: [릴리스 노트 24.2.0](https://github.com/apache/doris-operator/issues/319)

이 버전에서는 `DorisDisaggregatedCluster`의 다중 secret 지원과 컴퓨트 그룹의 decommission 기반 BE 축소 기능을 추가했습니다. Arrow Flight SQL 포트 노출, 리소스 정리, 테스트, 문서, 예제도 개선했습니다.

### 기능 및 개선 사항 {#features-and-improvements-14}

- decommission을 통해 DDC 컴퓨트 그룹의 BE를 축소할 수 있도록 했습니다. [#306](https://github.com/apache/doris-operator/pull/306)
- DDC의 사용자 이름 및 비밀번호 설정과 다중 secret을 지원합니다. [#312](https://github.com/apache/doris-operator/pull/312)
- Arrow Flight SQL 포트를 컨테이너 포트로 노출했습니다. [#295](https://github.com/apache/doris-operator/pull/295)
- 분리형 서비스에 Arrow Flight SQL 포트를 노출했습니다. [#307](https://github.com/apache/doris-operator/pull/307)
- 단위 테스트 범위를 확대했습니다. [#315](https://github.com/apache/doris-operator/pull/315)
- 컴퓨트 그룹 리소스 정리 코드를 리팩터링했습니다. [#318](https://github.com/apache/doris-operator/pull/318)

### 버그 수정 {#bug-fixes-12}

- 컴퓨트 그룹을 제거할 때 SQL 클라이언트의 동작을 수정했습니다. [#314](https://github.com/apache/doris-operator/pull/314)
- 서비스 레이블을 수정했습니다. [#318](https://github.com/apache/doris-operator/pull/318)
- `UniqueId`에 하이픈이 포함된 경우 컴퓨트 그룹이 제거되지 않는 문제를 수정했습니다. [#318](https://github.com/apache/doris-operator/pull/318)
- 클러스터 업데이트 중 FE 축소에 대한 안전성 검사를 추가했습니다. [#320](https://github.com/apache/doris-operator/pull/320)

### 기타 변경 사항 {#other-changes-3}

- README를 개선했습니다. [#303](https://github.com/apache/doris-operator/pull/303)
- 오래된 Dockerfile과 DDM 코드를 비롯한 사용하지 않는 파일을 제거했습니다. [#309](https://github.com/apache/doris-operator/pull/309) [#314](https://github.com/apache/doris-operator/pull/314)
- `DorisDisaggregatedCluster` CRD 예제를 개선했습니다. [#313](https://github.com/apache/doris-operator/pull/313)

### 감사의 말 {#thanks-14}

- [jonasbrami](https://github.com/jonasbrami)
- [hechao-ustc](https://github.com/hechao-ustc)
- [intelligentfu8](https://github.com/intelligentfu8)
- [catpineapple](https://github.com/catpineapple)

## 24.1.0 {#2410}

출처: [릴리스 노트 24.1.0](https://github.com/apache/doris-operator/issues/293)

이 버전에서는 `DorisCluster`에 워크로드 그룹 지원을 추가하고 롤링 재시작을 도입했으며, FE 배포 및 접근 문제를 수정했습니다.

워크로드 그룹을 사용하려면 공식 Apache Doris 2.1.7 이상 이미지가 필요합니다. 이전 Doris 버전에서는 호환되는 이미지를 직접 빌드하세요.

### 기능 및 개선 사항 {#features-and-improvements-15}

- Doris BE에 워크로드 그룹 지원을 추가했습니다. [#289](https://github.com/apache/doris-operator/pull/289)
- Doris 클러스터에 롤링 재시작 기능을 추가했습니다. [#292](https://github.com/apache/doris-operator/pull/292)
- Makefile의 controller-gen 버전을 업데이트했습니다. [#275](https://github.com/apache/doris-operator/pull/275)
- GitHub Actions에 라이선스 검사를 추가했습니다. [#278](https://github.com/apache/doris-operator/pull/278) [#279](https://github.com/apache/doris-operator/pull/279) [#280](https://github.com/apache/doris-operator/pull/280)
- 기본 이슈 템플릿을 추가했습니다. [#288](https://github.com/apache/doris-operator/pull/288)

### 버그 수정 {#bug-fixes-13}

- `DorisCluster` 리소스에 FE `electionNumber`가 설정되지 않았을 때 발생하는 nil 포인터 오류를 수정했습니다. [#285](https://github.com/apache/doris-operator/pull/285)
- FE 접근 주소가 서비스 이름과 네임스페이스를 사용하도록 수정했습니다. [#291](https://github.com/apache/doris-operator/pull/291)

### 감사의 말 {#thanks-15}

- [intelligentfu8](https://github.com/intelligentfu8)
- [catpineapple](https://github.com/catpineapple)

## 24.0.0 {#2400}

출처: [릴리스 노트 24.0.0](https://github.com/apache/doris-operator/issues/272)

이 버전에서는 스토리지와 컴퓨트를 분리한 Apache Doris 클러스터를 배포하기 위한 `DorisDisaggregatedCluster`(DDC) 사용자 지정 리소스를 도입했습니다. `DorisCluster`(DCR)를 통한 스토리지와 컴퓨트가 결합된 배포 지원도 확대했습니다.

DDC를 사용하려면 Apache Doris 3.0.2 이상이 필요합니다.

### 새로운 기능 {#new-features}

#### DorisDisaggregatedCluster {#dorisdisaggregatedcluster}

- FoundationDB 모듈 접근 기능을 추가했습니다. [#186](https://github.com/apache/doris-operator/pull/186)
- MetaService 모듈 배포 기능을 추가했습니다. [#194](https://github.com/apache/doris-operator/pull/194)
- FE 모듈 배포 기능을 추가했습니다. [#199](https://github.com/apache/doris-operator/pull/199)
- 컴퓨트 그룹 모듈 배포 기능을 추가했습니다. [#185](https://github.com/apache/doris-operator/pull/185) [#189](https://github.com/apache/doris-operator/pull/189) [#192](https://github.com/apache/doris-operator/pull/192) [#197](https://github.com/apache/doris-operator/pull/197)
- 분리형 Doris 구성 요소의 이미지 진입점 지원을 추가했습니다. [#195](https://github.com/apache/doris-operator/pull/195) [#196](https://github.com/apache/doris-operator/pull/196)
- FE 축소 기능을 추가했습니다. [#225](https://github.com/apache/doris-operator/pull/225)
- 컴퓨트 그룹 축소 및 리소스 정리 기능을 추가했습니다. [#238](https://github.com/apache/doris-operator/pull/238)
- SQL 인터페이스를 통한 FE 축소 기능을 추가했습니다. [#255](https://github.com/apache/doris-operator/pull/255)
- SQL 인터페이스를 통한 컴퓨트 그룹 축소 기능을 추가했습니다. [#256](https://github.com/apache/doris-operator/pull/256)

#### DorisCluster {#doriscluster}

- 외부 서비스를 통해 Arrow Flight SQL 포트를 노출했습니다. [#251](https://github.com/apache/doris-operator/pull/251)

### 개선 사항 {#improvements}

#### DorisDisaggregatedCluster {#dorisdisaggregatedcluster-1}

- `be.conf` 및 PVC 설정을 통한 컴퓨트 그룹 생성을 지원합니다. [#198](https://github.com/apache/doris-operator/pull/198)
- README 및 DDC 예제 YAML 파일을 개선했습니다. [#203](https://github.com/apache/doris-operator/pull/203) [#210](https://github.com/apache/doris-operator/pull/210) [#211](https://github.com/apache/doris-operator/pull/211) [#214](https://github.com/apache/doris-operator/pull/214)
- 최신 버전을 사용하도록 README 예제를 업데이트했습니다. [#220](https://github.com/apache/doris-operator/pull/220)
- DDC 배포를 활성화하는 Operator 스위치를 추가했습니다. [#204](https://github.com/apache/doris-operator/pull/204)
- 시스템 환경을 준비하기 위해 `SystemInitialization`을 추가했습니다. [#212](https://github.com/apache/doris-operator/pull/212)
- 컴퓨트 그룹 용어를 Doris의 명칭 변경에 맞췄습니다. [#215](https://github.com/apache/doris-operator/pull/215) [#245](https://github.com/apache/doris-operator/pull/245)
- MetaService 복제본 CRD를 제거했습니다. [#227](https://github.com/apache/doris-operator/pull/227)
- MetaService CRD를 `DorisDisaggregatedCluster` CRD에 통합하도록 재구성했습니다. [#234](https://github.com/apache/doris-operator/pull/234)
- 새로운 SQL 인터페이스에 맞춰 컴퓨트 그룹 식별자를 `UniqueId`로 변경했습니다. [#239](https://github.com/apache/doris-operator/pull/239)
- FE SQL 이미지 진입점과 클러스터 ID 해시 코드를 추가했습니다. [#249](https://github.com/apache/doris-operator/pull/249)
- DDC 작업을 HTTP 인터페이스에서 SQL 인터페이스로 이전했습니다. [#254](https://github.com/apache/doris-operator/pull/254)
- Pod 활성 상태 프로브에 `timeoutSeconds`를 추가했습니다. [#257](https://github.com/apache/doris-operator/pull/257)
- FE가 로그 PVC 생성을 건너뛸 수 있도록 `logNotStore`를 추가했습니다. [#266](https://github.com/apache/doris-operator/pull/266)
- DDC 예제와 문서를 업데이트했습니다. [#268](https://github.com/apache/doris-operator/pull/268)

#### DorisCluster {#doriscluster-1}

- Pod 활성 상태 프로브에 `timeoutSeconds`를 추가했습니다. [#257](https://github.com/apache/doris-operator/pull/257)

#### 기타 변경 사항 {#other-changes-4}

- 공통 유틸리티에 대한 단위 테스트를 추가했습니다. [#226](https://github.com/apache/doris-operator/pull/226)
- 리소스 및 컨트롤러 모델에 대한 단위 테스트를 추가했습니다. [#232](https://github.com/apache/doris-operator/pull/232)
- Artifact Hub용 Helm 차트 설정을 업데이트했습니다. [#244](https://github.com/apache/doris-operator/pull/244)
- 조직 이름을 SelectDB에서 Apache로 변경했습니다. [#247](https://github.com/apache/doris-operator/pull/247)

### 버그 수정 {#bug-fixes-14}

#### DorisDisaggregatedCluster {#dorisdisaggregatedcluster-2}

- Pod 어피니티와 StatefulSet PVC 포인터 처리를 수정했습니다. [#209](https://github.com/apache/doris-operator/pull/209)
- 기본 BE 스토리지 경로를 수정했습니다. [#243](https://github.com/apache/doris-operator/pull/243)
- 중복된 `ms_token` 환경 변수로 인해 초기 배포 중 Pod가 다시 시작되는 문제를 수정했습니다. [#259](https://github.com/apache/doris-operator/pull/259)
- 이미지 진입점에서 사용하는 BE ConfigMap 경로를 수정했습니다. [#261](https://github.com/apache/doris-operator/pull/261)
- `electionNumber`가 nil인 배포 문제를 수정하고 서비스가 계속 업데이트되지 않도록 했습니다. [#262](https://github.com/apache/doris-operator/pull/262) [#266](https://github.com/apache/doris-operator/pull/266)
- 반복적인 조정을 수정했습니다. [#263](https://github.com/apache/doris-operator/pull/263) [#265](https://github.com/apache/doris-operator/pull/265)
- 기본 BE 캐시 경로를 수정했습니다. [#266](https://github.com/apache/doris-operator/pull/266)

#### DorisCluster {#doriscluster-2}

- Operator 업그레이드 시 Doris Pod가 다시 시작되지 않도록 했습니다. [#226](https://github.com/apache/doris-operator/pull/226)
- 공유 Pod 환경 변수 배열을 병합할 때 깊은 복사본을 사용하도록 했습니다. [#236](https://github.com/apache/doris-operator/pull/236)
- 네임스페이스를 가로질러 FE를 축소할 때 발생하는 MySQL 클라이언트 오류를 수정했습니다. [#240](https://github.com/apache/doris-operator/pull/240)
- `electionNumber`가 nil일 때 발생하는 배포 실패를 수정했습니다. [#260](https://github.com/apache/doris-operator/pull/260)

#### 기타 변경 사항 {#other-changes-5}

- StatefulSet의 리소스 모델 단위 테스트를 수정했습니다. [#252](https://github.com/apache/doris-operator/pull/252)

### 감사의 말 {#thanks-16}

- [intelligentfu8](https://github.com/intelligentfu8)
- [catpineapple](https://github.com/catpineapple)
- [hechao-ustc](https://github.com/hechao-ustc)
