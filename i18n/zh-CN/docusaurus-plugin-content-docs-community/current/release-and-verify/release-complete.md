---
title: 完成发布
language: zh-CN
description: Apache Doris 发版收尾：Release SVN、下载链接、Release Note 与旧版本清理。
keywords:
    - Apache Doris
    - 完成发布
    - Release SVN
    - 下载链接
    - Release Note
    - Maven Release
    - Announce 邮件
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

# 完成发布

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: Apache 发版流程 / 发版收尾 -->

本文档描述在完成 `dev@doris` 邮件组中的发版投票并通过后，需要执行的后续收尾步骤。

## 完成发布 Checklist

| 步骤 | 操作 | 操作人 |
|------|------|--------|
| 1. 上传 Package 到 Release | 将 dev 下的源码包 / 签名 / 校验文件移动到 release | PMC 成员 |
| 2. 发布 Maven Staging | 在 Apache Nexus 中点击 `Release` | Release Manager |
| 3. 准备 Release Note | 更新 GitHub Release 与官网下载页 | Release Manager |
| 4. 清理 SVN 旧版本 | 仅保留最新版本，旧版本归档地址替换 | Release Manager |
| 5. 发送 Announce 邮件 | 在 dev@doris 公告新版本发布 | Release Manager |

## 1. 上传 Package 到 Release

当正式发布投票成功后，先发 `[Result]` 邮件，然后准备 Release Package。将之前在 dev 下发布的对应文件夹下的源码包、签名文件和 hash 文件拷贝到新目录（例如 `1.1.0`）。注意事项：

- 文件名中**不要带 `rcxx` 后缀**（可以 rename，但不要重新计算签名）。
- hash 可以重新计算，结果不变。

> 这一步仅 PMC 成员有权限操作。

源 SVN 路径：

```text
https://dist.apache.org/repos/dist/dev/doris/
```

目标 SVN 路径：

```text
https://dist.apache.org/repos/dist/release/doris/
```

操作示例：

```shell
svn mv -m "move doris 1.1.0-rc05 to release" \
    https://dist.apache.org/repos/dist/dev/doris/1.1 \
    https://dist.apache.org/repos/dist/release/doris/1.1
```

第一次发布的话，KEYS 文件也需要拷贝过来，然后 add 到 SVN release 下。add 成功后可以在以下网址看到发布的文件：

```text
https://dist.apache.org/repos/dist/release/doris/1.xx/
```

稍等一段时间后，可在 Apache 官网看到：

```text
http://www.apache.org/dist/doris/1.xx/
```

## 2. 在 Doris 官网和 GitHub 发布链接

以 Doris Core 为例，其他组件请注意替换对应名称。

### 2.1 创建下载链接

| 链接类型 | URL |
|----------|-----|
| 下载链接 | `http://www.apache.org/dyn/closer.cgi?filename=doris/1.xx/apache-doris-1.xx-src.tar.gz&action=download` |
| wget 下载 | `https://www.apache.org/dyn/mirrors/mirrors.cgi?action=download&filename=doris/1.xx/apache-doris-1.xx-src.tar.gz` |
| 原始位置 | `https://www.apache.org/dist/doris/1.xx/` |
| Closer 入口 | `http://www.apache.org/dyn/closer.cgi/doris/1.xx/apache-doris-1.xx-src.tar.gz` |
| 源码包 | `http://www.apache.org/dyn/closer.cgi/doris/1.xx/apache-doris-1.xx-src.tar.gz` |
| ASC 签名 | `http://archive.apache.org/dist/doris/1.xx/apache-doris-1.xx-src.tar.gz.asc` |
| sha512 校验 | `http://archive.apache.org/dist/doris/1.xx/apache-doris-1.xx-src.tar.gz.sha512` |
| KEYS | `http://archive.apache.org/dist/doris/KEYS` |

wget 下载示例：

```shell
wget --trust-server-names "https://www.apache.org/dyn/mirrors/mirrors.cgi?action=download&filename=doris/1.xx/apache-doris-1.xx-src.tar.gz"
```

详细规则请参考 [Apache 下载页面规范](http://www.apache.org/dev/release-download-pages#closer)。

### 2.2 Maven

在 [Apache Maven Staging Repositories](https://repository.apache.org/#stagingRepositories) 中找到对应的 Staging Repo：

1. 如果没有 close，先点击 `close` 关闭。
2. 点击 `Release` 进行正式发布。

> 如果 `close` 阶段报错 `No public key: Key with id: (xxx) was not able to be located on`，可执行以下命令将公钥同步到公开服务器后再重新 close：
>
> ```shell
> gpg --keyserver hkp://keyserver.ubuntu.com --send-keys xxx
> ```
>
> 其中 `xxx` 可通过 `gpg -k` 查看。

### 2.3 准备 Release Note

需要修改如下两处：

#### 2.3.1 GitHub Release 页面

```text
https://github.com/apache/doris/releases/tag/0.9.0-rc01
```

#### 2.3.2 Doris 官网下载页面

下载页面是 Markdown 文件，地址如下：

```text
docs/zh-CN/downloads/downloads.md
docs/en/downloads/downloads.md
```

需要完成两项修改：

1. 将上一次发布版本的下载包地址改为 Apache 的归档地址（见下节）。
2. 增加新版本的下载信息。

### 2.4 SVN 清理旧版本

#### 2.4.1 SVN 删除旧版本

SVN 只需要保存最新版本的包，新版本发布后需要清理旧版本。保持下面两个地址中只有最新版本的包即可：

```text
https://dist.apache.org/repos/dist/release/doris/
https://dist.apache.org/repos/dist/dev/doris/
```

#### 2.4.2 替换为归档地址

将 Doris 官网下载页面中旧版本包的下载地址改为归档页面地址：

| 类型 | URL |
|------|-----|
| 下载页面 | `http://doris.apache.org/downloads.html` |
| 归档页面 | `http://archive.apache.org/dist/doris` |

Apache 会有同步机制将历史的发布版本进行归档，具体操作见 [How to Archive](https://www.apache.org/legal/release-policy.html#how-to-archive)。即使旧的包从 SVN 上清除，仍然可以在归档页面中找到。

## 3. Announce 邮件

邮件标题：

```text
[ANNOUNCE] Apache Doris 1.xx release
```

发送至邮件组：

```text
dev@doris.apache.org
```

邮件正文：

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

## FAQ

### Q1：`svn mv` 报权限不足？

只有 PMC 成员才有 `release` SVN 目录的写权限。普通 Committer 需联系 PMC 成员代为操作。

### Q2：Maven 点击 `Release` 后报 `No public key`？

GPG 公钥未上传到公钥服务器。执行以下命令将公钥同步到公开服务器后重试：

```shell
gpg --keyserver hkp://keyserver.ubuntu.com --send-keys <KEY_ID>
```

`<KEY_ID>` 可通过 `gpg -k` 查看。

### Q3：官网下载链接 404？

可能原因：

- SVN release 目录文件刚提交，CDN 同步需要 10-30 分钟。
- 旧版本已清理，但下载页未替换为归档地址。

### Q4：用户下载旧版本时找不到？

旧版本会被 Apache 自动归档，下载页面需要把旧版本链接替换为 `http://archive.apache.org/dist/doris/<version>/` 路径。
