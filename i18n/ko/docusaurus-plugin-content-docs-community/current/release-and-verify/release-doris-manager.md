---
title: Doris Manager 릴리스
language: ko
description: "Apache Doris Manager 릴리스 절차: 브랜치 관리, 태그 생성, 패키징 및 서명, SVN 업로드, 커뮤니티 투표, IPMC 투표."
keywords:
    - Apache Doris
    - Doris Manager
    - 릴리스 절차
    - 커뮤니티 투표
    - IPMC 투표
    - GPG 서명
    - SVN 업로드
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

# Doris Manager 릴리스 {#release-doris-manager}

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenario: Apache release process / Doris Manager release -->

Doris Manager 코드베이스는 기본 Doris 코드베이스와 별도로 [apache/doris-manager](https://github.com/apache/doris-manager)에서 관리합니다. 이 문서에서는 Doris Manager의 전체 릴리스 절차를 설명합니다.

## 릴리스 절차 개요 {#release-process-overview}

| 단계 | 절차 | 목적 |
|------|------|------|
| 준비 | 1. 릴리스 준비 | GPG 키, SVN 접근 권한 등 사전 준비 사항 완료 |
| 준비 | 2. 브랜치 준비 | 릴리스 브랜치 생성 및 기능 안정성 확보 |
| 준비 | 3. 이슈 정리 | 완료된 이슈 종료 및 미완료 이슈 연기 |
| 준비 | 4. 필요한 패치 병합 | 중요한 패치 검토 및 병합 |
| 검증 | 5. 브랜치 검증 | 안정성 테스트 및 빌드 검증 |
| 투표 | 6. 태그 생성, 패키징, 서명 및 업로드 | RC 패키지 생성 및 SVN 업로드 |
| 투표 | 7. dev@doris 투표 | 커뮤니티 투표 |
| 투표 | 8. IPMC 투표 | Incubator PMC 투표 |
| 마무리 | 9. 릴리스 완료 | 보관, 게시 및 공지 |

## 1. 릴리스 준비 {#1-prepare-for-release}

[릴리스 준비](./release-prepare) 문서를 참고하여 릴리스 전 준비 작업을 완료합니다.

## 2. 브랜치 준비 {#2-prepare-the-branch}

릴리스 전에 새 브랜치를 생성합니다:

```shell
git checkout -b branch-1.0.0
```

브랜치를 생성한 후에는 충분한 테스트를 수행하여 다음 사항을 확인합니다:

- 기능이 예상대로 동작합니다.
- 버그가 점차 줄어들고 있습니다.
- 중요한 버그가 모두 수정되었습니다.

테스트 중에는 커뮤니티의 피드백을 기다리면서 병합해야 할 패치가 있는지 판단합니다. 필요한 패치가 있으면 cherry-pick으로 릴리스 브랜치에 적용합니다.

## 3. 이슈 정리 {#3-clean-up-issues}

이번 릴리스에 포함된 모든 이슈를 검토합니다:

- 완료된 이슈는 종료합니다.
- 완료할 수 없는 이슈는 이후 릴리스로 연기합니다.

## 4. 필요한 패치 병합 {#4-merge-required-patches}

릴리스를 기다리는 동안 중요한 패치를 병합해야 할 수 있습니다. 커뮤니티에서 이번 릴리스에 수정 사항을 포함해야 하는 중요한 버그를 보고하면, Release Manager가 수정 사항을 검토하고 해당 패치를 릴리스 브랜치에 병합합니다.

## 5. 브랜치 검증 {#5-verify-the-branch}

### 5.1 안정성 테스트 {#51-stability-testing}

준비된 브랜치를 QA에 전달하여 안정성 테스트를 진행합니다. 테스트 중에 수정이 필요한 문제가 발견되면, 수정 PR이 준비되는 대로 릴리스 브랜치에 병합합니다.

브랜치 전체가 안정화된 후에만 릴리스를 진행합니다.

### 5.2 빌드 검증 {#52-build-verification}

빌드 문서를 참고하여 소스에서 빌드하고, 소스 코드가 정상적으로 컴파일되는지 확인합니다.

## 6. 커뮤니티 릴리스 투표 절차 {#6-community-release-vote-process}

### 6.1 태그 생성 {#61-create-the-tag}

브랜치가 안정화되면 해당 브랜치에 태그를 생성합니다. 예를 들면 다음과 같습니다:

```shell
git checkout branch-1.0.0
git tag -a 1.0.0-rc01 -m "doris manager 1.0.0 release candidate 01"
git push origin 1.0.0-rc01
```

예상 출력:

```text
Counting objects: 1, done.
Writing objects: 100% (1/1), 165 bytes | 0 bytes/s, done.
Total 1 (delta 0), reused 0 (delta 0)
To git@github.com:apache/doris-manager.git
 * [new tag]         1.0.0-rc01 -> 1.0.0-rc01
```

`git tag`를 실행하여 로컬 태그 목록을 확인합니다.

### 6.2 패키징, 서명 및 업로드 {#62-package-sign-and-upload}

다음 단계를 수행하려면 SecureCRT와 같은 터미널을 통해 해당 사용자 계정으로 직접 로그인해야 합니다. **`su - user` 또는 `ssh`로 접속을 전환하지 마세요**. 비밀번호 입력 창이 표시되지 않아 명령이 실패할 수 있습니다.

#### 6.2.1 패키징 및 서명 {#621-package-and-sign}

```shell
git archive --format=tar 1.0.0-rc01 --prefix=apache-doris-incubating-manager-src-1.0.0-rc01/ | gzip > apache-doris-incubating-manager-src-1.0.0-rc01.tar.gz

gpg -u xxx@apache.org --armor --output apache-doris-incubating-manager-src-1.0.0-rc01.tar.gz.asc --detach-sign apache-doris-incubating-manager-src-1.0.0-rc01.tar.gz

gpg --verify apache-doris-incubating-manager-src-1.0.0-rc01.tar.gz.asc apache-doris-incubating-manager-src-1.0.0-rc01.tar.gz

sha512sum apache-doris-incubating-manager-src-1.0.0-rc01.tar.gz > apache-doris-incubating-manager-src-1.0.0-rc01.tar.gz.sha512

sha512sum --check apache-doris-incubating-manager-src-1.0.0-rc01.tar.gz.sha512
```

#### 6.2.2 SVN에 업로드 {#622-upload-to-svn}

SVN 저장소를 체크아웃합니다:

```shell
svn co https://dist.apache.org/repos/dist/dev/doris/
```

앞에서 생성한 파일을 다음 SVN 경로에 배치합니다:

```text
./doris/
├── doris-manager
│   └── 1.0.0
│       ├── apache-doris-incubating-manager-src-1.0.0-rc01.tar.gz
│       ├── apache-doris-incubating-manager-src-1.0.0-rc01.tar.gz.asc
│       └── apache-doris-incubating-manager-src-1.0.0-rc01.tar.gz.sha512
```

파일을 업로드합니다:

```shell
svn add 1.0.0-rc01
svn commit -m "Add doris manager 1.0.0-rc01"
```

### 6.3 dev@doris.apache.org로 투표 요청 이메일 보내기 {#63-send-a-vote-email-to-devdorisapacheorg}

이메일 제목:

```text
[VOTE] Release Apache Doris Manager 1.0.0-incubating-rc01
```

이메일 본문 템플릿:

```text
Hi All,

This is a call for vote to release Doris Manager v1.0.0 for Apache Doris(Incubating).

- apache-doris-incubating-manager-src-1.0.0-rc01

The release node:



The release candidates:
https://dist.apache.org/repos/dist/dev/doris/doris-manager/1.0.0/

Keys to verify the Release Candidate:
https://downloads.apache.org/doris/KEYS

Look at here for how to verify this release candidate:
http://doris.apache.org/community/release-and-verify/release-verify.html

Vote thread at dev@doris: [1]

The vote will be open for at least 72 hours or until necessary number of votes are reached.

Please vote accordingly:

[ ] +1 approve
[ ] +0 no opinion
[ ] -1 disapprove with the reason

[1] vote thread in dev@doris


Brs,
xxxx
------------------
DISCLAIMER: 
Apache Doris (incubating) is an effort undergoing incubation at The
Apache Software Foundation (ASF), sponsored by the Apache Incubator PMC.

Incubation is required of all newly accepted
projects until a further review indicates that the
infrastructure, communications, and decision making process have
stabilized in a manner consistent with other successful ASF
projects.

While incubation status is not necessarily a reflection
of the completeness or stability of the code, it does indicate
that the project has yet to be fully endorsed by the ASF.
```

### 6.4 투표 통과 후 결과 이메일 보내기 {#64-after-the-vote-passes-send-a-result-email}

이메일 제목:

```text
[Result][VOTE] Release Apache Doris Manager 1.0.0-incubating-rc01
```

이메일 본문 템플릿:

```text
Thanks to everyone, and this vote is now closed.

It has passed with 4 +1 (binding) votes and no 0 or -1 votes.

Binding:
+1 jiafeng Zhang
+1 xxx
+1 EmmyMiao87
+1 Mingyu Chen

Best Regards,
xxx
```

## 7. IPMC 투표 {#7-ipmc-vote}

dev 메일링 리스트 투표가 통과되면 `general@incubator.apache.org` 메일링 리스트로 이메일을 보내 IPMC 투표를 시작합니다.

이메일 본문 템플릿:

```text
Hi all,

Please review and vote on Apache Doris Manager 1.0.0-incubating-rc01 release.

Doris manager is a platform for automatic installation, deployment and management of Doris groups

The Apache Doris community has voted on and approved this release:
https://lists.apache.org/thread.html/d70f7c8a8ae448bf6680a15914646005c6483564464cfa15f4ddc2fc@%3Cdev.doris.apache.org%3E

The vote result email thread:
https://lists.apache.org/thread.html/64d229f0ba15d66adc83306bc8d7b7ccd5910ecb7e842718ce6a61da@%3Cdev.doris.apache.org%3E

The release candidate has been tagged in GitHub as 1.0.0-rc01, available here:
https://github.com/apache/doris-manager/releases/tag/1.0.0-rc01

There is no CHANGE LOG file because this is the first release of Apache Doris.
Thanks to everyone who has contributed to this release, and there is a simple release notes can be found here:
https://github.com/apache/doris/issues/406

The artifacts (source, signature and checksum) corresponding to this release candidate can be found here:
https://dist.apache.org/repos/dist/dev/doris/doris-manager/1.0.0/

This has been signed with PGP key 33DBF2E0, corresponding to lide@apache.org.
KEYS file is available here:
https://downloads.apache.org/doris/KEYS
It is also listed here:
https://people.apache.org/keys/committer/lide.asc

The vote will be open for at least 72 hours.
[ ] +1 Approve the release
[ ] +0 No opinion
[ ] -1 Do not release this package because ...

To verify and build, you can refer to following instruction:

Firstly, you must be install and start docker service, and then you could build Doris as following steps:

$ wget https://dist.apache.org/repos/dist/dev/doris/doris-manager/1.0.0/apache-doris-incubating-manager-src-1.0.0-rc01.tar.gz

Step4: Build Doris
Now you can decompress and enter Doris source path and build Doris.
$ tar zxvf apache-doris-incubating-manager-src-1.0.0-rc01.tar.gz
$ cd apache-doris-incubating-manager-src-1.0.0-rc01
$ sh build.sh

Best Regards,
xxx

----
DISCLAIMER: 
Apache Doris (incubating) is an effort undergoing incubation at The
Apache Software Foundation (ASF), sponsored by the Apache Incubator PMC.

Incubation is required of all newly accepted
projects until a further review indicates that the
infrastructure, communications, and decision making process have
stabilized in a manner consistent with other successful ASF
projects.

While incubation status is not necessarily a reflection
of the completeness or stability of the code, it does indicate
that the project has yet to be fully endorsed by the ASF.
```

다음 주소에서 이메일 스레드 링크를 찾습니다:

```text
https://lists.apache.org/list.html?dev@doris.apache.org
```

### 7.1 general@incubator.apache.org로 결과 이메일 보내기 {#71-send-the-result-email-to-generalincubatorapacheorg}

이메일 제목:

```text
[RESULT][VOTE] Release Apache Doris Manager 1.0.0-incubating-rc01
```

이메일 본문 템플릿:

```text
Hi,

Thanks to everyone, and the vote for releasing Apache Doris Manager 1.0.0-incubating-rc01 is now closed.

It has passed with 4 +1 (binding) votes and no 0 or -1 votes.

Binding:
+1 Willem Jiang
+1 Justin Mclean
+1 ShaoFeng Shi
+1 Makoto Yui

The vote thread:
https://lists.apache.org/thread.html/da05fdd8d84e35de527f27200b5690d7811a1e97d419d1ea66562130@%3Cgeneral.incubator.apache.org%3E

Best Regards,
xxx
```

## 8. 릴리스 완료 {#8-complete-the-release}

[릴리스 완료](./release-complete) 문서를 참고하여 모든 릴리스 단계를 마무리합니다.

## 자주 묻는 질문 {#faq}

### Q1: `ssh` 또는 `su - user`를 통해 패키징 및 서명 단계를 진행할 수 없는 이유는 무엇인가요? {#q1-why-can-the-packaging-and-signing-step-not-be-done-through-ssh-or-su---user}

`ssh` 또는 `su -`를 통해 접속한 터미널에서는 GPG 비밀번호 입력 창이 제대로 표시되지 않아 서명 명령이 실패합니다. SecureCRT와 같은 터미널을 통해 대상 사용자 계정으로 직접 로그인하세요.

### Q2: `gpg --verify` 실행 시 `gpg verify failed` 또는 `BAD signature`가 표시됨 {#q2-gpg---verify-reports-gpg-verify-failed-or-bad-signature}

가능한 원인:

- 공개 키를 가져오지 않았습니다. 먼저 `gpg --import KEYS`를 실행하세요.
- 서명 파일과 소스 패키지가 일치하지 않습니다. `.asc`와 `.tar.gz`가 동일한 빌드에서 생성되었는지 확인하세요.

### Q3: `sha512sum --check` 실행 시 `shasum mismatch`가 표시됨 {#q3-sha512sum---check-reports-shasum-mismatch}

전송 중에 소스 패키지가 손상되었거나 덮어쓰였을 수 있습니다. 소스 패키지를 다시 다운로드하거나 `.sha512` 체크섬 파일을 다시 생성한 후 검증을 다시 수행하세요.
