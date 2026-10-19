---
title: Apache Doris 릴리스 준비
language: ko
description: "Apache Doris 릴리스 준비: GPG 서명, Maven 설정, DISCUSS 스레드 및 전체 릴리스 절차."
keywords:
    - Apache Doris 릴리스 준비
    - Release Manager
    - GPG 서명 PGP 키
    - Apache 투표 절차
    - Maven settings.xml
    - Apache SVN dist
    - DISCUSS
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

# Apache Doris 릴리스 준비 {#apache-doris-release-preparation}

<!-- Knowledge type: Procedure -->
<!-- Applicable scenarios: Version release / Apache voting process / Release Manager preparation -->

Apache 프로젝트의 릴리스는 Apache Software Foundation의 릴리스 절차를 엄격히 따라야 합니다. 이 문서에서는 Apache Doris의 전체 릴리스 절차, 서명 환경 구성, Maven 릴리스 설정을 설명합니다. Release Manager 역할을 처음 맡는 PMC 멤버 또는 Committer를 위한 문서입니다.

관련 Apache 공식 정책 및 가이드:

- [릴리스 생성 절차](https://infra.apache.org/release-publishing)
- [릴리스 정책](https://www.apache.org/legal/release-policy.html)
- [Maven 릴리스를 Maven Central Repository에 게시](https://infra.apache.org/publishing-maven-artifacts.html)

각 컴포넌트의 자세한 릴리스 단계는 다음 문서를 참조하세요.

- [Doris Core 릴리스](./release-doris-core)
- [Doris Connectors 릴리스](./release-doris-connectors)
- [Doris Shade 릴리스](./release-doris-shade)
- [Doris SDK 릴리스](./release-doris-sdk)

## 릴리스 형태 {#release-forms}

Apache 프로젝트의 릴리스는 크게 세 가지 형태로 나뉩니다.

| 형태 | 설명 | 필수 여부 |
| --- | --- | --- |
| 소스 릴리스 | 소스 코드 릴리스 | 필수 |
| 바이너리 릴리스 | 바이너리 릴리스(컴파일된 실행 파일) | 선택 |
| 편의용 바이너리 | Maven, Docker 등의 타사 플랫폼에 게시하는 편의용 바이너리 패키지 | 선택 |

## 전체 릴리스 절차 {#overall-release-process}

<!-- Knowledge type: Procedure -->

프로젝트를 릴리스할 때마다 PMC 멤버 또는 Committer가 **Release Manager** 역할을 맡아야 합니다. 전체 절차는 다음과 같습니다.

1. **환경 구성**: GPG와 SVN을 설치하고 서명용 공개 키를 생성합니다(아래 참조).
2. **릴리스 준비**:
    1. 커뮤니티에서 DISCUSS 스레드를 시작하고 구체적인 릴리스 계획을 논의합니다.
    2. 릴리스에 사용할 브랜치를 생성합니다.
    3. 해당 버전의 이슈를 정리합니다.
    4. 필요한 패치를 릴리스 브랜치에 병합합니다.
3. **브랜치 검증**:
    1. QA 안정성 테스트를 수행합니다.
    2. 브랜치 코드의 빌드 과정을 검증합니다.
    3. 릴리스 노트를 준비합니다.
4. **릴리스 아티팩트 준비**:
    1. 릴리스 태그를 생성합니다.
    2. 릴리스할 아티팩트를 [Apache Dev SVN 저장소](https://dist.apache.org/repos/dist/dev/doris)에 업로드합니다.
    3. 다른 편의용 바이너리를 준비합니다(예: [Maven Staging 저장소](https://repository.apache.org/#stagingRepositories)에 업로드).
5. **커뮤니티 투표 절차**:
    1. Doris 커뮤니티 Dev 메일링 리스트(`dev@doris.apache.org`)에서 투표를 시작합니다.
    2. 투표가 통과되면 Result 이메일을 보냅니다.
6. **마무리**:
    1. 서명된 패키지를 [Apache Release 저장소](https://dist.apache.org/repos/dist/release/doris/)에 업로드하고 다운로드 링크를 생성합니다.
    2. Doris 웹사이트와 GitHub에 다운로드 링크를 게시하고 SVN의 이전 버전 패키지를 정리합니다.
    3. `dev@doris.apache.org`로 Announce 이메일을 보냅니다.

## 서명 환경 준비 {#prepare-the-signing-environment}

<!-- Knowledge type: Procedure -->
<!-- Applicable scenarios: First time acting as Release Manager -->

처음 릴리스하는 경우 로컬 환경에 다음 도구를 준비하세요.

| 도구 | 용도 | 참고 자료 |
| --- | --- | --- |
| 릴리스 서명 | Apache 서명 요구 사항 이해 | [릴리스 서명](https://www.apache.org/dev/release-signing.html) |
| gpg | 서명 키 생성 및 릴리스 패키지 서명 | [openpgp](https://www.apache.org/dev/openpgp.html) |
| svn | Apache SVN에 릴리스 아티팩트 업로드 | [openpgp](https://www.apache.org/dev/openpgp.html) |

### GPG 키 준비 {#prepare-the-gpg-key}

릴리스 전에 Release Manager는 서명용 공개 키를 생성하여 공개 키 서버에 업로드한 다음, 해당 키로 릴리스 패키지에 서명해야 합니다.

> 자신의 키가 이미 [Apache Doris KEYS 파일](https://downloads.apache.org/doris/KEYS)에 포함되어 있다면 이 절은 건너뛰어도 됩니다.

#### GnuPG 설치 {#install-gnupg}

GnuPG(약칭 GPG)는 PGP를 구현한 자유 소프트웨어로, 키를 생성하고 파일에 서명하는 데 사용합니다.

CentOS에서의 설치 명령:

```bash
yum install gnupg
```

설치 후 기본 설정 파일은 다음 위치에 있습니다.

```text
~/.gnupg/gpg.conf
```

파일이 없으면 빈 파일을 생성해도 됩니다.

Apache 서명에는 SHA512를 권장합니다. `gpg.conf`를 편집하여 다음 세 줄을 추가하세요.

```text
personal-digest-preferences SHA512
cert-digest-algo SHA512
default-preference-list SHA512 SHA384 SHA256 SHA224 AES256 AES192 AES CAST5 ZLIB BZIP2 ZIP Uncompressed
```

#### GPG 버전 확인 {#check-the-gpg-version}

GPG가 SHA512를 지원하는지 확인합니다.

```bash
$ gpg --version
gpg (GnuPG) 2.0.22
libgcrypt 1.5.3
Copyright (C) 2013 Free Software Foundation, Inc.
License GPLv3+: GNU GPL version 3 or later <http://gnu.org/licenses/gpl.html>
This is free software: you are free to change and redistribute it.
There is NO WARRANTY, to the extent permitted by law.

Home: ~/.gnupg
Supported algorithms:
Pubkey: RSA, ?, ?, ELG, DSA
Cipher: IDEA, 3DES, CAST5, BLOWFISH, AES, AES192, AES256, TWOFISH,
        CAMELLIA128, CAMELLIA192, CAMELLIA256
Hash: MD5, SHA1, RIPEMD160, SHA256, SHA384, SHA512, SHA224
Compression: Uncompressed, ZIP, ZLIB, BZIP2
```

:::caution 참고
SecureCRT와 같은 터미널을 통해 해당 사용자 계정으로 직접 로그인해야 합니다. `su - user` 또는 `ssh`로 계정을 전환하거나 접속하면 암호 구문 입력 창이 표시되지 않아 작업이 실패합니다.
:::

#### 서명 키 생성 {#generate-the-signing-key}

`gpg --gen-key`를 실행하고 아래 권장 설정에 따라 프롬프트에 응답합니다.

| 옵션 | 권장 값 | 참고 |
| --- | --- | --- |
| 키 유형 | `1` (RSA 및 RSA) | 기본값 |
| 키 길이 | `4096` | Apache는 최소 4096비트를 권장 |
| 유효 기간 | `0` | 만료되지 않음 |
| 실명 | [id.apache.org](https://id.apache.org)에 표시된 ID와 동일 | 필수 |
| 이메일 주소 | Apache 이메일(`xxx@apache.org`) | 필수 |

전체 대화형 예제:

```text
$ gpg --gen-key
gpg (GnuPG) 2.0.22; Copyright (C) 2013 Free Software Foundation, Inc.
This is free software: you are free to change and redistribute it.
There is NO WARRANTY, to the extent permitted by law.

Please select what kind of key you want:
   (1) RSA and RSA (default)
   (2) DSA and Elgamal
   (3) DSA (sign only)
   (4) RSA (sign only)
Your selection? 1
RSA keys may be between 1024 and 4096 bits long.
What keysize do you want? (2048) 4096
Requested keysize is 4096 bits
Please specify how long the key should be valid.
         0 = key does not expire
      <n>  = key expires in n days
      <n>w = key expires in n weeks
      <n>m = key expires in n months
      <n>y = key expires in n years
Key is valid for? (0)
Key does not expire at all
Is this correct? (y/N) y

GnuPG needs to construct a user ID to identify your key.

Real name: xxx
Name must be at least 5 characters long
Real name: xxx-yyy
Email address: xxx@apache.org
Comment: xxx's key
You selected this USER-ID:
    "xxx-yyy (xxx's key) <xxx@apache.org>"

Change (N)ame, (C)omment, (E)mail or (O)kay/(Q)uit? o
```

그다음 암호 구문을 입력해야 합니다(두 번, 최소 8자).

:::danger 중요
여기서 설정한 암호 구문을 반드시 기억하세요. 이후 서명할 때와 다른 컴포넌트를 릴리스할 때 사용합니다.
:::

`gpg --gen-key`가 오랫동안 멈춰 있으면 다음 방법 중 하나로 엔트로피를 보충하세요.

- 다른 터미널을 열고 `find / | xargs file`을 실행하여 임의의 문자를 생성합니다.
- `rng-tools`를 설치하고(`yum install rng-tools`) `rngd -r /dev/urandom`을 실행합니다. 그러면 키 생성이 거의 즉시 완료됩니다.

#### 공개 키 확인 및 내보내기 {#view-and-export-the-public-key}

```bash
$ gpg --list-keys
/home/lide/.gnupg/pubring.gpg
-----------------------------
pub   4096R/33DBF2E0 2018-12-06
uid                  xxx-yyy  (xxx's key) <xxx@apache.org>
sub   4096R/0E8182E6 2018-12-06
```

여기서 `xxx-yyy`는 사용자 ID이고, `33DBF2E0`는 짧은 지문입니다.

공개 키를 파일로 내보냅니다.

```bash
gpg --armor --output public-key.txt --export [user ID]
```

예제:

```bash
$ gpg --armor --output public-key.txt --export xxx-yyy
File 'public-key.txt' already exists. Overwrite? (y/N) y
$ cat public-key.txt
-----BEGIN PGP PUBLIC KEY BLOCK-----
Version: GnuPG v2.0.22 (GNU/Linux)

mQINBFwJEQ0BEACwqLluHfjBqD/RWZ4uoYxNYHlIzZvbvxAlwS2mn53BirLIU/G3
9opMWNplvmK+3+gNlRlFpiZ7EvHsF/YJOAP59HmI2Z...
```

#### 키 서버에 공개 키 업로드 {#upload-the-public-key-to-a-key-server}

`--send-keys`를 사용하여 Ubuntu 키 서버에 공개 키를 업로드합니다.

```bash
gpg --send-keys xxxx --keyserver https://keyserver.ubuntu.com/
```

여기서 `xxxx`는 이전 단계의 `pub` 뒤에 있는 문자열로, `--list-keys` 출력에서 확인할 수 있습니다(예: `33DBF2E0`).

`public-key.txt`의 내용을 붙여 넣어 [https://keyserver.ubuntu.com/](https://keyserver.ubuntu.com/) 웹페이지에서 업로드할 수도 있습니다.

업로드에 성공하면 해당 페이지에 `0x33DBF2E0`를 입력하여 키를 쿼리할 수 있습니다(`0x` 접두사에 주의하세요). 사이트의 쿼리 결과에 반영되기까지 지연이 있으므로 약 한 시간 기다려야 할 수 있습니다.

#### 지문 생성 및 Apache 계정에 연결 {#generate-the-fingerprint-and-bind-it-to-your-apache-account}

키 서버는 진위를 확인하지 않으므로 누구나 다른 사람의 이름으로 공개 키를 업로드할 수 있습니다. 따라서 다른 사람들이 대조하여 확인할 수 있도록 [id.apache.org](https://id.apache.org)에서 지문을 계정에 연결해야 합니다.

지문을 생성합니다.

```bash
gpg --fingerprint [user ID]
```

예제:

```text
$ gpg --fingerprint xxx-yyy
pub   4096R/33DBF2E0 2018-12-06
      Key fingerprint = 07AA E690 B01D 1A4B 469B  0BEF 5E29 CE39 33DB F2E0
uid                  xxx-yyy (xxx's key) <xxx@apache.org>
sub   4096R/0E8182E6 2018-12-06
```

전체 지문(`07AA E690 B01D 1A4B 469B  0BEF 5E29 CE39 33DB F2E0`)을 `OpenPGP Public Key Primary Fingerprint` 필드에 붙여 넣습니다. 이 필드는 [https://id.apache.org](https://id.apache.org)에 있습니다.

> 참고: 각 Apache 계정에는 여러 공개 키를 연결할 수 있습니다.

#### KEYS 파일에 공개 키 추가 {#append-the-public-key-to-the-keys-file}

:::danger 중요
**KEYS 파일의 기존 내용은 절대 삭제하지 마세요.** 새 항목만 추가하세요.
:::

자신의 KEY를 Dev 및 Release SVN 저장소에 차례로 추가합니다.

```bash
svn co https://dist.apache.org/repos/dist/dev/doris/
# edit doris/KEYS file
gpg --list-sigs [user ID] >> doris/KEYS
gpg --armor --export [user ID] >> doris/KEYS
svn ci --username $ASF_USERNAME --password "$ASF_PASSWORD" -m"Update KEYS"
```

```bash
svn co https://dist.apache.org/repos/dist/release/doris
# edit doris/KEYS file
svn ci --username $ASF_USERNAME --password "$ASF_PASSWORD" -m"Update KEYS"
```

변경 사항은 다음 위치에 자동으로 동기화됩니다.

```text
https://downloads.apache.org/doris/KEYS
```

이후 릴리스 투표 이메일에서는 `https://downloads.apache.org/doris/KEYS` 주소를 사용하세요.

## Maven 릴리스 준비 {#maven-release-preparation}

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenarios: Release Doris Connector / Shade / SDK -->

Doris Connector, Shade, SDK 등의 컴포넌트는 Maven을 사용하여 릴리스해야 하므로 `~/.m2/settings.xml`과 `~/.m2/settings-security.xml`을 설정해야 합니다.

### 1. 마스터 비밀번호 생성 {#1-generate-the-master-password}

마스터 비밀번호는 이후 다른 비밀번호를 암호화하는 데 사용합니다.

```bash
mvn --encrypt-master-password <password>
```

출력은 `{VSb+6+76djkH/43...}`와 같은 형태입니다. 이를 `~/.m2/settings-security.xml`에 작성합니다.

```xml
<settingsSecurity>
  <master>{VSb+6+76djkH/43...}</master>
</settingsSecurity>
```

### 2. Apache 계정 비밀번호 암호화 {#2-encrypt-the-apache-account-password}

```bash
mvn --encrypt-password <password>
```

`<password>`는 Apache 계정 비밀번호입니다. 출력은 `{GRKbCylpwysHfV...}`와 같은 형태입니다.

다음 `<servers>` 설정을 `~/.m2/settings.xml`에 추가합니다.

```xml
<servers>
  <!-- To publish a snapshot of your project -->
  <server>
    <id>apache.snapshots.https</id>
    <username>yangzhg</username>
    <password>{GRKbCylpwysHfV...}</password>
  </server>
  <!-- To stage a release of your project -->
  <server>
    <id>apache.releases.https</id>
    <username>yangzhg</username>
    <password>{GRKbCylpwysHfV...}</password>
  </server>
</servers>
```

두 `server id` 항목의 용도는 다음과 같습니다.

| 서버 ID | 용도 |
| --- | --- |
| `apache.snapshots.https` | SNAPSHOT 버전 게시 |
| `apache.releases.https` | Staging 저장소에 Release 버전 게시 |

## 커뮤니티에서 DISCUSS 스레드 시작 {#start-a-discuss-thread-in-the-community}

<!-- Knowledge type: Procedure -->

DISCUSS 스레드는 릴리스 전 필수 단계는 아니지만, 중요한 릴리스에서는 `dev@doris.apache.org` 메일링 리스트에 스레드를 시작할 것을 **강력히 권장합니다**. 논의할 주제에는 다음 사항 등이 포함됩니다.

- 주요 기능 설명 및 설계상의 핵심 사항.
- 버그 수정 사항 설명.
- 호환성 변경 사항 및 업그레이드 시 참고 사항.
- 예상 릴리스 일정.

## FAQ / 문제 해결 {#faq--troubleshooting}

**질문: `gpg --gen-key`가 멈춰 있습니다. 어떻게 해야 하나요?**

엔트로피가 부족해서 발생하는 문제입니다. `find / | xargs file`을 실행하거나, `rng-tools`를 설치하고 `rngd -r /dev/urandom`을 실행하여 난수 공급원을 보충하세요.

**질문: 서명할 때 `gpg: signing failed: Inappropriate ioctl for device` 오류가 발생하나요?**

터미널에서 암호 구문을 입력받을 수 없는 상태입니다. `export GPG_TTY=$(tty)`를 실행한 후 다시 시도하세요.

**질문: `mvn deploy`가 401 Unauthorized를 반환하나요?**

`apache.releases.https`의 사용자 이름과 암호화된 비밀번호를 `~/.m2/settings.xml`에서 확인하고, `~/.m2/settings-security.xml`의 마스터 비밀번호가 일치하는지 확인하세요.

**질문: 키 서버에 업로드한 후 키를 찾을 수 없나요?**

`keyserver.ubuntu.com`에는 동기화 지연이 있으며, 일반적으로 약 한 시간이 걸립니다.
