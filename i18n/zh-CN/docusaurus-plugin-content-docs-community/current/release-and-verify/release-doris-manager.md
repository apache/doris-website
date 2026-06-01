---
title: 发布 Doris Manager
language: zh-CN
description: Apache Doris Manager 发版流程：分支管理、Tag、打包签名、SVN 上传、社区与 IPMC 投票。
keywords:
    - Apache Doris
    - Doris Manager
    - 发版流程
    - 社区投票
    - IPMC 投票
    - GPG 签名
    - SVN 上传
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

# 发布 Doris Manager

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: Apache 发版流程 / Doris Manager 发布 -->

Doris Manager 代码库独立于 Doris 主代码库，地址为 [apache/doris-manager](https://github.com/apache/doris-manager)。本文介绍 Doris Manager 的完整发版流程。

## 发版流程概览

| 阶段 | 步骤 | 目的 |
|------|------|------|
| 准备 | 1. 发版准备 | 完成 GPG 密钥、SVN 权限等准备 |
| 准备 | 2. 准备分支 | 新建发版分支，确保功能稳定 |
| 准备 | 3. 清理 Issues | 关闭已完成项，推迟未完成项 |
| 准备 | 4. 合入必要 Patch | 评估并合入重要 Patch |
| 验证 | 5. 验证分支 | 稳定性测试与编译验证 |
| 投票 | 6. 打 Tag、打包、签名上传 | 生成 RC 包并上传 SVN |
| 投票 | 7. dev@doris 投票 | 社区投票 |
| 投票 | 8. IPMC 投票 | 孵化器 PMC 投票 |
| 收尾 | 9. 完成发布 | 归档、发布、Announce |

## 1. 准备发布

请参阅 [发版准备](./release-prepare) 文档完成发版前置工作。

## 2. 准备分支

发布前需要先新建一个分支：

```shell
git checkout -b branch-1.0.0
```

新建分支后需要进行充分测试，确保：

- 功能可用。
- Bug 收敛。
- 重要 Bug 都得到修复。

测试期间需要等待社区反馈，确认是否有必要 Patch 需要合入。如果有，需要将其 cherry-pick 到发布分支。

## 3. 清理 Issues

逐一过一遍属于该版本的所有 Issue：

- 关闭已经完成的 Issue。
- 无法完成的 Issue 推迟到更晚的版本。

## 4. 合并必要的 Patch

在发布等待过程中，可能会有重要的 Patch 需要合入。如果社区反馈有重要 Bug 需要合入，Release Manager 需要评估并将重要 Patch 合入到发布分支。

## 5. 验证分支

### 5.1 稳定性测试

将打好的分支交给 QA 同学进行稳定性测试。如果在测试过程中出现需要修复的问题，待修复完成后，需要将修复问题的 PR 合入到发布分支。

待整个分支稳定后才能准备发版。

### 5.2 编译验证

请参阅编译文档进行编译，以确保源码编译正确。

## 6. 社区发布投票流程

### 6.1 打 Tag

当上述分支已经比较稳定后，在该分支上打 tag。例如：

```shell
git checkout branch-1.0.0
git tag -a 1.0.0-rc01 -m "doris manager 1.0.0 release candidate 01"
git push origin 1.0.0-rc01
```

预期输出：

```text
Counting objects: 1, done.
Writing objects: 100% (1/1), 165 bytes | 0 bytes/s, done.
Total 1 (delta 0), reused 0 (delta 0)
To git@github.com:apache/doris-manager.git
 * [new tag]         1.0.0-rc01 -> 1.0.0-rc01
```

通过 `git tag` 命令可查看本地 tag 列表。

### 6.2 打包、签名上传

下面的步骤需要通过 SecureCRT 等终端直接登录用户账号，**不能通过 `su - user` 或 `ssh` 跳转**，否则密码输入框可能无法显示并报错。

#### 6.2.1 打包并签名

```shell
git archive --format=tar 1.0.0-rc01 --prefix=apache-doris-incubating-manager-src-1.0.0-rc01/ | gzip > apache-doris-incubating-manager-src-1.0.0-rc01.tar.gz

gpg -u xxx@apache.org --armor --output apache-doris-incubating-manager-src-1.0.0-rc01.tar.gz.asc --detach-sign apache-doris-incubating-manager-src-1.0.0-rc01.tar.gz

gpg --verify apache-doris-incubating-manager-src-1.0.0-rc01.tar.gz.asc apache-doris-incubating-manager-src-1.0.0-rc01.tar.gz

sha512sum apache-doris-incubating-manager-src-1.0.0-rc01.tar.gz > apache-doris-incubating-manager-src-1.0.0-rc01.tar.gz.sha512

sha512sum --check apache-doris-incubating-manager-src-1.0.0-rc01.tar.gz.sha512
```

#### 6.2.2 上传到 SVN

下载 SVN 库：

```shell
svn co https://dist.apache.org/repos/dist/dev/doris/
```

将之前得到的全部文件组织成以下 SVN 路径：

```text
./doris/
├── doris-manager
│   └── 1.0.0
│       ├── apache-doris-incubating-manager-src-1.0.0-rc01.tar.gz
│       ├── apache-doris-incubating-manager-src-1.0.0-rc01.tar.gz.asc
│       └── apache-doris-incubating-manager-src-1.0.0-rc01.tar.gz.sha512
```

上传这些文件：

```shell
svn add 1.0.0-rc01
svn commit -m "Add doris manager 1.0.0-rc01"
```

### 6.3 发邮件到社区 dev@doris.apache.org 进行投票

邮件标题：

```text
[VOTE] Release Apache Doris Manager 1.0.0-incubating-rc01
```

邮件正文模板：

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


Brs，
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

### 6.4 投票通过后，发 Result 邮件

邮件标题：

```text
[Result][VOTE] Release Apache Doris Manager 1.0.0-incubating-rc01
```

邮件正文模板：

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

## 7. IPMC 投票

dev 邮件组通过后，再发送邮件到 `general@incubator.apache.org` 邮件组进行 IPMC 投票。

邮件正文模板：

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

邮件的 thread 链接可在以下地址查询：

```text
https://lists.apache.org/list.html?dev@doris.apache.org
```

### 7.1 发 Result 邮件到 general@incubator.apache.org

邮件标题：

```text
[RESULT][VOTE] Release Apache Doris Manager 1.0.0-incubating-rc01
```

邮件正文模板：

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

## 8. 完成发布

请参阅 [完成发布](./release-complete) 文档完成所有发布流程。

## FAQ

### Q1：打包、签名步骤为什么不能用 `ssh` 或 `su - user`？

通过 `ssh` 或 `su -` 切换进入的终端无法正确显示 GPG 密码输入框，会导致签名命令报错。需通过 SecureCRT 等终端直接登录目标用户账号。

### Q2：`gpg --verify` 报错 `gpg verify failed` 或 `BAD signature`

可能原因：

- 公钥未导入：先执行 `gpg --import KEYS`。
- 签名文件与源码包不匹配：确认 `.asc` 与 `.tar.gz` 来自同一构建过程。

### Q3：`sha512sum --check` 报 `shasum mismatch`

源码包在传输过程中可能损坏或被覆盖。重新下载源码包，或重新生成 `.sha512` 校验文件后再次校验。
