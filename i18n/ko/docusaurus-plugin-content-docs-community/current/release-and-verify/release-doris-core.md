---
title: Apache Doris Core 릴리스
language: ko
description: "Apache Doris Core의 전체 릴리스 프로세스: 브랜치 준비, 태그 생성, 서명, SVN 업로드, Dev 및 IPMC 투표."
keywords:
    - Apache Doris Core 릴리스
    - Doris 릴리스 프로세스
    - Apache 투표
    - SVN dist
    - GPG 서명
    - 릴리스 후보 rc01
    - 릴리스 관리자
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

# Apache Doris Core 릴리스 {#release-apache-doris-core}

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Version release / Apache voting process -->

Doris Core는 [https://github.com/apache/doris](https://github.com/apache/doris)의 코드를 가리킵니다. 이 문서는 릴리스 관리자가 브랜치 준비와 검증부터 패키징, 서명, 커뮤니티 투표까지 수행하는 전체 릴리스 프로세스를 설명합니다.

## 릴리스 준비 {#prepare-for-release}

먼저 [릴리스 준비](./release-prepare) 문서를 참고하여 서명, SVN, Maven 및 기타 환경 설정을 완료합니다.

### 1. 브랜치 준비 {#1-prepare-the-branch}

릴리스 전에 새 릴리스 브랜치를 생성합니다. 예를 들면 다음과 같습니다.

```bash
git checkout -b branch-0.9
```

브랜치를 생성한 후에는 철저한 테스트를 통해 기능을 정상적으로 사용할 수 있는지 확인하고, 버그를 줄이고 주요 버그를 수정합니다. 이 과정에서 커뮤니티 동향을 살피며 릴리스 브랜치에 체리픽해야 할 패치가 있는지 확인합니다.

### 2. 이슈 정리 {#2-clean-up-issues}

이번 릴리스에 속한 모든 이슈를 검토합니다.

- 완료된 이슈는 종료합니다.
- 이번 릴리스에서 완료할 수 없는 이슈는 이후 버전으로 미룹니다.

### 3. 필요한 패치 병합 {#3-merge-necessary-patches}

릴리스를 준비하는 동안 중요한 패치가 병합될 수 있습니다. 커뮤니티에서 중요한 버그를 보고하여 관련 패치를 반영해야 하는 경우, 릴리스 관리자가 이를 평가하고 해당 패치를 릴리스 브랜치에 병합합니다.

## 브랜치 검증 {#verify-the-branch}

### 1. 안정성 테스트 {#1-stability-testing}

태그가 지정된 브랜치를 QA 팀에 전달하여 안정성 테스트를 진행합니다. 테스트 중 수정이 필요한 문제가 발견되면, 수정 PR이 완료된 후 릴리스 브랜치에 병합합니다.

브랜치 전체가 안정화된 후에만 정식 릴리스를 준비할 수 있습니다.

### 2. 컴파일 검증 {#2-compilation-verification}

컴파일 문서를 참고하여 컴파일을 수행하고 소스 코드가 올바르게 컴파일되는지 확인합니다.

### 3. 릴리스 노트 준비 {#3-prepare-release-notes}

이번 릴리스의 주요 기능, 버그 수정, 호환성 변경 사항을 정리하여 릴리스 노트를 작성합니다. 일반적으로 GitHub 이슈로 게시합니다.

## 커뮤니티 투표 절차 {#community-voting-process}

### 1. 릴리스 태그 생성 {#1-tag-the-release}

브랜치가 충분히 안정화되면 해당 브랜치에 태그를 생성할 수 있습니다.

태그를 생성하기 전에 `build_version` 변수를 `gensrc/script/gen_build_version.sh`에서 수정합니다. 예를 들어 `build_version="0.10.0-release"`로 설정할 수 있습니다.

```bash
$ git checkout branch-0.9
$ git tag -a 0.9.0-rc01 -m "0.9.0 release candidate 01"
$ git push origin 0.9.0-rc01
Counting objects: 1, done.
Writing objects: 100% (1/1), 165 bytes | 0 bytes/s, done.
Total 1 (delta 0), reused 0 (delta 0)
To git@github.com:apache/doris.git
 * [new tag]         0.9.0-rc01 -> 0.9.0-rc01

$ git tag
```

### 2. 패키징, 서명 및 업로드 {#2-package-sign-and-upload}

:::caution 참고
다음 단계에서는 SecureCRT와 같은 터미널을 통해 사용자 계정에 직접 로그인해야 합니다. `su - user` 또는 `ssh`를 통해 전환하거나 접속하면 비밀번호 입력 창이 나타나지 않고 오류가 발생합니다.
:::

소스 코드를 패키징하고 GPG 서명과 SHA512 체크섬 파일을 생성합니다.

```bash
$ git checkout 0.9.0-rc01

$ git archive --format=tar 0.9.0-rc01 --prefix=apache-doris-0.9.0-incubating-src/ | gzip > apache-doris-0.9.0-incubating-src.tar.gz

$ gpg -u xxx@apache.org --armor --output apache-doris-0.9.0-incubating-src.tar.gz.asc --detach-sign apache-doris-0.9.0-incubating-src.tar.gz

$ gpg --verify apache-doris-0.9.0-incubating-src.tar.gz.asc apache-doris-0.9.0-incubating-src.tar.gz

$ sha512sum apache-doris-0.9.0-incubating-src.tar.gz > apache-doris-0.9.0-incubating-src.tar.gz.sha512

$ sha512sum --check apache-doris-0.9.0-incubating-src.tar.gz.sha512
```

| 파일 | 용도 |
| --- | --- |
| `*-src.tar.gz` | 소스 패키지 |
| `*-src.tar.gz.asc` | GPG 서명 파일 |
| `*-src.tar.gz.sha512` | SHA512 체크섬 파일 |

Dev SVN 저장소를 다운로드합니다.

```bash
svn co https://dist.apache.org/repos/dist/dev/doris/
```

세 파일을 다음 SVN 디렉터리 구조에 맞게 배치합니다.

```text
./doris/
|-- 0.9.0-rc01
|   |-- apache-doris-0.9.0-incubating-src.tar.gz
|   |-- apache-doris-0.9.0-incubating-src.tar.gz.asc
|   `-- apache-doris-0.9.0-incubating-src.tar.gz.sha512
`-- KEYS
```

SVN에 커밋합니다.

```bash
svn add 0.9.0-rc01
svn commit -m "Add 0.9.0-rc1"
```

### 3. Dev 메일링 리스트 투표 시작 {#3-start-the-dev-mailing-list-vote}

`dev@doris.apache.org`에서 다음 제목으로 투표를 시작합니다.

> [VOTE] Apache Doris 0.9.0-incubating-rc01 릴리스

본문 템플릿:

```text
Hi all,

Please review and vote on Apache Doris 0.9.0-incubating-rc01 release.

The release candidate has been tagged in GitHub as 0.9.0-rc01, available
here:
https://github.com/apache/incubator-doris/releases/tag/0.9.0-rc01

Release Notes are here:
https://github.com/apache/incubator-doris/issues/1891

Thanks to everyone who has contributed to this release.

The artifacts (source, signature and checksum) corresponding to this release
candidate can be found here:
https://dist.apache.org/repos/dist/dev/incubator/doris/0.9/0.9.0-rc1/

This has been signed with PGP key 33DBF2E0, corresponding to
lide@apache.org.
KEYS file is available here:
https://downloads.apache.org/incubator/doris/KEYS
It is also listed here:
https://people.apache.org/keys/committer/lide.asc

To verify and build, you can refer to following link:
http://doris.incubator.apache.org/community/release-and-verify/release-verify.html

The vote will be open for at least 72 hours.
[ ] +1 Approve the release
[ ] +0 No opinion
[ ] -1 Do not release this package because ...

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

### 4. Dev 투표 결과 이메일 발송 {#4-send-the-dev-vote-result-email}

투표가 통과되면 다음 제목으로 결과 이메일을 발송합니다.

> [Result][VOTE] Apache Doris 0.9.0-incubating-rc01 릴리스

본문 템플릿:

```text
Thanks to everyone, and this vote is now closed.

It has passed with 4 +1 (binding) votes and no 0 or -1 votes.

Binding:
+1 Zhao Chun
+1 xxx
+1 Li Chaoyong
+1 Mingyu Chen

Best Regards,
xxx
```

### 5. IPMC 투표 시작 {#5-start-the-ipmc-vote}

:::tip 팁
인큐베이터 프로젝트가 아니라면 이 섹션과 다음 섹션을 건너뜁니다.
:::

`general@incubator.apache.org`에서 다음 제목으로 IPMC 투표를 시작합니다.

> [VOTE] Apache Doris 0.9.0-incubating-rc01 릴리스

본문 템플릿:

```text
Hi all,

Please review and vote on Apache Doris 0.9.0-incubating-rc01 release.

Apache Doris is an MPP-based interactive SQL data warehousing for reporting and analysis.

The Apache Doris community has voted on and approved this release:
https://lists.apache.org/thread.html/d70f7c8a8ae448bf6680a15914646005c6483564464cfa15f4ddc2fc@%3Cdev.doris.apache.org%3E

The vote result email thread:
https://lists.apache.org/thread.html/64d229f0ba15d66adc83306bc8d7b7ccd5910ecb7e842718ce6a61da@%3Cdev.doris.apache.org%3E

The release candidate has been tagged in GitHub as 0.9.0-rc01, available here:
https://github.com/apache/doris/releases/tag/0.9.0-rc01

There is no CHANGE LOG file because this is the first release of Apache Doris.
Thanks to everyone who has contributed to this release, and there is a simple release notes can be found here:
https://github.com/apache/doris/issues/406

The artifacts (source, signature and checksum) corresponding to this release candidate can be found here:
https://dist.apache.org/repos/dist/dev/incubator/doris/0.9/0.9.0-rc01/

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

Step1: Pull the docker image with Doris building environment
$ docker pull apache/doris:build-env-1.3.1
You can check it by listing images, its size is about 3.28GB.

Step2: Run the Docker image
You can run image directly:
$ docker run -it apache/doris:build-env-1.3.1

Step3: Download Doris source
Now you should in docker environment, and you can download Doris source package.
(If you have downloaded source and it is not in image, you can map its path to image in Step2.)
$ wget https://dist.apache.org/repos/dist/dev/doris/0.9/0.9.0-rc01/apache-doris-0.9.0.rc01-incubating-src.tar.gz

Step4: Build Doris
Now you can decompress and enter Doris source path and build Doris.
$ tar zxvf apache-doris-0.9.0.rc01-incubating-src.tar.gz
$ cd apache-doris-0.9.0.rc01-incubating-src
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

이메일 스레드 링크는 다음 주소에서 확인할 수 있습니다.

```text
https://lists.apache.org/list.html?dev@doris.apache.org
```

### 6. IPMC 투표 결과 이메일 발송 {#6-send-the-ipmc-vote-result-email}

:::tip 팁
인큐베이터 프로젝트가 아니라면 이 섹션을 건너뜁니다.
:::

결과 이메일을 `general@incubator.apache.org`에 다음 제목으로 발송합니다.

> [RESULT][VOTE] Apache Doris 0.9.0-incubating-rc01 릴리스

본문 템플릿:

```text
Hi,

Thanks to everyone, and the vote for releasing Apache Doris 0.9.0-incubating-rc01 is now closed.

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

## 릴리스 완료 {#complete-the-release}

[릴리스 완료](./release-complete) 문서를 참고하여 모든 릴리스 단계를 마무리합니다.

## FAQ / 문제 해결 {#faq--troubleshooting}

**질문: `gpg --verify` 실행 시 `gpg: Can't check signature: No public key`가 표시되면 어떻게 하나요?**

해당 공개 키가 로컬에 없습니다. `gpg --keyserver https://keyserver.ubuntu.com/ --recv-keys <KEY_ID>`를 실행하여 공개 키를 가져온 후 다시 시도합니다.

**질문: `svn commit` 실행 시 `Authentication failed`가 표시되면 어떻게 하나요?**

환경 변수 `$ASF_USERNAME`과 `$ASF_PASSWORD`가 올바르게 설정되어 있는지 확인합니다. 비밀번호는 Apache LDAP 비밀번호입니다.

**질문: 투표를 시작한 지 72시간이 지나지 않아도 조기에 종료할 수 있나요?**

아니요. Apache 정책에 따라 릴리스 투표는 최소 72시간 동안 진행해야 하므로, 해당 시간이 지날 때까지 기다려야 합니다.
