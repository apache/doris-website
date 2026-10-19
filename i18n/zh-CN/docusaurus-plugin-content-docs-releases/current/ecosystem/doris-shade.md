---
{
    "title": "Doris Shade",
    "language": "zh-CN",
    "description": "Apache Doris Shade 版本发布说明、源码下载和 Maven Central 坐标。"
}
---

# Doris Shade

Apache Doris Shade 为 Apache Doris 打包经过 shading 处理的依赖。本文列出了其版本发布说明和下载入口。

## 4.1.0

发布日期：2026-10-19

来源：[Apache Doris Shade 4.1.0 GitHub Release](https://github.com/apache/doris-shade/releases/tag/doris-shade-4.1.0-rc2)

### 功能与改进

- 将 Paimon 升级至 2.1.0。[#64](https://github.com/apache/doris-shade/pull/64)

### Bug 修复

- 保留 shaded 产物中的依赖许可证文本。[#66](https://github.com/apache/doris-shade/pull/66)

### 下载

| 产物 | 下载 | 签名 | 校验和 |
| --- | --- | --- | --- |
| 源码包 | [apache-doris-shade-4.1.0-src.tar.gz](https://www.apache.org/dyn/closer.lua/doris/doris-shade/4.1.0/apache-doris-shade-4.1.0-src.tar.gz?action=download) | [ASC](https://downloads.apache.org/doris/doris-shade/4.1.0/apache-doris-shade-4.1.0-src.tar.gz.asc) | [SHA-512](https://downloads.apache.org/doris/doris-shade/4.1.0/apache-doris-shade-4.1.0-src.tar.gz.sha512) |

请使用 [Apache Doris 签名公钥](https://downloads.apache.org/doris/KEYS)，按照[版本验证说明](/community/release-and-verify/release-verify)验证源码包。

本次发布使用投票通过的 `doris-shade-4.1.0-rc2` tag，对应提交为 `65949e3403531b8e20f551dac88d5e66096e5c71`。

### Maven Central

可从 Maven Central 获取 [hive-catalog-shade 4.1.0 JAR](https://repo.maven.apache.org/maven2/org/apache/doris/hive-catalog-shade/4.1.0/hive-catalog-shade-4.1.0.jar) 和 [doris-shade 4.1.0 父 POM](https://repo.maven.apache.org/maven2/org/apache/doris/doris-shade/4.1.0/doris-shade-4.1.0.pom)。

```xml
<dependency>
    <groupId>org.apache.doris</groupId>
    <artifactId>hive-catalog-shade</artifactId>
    <version>4.1.0</version>
</dependency>
```
