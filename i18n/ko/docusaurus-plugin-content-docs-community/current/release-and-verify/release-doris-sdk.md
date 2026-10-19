---
title: Doris SDK 릴리스
language: ko
description: "Apache Doris SDK 릴리스 절차: Maven Release prepare/perform, SVN 업로드 및 커뮤니티 투표."
keywords:
    - Apache Doris
    - Doris SDK
    - 릴리스 절차
    - Maven Release
    - SVN 업로드
    - 커뮤니티 투표
    - GPG 서명
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

# Doris SDK 릴리스 {#release-doris-sdk}

<!-- Knowledge type: Operating procedure -->
<!-- Applies to: Apache release process / SDK release -->

Doris SDK 코드 저장소는 Doris 주 저장소와 분리되어 있으며, [apache/doris-sdk](https://github.com/apache/doris-sdk)에 있습니다. 이 문서는 `Doris SDK v1.0.0` 릴리스를 예로 들어 Maven Staging 게시부터 커뮤니티 투표까지 전체 절차를 설명합니다.

## 릴리스 절차 개요 {#release-process-overview}

| 단계 | 목적 | 주요 산출물 |
|------|---------|---------------|
| 1. 릴리스 준비 | 릴리스 사전 준비 완료(KEYS, 계정, 환경 등) | GPG 키, Apache 계정 |
| 2. 브랜치 준비 | 저장소에 릴리스 브랜치 생성 | `1.0.0-release` 브랜치 |
| 3. Maven Staging에 게시 | 릴리스 태그 생성 및 Apache Maven Staging에 게시 | 태그, Staging Repository |
| 4. SVN 준비 | 소스 패키지, 서명 및 체크섬 파일을 SVN에 업로드 | tar.gz / .asc / .sha512 |
| 5. 투표 시작 | dev@doris 메일링 리스트에서 투표 시작 | 투표 이메일 |
| 6. 릴리스 완료 | 투표 통과 후 보관 및 공지 | 릴리스 패키지 |

## 1. 릴리스 준비 {#1-prepare-for-release}

[릴리스 준비](./release-prepare) 문서를 참고하여 릴리스에 필요한 사전 준비를 완료합니다.

## 2. Maven에 게시 {#2-publish-to-maven}

### 2.1 브랜치 준비 {#21-prepare-the-branch}

저장소에 `1.0.0-release` 브랜치를 생성하고 해당 브랜치로 전환합니다.

```shell
git checkout -b 1.0.0-release
```

### 2.2 Maven Staging에 게시 {#22-publish-to-maven-staging}

다음 명령을 실행하여 릴리스 태그를 생성합니다.

```shell
mvn release:clean
mvn release:prepare -DpushChanges=false
```

여기서 `-DpushChanges=false`는 실행 중에 새로 생성된 브랜치와 태그를 저장소에 푸시하지 않는다는 의미입니다.

`mvn release:prepare`를 실행한 후에는 다음 세 가지 정보를 순서대로 입력해야 합니다.

| 입력 항목 | 설명 | 예시 |
|-------|-------------|---------|
| Doris SDK 버전 | 릴리스할 버전으로, `{sdk.version}` 형식으로 입력 | `1.0.0` |
| 릴리스 태그 이름 | 로컬에서 생성할 태그의 이름 | `1.0.0` |
| 다음 버전 | 로컬 브랜치를 생성하는 데만 사용되며 실제 의미는 없음 | `1.0.1-SNAPSHOT` |

**자주 발생하는 문제:**

- `mvn release:prepare` 실행 시 GPG 암호 문구를 입력하라는 메시지가 표시될 수 있습니다.
- `gpg: no valid OpenPGP data found` 오류가 발생하면 다음 명령을 실행하고 다시 시도합니다.

    ```shell
    export GPG_TTY=$(tty)
    ```

`mvn release:prepare`가 성공적으로 실행되면 로컬에 태그와 브랜치가 생성되고 현재 브랜치에 커밋 두 개가 추가됩니다.

1. 첫 번째 커밋은 새로 생성된 태그에 해당합니다.
2. 두 번째 커밋은 다음 버전의 브랜치에 해당합니다.

`git log`로 이를 확인할 수 있습니다.

로컬 태그가 올바른지 확인한 후 저장소에 태그를 푸시합니다.

```shell
git push upstream --tags
```

여기서 `upstream`은 `apache/doris-sdk` 저장소를 가리킵니다.

마지막으로 perform 명령을 실행하여 빌드 아티팩트를 Maven Staging에 게시합니다.

```shell
mvn release:perform
```

명령이 성공적으로 실행되면 [Apache Maven Staging Repositories](https://repository.apache.org/#stagingRepositories)에서 방금 게시한 버전을 확인할 수 있습니다.

![](/images/staging-repositories.png)

**참고: 게시한 아티팩트에는 `.asc` 서명 파일이 반드시 포함되어야 합니다.**

문제가 발생하면 다음 순서로 롤백합니다.

1. 로컬 태그를 삭제합니다.
2. 저장소의 태그를 삭제합니다.
3. 로컬에 새로 생성된 커밋 두 개를 삭제합니다.
4. Staging Repository 페이지에서 staging을 `drop`합니다.
5. 위 단계를 다시 실행합니다.

검증을 마친 후 페이지의 `close` 버튼을 클릭하여 Staging 릴리스를 완료합니다.

### 2.3 SVN 준비 {#23-prepare-svn}

#### 2.3.1 SVN 저장소 체크아웃 {#231-check-out-the-svn-repository}

```shell
svn co https://dist.apache.org/repos/dist/dev/doris/
```

#### 2.3.2 태그의 소스 패키징 및 서명 생성 {#232-package-the-tag-source-and-generate-the-signature}

`1.0.0`을 예로 설명하며, 다른 태그도 비슷한 방식으로 처리합니다.

```shell
git archive --format=tar 1.14_2.12-1.0.0 --prefix=apache-doris-sdk-1.0.0-src/ | gzip > apache-doris-sdk-1.0.0-src.tar.gz
gpg -u xxx@apache.org --armor --output apache-doris-sdk-1.0.0-src.tar.gz.asc  --detach-sign apache-doris-sdk-1.0.0-src.tar.gz
sha512sum apache-doris-sdk-1.14_2.12-1.0.0-src.tar.gz > apache-doris-sdk-1.0.0-src.tar.gz.sha512
```

macOS에서는 `shasum`을 `sha512sum` 대신 사용합니다.

```shell
shasum -a 512 apache-doris-sdk-1.0.0-src.tar.gz > apache-doris-sdk-1.0.0-src.tar.gz.sha512
```

다음과 같이 파일 세 개가 생성됩니다.

```text
apache-doris-sdk-1.0.0-src.tar.gz
apache-doris-sdk-1.0.0-src.tar.gz.asc
apache-doris-sdk-1.0.0-src.tar.gz.sha512
```

#### 2.3.3 SVN에 업로드 {#233-upload-to-svn}

이 파일 세 개를 SVN 디렉터리 `doris/doris-sdk/1.0.0/`로 이동합니다. 최종 SVN 디렉터리 구조는 다음과 같습니다.

```text
├── 1.2.3-rc01
│   ├── apache-doris-1.2.3-src.tar.gz
│   ├── apache-doris-1.2.3-src.tar.gz.asc
│   ├── apache-doris-1.2.3-src.tar.gz.sha512
...
├── KEYS
├── doris-sdk
│   └── 1.0.0
│       ├── apache-doris-sdk-1.0.0-src.tar.gz
│       ├── apache-doris-sdk-1.0.0-src.tar.gz.asc
│       └── apache-doris-sdk-1.0.0-src.tar.gz.sha512
```

여기서 `1.2.3-rc01`은 Doris 주 저장소의 디렉터리이며, `doris-sdk/1.0.0`에는 이번 릴리스의 내용이 들어 있습니다.

KEYS 파일을 준비하는 방법은 [릴리스 준비](./release-prepare) 문서를 참고하세요.

### 2.4 투표 {#24-vote}

`dev@doris.apache.org` 메일링 리스트에서 투표를 시작합니다. 다음 이메일 템플릿을 사용합니다.

```text
Hi All,

This is a call for the vote to release Apache Doris-SDK 1.0.0

The git tag for the release:
https://github.com/apache/doris-sdk/releases/tag/1.0.0

Release Notes are here:
https://github.com/apache/doris-sdk/blob/1.0.0/CHANGE-LOG.txt

Thanks to everyone who has contributed to this release.

The release candidates:
https://dist.apache.org/repos/dist/dev/doris/doris-sdk/1.0.0/

KEYS file is available here:
https://downloads.apache.org/doris/KEYS

To verify and build, you can refer to following link:
https://doris.apache.org/community/release-and-verify/release-verify

The vote will be open for at least 72 hours.

[ ] +1 Approve the release
[ ] +0 No opinion
[ ] -1 Do not release this package because …
```

## 3. 릴리스 완료 {#3-complete-the-release}

투표가 통과되면 [릴리스 완료](./release-complete) 문서를 참고하여 남은 릴리스 단계를 모두 완료합니다.

## 부록: SNAPSHOT 게시 {#appendix-publishing-to-snapshot}

Snapshot은 Apache Release 버전이 아니며, 릴리스 전 미리 보기 용도로만 사용됩니다. PMC의 논의와 승인을 거친 후 Snapshot 버전을 게시할 수 있습니다.

Doris SDK 디렉터리로 이동하여 다음 명령을 실행합니다.

```shell
mvn deploy
```

이후 다음 위치에서 Snapshot 버전을 확인할 수 있습니다.

```text
https://repository.apache.org/content/repositories/snapshots/org/apache/doris/doris-sdk/
```

## 자주 묻는 질문 {#faq}

### Q1: `mvn release:prepare` 실행 시 `gpg: no valid OpenPGP data found` 오류 발생 {#q1-mvn-releaseprepare-fails-with-gpg-no-valid-openpgp-data-found}

GPG가 현재 터미널에 연결되어 있지 않습니다. `export GPG_TTY=$(tty)`를 실행하고 다시 시도합니다.

### Q2: Staging 단계의 `close` 작업이 `No public key` 오류로 실패함 {#q2-the-close-step-in-the-staging-phase-fails-with-no-public-key}

GPG 공개 키가 키 서버에 업로드되지 않았습니다. 다음 명령을 실행하여 공개 키를 공개 키 서버와 동기화합니다.

```shell
gpg --keyserver hkp://keyserver.ubuntu.com --send-keys <KEY_ID>
```

`<KEY_ID>`는 `gpg -k`로 확인할 수 있습니다.

### Q3: 실수했을 때 어떻게 롤백하나요? {#q3-i-made-a-mistake-how-do-i-roll-back}

다음 단계를 순서대로 수행합니다.

1. 로컬 태그를 삭제합니다: `git tag -d <tag>`.
2. 원격 태그를 삭제합니다: `git push upstream --delete <tag>`.
3. 로컬 릴리스 커밋 두 개를 되돌립니다.
4. Staging Repositories 페이지에서 staging을 `drop`합니다.
5. `mvn release:prepare`와 `mvn release:perform`을 다시 실행합니다.
