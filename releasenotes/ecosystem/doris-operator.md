---
{
    "title": "Doris Operator",
    "language": "en",
    "description": "Doris Operator release notes."
}
---

# Doris Operator

This document lists Doris Operator release notes in reverse chronological order.

## 25.8.0

Source: [Release Notes 25.8.0](https://github.com/apache/doris-operator/issues/472)

This version adds important DDC capabilities, including TLS support, PVC scaling, and pod debugging. It also improves Helm support, pod resource configuration, and reliability.

### Features and Improvements

- Added TLS access support for `dorisctl`. [#432](https://github.com/apache/doris-operator/pull/432)
- Supported TLS usage in Operator drop-node scenarios. [#434](https://github.com/apache/doris-operator/pull/434)
- Improved Helm chart templates. [#452](https://github.com/apache/doris-operator/pull/452)
- Allowed Helm and Operator charts to set Deployment resource quotas from `values.yaml`. [#462](https://github.com/apache/doris-operator/pull/462)
- Made Helm chart `kubeVersion` compatible with Kubernetes versions that include pre-release suffixes, such as EKS and GKE versions. [#463](https://github.com/apache/doris-operator/pull/463)
- Added DDC debugging capabilities. [#460](https://github.com/apache/doris-operator/pull/460) [#471](https://github.com/apache/doris-operator/pull/471)
- Added CPU resource awareness parameter passing for BE pods. [#464](https://github.com/apache/doris-operator/pull/464)
- Supported PVC expansion for DDC. [#467](https://github.com/apache/doris-operator/pull/467)
- Supported resource limit configuration for custom init container behavior. [#469](https://github.com/apache/doris-operator/pull/469)

### Bug Fixes

- Fixed unit test case issues. [#430](https://github.com/apache/doris-operator/pull/430) [#433](https://github.com/apache/doris-operator/pull/433)
- Fixed a resource leak caused by an unclosed SQL connection. [#437](https://github.com/apache/doris-operator/pull/437)
- Fixed FE PVC information collection. [#438](https://github.com/apache/doris-operator/pull/438)
- Fixed error log messages, duplicate environment variables, and other code defects. [#440](https://github.com/apache/doris-operator/pull/440) [#442](https://github.com/apache/doris-operator/pull/442) [#449](https://github.com/apache/doris-operator/pull/449)
- Fixed CVEs and updated security dependencies. [#453](https://github.com/apache/doris-operator/pull/453)
- Fixed MySQL SQL client structure definition mapping. [#468](https://github.com/apache/doris-operator/pull/468)

### Reliability

- Reused `BuildVolumesVolumeMountsAndPVCs` in the DDC MetaService controller to build PVCs, improving logic consistency. [#436](https://github.com/apache/doris-operator/pull/436)

### Downloads

Refer to the image repository description for image formats.

### Thanks

- [intelligentfu8](https://github.com/intelligentfu8)
- [ztonny](https://github.com/ztonny)
- [matiasbertani](https://github.com/matiasbertani)
- [jonasbrami](https://github.com/jonasbrami)
- [gohalo](https://github.com/gohalo)
- [catpineapple](https://github.com/catpineapple)

## 25.4.0

Source: [Release Notes 25.4.0](https://github.com/apache/doris-operator/issues/376)

This version mainly supports mounting shared disks on DCR and configuring pod annotations in Helm charts.

### Features and Improvements

- Supported configuring shared PVCs that need to be mounted on pods. [#375](https://github.com/apache/doris-operator/pull/375)
- Added pod annotation support in Doris Helm charts. [#327](https://github.com/apache/doris-operator/pull/327)

### Thanks

- [catpineapple](https://github.com/catpineapple)
- [bluicezhen](https://github.com/bluicezhen)

## 25.3.0

Source: [Release Notes 25.3.0](https://github.com/apache/doris-operator/issues/371)

This version improves PersistentVolume capabilities for `DorisCluster` and `DorisDisaggregatedCluster`, fixes bugs, and improves project examples and Helm build methods.

### Features and Improvements

- Added Helm `make` support in the Makefile for Helm releases. [#362](https://github.com/apache/doris-operator/pull/362)
- Added DCR PersistentVolume template configuration and linkage with configuration files. [#364](https://github.com/apache/doris-operator/pull/364)
- Added DDC PersistentVolume customization and `PersistentVolume` compatibility. [#369](https://github.com/apache/doris-operator/pull/369)

### Bug Fixes

- Avoided possible illegal strings in PVC names. [#368](https://github.com/apache/doris-operator/pull/368)
- Fixed scale-out failure when disaggregated Doris sets `adminUser`. [#367](https://github.com/apache/doris-operator/pull/367)

### Other Changes

- Added a new DDC example for affinity and password configuration. [#366](https://github.com/apache/doris-operator/pull/366)
- Removed unused API documentation. [#370](https://github.com/apache/doris-operator/pull/370)

### Thanks

- [catpineapple](https://github.com/catpineapple)
- [intelligentfu8](https://github.com/intelligentfu8)

## 25.2.0

Source: [Release Notes 25.2.0](https://github.com/apache/doris-operator/issues/351)

This version adds support for accessing Kerberos-protected data systems, upgrades Go and controller-runtime versions, improves runtime behavior, fixes bugs, and updates documentation.

### Features and Improvements

- Added Kerberos support in the Operator to access Kerberos-protected data systems. [#336](https://github.com/apache/doris-operator/pull/336) [#348](https://github.com/apache/doris-operator/pull/348)
- Improved BE initialization skipping and added environment variables to Doris Core. [#338](https://github.com/apache/doris-operator/pull/338)

### Bug Fixes

- Fixed a bug that could cause reconciliation while waiting for BE deployment. [#341](https://github.com/apache/doris-operator/pull/341)

### Other Changes

- Updated the base image in the Operator Dockerfile and changed the Go version to 1.23. [#337](https://github.com/apache/doris-operator/pull/337) [#346](https://github.com/apache/doris-operator/pull/346)
- Updated Go and controller-runtime from alpha v1 to v1. [#340](https://github.com/apache/doris-operator/pull/340)
- Bumped `golang.org/x/net` from 0.30.0 to 0.33.0. [#343](https://github.com/apache/doris-operator/pull/343)
- Updated README files. [#344](https://github.com/apache/doris-operator/pull/344) [#345](https://github.com/apache/doris-operator/pull/345) [#347](https://github.com/apache/doris-operator/pull/347) [#349](https://github.com/apache/doris-operator/pull/349) [#350](https://github.com/apache/doris-operator/pull/350)

### Downloads

- Operator image: [Docker Hub](https://hub.docker.com/r/apache/doris/tags), using tags with the `operator` prefix.
- Doris images: [Docker Hub](https://hub.docker.com/r/apache/doris/tags), using tags with the `ms`, `fe`, and `be` prefixes.

### Thanks

- [catpineapple](https://github.com/catpineapple)
- [intelligentfu8](https://github.com/intelligentfu8)
