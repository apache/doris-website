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

## 25.7.0

Source: [Release Notes 25.7.0](https://github.com/apache/doris-operator/issues/423)

This version improves drop-node compatibility and debug image builds. It also fixes DDC pod information mounts, PVC tests, and event handling.

### Features and Improvements

- Made drop-node operations compatible with renamed compute groups. [#417](https://github.com/apache/doris-operator/pull/417)
- Upgraded the Go version used to build the debug image. [#424](https://github.com/apache/doris-operator/pull/424)

### Bug Fixes

- Corrected spelling errors. [#413](https://github.com/apache/doris-operator/pull/413)
- Fixed missing pod information mounts for DDC containers. [#415](https://github.com/apache/doris-operator/pull/415)
- Fixed failing PVC construction unit tests. [#420](https://github.com/apache/doris-operator/pull/420)
- Prevented a nil pointer error when `EventString` is nil. [#422](https://github.com/apache/doris-operator/pull/422)

### Thanks

- [intelligentfu8](https://github.com/intelligentfu8)
- [ztonny](https://github.com/ztonny)

## 25.6.0

Source: [Release Notes 25.6.0](https://github.com/apache/doris-operator/issues/414)

This version extends `dorisctl` to storage-compute decoupled clusters and fixes PVC creation during initial deployment.

### Features and Improvements

- Supported using `dorisctl` to manage storage-compute decoupled Doris clusters. [#412](https://github.com/apache/doris-operator/pull/412)

### Bug Fixes

- Fixed PVCs not being created during initial deployment. [#410](https://github.com/apache/doris-operator/pull/410)

### Thanks

- [intelligentfu8](https://github.com/intelligentfu8)

## 25.5.3

Source: [Release Notes 25.5.3](https://github.com/apache/doris-operator/issues/408)

This version improves default images and documentation for DDC deployments, and prevents an internal reconciliation annotation from appearing in custom resources.

### Features and Improvements

- Used the BE image as the default init container image. [#405](https://github.com/apache/doris-operator/pull/405)
- Added two feature descriptions to the README. [#406](https://github.com/apache/doris-operator/pull/406)
- Added FoundationDB usage examples for different scenarios. [#407](https://github.com/apache/doris-operator/pull/407)

### Bug Fixes

- Prevented an annotation used only for reconciliation status checks from appearing in custom resources. [#404](https://github.com/apache/doris-operator/pull/404)

### Thanks

- [intelligentfu8](https://github.com/intelligentfu8)

## 25.5.2

Source: [Release Notes 25.5.2](https://github.com/apache/doris-operator/issues/403)

This version improves DDC reconciliation and debugging behavior.

### Features and Improvements

- Avoided redundant reconciliation when the `DorisDisaggregatedCluster` status is already consistent. [#399](https://github.com/apache/doris-operator/pull/399)
- Added the `apache.com.doris/runmode` annotation for entering debug mode. [#400](https://github.com/apache/doris-operator/pull/400)
- Made `DorisDisaggregatedCluster` reconciliation the default mode. [#402](https://github.com/apache/doris-operator/pull/402)

### Thanks

- [intelligentfu8](https://github.com/intelligentfu8)

## 25.5.1

Source: [Release Notes 25.5.1](https://github.com/apache/doris-operator/issues/398)

This version adds Kerberos support for DDC and aligns disaggregated release versions with the Operator version.

### Features and Improvements

- Added Kerberos support for DDC. [#396](https://github.com/apache/doris-operator/pull/396)

### Bug Fixes

- Aligned the disaggregated release version with the Operator version. [#395](https://github.com/apache/doris-operator/pull/395)

### Thanks

- [intelligentfu8](https://github.com/intelligentfu8)

## 25.5.0

Source: [Release Notes 25.5.0](https://github.com/apache/doris-operator/issues/394)

This version adds workload group and Helm chart support for storage-compute decoupled clusters. It also improves DDC initialization and fixes image, permission, and MetaService configuration issues.

### Features and Improvements

- Added workload group support for storage-compute decoupled Doris clusters. [#378](https://github.com/apache/doris-operator/pull/378)
- Added `DorisDisaggregatedCluster` resource reconciliation. [#379](https://github.com/apache/doris-operator/pull/379)
- Added Helm chart support for storage-compute decoupled Doris clusters. [#379](https://github.com/apache/doris-operator/pull/379) [#386](https://github.com/apache/doris-operator/pull/386) [#388](https://github.com/apache/doris-operator/pull/388) [#393](https://github.com/apache/doris-operator/pull/393)
- Allowed DDC to skip the default system initialization check. [#389](https://github.com/apache/doris-operator/pull/389)

### Bug Fixes

- Adjusted the default Operator image. [#377](https://github.com/apache/doris-operator/pull/377)
- Added an aggregated `ClusterRole`. [#380](https://github.com/apache/doris-operator/pull/380)
- Fixed the MetaService replica count for disaggregated clusters. [#382](https://github.com/apache/doris-operator/pull/382)

### Thanks

- [wdxxl](https://github.com/wdxxl)
- [catpineapple](https://github.com/catpineapple)
- [intelligentfu8](https://github.com/intelligentfu8)

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

## 25.2.1

Source: [Release Notes 25.2.1](https://github.com/apache/doris-operator/issues/360)

This version adds disaggregated cluster resources to the Helm chart, improves release-time version replacement and image repositories, and fixes Helm chart issues.

### Features and Improvements

- Added disaggregated custom resources to the Helm chart for deploying disaggregated clusters. [#355](https://github.com/apache/doris-operator/pull/355)
- Made version fields replaceable variables in the release process. [#354](https://github.com/apache/doris-operator/pull/354)
- Migrated images from the SelectDB repository to the Apache repository. [#357](https://github.com/apache/doris-operator/pull/357)

### Bug Fixes

- Reverted selected changes from PR 354. [#358](https://github.com/apache/doris-operator/pull/358)
- Fixed the Helm chart `apiVersion`. [#359](https://github.com/apache/doris-operator/pull/359)

### Thanks

- [xiacongling](https://github.com/xiacongling)
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

## 25.1.0

Source: [Release Notes 25.1.0](https://github.com/apache/doris-operator/issues/333)

This version improves BE scheduling and configuration updates, adds controller tests, fixes StatefulSet preparation, and migrates image tags to the Apache repository.

### Features and Improvements

- Added BE-to-FE affinity so the Operator prefers to schedule BEs on nodes that run FEs. [#328](https://github.com/apache/doris-operator/pull/328)
- Watched ConfigMap changes and restarted Doris when startup configuration changed. [#331](https://github.com/apache/doris-operator/pull/331)
- Allowed BEs to skip default system initialization. [#321](https://github.com/apache/doris-operator/pull/321)
- Added controller unit tests. [#322](https://github.com/apache/doris-operator/pull/322)

### Bug Fixes

- Fixed parameters passed to `prepareStatefulsetApply`. [#326](https://github.com/apache/doris-operator/pull/326)

### Other Changes

- Migrated all image tags from the SelectDB repository to the Apache repository. [#329](https://github.com/apache/doris-operator/pull/329)

### Thanks

- [catpineapple](https://github.com/catpineapple)
- [intelligentfu8](https://github.com/intelligentfu8)

## 24.2.0

Source: [Release Note 24.2.0](https://github.com/apache/doris-operator/issues/319)

This version adds multi-secret support for `DorisDisaggregatedCluster` and decommission-based BE scale-down for compute groups. It also improves Arrow Flight SQL exposure, resource cleanup, tests, documentation, and examples.

### Features and Improvements

- Supported scaling down BEs in DDC compute groups through decommissioning. [#306](https://github.com/apache/doris-operator/pull/306)
- Supported username and password configuration and multiple secrets for DDC. [#312](https://github.com/apache/doris-operator/pull/312)
- Exposed Arrow Flight SQL ports as container ports. [#295](https://github.com/apache/doris-operator/pull/295)
- Exposed Arrow Flight SQL ports in disaggregated services. [#307](https://github.com/apache/doris-operator/pull/307)
- Expanded unit test coverage. [#315](https://github.com/apache/doris-operator/pull/315)
- Refactored compute group resource cleanup. [#318](https://github.com/apache/doris-operator/pull/318)

### Bug Fixes

- Fixed SQL client behavior when dropping compute groups. [#314](https://github.com/apache/doris-operator/pull/314)
- Fixed service labels. [#318](https://github.com/apache/doris-operator/pull/318)
- Fixed compute group removal when `UniqueId` contains a hyphen. [#318](https://github.com/apache/doris-operator/pull/318)
- Added safety checks for FE scale-down during cluster updates. [#320](https://github.com/apache/doris-operator/pull/320)

### Other Changes

- Improved the README. [#303](https://github.com/apache/doris-operator/pull/303)
- Removed unused files, including obsolete Dockerfile and DDM code. [#309](https://github.com/apache/doris-operator/pull/309) [#314](https://github.com/apache/doris-operator/pull/314)
- Improved `DorisDisaggregatedCluster` CRD examples. [#313](https://github.com/apache/doris-operator/pull/313)

### Thanks

- [jonasbrami](https://github.com/jonasbrami)
- [hechao-ustc](https://github.com/hechao-ustc)
- [intelligentfu8](https://github.com/intelligentfu8)
- [catpineapple](https://github.com/catpineapple)

## 24.1.0

Source: [Release Note 24.1.0](https://github.com/apache/doris-operator/issues/293)

This version adds workload group support to `DorisCluster`, introduces rolling restarts, and fixes FE deployment and access issues.

Workload groups require the official Apache Doris 2.1.7 image or later. For earlier Doris versions, build a compatible image manually.

### Features and Improvements

- Added workload group support for Doris BEs. [#289](https://github.com/apache/doris-operator/pull/289)
- Added rolling restarts for Doris clusters. [#292](https://github.com/apache/doris-operator/pull/292)
- Updated the controller-gen version in the Makefile. [#275](https://github.com/apache/doris-operator/pull/275)
- Added license checks to GitHub Actions. [#278](https://github.com/apache/doris-operator/pull/278) [#279](https://github.com/apache/doris-operator/pull/279) [#280](https://github.com/apache/doris-operator/pull/280)
- Added a default issue template. [#288](https://github.com/apache/doris-operator/pull/288)

### Bug Fixes

- Fixed a nil pointer error when FE `electionNumber` is not set in a `DorisCluster` resource. [#285](https://github.com/apache/doris-operator/pull/285)
- Fixed the FE access address to use the service name and namespace. [#291](https://github.com/apache/doris-operator/pull/291)

### Thanks

- [intelligentfu8](https://github.com/intelligentfu8)
- [catpineapple](https://github.com/catpineapple)

## 24.0.0

Source: [Release Note 24.0.0](https://github.com/apache/doris-operator/issues/272)

This version introduces the `DorisDisaggregatedCluster` (DDC) custom resource for deploying storage-compute decoupled Apache Doris clusters. It also expands support for storage-compute coupled deployments through `DorisCluster` (DCR).

DDC requires Apache Doris 3.0.2 or later.

### New Features

#### DorisDisaggregatedCluster

- Added FoundationDB module access. [#186](https://github.com/apache/doris-operator/pull/186)
- Added MetaService module deployment. [#194](https://github.com/apache/doris-operator/pull/194)
- Added FE module deployment. [#199](https://github.com/apache/doris-operator/pull/199)
- Added compute group module deployment. [#185](https://github.com/apache/doris-operator/pull/185) [#189](https://github.com/apache/doris-operator/pull/189) [#192](https://github.com/apache/doris-operator/pull/192) [#197](https://github.com/apache/doris-operator/pull/197)
- Added image entrypoint support for disaggregated Doris components. [#195](https://github.com/apache/doris-operator/pull/195) [#196](https://github.com/apache/doris-operator/pull/196)
- Added FE scale-down. [#225](https://github.com/apache/doris-operator/pull/225)
- Added compute group scale-down and resource cleanup. [#238](https://github.com/apache/doris-operator/pull/238)
- Added FE scale-down through the SQL interface. [#255](https://github.com/apache/doris-operator/pull/255)
- Added compute group scale-down through the SQL interface. [#256](https://github.com/apache/doris-operator/pull/256)

#### DorisCluster

- Exposed the Arrow Flight SQL port through external services. [#251](https://github.com/apache/doris-operator/pull/251)

### Improvements

#### DorisDisaggregatedCluster

- Supported creating compute groups through `be.conf` and PVC configuration. [#198](https://github.com/apache/doris-operator/pull/198)
- Improved the README and DDC example YAML files. [#203](https://github.com/apache/doris-operator/pull/203) [#210](https://github.com/apache/doris-operator/pull/210) [#211](https://github.com/apache/doris-operator/pull/211) [#214](https://github.com/apache/doris-operator/pull/214)
- Updated README examples to use the latest version. [#220](https://github.com/apache/doris-operator/pull/220)
- Added an Operator switch for enabling DDC deployments. [#204](https://github.com/apache/doris-operator/pull/204)
- Added `SystemInitialization` to prepare system environments. [#212](https://github.com/apache/doris-operator/pull/212)
- Kept compute group terminology aligned with Doris naming changes. [#215](https://github.com/apache/doris-operator/pull/215) [#245](https://github.com/apache/doris-operator/pull/245)
- Removed the MetaService replicas CRD. [#227](https://github.com/apache/doris-operator/pull/227)
- Reworked the MetaService CRD into the `DorisDisaggregatedCluster` CRD. [#234](https://github.com/apache/doris-operator/pull/234)
- Changed the compute group identifier to `UniqueId` for the new SQL interface. [#239](https://github.com/apache/doris-operator/pull/239)
- Added an FE SQL image entrypoint and cluster ID hash code. [#249](https://github.com/apache/doris-operator/pull/249)
- Migrated DDC operations from the HTTP interface to the SQL interface. [#254](https://github.com/apache/doris-operator/pull/254)
- Added `timeoutSeconds` for pod liveness probes. [#257](https://github.com/apache/doris-operator/pull/257)
- Added `logNotStore` so FEs can skip log PVC creation. [#266](https://github.com/apache/doris-operator/pull/266)
- Updated DDC examples and documentation. [#268](https://github.com/apache/doris-operator/pull/268)

#### DorisCluster

- Added `timeoutSeconds` for pod liveness probes. [#257](https://github.com/apache/doris-operator/pull/257)

#### Other Changes

- Added unit tests for common utilities. [#226](https://github.com/apache/doris-operator/pull/226)
- Added unit tests for resource and controller models. [#232](https://github.com/apache/doris-operator/pull/232)
- Updated Helm chart configuration for Artifact Hub. [#244](https://github.com/apache/doris-operator/pull/244)
- Changed the organization name from SelectDB to Apache. [#247](https://github.com/apache/doris-operator/pull/247)

### Bug Fixes

#### DorisDisaggregatedCluster

- Fixed pod affinity and StatefulSet PVC pointer handling. [#209](https://github.com/apache/doris-operator/pull/209)
- Corrected the default BE storage path. [#243](https://github.com/apache/doris-operator/pull/243)
- Fixed pod restarts during initial deployment caused by a duplicate `ms_token` environment variable. [#259](https://github.com/apache/doris-operator/pull/259)
- Fixed the BE ConfigMap path used by the image entrypoint. [#261](https://github.com/apache/doris-operator/pull/261)
- Fixed deployments with a nil `electionNumber` and stopped services from updating continuously. [#262](https://github.com/apache/doris-operator/pull/262) [#266](https://github.com/apache/doris-operator/pull/266)
- Fixed repeated reconciliation. [#263](https://github.com/apache/doris-operator/pull/263) [#265](https://github.com/apache/doris-operator/pull/265)
- Corrected the default BE cache path. [#266](https://github.com/apache/doris-operator/pull/266)

#### DorisCluster

- Prevented Operator upgrades from restarting Doris pods. [#226](https://github.com/apache/doris-operator/pull/226)
- Used deep copies when merging shared pod environment variable arrays. [#236](https://github.com/apache/doris-operator/pull/236)
- Fixed MySQL client failures when scaling down FEs across namespaces. [#240](https://github.com/apache/doris-operator/pull/240)
- Fixed deployment failures when `electionNumber` is nil. [#260](https://github.com/apache/doris-operator/pull/260)

#### Other Changes

- Fixed resource model unit tests for StatefulSets. [#252](https://github.com/apache/doris-operator/pull/252)

### Thanks

- [intelligentfu8](https://github.com/intelligentfu8)
- [catpineapple](https://github.com/catpineapple)
- [hechao-ustc](https://github.com/hechao-ustc)
