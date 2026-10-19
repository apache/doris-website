---
title: Apache 릴리스 검증
language: ko
description: "Apache Doris 릴리스 검증 절차: 다운로드, 서명 확인, 소스 라이선스 확인, 컴파일 검증 및 투표."
keywords:
    - Apache Doris
    - 릴리스 검증
    - GPG 서명
    - sha512 체크섬
    - LICENSE 검사
    - skywalking-eyes
    - 릴리스 투표
---

<!-- 
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

# Apache 릴리스 검증 {#verify-an-apache-release}

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenario: Apache release process / verification and voting -->

이 검증 절차는 다음 경우에 적용됩니다.

- 릴리스 투표 중 릴리스 후보(RC)를 검증할 때.
- 이미 게시된 릴리스의 무결성을 확인할 때.

이 문서에서는 Doris Core를 예로 사용합니다. 다른 구성 요소를 검증할 때는 해당 이름으로 바꾸어 적용하세요.

## 검증 체크리스트 {#verification-checklist}

아래 7개 항목을 모두 통과해야 +1 표를 던질 수 있습니다.

| 번호 | 검사 항목 | 검증 방법 |
|------|--------|----------|
| 1 | 다운로드 링크가 공식 배포 주소임 | 링크가 `dist.apache.org` 또는 `downloads.apache.org`에서 제공됨 |
| 2 | 체크섬과 PGP 서명이 유효함 | `gpg --verify` + `sha512sum --check` |
| 3 | 코드가 현재 릴리스 버전과 일치함 | 소스 코드를 Git 태그와 비교 |
| 4 | LICENSE 및 NOTICE 파일이 올바름 | 수동 검사 |
| 5 | 모든 파일에 필수 라이선스 헤더가 있음 | `apache/skywalking-eyes` |
| 6 | 소스 패키지에 컴파일된 결과물이 포함되지 않음 | `target/`, `build/` 및 바이너리 파일을 수동으로 검사 |
| 7 | 컴파일이 성공적으로 완료됨 | 컴파일 문서에 따라 빌드 |

## 1. 소스 패키지, 서명 파일, 체크섬 파일 및 KEYS 다운로드 {#1-download-the-source-package-signature-file-checksum-file-and-keys}

관련 파일을 모두 다운로드합니다. 이 예에서는 `a.b.c-incubating`을 사용합니다.

```shell
wget https://www.apache.org/dyn/mirrors/mirrors.cgi?action=download&filename=/incubator/doris/a.b.c-incubating/apache-doris-a.b.c-incubating-src.tar.gz

wget https://www.apache.org/dist/incubator/doris/a.b.c-incubating/apache-doris-a.b.c-incubating-src.tar.gz.sha512

wget https://www.apache.org/dist/incubator/doris/a.b.c-incubating/apache-doris-a.b.c-incubating-src.tar.gz.asc

wget https://downloads.apache.org/incubator/doris/KEYS
```

> 투표를 위한 검증에서는 투표 이메일에 제공된 SVN 주소에서 파일을 받으세요.

## 2. 서명 및 체크섬 확인 {#2-check-the-signature-and-checksum}

### 2.1 GnuPG 설치 {#21-install-gnupg}

GnuPG 사용을 권장합니다. 다음 명령 중 시스템에 맞는 명령으로 설치합니다.

| 시스템 | 설치 명령 |
|------|----------|
| CentOS / RHEL | `yum install gnupg` |
| Ubuntu / Debian | `apt-get install gnupg` |

### 2.2 KEYS 가져오기 및 검증 {#22-import-keys-and-verify}

다음 예에서는 Doris core 릴리스를 사용합니다. 다른 릴리스도 비슷한 방식으로 검증할 수 있습니다.

```shell
gpg --import KEYS
gpg --verify apache-doris-a.b.c-incubating-src.tar.gz.asc apache-doris-a.b.c-incubating-src.tar.gz
sha512sum --check apache-doris-a.b.c-incubating-src.tar.gz.sha512
```

> 참고: `gpg --import` 실행 시 `no valid user IDs` 오류로 실패하면 GPG 버전이 호환되지 않는 것일 수 있습니다. 2.2.x 이상으로 업그레이드하세요.

## 3. 소스 라이선스 헤더 검증 {#3-verify-source-license-headers}

[skywalking-eyes](https://github.com/apache/skywalking-eyes)를 사용하여 라이선스 헤더를 검증합니다.

소스 루트 디렉터리로 이동하여 다음 명령을 실행합니다.

```shell
sudo docker run -it --rm -v $(pwd):/github/workspace apache/skywalking-eyes header check
```

출력 예:

```text
INFO GITHUB_TOKEN is not set, license-eye won't comment on the pull request
INFO Loading configuraftion from file: .licenserc.yaml
INFO Totally checked 5611 files, valid: 3926, invalid: 0, ignored: 1685, fixed: 0
```

`invalid` 값이 0이면 검사를 통과한 것입니다.

## 4. 컴파일 검증 {#4-verify-compilation}

각 구성 요소의 컴파일 문서를 참고하세요.

- Doris core 컴파일: [컴파일 문서](/community/source-install/compilation-with-docker)를 참고하세요.
- Flink Doris Connector 컴파일: [Flink Doris Connector 문서](/docs/dev/connection-integration/data-integration/flink-doris-connector)를 참고하세요.
- Spark Doris Connector 컴파일: [Spark Doris Connector 문서](/docs/dev/connection-integration/data-integration/spark-doris-connector)를 참고하세요.

## 5. 투표 {#5-voting}

투표에 관한 자세한 내용은 [ASF 투표 절차](https://www.apache.org/foundation/voting.html)를 참고하세요.

검증을 마친 후에는 다음 템플릿을 사용하여 `dev@doris` 메일링 리스트의 투표 이메일에 회신할 수 있습니다.

```text
+1 (binding) or +1 (non-binding)

My Apache ID(optional): morningman

I checked:

[x] The download link is legal.
[x] The PGP signature are valid.
[x] The source code matches the current release version.
[x] The LICENSE and NOTICE files are correct.
[x] All files carry the necessary protocol header.
[x] The compiled content is not included in the source package.
[x] The compilation can be executed smoothly.

Other comments...
```

### 5.1 주요 투표 규칙 {#51-key-voting-rules}

| 규칙 | 설명 |
|------|------|
| 구속력 있는 투표 | PMC 구성원의 투표에는 구속력이 있습니다. 그 외의 투표는 참고 의견으로 반영됩니다 |
| 통과 조건 | 과반수 찬성: PMC 구성원의 +1 투표가 최소 세 표이고, +1 표가 -1 표보다 많아야 합니다 |
| 투표 기간 | 최소 72시간 동안 진행합니다 |
| 암묵적인 +1 없음 | 릴리스 관리자와 모든 투표자에게 암묵적인 +1은 부여되지 않습니다. 명시적으로 행사한 표만 집계합니다 |

PMC 구성원의 투표에는 구속력이 있지만, 커뮤니티는 참고 의견으로만 반영되는 경우에도 모든 구성원이 투표에 참여하도록 권장합니다.

릴리스 관리자는 각 투표의 유효성을 확인해야 합니다. PMC 명단을 통해 이메일 주소가 일치하는지 확인할 수 있습니다. 권장 사항은 다음과 같습니다.

- 투표의 유효성을 확인할 수 있도록 Apache 이메일 주소를 사용하세요.
- 릴리스 관리자가 더 쉽게 집계할 수 있도록 투표에 Apache ID를 포함하세요.

일반적으로 심각한 문제가 발견되면 커뮤니티는 릴리스 투표를 취소합니다. 다만 대부분의 경우 최종 결정은 릴리스 관리자가 내립니다. 구체적인 절차는 프로젝트마다 다를 수 있지만, **"최소 세 표의 +1이 필요하다"는 정족수 규칙은 모든 프로젝트에 적용됩니다**.

참고: **릴리스 관리자를 비롯한 ASF 투표의 어떤 참여자에게도 암묵적인 +1은 부여되지 않습니다. 명시적으로 행사한 표만 집계합니다.** 릴리스 관리자도 해당 릴리스에 투표하는 것이 권장됩니다.

## 자주 묻는 질문 / 문제 해결 {#faq--troubleshooting}

### Q1: `gpg --verify` 실행 시 `gpg verify failed` 또는 `BAD signature` 오류가 발생함 {#q1-gpg---verify-reports-gpg-verify-failed-or-bad-signature}

가능한 원인:

- KEYS 파일을 가져오지 않았습니다. 먼저 `gpg --import KEYS`를 실행하세요.
- 서명 파일이 소스 패키지와 일치하지 않습니다. `.asc` 파일과 `.tar.gz` 파일이 같은 디렉터리에 있고 버전 번호가 일치하는지 확인하세요.
- 다운로드 중 소스 패키지가 손상되었습니다. 다시 다운로드하고 `.sha512` 파일과 비교하세요.

### Q2: `gpg --import` 실행 시 `no valid user IDs` 오류가 발생함 {#q2-gpg---import-reports-no-valid-user-ids}

GPG 버전이 너무 오래되었습니다. 2.2.x 이상으로 업그레이드하세요.

```shell
# Ubuntu
apt-get install gnupg2

# CentOS
yum install gnupg2
```

### Q3: `sha512sum --check` 실행 시 `shasum mismatch` 또는 `FAILED` 오류가 발생함 {#q3-sha512sum---check-reports-shasum-mismatch-or-failed}

소스 패키지가 손상되었거나 체크섬 파일과 일치하지 않습니다. 소스 패키지를 다시 다운로드하고, 파일 크기를 비교하여 다운로드가 완료되었는지 확인한 다음 검사를 다시 실행하세요.

### Q4: skywalking-eyes 실행 시 `LICENSE check failed` 또는 `invalid > 0`이 표시됨 {#q4-skywalking-eyes-reports-license-check-failed-or-invalid--0}

소스 코드의 일부 파일에 라이선스 헤더가 없습니다. 일반적인 원인은 다음과 같습니다.

- 새로 추가한 코드 파일에 Apache License 헤더가 없습니다.
- 서드파티 파일이 `paths-ignore` 항목에 선언되어 있지 않습니다(설정 파일: `.licenserc.yaml`).

릴리스 관리자는 문제를 수정하고 새 RC를 만들어야 합니다.

### Q5: 컴파일이 실패하면 -1 표를 던져야 하나요? {#q5-should-i-vote--1-if-compilation-fails}

컴파일 실패의 원인이 릴리스 패키지 자체에 있다면(예: 파일 누락 또는 의존성 오류), -1 표를 던지고 구체적인 이유를 포함하세요. 실패의 원인이 로컬 환경 문제라면(예: 의존성 누락 또는 잘못된 JDK 버전), 환경 문제를 해결한 후에 결정하세요.
