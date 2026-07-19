---
title: 发布 Apache Doris Core
language: zh-CN
description: Apache Doris Core 发版完整流程：分支准备、Tag、签名、SVN 上传、Dev 与 IPMC 投票。
keywords:
    - Apache Doris Core 发版
    - Doris Release 流程
    - Apache 投票
    - SVN dist
    - GPG 签名
    - Release Candidate rc01
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

# 发布 Apache Doris Core

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 版本发布 / Apache 投票流程 -->

Doris Core 指 [https://github.com/apache/doris](https://github.com/apache/doris) 中的代码内容。本文介绍 Release Manager 从分支准备、验证、打包签名到社区投票的完整发版流程。

## 准备发布

首先，请参阅 [发版准备](./release-prepare) 文档完成签名、SVN、Maven 等环境的准备。

### 1. 准备分支

发布前需新建一个发布分支，例如：

```bash
git checkout -b branch-0.9
```

分支创建后，需要进行充分测试，让功能可用、Bug 收敛、重要 Bug 都得到修复。在此过程中需要关注社区，看是否有必要的 Patch 需要 cherry-pick 到发布分支。

### 2. 清理 Issue

将属于该版本的所有 Issue 过一遍：

- 已完成的关闭；
- 无法在本版本完成的，推迟到更晚的版本。

### 3. 合并必要的 Patch

在发布等待过程中，可能会有重要 Patch 合入。如果社区提出有重要 Bug 需要合入，Release Manager 需评估后将相应 Patch 合并到发布分支。

## 验证分支

### 1. 稳定性测试

将打好的分支交给 QA 团队进行稳定性测试。如果测试过程中出现需要修复的问题，待修复完成后将修复 PR 合入到待发版本的分支中。

待整个分支稳定后，才能准备正式发版。

### 2. 编译验证

请参阅编译文档进行编译，以确保源码编译正确性。

### 3. 准备 Release Notes

整理本次发布的主要功能、Bug 修复和兼容性变更，准备 Release Notes（通常以 GitHub Issue 的形式发布）。

## 社区投票流程

### 1. 打 Tag

当分支已经比较稳定后，就可以在该分支上打 Tag。

打 Tag 前，需修改 `gensrc/script/gen_build_version.sh` 中的 `build_version` 变量，例如 `build_version="0.10.0-release"`。

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

### 2. 打包、签名与上传

:::caution 注意
以下步骤需要通过 SecureCRT 等终端直接登录用户账户，不能通过 `su - user` 或 `ssh` 转跳，否则密码输入框会显示不出来而报错。
:::

打包源码、生成 GPG 签名和 SHA512 校验文件：

```bash
$ git checkout 0.9.0-rc01

$ git archive --format=tar 0.9.0-rc01 --prefix=apache-doris-0.9.0-incubating-src/ | gzip > apache-doris-0.9.0-incubating-src.tar.gz

$ gpg -u xxx@apache.org --armor --output apache-doris-0.9.0-incubating-src.tar.gz.asc --detach-sign apache-doris-0.9.0-incubating-src.tar.gz

$ gpg --verify apache-doris-0.9.0-incubating-src.tar.gz.asc apache-doris-0.9.0-incubating-src.tar.gz

$ sha512sum apache-doris-0.9.0-incubating-src.tar.gz > apache-doris-0.9.0-incubating-src.tar.gz.sha512

$ sha512sum --check apache-doris-0.9.0-incubating-src.tar.gz.sha512
```

| 文件 | 用途 |
| --- | --- |
| `*-src.tar.gz` | 源码包 |
| `*-src.tar.gz.asc` | GPG 签名文件 |
| `*-src.tar.gz.sha512` | SHA512 校验文件 |

下载 Dev SVN 仓库：

```bash
svn co https://dist.apache.org/repos/dist/dev/doris/
```

将三个文件组织成以下 SVN 目录结构：

```text
./doris/
|-- 0.9.0-rc01
|   |-- apache-doris-0.9.0-incubating-src.tar.gz
|   |-- apache-doris-0.9.0-incubating-src.tar.gz.asc
|   `-- apache-doris-0.9.0-incubating-src.tar.gz.sha512
`-- KEYS
```

提交到 SVN：

```bash
svn add 0.9.0-rc01
svn commit -m "Add 0.9.0-rc1"
```

### 3. 发起 Dev 邮件组投票

在 `dev@doris.apache.org` 发起投票，标题为：

> [VOTE] Release Apache Doris 0.9.0-incubating-rc01

正文模板：

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

### 4. 发送 Dev 投票 Result 邮件

投票通过后，发送结果邮件。标题为：

> [Result][VOTE] Release Apache Doris 0.9.0-incubating-rc01

正文模板：

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

### 5. 发起 IPMC 投票

:::tip 提示
如非孵化器项目，请跳过本节及下一节。
:::

向 `general@incubator.apache.org` 发起 IPMC 投票，标题为：

> [VOTE] Release Apache Doris 0.9.0-incubating-rc01

正文模板：

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

邮件 thread 链接可在以下地址查询：

```text
https://lists.apache.org/list.html?dev@doris.apache.org
```

### 6. 发送 IPMC 投票 Result 邮件

:::tip 提示
如非孵化器项目，请跳过本节。
:::

向 `general@incubator.apache.org` 发送结果邮件，标题为：

> [RESULT][VOTE] Release Apache Doris 0.9.0-incubating-rc01

正文模板：

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

## 完成发布

请参阅 [完成发布](./release-complete) 文档完成所有发布流程。

## FAQ / Troubleshooting

**Q：`gpg --verify` 报 `gpg: Can't check signature: No public key`？**

本地缺少对应公钥，执行 `gpg --keyserver https://keyserver.ubuntu.com/ --recv-keys <KEY_ID>` 拉取公钥后重试。

**Q：`svn commit` 报 `Authentication failed`？**

检查环境变量 `$ASF_USERNAME` 与 `$ASF_PASSWORD` 是否正确设置；密码为 Apache LDAP 密码。

**Q：投票时间不足 72 小时可以提前关闭吗？**

不可以。Apache 政策要求 Release 投票至少开放 72 小时，必须等待时间到达。
