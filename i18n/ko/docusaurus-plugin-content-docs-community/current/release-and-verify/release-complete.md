---
title: 릴리스 마무리
language: ko
description: "Apache Doris 릴리스 마무리: 릴리스 SVN, 다운로드 링크, 릴리스 노트 및 이전 버전 정리."
keywords:
    - Apache Doris
    - 릴리스 마무리
    - 릴리스 SVN
    - 다운로드 링크
    - 릴리스 노트
    - Maven 릴리스
    - 공지 이메일
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

# 릴리스 마무리 {#complete-the-release}

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: Apache release process / Release wrap-up -->

이 문서에서는 `dev@doris` 메일링 리스트의 릴리스 투표가 종료되고 통과된 후 수행해야 할 마무리 절차를 설명합니다.

## 릴리스 마무리 체크리스트 {#release-completion-checklist}

| 단계 | 작업 | 담당자 |
|------|--------|--------------|
| 1. 릴리스 디렉터리에 패키지 업로드 | 소스 패키지, 서명 파일 및 체크섬 파일을 `dev`에서 `release`로 이동 | PMC 멤버 |
| 2. Maven Staging 저장소 게시 | Apache Nexus에서 `Release` 클릭 | 릴리스 관리자 |
| 3. 릴리스 노트 준비 | GitHub Release 및 공식 웹사이트의 다운로드 페이지 업데이트 | 릴리스 관리자 |
| 4. SVN의 이전 버전 정리 | 최신 버전만 유지하고 이전 버전 링크를 아카이브 URL로 변경 | 릴리스 관리자 |
| 5. 공지 이메일 발송 | `dev@doris`에 새 릴리스 공지 | 릴리스 관리자 |

## 1. 릴리스 디렉터리에 패키지 업로드 {#1-upload-the-package-to-release}

정식 릴리스 투표가 통과되면 먼저 `[Result]` 이메일을 보낸 다음 릴리스 패키지를 준비합니다. 이전에 `dev` 아래에 게시한 해당 폴더에서 소스 패키지, 서명 파일 및 해시 파일을 새 디렉터리(예: `1.1.0`)로 복사합니다. 다음 사항에 유의하세요.

- 파일 이름에는 **`rcxx` 접미사를 포함하면 안 됩니다**(파일 이름은 변경해도 되지만 서명은 다시 계산하지 마세요).
- 해시는 다시 계산해도 결과가 동일합니다.

> 이 단계는 PMC 멤버만 수행할 수 있습니다.

원본 SVN 경로:

```text
https://dist.apache.org/repos/dist/dev/doris/
```

대상 SVN 경로:

```text
https://dist.apache.org/repos/dist/release/doris/
```

명령어 예시:

```shell
svn mv -m "move doris 1.1.0-rc05 to release" \
    https://dist.apache.org/repos/dist/dev/doris/1.1 \
    https://dist.apache.org/repos/dist/release/doris/1.1
```

최초 릴리스인 경우 KEYS 파일도 복사하여 SVN 릴리스 디렉터리에 추가해야 합니다. 추가가 완료되면 다음 위치에서 게시된 파일을 확인할 수 있습니다.

```text
https://dist.apache.org/repos/dist/release/doris/1.xx/
```

잠시 기다리면 Apache 공식 사이트에서도 확인할 수 있습니다.

```text
http://www.apache.org/dist/doris/1.xx/
```

## 2. Doris 웹사이트 및 GitHub에 링크 게시 {#2-publish-links-on-the-doris-website-and-github}

이 절에서는 Doris Core를 예로 설명합니다. 다른 컴포넌트의 경우 해당 이름을 알맞게 바꾸세요.

### 2.1 다운로드 링크 생성 {#21-create-download-links}

| 링크 유형 | URL |
|-----------|-----|
| 다운로드 링크 | `http://www.apache.org/dyn/closer.cgi?filename=doris/1.xx/apache-doris-1.xx-src.tar.gz&action=download` |
| wget 다운로드 | `https://www.apache.org/dyn/mirrors/mirrors.cgi?action=download&filename=doris/1.xx/apache-doris-1.xx-src.tar.gz` |
| 원본 위치 | `https://www.apache.org/dist/doris/1.xx/` |
| Closer 진입점 | `http://www.apache.org/dyn/closer.cgi/doris/1.xx/apache-doris-1.xx-src.tar.gz` |
| 소스 패키지 | `http://www.apache.org/dyn/closer.cgi/doris/1.xx/apache-doris-1.xx-src.tar.gz` |
| ASC 서명 | `http://archive.apache.org/dist/doris/1.xx/apache-doris-1.xx-src.tar.gz.asc` |
| sha512 체크섬 | `http://archive.apache.org/dist/doris/1.xx/apache-doris-1.xx-src.tar.gz.sha512` |
| KEYS | `http://archive.apache.org/dist/doris/KEYS` |

wget 명령어 예시:

```shell
wget --trust-server-names "https://www.apache.org/dyn/mirrors/mirrors.cgi?action=download&filename=doris/1.xx/apache-doris-1.xx-src.tar.gz"
```

자세한 규칙은 [Apache 다운로드 페이지 지침](http://www.apache.org/dev/release-download-pages#closer)을 참조하세요.

### 2.2 Maven {#22-maven}

[Apache Maven Staging 저장소](https://repository.apache.org/#stagingRepositories)에서 해당 Staging 저장소를 찾습니다.

1. 아직 닫지 않았다면 먼저 `close`를 클릭합니다.
2. `Release`를 클릭하여 정식으로 릴리스합니다.

> `close` 단계에서 `No public key: Key with id: (xxx) was not able to be located on` 오류가 발생하면 다음 명령어를 실행하여 공개 키를 공개 키 서버에 동기화한 후 다시 닫습니다.
>
> ```shell
> gpg --keyserver hkp://keyserver.ubuntu.com --send-keys xxx
> ```
>
> `xxx` 값은 `gpg -k`로 확인할 수 있습니다.

### 2.3 릴리스 노트 준비 {#23-prepare-the-release-notes}

다음 두 곳을 업데이트해야 합니다.

#### 2.3.1 GitHub Release 페이지 {#231-github-release-page}

```text
https://github.com/apache/doris/releases/tag/0.9.0-rc01
```

#### 2.3.2 Doris 웹사이트 다운로드 페이지 {#232-doris-website-download-page}

다운로드 페이지는 다음 경로에 있는 Markdown 파일입니다.

```text
docs/zh-CN/downloads/downloads.md
docs/en/downloads/downloads.md
```

다음 두 가지를 변경해야 합니다.

1. 이전 버전의 다운로드 URL을 Apache 아카이브 URL로 변경합니다(다음 절 참조).
2. 새 버전의 다운로드 정보를 추가합니다.

### 2.4 SVN의 이전 버전 정리 {#24-clean-up-old-versions-in-svn}

#### 2.4.1 SVN에서 이전 버전 삭제 {#241-delete-old-versions-from-svn}

SVN에는 최신 버전의 패키지만 유지하면 됩니다. 새 버전을 릴리스한 후에는 다음 두 경로에 최신 버전의 패키지만 남도록 이전 버전을 정리합니다.

```text
https://dist.apache.org/repos/dist/release/doris/
https://dist.apache.org/repos/dist/dev/doris/
```

#### 2.4.2 아카이브 URL로 변경 {#242-replace-with-the-archive-url}

Doris 웹사이트 다운로드 페이지에 있는 이전 버전의 다운로드 URL을 아카이브 페이지 URL로 변경합니다.

| 유형 | URL |
|------|-----|
| 다운로드 페이지 | `http://doris.apache.org/downloads.html` |
| 아카이브 페이지 | `http://archive.apache.org/dist/doris` |

Apache는 이전에 릴리스된 버전을 아카이브하는 동기화 메커니즘을 제공합니다. 절차는 [아카이브 방법](https://www.apache.org/legal/release-policy.html#how-to-archive)을 참조하세요. 이전 패키지를 SVN에서 삭제한 후에도 아카이브 페이지에서는 계속 다운로드할 수 있습니다.

## 3. 공지 이메일 {#3-announce-email}

이메일 제목:

```text
[ANNOUNCE] Apache Doris 1.xx release
```

수신 메일링 리스트:

```text
dev@doris.apache.org
```

이메일 본문:

```text
Hi All,

We are pleased to announce the release of Apache Doris 1.xx.

Apache Doris is an MPP-based interactive SQL data warehousing for reporting and analysis.

The release is available at:
http://doris.apache.org/master/zh-CN/downloads/downloads.html

Thanks to everyone who has contributed to this release, and the release note can be found here:
https://github.com/apache/doris/releases

Best Regards,

On behalf of the Doris team,
xxx
```

## 자주 묻는 질문 {#faq}

### Q1: `svn mv`에서 권한 오류가 발생하나요? {#q1-svn-mv-reports-a-permission-error}

PMC 멤버만 `release` SVN 디렉터리에 쓰기 권한을 가집니다. 일반 커미터는 PMC 멤버에게 작업을 대신 수행해 달라고 요청해야 합니다.

### Q2: Maven의 `No public key` 오류가 `Release` 클릭 후 발생하나요? {#q2-maven-reports-no-public-key-after-clicking-release}

GPG 공개 키가 공개 키 서버에 업로드되지 않았기 때문입니다. 다음 명령어를 실행하여 공개 키를 공개 키 서버에 동기화한 후 다시 시도하세요.

```shell
gpg --keyserver hkp://keyserver.ubuntu.com --send-keys <KEY_ID>
```

`<KEY_ID>`는 `gpg -k`로 확인할 수 있습니다.

### Q3: 웹사이트의 다운로드 링크에서 404 오류가 발생하나요? {#q3-the-download-link-on-the-website-returns-404}

가능한 원인은 다음과 같습니다.

- 파일을 SVN 릴리스 디렉터리에 커밋한 직후에는 CDN에 전파되는 데 10분에서 30분이 걸립니다.
- 이전 버전을 정리했지만 다운로드 페이지의 링크를 아카이브 URL로 업데이트하지 않았습니다.

### Q4: 사용자가 다운로드할 이전 버전을 찾을 수 없나요? {#q4-users-cannot-find-an-old-version-when-downloading}

이전 버전은 Apache에서 자동으로 아카이브합니다. 다운로드 페이지의 이전 버전 링크를 `http://archive.apache.org/dist/doris/<version>/` 경로로 업데이트해야 합니다.
