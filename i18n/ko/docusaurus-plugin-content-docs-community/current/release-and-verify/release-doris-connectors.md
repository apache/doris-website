---
title: Apache Doris Connectors 릴리스
language: ko
description: "Apache Doris Spark/Flink Connector 릴리스 절차: Maven Staging, SVN 업로드 및 커뮤니티 투표."
keywords:
    - Apache Doris Connector 릴리스
    - Spark Connector
    - Flink Connector
    - Maven Staging
    - Apache 투표
    - SVN dist
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

# Apache Doris Connectors 릴리스 {#release-apache-doris-connectors}

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Release / Apache vote process -->

Doris Connectors에는 현재 Flink Connector와 Spark Connector가 포함됩니다. 두 저장소 모두 Doris의 메인 저장소와 독립적으로 관리됩니다:

| 커넥터 | 저장소 |
| --- | --- |
| Flink Connector | [https://github.com/apache/doris-flink-connector](https://github.com/apache/doris-flink-connector) |
| Spark Connector | [https://github.com/apache/doris-spark-connector](https://github.com/apache/doris-spark-connector) |

이 문서에서는 Spark Connector 1.2.0을 예로 들어, Maven Staging 및 SVN 준비부터 커뮤니티 투표까지 커넥터 유형 컴포넌트의 전체 릴리스 절차를 설명합니다.

## 릴리스 준비 {#prepare-for-release}

먼저 [릴리스 준비](./release-prepare) 문서를 참고하여 서명, SVN 및 Maven 환경을 설정합니다.

## Maven에 릴리스 {#release-to-maven}

### 1. 브랜치와 태그 준비 {#1-prepare-the-branch-and-tag}

저장소에 `release-1.2.0` 브랜치를 생성하고 체크아웃합니다.

`revision` 버전을 `pom.xml`에서 `1.2.0`으로 수정한 다음 변경 사항을 커밋합니다:

```bash
git commit -a -m "Commit for release 1.2.0"
```

태그를 생성하고 푸시합니다:

```bash
git tag 1.2.0
git push origin 1.2.0
```

### 2. Maven Staging에 릴리스 {#2-release-to-maven-staging}

Spark Connector는 Spark 버전별로(예: 2.3, 3.1, 3.2) 별도의 릴리스를 게시하므로, 각각 개별적으로 컴파일하고 게시해야 합니다. 다음은 Spark 2.3과 Scala 2.11을 예로 듭니다.

먼저 로컬 환경에서 설치하고 검증합니다:

```bash
mvn clean install \
-Dspark.version=2.3.0 \
-Dscala.version=2.11 \
-Dspark.major.version=2.3
```

> 관련 매개변수는 `build.sh` 스크립트의 빌드 명령을 참고하세요. `revision`은 이번 릴리스의 버전 번호입니다.

Apache Staging 저장소에 게시합니다:

```bash
mvn deploy \
-Papache-release \
-Dspark.version=2.3.0 \
-Dscala.version=2.11 \
-Dspark.major.version=2.3
```

명령이 성공하면 새로 게시한 버전이 [https://repository.apache.org/#stagingRepositories](https://repository.apache.org/#stagingRepositories)에 표시됩니다:

![](/images/staging-repositories.png)

:::caution 참고
아티팩트에 `.asc` 서명 파일이 포함되어 있는지 확인하세요.
:::

문제가 있으면 해당 Staging을 삭제하고 위 단계를 다시 실행합니다.

모든 항목이 올바른지 확인한 후 `close` 버튼을 클릭하여 Staging 릴리스를 완료합니다.

### 3. SVN 준비 {#3-prepare-svn}

Dev SVN 저장소를 체크아웃합니다:

```bash
svn co https://dist.apache.org/repos/dist/dev/doris/
```

태그의 소스 코드를 패키징하고 서명 파일과 SHA512 체크섬 파일을 생성합니다(다음은 `1.2.0`을 예로 듭니다):

```bash
git archive --format=tar release-1.2.0 --prefix=apache-doris-spark-connector-1.2.0-src/ | gzip > apache-doris-spark-connector-1.2.0-src.tar.gz

gpg -u xxx@apache.org --armor --output apache-doris-spark-connector-1.2.0-src.tar.gz.asc  --detach-sign apache-doris-spark-connector-1.2.0-src.tar.gz
sha512sum apache-doris-spark-connector-1.2.0-src.tar.gz > apache-doris-spark-connector-1.2.0-src.tar.gz.sha512
```

macOS에서는 다음 명령을 사용합니다:

```bash
shasum -a 512 apache-doris-spark-connector-1.2.0-src.tar.gz > apache-doris-spark-connector-1.2.0-src.tar.gz.sha512
```

다음 세 파일이 생성됩니다:

| 파일 | 용도 |
| --- | --- |
| `apache-doris-spark-connector-1.2.0-src.tar.gz` | 소스 패키지 |
| `apache-doris-spark-connector-1.2.0-src.tar.gz.asc` | GPG 서명 파일 |
| `apache-doris-spark-connector-1.2.0-src.tar.gz.sha512` | SHA512 체크섬 파일 |

세 파일을 다음 SVN 디렉터리로 이동합니다:

```text
doris/spark-connector/1.2.0/
```

전체 SVN 디렉터리 구조는 다음과 같습니다:

```text
|____0.15
| |____0.15.0-rc04
| | |____apache-doris-0.15.0-incubating-src.tar.gz.sha512
| | |____apache-doris-0.15.0-incubating-src.tar.gz.asc
| | |____apache-doris-0.15.0-incubating-src.tar.gz
|____KEYS
|____spark-connector
| |____1.2.0
| | |____apache-doris-spark-connector-1.2.0-src.tar.gz
| | |____apache-doris-spark-connector-1.2.0-src.tar.gz.asc
| | |____apache-doris-spark-connector-1.2.0-src.tar.gz.sha512
```

이 구조에서 `0.15`는 Doris 메인 코드 디렉터리이며, `spark-connector/1.2.0`에는 이번 릴리스의 파일이 들어 있습니다.

> KEYS 파일을 준비하는 방법은 [릴리스 준비](./release-prepare)의 관련 절을 참고하세요.

### 4. 투표 {#4-vote}

다음 템플릿을 사용하여 `dev@doris.apache.org` 메일링 리스트에서 투표를 시작합니다:

```text
Hi all,

This is a call for the vote to release Apache Doris Spark Connector 1.2.0

The git tag for the release:
https://github.com/apache/doris-spark-connector/releases/tag/1.2.0

Release Notes are here:
https://github.com/apache/doris-spark-connector/issues/109

Thanks to everyone who has contributed to this release.

The release candidates:
https://dist.apache.org/repos/dist/dev/doris/spark-connector/1.2.0/

Maven 2 staging repository:
https://repository.apache.org/content/repositories/orgapachedoris-1031


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

[릴리스 완료](./release-complete) 문서를 참고하여 나머지 릴리스 단계를 마무리합니다.

## 부록: SNAPSHOT에 게시 {#appendix-publish-to-snapshot}

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Pre-release preview -->

Snapshot은 Apache Release 버전이 아니며, 릴리스 전 미리보기 용도로만 사용됩니다. Snapshot 버전은 PMC에서 논의하고 승인한 후에만 게시할 수 있습니다.

Spark Connector 디렉터리로 이동합니다(Spark 2.3과 Scala 2.11을 예로 듭니다):

```bash
cd spark-doris-connector
mvn deploy \
-Dspark.version=2.3.0 \
-Dscala.version=2.11 \
-Dspark.major.version=2.3 \
```

게시 후 다음 주소에서 Snapshot 버전을 확인할 수 있습니다:

```text
https://repository.apache.org/content/repositories/snapshots/org/apache/doris/doris-spark-connector/
```

## FAQ / 문제 해결 {#faq--troubleshooting}

**질문: `mvn deploy` 실행 시 `gpg: signing failed: Inappropriate ioctl for device` 오류가 발생하면 어떻게 하나요?**

`export GPG_TTY=$(tty)`를 실행한 다음 다시 시도합니다.

**질문: Staging 저장소에 `.asc` 서명 파일이 없습니다. 어떻게 해야 하나요?**

`mvn deploy` 명령에 `-Papache-release`가 포함되어 있는지 확인하고, `~/.m2/settings.xml`과 `settings-security.xml`이 올바르게 설정되어 있는지 확인합니다. 아티팩트가 완전하지 않으면 해당 Staging을 삭제하고 `mvn deploy`를 다시 실행합니다.

**질문: 동일한 릴리스에서 서로 다른 Spark 버전용 아티팩트를 여러 개 게시하려면 어떻게 하나요?**

각 Spark/Scala 버전 조합에 대해 `mvn deploy`를 개별적으로 실행하며, 매번 서로 다른 `-Dspark.version`, `-Dscala.version`, `-Dspark.major.version` 값을 지정합니다. 모든 조합의 게시가 완료되면 Staging 저장소를 한 번에 닫습니다.
