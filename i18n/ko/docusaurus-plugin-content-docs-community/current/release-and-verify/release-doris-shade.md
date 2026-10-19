---
title: Apache Doris Shade 릴리스
language: ko
description: "Apache Doris Shade 릴리스 절차: Maven release prepare/perform, SVN 업로드 및 커뮤니티 투표."
keywords:
    - Apache Doris Shade release
    - Maven release prepare
    - Maven release perform
    - Apache vote
    - Maven Staging
    - SVN dist
    - Release Manager
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

# Apache Doris Shade 릴리스 {#release-apache-doris-shade}

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Version release / Apache vote process -->

Doris Shade 저장소는 기본 Doris 저장소와 별개로 관리되며, 주소는 다음과 같습니다:

- [https://github.com/apache/doris-Shade](https://github.com/apache/doris-Shade)

이 문서는 Doris Shade v1.0.0 릴리스를 예로 들어 Maven 릴리스 플러그인, SVN 준비, 커뮤니티 투표를 포함한 Shade 계열 컴포넌트의 전체 릴리스 절차를 설명합니다.

## 릴리스 준비 {#prepare-for-release}

먼저 [릴리스 준비](./release-prepare) 문서를 참고하여 서명, SVN, Maven 환경을 설정합니다.

## Maven에 릴리스 {#release-to-maven}

### 1. 브랜치 준비 {#1-prepare-the-branch}

저장소에서 `1.0.0-release` 브랜치를 생성하고 체크아웃합니다.

### 2. Maven Staging에 릴리스 {#2-release-to-maven-staging}

Maven 릴리스 플러그인을 실행하여 릴리스 태그를 생성합니다:

```shell
mvn release:clean
mvn release:prepare -DpushChanges=false
```

`-DpushChanges=false`는 실행 중에 새로 생성된 브랜치와 태그를 저장소에 자동으로 푸시하지 **않음**을 의미합니다.

실행 중에 `release:prepare`는 다음 세 가지 정보를 입력하도록 요청합니다:

| 입력 항목 | 권장 값 | 예시 |
| --- | --- | --- |
| Doris Shade 버전 | 기본값 사용, 형식은 `{shade.version}` | `1.0.0` |
| 릴리스 태그 이름 | 기본 태그 이름 사용 | `1.0.0` |
| 다음 버전 | 로컬 브랜치에 사용되며, 실질적인 의미는 없음 | `1.0.1-SNAPSHOT` |

실행 중에 GPG 암호 입력을 요청받을 수 있습니다. `gpg: no valid OpenPGP data found`가 표시되면 먼저 `export GPG_TTY=$(tty)`를 실행한 후 다시 시도합니다.

`mvn release:prepare`가 정상적으로 완료되면 태그와 브랜치가 로컬에 생성되고, 현재 브랜치에 새 커밋 두 개가 추가됩니다:

1. 첫 번째 커밋은 새로 생성된 태그에 해당합니다.
2. 두 번째 커밋은 다음 버전의 브랜치에 해당합니다.

`git log`로 이를 확인할 수 있습니다.

로컬 태그가 올바른지 확인한 후 태그를 저장소에 푸시합니다:

```bash
git push upstream --tags
```

여기서 `upstream`은 `apache/doris-shade` 저장소를 가리킵니다.

마지막으로 release:perform을 실행합니다:

```bash
mvn release:perform
```

정상적으로 실행되면 [https://repository.apache.org/#stagingRepositories](https://repository.apache.org/#stagingRepositories)에서 릴리스된 버전을 확인할 수 있습니다:

![](/images/staging-repositories.png)

:::caution 참고
아티팩트에 `.asc` 서명 파일이 포함되어 있는지 확인합니다.
:::

문제가 발생하면 다음 작업을 수행해야 합니다:

1. 로컬 태그를 삭제합니다.
2. 저장소의 태그를 삭제합니다.
3. 새로 생성된 로컬 커밋 두 개를 삭제합니다.
4. Staging 저장소를 삭제합니다.
5. 위 단계를 다시 수행합니다.

모든 항목이 올바른지 확인한 후 `close` 버튼을 클릭하여 Staging 릴리스를 완료합니다.

### 3. SVN 준비 {#3-prepare-svn}

Dev SVN 저장소를 체크아웃합니다:

```bash
svn co https://dist.apache.org/repos/dist/dev/doris/
```

태그의 소스 코드를 패키징하고 서명 파일과 SHA512 체크섬 파일을 생성합니다(다음 예에서는 `1.0.0`을 사용합니다):

```bash
git archive --format=tar 1.14_2.12-1.0.0 --prefix=apache-doris-shade-1.0.0-src/ | gzip > apache-doris-shade-1.0.0-src.tar.gz
gpg -u xxx@apache.org --armor --output apache-doris-shade-1.0.0-src.tar.gz.asc  --detach-sign apache-doris-shade-1.0.0-src.tar.gz
sha512sum apache-doris-shade-1.14_2.12-1.0.0-src.tar.gz > apache-doris-shade-1.0.0-src.tar.gz.sha512
```

macOS에서는 다음 명령을 사용합니다:

```bash
shasum -a 512 apache-doris-shade-1.0.0-src.tar.gz > apache-doris-shade-1.0.0-src.tar.gz.sha512
```

다음 세 파일이 생성됩니다:

| 파일 | 용도 |
| --- | --- |
| `apache-doris-shade-1.0.0-src.tar.gz` | 소스 패키지 |
| `apache-doris-shade-1.0.0-src.tar.gz.asc` | GPG 서명 파일 |
| `apache-doris-shade-1.0.0-src.tar.gz.sha512` | SHA512 체크섬 파일 |

세 파일을 SVN 디렉터리로 이동합니다:

```text
doris/doris-shade/1.0.0/
```

전체 SVN 디렉터리 구조의 예시는 다음과 같습니다:

```text
├── 1.2.3-rc01
│   ├── apache-doris-1.2.3-src.tar.gz
│   ├── apache-doris-1.2.3-src.tar.gz.asc
│   ├── apache-doris-1.2.3-src.tar.gz.sha512
...
├── KEYS
├── doris-shade
│   └── 1.0.0
│       ├── apache-doris-shade-1.0.0-src.tar.gz
│       ├── apache-doris-shade-1.0.0-src.tar.gz.asc
│       └── apache-doris-shade-1.0.0-src.tar.gz.sha512
```

여기서 `1.2.3-rc01`은 기본 Doris 릴리스의 디렉터리이며, `doris-shade/1.0.0`에는 이번 릴리스의 내용이 들어 있습니다.

> KEYS 파일 준비 방법은 [릴리스 준비](./release-prepare)의 관련 절을 참고하세요.

### 4. 투표 {#4-vote}

`dev@doris.apache.org` 메일링 리스트에서 투표를 시작합니다. 템플릿은 다음과 같습니다:

```text
Hi all,

This is a call for the vote to release Apache Doris-Shade 1.0.0

The git tag for the release:
https://github.com/apache/doris-shade/releases/tag/doris-shade-1.0.0

Release Notes are here:
https://github.com/apache/doris-shade/blob/doris-shade-1.0.0/CHANGE-LOG.txt

Thanks to everyone who has contributed to this release.

The release candidates:
https://dist.apache.org/repos/dist/dev/doris/doris-shade/

KEYS file is available here:
https://downloads.apache.org/doris/KEYS

To verify and build, you can refer to following link:
https://doris.apache.org/community/release-and-verify/release-verify

The vote will be open for at least 72 hours.

[ ] +1 Approve the release
[ ] +0 No opinion
[ ] -1 Do not release this package because ...
```

## 릴리스 완료 {#complete-the-release}

[릴리스 완료](./release-complete) 문서를 참고하여 전체 릴리스 절차를 마무리합니다.

## 부록: SNAPSHOT에 릴리스 {#appendix-release-to-snapshot}

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Pre-release preview -->

Snapshot은 Apache 정식 릴리스 버전이 아닙니다. 릴리스 전 미리보기 용도로만 사용합니다. Snapshot 버전은 PMC의 논의와 승인을 거친 후에만 릴리스할 수 있습니다.

doris-shade 디렉터리로 이동합니다:

```bash
mvn deploy
```

이후 다음 주소에서 Snapshot 버전을 확인할 수 있습니다:

```text
https://repository.apache.org/content/repositories/snapshots/org/apache/doris/doris-shade/
```

## 자주 묻는 질문 / 문제 해결 {#faq--troubleshooting}

**질문: `mvn release:prepare` 실행 시 `gpg: no valid OpenPGP data found`가 표시되는 이유는 무엇인가요?**

터미널에서 GPG 암호를 입력받지 못하는 상태입니다. `export GPG_TTY=$(tty)`를 실행한 후 다시 시도합니다.

**질문: `mvn release:perform`이 실패한 후 완전히 롤백하려면 어떻게 해야 하나요?**

다음 단계를 순서대로 수행합니다: 로컬 태그 삭제(`git tag -d <tag>`), 원격 태그 삭제(`git push upstream :refs/tags/<tag>`), 로컬 커밋 두 개 롤백(`git reset --hard HEAD~2`), Apache Staging에서 해당 저장소 삭제. 그런 다음 `mvn release:clean`과 `mvn release:prepare`를 다시 실행합니다.

**질문: Maven 릴리스 플러그인을 사용하는 방식과 수동으로 태그를 만든 뒤 `mvn deploy`를 실행하는 방식은 어떤 차이가 있나요?**

`release:prepare/perform`은 버전 변경, 태그 생성, 아티팩트 업로드를 자동으로 처리하므로 Shade처럼 간단한 pom을 사용하는 프로젝트에 적합합니다. 수동 방식은 여러 Spark 버전을 지원하는 Spark Connector처럼 여러 아티팩트를 다루는 경우에 더 유연합니다.
