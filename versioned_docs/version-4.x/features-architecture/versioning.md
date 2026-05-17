---
{
  "title": "Version Notes",
  "description": "What are the version numbering rules for Apache Doris? How do you choose between Latest and Stable releases? What preparations are required before upgrading? This document explains the meaning of Doris version numbers, upgrade and downgrade policies, and version selection recommendations in detail.",
  "language": "en"
}
---

## What is a version number?

Apache Doris uses a three-part version number (X.Y.Z), where each digit represents a different release type:

| Version Position | Name | Description |
|------------------|------|-------------|
| X | Major version | Major feature releases or architectural upgrades, on a roughly 1-year cycle |
| Y | Minor version | Important features and performance improvements, on a roughly quarterly cycle |
| Z | Patch version | Bug fixes and performance improvements, on a 2-4 week cycle |

**Example**: Version `2.1.0` indicates major version 2, minor version 1, and patch version 0.

---

## What you must know before upgrading

### Compatibility differences across version positions

| Version Type | Metadata / Data Format Changes | Compatibility Notes |
|--------------|--------------------------------|---------------------|
| Major version (X) | May occur | Forward compatible, but backward compatibility is not guaranteed |
| Minor version (Y) | No changes | Both forward and backward compatibility are guaranteed as long as no new features are used |
| Patch version (Z) | No changes | Fully forward and backward compatible, free to upgrade or downgrade |

:::warning Important
When upgrading a major version, **downgrading to the older version is not guaranteed**. Back up your data before upgrading.
:::

### Pre-upgrade checklist

-  Confirm whether the target version is a major, minor, or patch release
-  Back up important data and metadata
-  Verify the upgrade procedure in a test environment
-  Review the version compatibility notes (if any)

---

## How to choose a version

Apache Doris maintains two latest version branches:

| Version Type | Use Cases | Description |
|--------------|-----------|-------------|
| **Latest** | POC, performance testing, trying new features | Includes the latest features, may be unstable |
| **Stable** | Production environments | Continues to receive bug fixes, high stability |

**Selection guidance**:
- Production environments: choose **Stable**
- Exploration and testing: choose **Latest**

---

## CPU model and binary selection

Doris provides three binary versions corresponding to different CPU instruction sets:

| Version | Applicable CPU | Description |
|---------|----------------|-------------|
| x64 (avx2) | x86_64 CPUs that support the avx2 instruction set | Best performance |
| x64 (no avx2) | x86_64 CPUs that do not support avx2 | Compatibility first |
| ARM64 | ARM-architecture CPUs | Apple M-series, Kunpeng, and others |

### How to determine whether your CPU supports avx2

```bash
cat /proc/cpuinfo | grep avx2
```

If the command produces output, the CPU supports the avx2 instruction set, and you can choose the x64 (avx2) build for better performance.

---

## Upgrade rules across versions

The matrix below lists the considerations for upgrading between versions. The contents of this table will be updated continuously.

### Version upgrade compatibility matrix

TODO

| Current version → Target version | 3.0.x | 3.1.x | 4.0.x | 4.1.x |
|----------------------------------|-------|-------|-------|-------|
| **3.0.x** | - | | | |
| **3.1.x** | | - | | |
| **4.0.x** | | | - | |
| **4.1.x** | | | | - |

:::tip Notes
- "-" indicates no upgrade is needed (current version)
- Blank cells indicate that upgrade notes are still to be added
- Always read the upgrade documentation for the target version before upgrading
:::

---

## Frequently asked questions

### Q: Can I upgrade from 2.0 to 3.1?

Yes. However, a major version upgrade may involve data format changes. Before upgrading:

1. Back up your data
2. Verify in a test environment
3. Prepare a rollback plan

### Q: Can patch versions be upgraded at any time?

Yes. Patch versions (such as 2.1.0 to 2.1.1) are guaranteed to be both forward and backward compatible, so you can upgrade or downgrade at any time.

### Q: How do I check the current Doris version?

Run `SELECT VERSION();` to query the current version.

### Q: Where can I download the Latest and Stable versions?

Visit the [Apache Doris download page](https://doris.apache.org/download) for download links to all versions.

---

## Related documents

- [TODO] - Detailed cluster upgrade steps
- [TODO] - How to back up data
