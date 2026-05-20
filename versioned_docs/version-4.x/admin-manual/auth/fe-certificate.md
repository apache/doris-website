---
{
    "title": "Secure HTTP Transport",
    "language": "en",
    "description": "Enable HTTPS/SSL encryption for the Doris FE interface: configure certificate path, password, type, alias, and other parameters to secure FE communication.",
    "keywords": [
        "Doris HTTPS",
        "Doris SSL",
        "FE certificate configuration",
        "enable_https",
        "key_store_path",
        "key_store_password",
        "key_store_type",
        "key_store_alias",
        "JKS keystore",
        "FE HTTPS encryption",
        "self-signed certificate",
        "CA certificate"
    ]
}
---

<!-- Knowledge type: Procedure / Configuration parameters -->
<!-- Applicable scenarios: Enabling HTTPS encryption for the FE interface / Certificate deployment -->

This article describes how to enable HTTPS (SSL) encrypted transport for the Doris FE interface. By configuring an SSL key and certificate, you ensure the confidentiality and integrity of communication between clients and the FE.

:::tip

Starting from version 2.0, Doris supports SSL key and certificate configuration.

:::

## Applicable Scenarios

| Scenario | Applicable |
| --- | --- |
| Production environment that needs to encrypt the FE HTTP interface | Applicable. A CA-issued certificate is recommended. |
| Internal testing or development environment verifying the HTTPS flow | Applicable. A self-signed certificate can be used. |
| Cluster-internal communication only, no external access required | Optional |

## Prerequisites

- Doris version >= 2.0
- An available SSL certificate (in a keystore format such as JKS), or an environment in which a self-signed certificate can be generated
- File system access to the FE node, so that the certificate can be placed and `conf/fe.conf` can be modified

## Configuration Workflow Overview

1. Prepare the SSL certificate (purchase one or generate a self-signed certificate).
2. Copy the certificate to the designated path on the FE.
3. Modify the FE configuration file `conf/fe.conf` and enable HTTPS.
4. Restart the FE to apply the configuration.

## Procedure

### Step 1: Prepare the SSL certificate

Purchase or generate a self-signed SSL certificate. For production environments, a CA-issued certificate is recommended to avoid certificate-not-trusted warnings on the client side.

### Step 2: Place the certificate file

Copy the SSL certificate to the designated path. The default path is `${DORIS_HOME}/conf/ssl/`, and you can also specify a custom path.

### Step 3: Modify the FE configuration

Modify the FE configuration file `conf/fe.conf`. The following parameters must match the SSL certificate you purchased or generated:

- Set `enable_https = true` to enable HTTPS. The default is `false`.
- Set the certificate path `key_store_path`. The default is `${DORIS_HOME}/conf/ssl/doris_ssl_certificate.keystore`.
- Set the certificate password `key_store_password`. The default is empty.
- Set the certificate type `key_store_type`. The default is `JKS`.
- Set the certificate alias `key_store_alias`. The default is `doris_ssl_certificate`.

### Step 4: Restart the FE

After modifying the configuration, restart the FE node for the configuration to take effect.

## Configuration Parameter Reference

<!-- Knowledge type: Configuration parameters -->

| Parameter | Default | Description |
| --- | --- | --- |
| `enable_https` | `false` | Whether to enable HTTPS for the FE. Set to `true` to enable. |
| `key_store_path` | `${DORIS_HOME}/conf/ssl/doris_ssl_certificate.keystore` | Path to the SSL certificate file. Must match the actual storage location. |
| `key_store_password` | Empty | SSL certificate password. Must match the password set when the certificate was generated. |
| `key_store_type` | `JKS` | Certificate type. Must match the actual type of the certificate. |
| `key_store_alias` | `doris_ssl_certificate` | Certificate alias. Must match the alias defined in the certificate. |

## FAQ

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenarios: Troubleshooting HTTPS enablement failures -->

### Q: The FE fails to start after HTTPS is enabled.

The file pointed to by `key_store_path` does not exist, or the path has insufficient permissions. Check that the certificate path is correct and confirm that the FE process has read permission on that path.

### Q: Startup reports an error indicating that the certificate failed to load.

`key_store_password`, `key_store_type`, or `key_store_alias` does not match the actual information of the certificate. Verify the password, type, and alias used when the certificate was generated, and make sure they match the configuration in `fe.conf`.

### Q: The browser shows a certificate-not-trusted warning.

A self-signed certificate is being used. In production environments, switch to a CA-issued certificate, or manually trust this certificate on the client side.

### Q: HTTPS still does not take effect after the configuration is modified.

The FE was not restarted, or only some FE nodes had their configuration modified. Make sure all FE nodes have consistent configuration and have been restarted.
