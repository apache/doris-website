---
{
    "title": "Upgrade",
    "language": "en",
    "description": "This guide provides step-by-step instructions for upgrading Doris using a storage-compute decoupling architecture (a.k.a. Cloud Mode)."
}
---

## Overview

This guide provides step-by-step instructions for upgrading Doris using a storage-compute decoupling architecture (a.k.a. Cloud Mode). Upgrades should be performed using the recommended steps in this section for cluster upgrades. Doris cluster upgrades can be carried out using a **rolling upgrade** method, which does not require all cluster nodes to be shut down for the upgrade, greatly minimizing the impact on applications.

## Doris Version Description

Doris uses a three numbers separated by dots version format, which can be viewed using the following SQL:

```sql
MySQL [(none)]> select @@version_comment;
+--------------------------------------------------------+
| @@version_comment                                      |
+--------------------------------------------------------+
| Doris version doris-3.0.3-rc03-43f06a5e26 (Cloud Mode) |
+--------------------------------------------------------+
```

> The 1st number in `3.0.3` represents the major version number, the 2nd number represents the minor version number, and the 3rd number represents the patch version number. In some cases, the version number may become a 4-numbers format, such as `2.0.2.1`, where the last number indicates an emergency bug fix version, which usually means that this patch version has some significant bugs.
>
> Doris has supported cloud mode deployment since version `3.0.0`. When deployed in this mode, the version number will have a Cloud Mode suffix. If started in the integrated storage and compute (a.k.a. Local) mode, there will be no such suffix.

Once Doris is deployed in cloud mode, it does not support switching back to local mode. Similarly, Doris in local mode does not support switching to cloud mode.

In principle, Doris supports upgrading from a lower version to a higher version and downgrading between patch versions. Downgrading between minor or major versions is not allowed.

## Upgrade Steps

### Upgrade Instructions

1. Make sure that your Doris is started in cloud mode. If you are not sure about the current deployment mode of Doris, refer to the instructions in the [previous section](#doris-version-description).
   For Doris in local mode, refer to [Cluster Upgrade](../admin-manual/cluster-management/upgrade) for upgrade steps.
2. Make sure that your Doris data import tasks have a retry mechanism to avoid task failures due to node restarts during the upgrade process.
3. Before upgrading, we recommend checking the status of all Doris components (MetaService, Recycler, Frontend and Backend) to ensure they are operating normally and without exception logs to avoid affecting the upgrade process.

### Overview of the Upgrade Process

1. Metadata backup
2. Upgrade MetaService
3. Upgrade Recycler (if have)
4. Upgrade BE
5. Upgrade FE
   1. Upgrade Observer FE first
   2. Then upgrade other non-Master FE
   3. Finally, upgrade Master FE

### Upgrade Pre-work

1. Backup the metadata directory of the Master FE. Usually, the metadata directory is the `doris-meta` directory under the FE home directory. If this directory is empty, it means that you had set another directory to save metadata. You can search for the `meta_dir` in the FE configuration file (conf/fe.conf).
2. [Download](/download) the package from the Doris official website. It is recommended to verify the SHA-512 hash to ensure that the package matches the one provided by Doris.

### Upgrade Process

#### 1. Upgrade MetaService

Assuming the following environment variables:
- `${MS_HOME}`: Working directory of MetaService.
- `${MS_PACKAGE_DIR}`: Directory containing the new MetaService package.

Follow these steps to upgrade each MetaService instance.

1.1. Stop the current MetaService:
```shell
cd ${MS_HOME}
sh bin/stop.sh
```

1.2. Backup the existing MetaService binaries:
```shell
mv ${MS_HOME}/bin bin_backup_$(date +%Y%m%d_%H%M%S)
mv ${MS_HOME}/lib lib_backup_$(date +%Y%m%d_%H%M%S)
```

1.3. Deploy the new package:
```shell
cp ${MS_PACKAGE_DIR}/bin ${MS_HOME}/bin
cp ${MS_PACKAGE_DIR}/lib ${MS_HOME}/lib
```

1.4. Start the new MetaService:
```shell
sh ${MS_HOME}/bin/start.sh --daemon
```

1.5. Check status of the new MetaService:

Verify that the new MetaService is running and that a new version number is present in `${MS_HOME}/log/doris_cloud.out`.

#### 2. Upgrade Recycler (if have)

:::caution
If you have not deployed the Recycler component separately, you can skip this step.
:::

Assuming the following environment variables:
- `${RECYCLER_HOME}`: Working directory of Recycler
- `${MS_PACKAGE_DIR}`: Directory containing the new MetaService package, MetaService and Recycler use same package.

Upgrade each Recycler instance by following these steps.

2.1. Stop the current Recycler:
```shell
cd ${RECYCLER_HOME}
sh bin/stop.sh
```

2.2. Backup existing Recycler binary files:
```shell
mv ${RECYCLER_HOME}/bin bin_backup_$(date +%Y%m%d_%H%M%S)
mv ${RECYCLER_HOME}/lib lib_backup_$(date +%Y%m%d_%H%M%S)
```

2.3. Deploy the new package:
```shell
cp ${RECYCLER_PACKAGE_DIR}/bin ${RECYCLER_HOME}/bin
cp ${RECYCLER_PACKAGE_DIR}/lib ${RECYCLER_HOME}/lib
```

2.4. Start the new Recycler:
```shell
sh ${RECYCLER_HOME}/bin/start.sh --recycler --daemon
```

2.5. Check status of the new Recycler:

Verify that the new MetaService is running and that a new version number is present in `${RECYCLER_HOME}/log/doris_cloud.out`.

#### 3. Upgrade BE

Verify that all instances of MetaService and Recycler (if installed separately) have been upgraded.

Assuming the following environment variables:
- `${BE_HOME}`: Working directory of BE.
- `${BE_PACKAGE_DIR}`: Directory containing the new BE package.

Upgrade each BE instance by following these steps.

3.1. Stop the current BE:
```shell
cd ${BE_HOME}
sh bin/stop_be.sh
```

3.2. Backup the existing BE binaries:
```shell
mv ${BE_HOME}/bin bin_backup_$(date +%Y%m%d_%H%M%S)
mv ${BE_HOME}/lib lib_backup_$(date +%Y%m%d_%H%M%S)
```

3.3. Deploy the new package:
```shell
cp ${BE_PACKAGE_DIR}/bin ${BE_HOME}/bin
cp ${BE_PACKAGE_DIR}/lib ${BE_HOME}/lib
```

3.4. Start the new BE:
```shell
sh ${BE_HOME}/bin/start_be.sh --daemon
```

3.5. Check status of the new BE:

Confirm that the new BE is running and operational with the new version. The status and version can be obtained using the following SQL.

```sql
show backends;
```

#### 4. Upgrade FE

Verify that all instances of BE have been upgraded.

Assuming the following environment variables:
- `${FE_HOME}`: Working directory of FE.
- `${FE_PACKAGE_DIR}`: Directory containing the new FE package.

Upgrade the Frontend (FE) instances in the following order:
1. Observer FE nodes
2. Non-master FE nodes
3. Master FE node

Upgrade each Frontend (FE) node by following these steps.

4.1. Stop the current FE:
```shell
cd ${FE_HOME}
sh bin/stop_fe.sh
```

4.2. Backup the existing FE binaries:
```shell
mv ${FE_HOME}/bin bin_backup_$(date +%Y%m%d_%H%M%S)
mv ${FE_HOME}/lib lib_backup_$(date +%Y%m%d_%H%M%S)
```

4.3. Deploy the new package:
```shell
cp ${FE_PACKAGE_DIR}/bin ${FE_HOME}/bin
cp ${FE_PACKAGE_DIR}/lib ${FE_HOME}/lib
```

4.4. Start the new FE:
```shell
sh ${FE_HOME}/bin/start_fe.sh --daemon
```

4.5. Check status of the new FE:

Confirm that the new FE is running and operational with the new version. The status and version can be obtained using the following SQL.

```sql
show frontends;
```

## FAQ

1. Does Doris in local mode need to turn off the replica balance function before upgrading, and is it necessary for clusters in cloud mode?

No. Because in cloud mode, the data is stored on HDFS or S3 services, so there is no need for replica balancing.

2. With a separate MetaService providing metadata services, why is it still necessary to backup metadata for FE?

Because currently, MetaService saves some metadata, and FE also saves some metadata. For safety reasons, we recommend backing up the metadata for FE.
