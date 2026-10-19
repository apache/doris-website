---
{
    "title": "Doris Shade",
    "language": "en",
    "description": "Apache Doris Shade release notes, source downloads, and Maven Central coordinates."
}
---

# Doris Shade

Apache Doris Shade packages shaded dependencies used by Apache Doris. This page lists its release notes and downloads.

## 4.1.0

Release date: 2026-10-19

Source: [Apache Doris Shade 4.1.0 GitHub Release](https://github.com/apache/doris-shade/releases/tag/doris-shade-4.1.0-rc2)

### Features and Improvements

- Upgrade Paimon to 2.1.0. [#64](https://github.com/apache/doris-shade/pull/64)

### Bug Fixes

- Preserve dependency license texts in shaded artifacts. [#66](https://github.com/apache/doris-shade/pull/66)

### Downloads

| Artifact | Download | Signature | Checksum |
| --- | --- | --- | --- |
| Source archive | [apache-doris-shade-4.1.0-src.tar.gz](https://www.apache.org/dyn/closer.lua/doris/doris-shade/4.1.0/apache-doris-shade-4.1.0-src.tar.gz?action=download) | [ASC](https://downloads.apache.org/doris/doris-shade/4.1.0/apache-doris-shade-4.1.0-src.tar.gz.asc) | [SHA-512](https://downloads.apache.org/doris/doris-shade/4.1.0/apache-doris-shade-4.1.0-src.tar.gz.sha512) |

Use the [Apache Doris signing keys](https://downloads.apache.org/doris/KEYS) and the [release verification instructions](/community/release-and-verify/release-verify) to verify the source archive.

The release uses the approved `doris-shade-4.1.0-rc2` tag at commit `65949e3403531b8e20f551dac88d5e66096e5c71`.

### Maven Central

The [hive-catalog-shade 4.1.0 JAR](https://repo.maven.apache.org/maven2/org/apache/doris/hive-catalog-shade/4.1.0/hive-catalog-shade-4.1.0.jar) and [doris-shade 4.1.0 parent POM](https://repo.maven.apache.org/maven2/org/apache/doris/doris-shade/4.1.0/doris-shade-4.1.0.pom) are available from Maven Central.

```xml
<dependency>
    <groupId>org.apache.doris</groupId>
    <artifactId>hive-catalog-shade</artifactId>
    <version>4.1.0</version>
</dependency>
```
