---
{
    "title": "Catalog Property Masking",
    "language": "en",
    "description": "Understand how Doris masks Catalog credentials, JDBC strings, URLs, SDK and Hadoop properties in SHOW output, audit SQL and lineage.",
    "keywords": ["catalog property masking", "catalog credentials", "SHOW CATALOG", "JDBC URL", "datasource_sensitive_property_pattern"],
    "doc_type": "reference"
}
---

Doris masks sensitive external Catalog properties in supported display and audit paths. Masking replaces a whole value or a sensitive URL parameter with `*XXX`; some internal properties are omitted entirely. Connectors continue using the original values.

:::info Version scope
This page describes the current development version. The complete policy and `datasource_sensitive_property_pattern` are not available in every 4.x or 3.x build. Check the documentation and release notes for your deployed version before relying on these rules. A password masked in an older SHOW example does not imply that all access keys, tokens or connection strings are masked in that version.
:::

## Quick Start

For an existing Catalog that you have permission to view:

```sql
SHOW CATALOG example_catalog;
SHOW CREATE CATALOG example_catalog;
SELECT `Property`, `Value`
FROM catalogs()
WHERE CatalogName = 'example_catalog'
ORDER BY `Property`;
```

The following mappings illustrate the output policy; they do not require a connection to the example endpoints:

| Property | Original value | Displayed value |
|---|---|---|
| `mc.session_token` | `example-token` | `*XXX` |
| `ozone.access_key` | `example-key` | `*XXX` |
| `jdbc_url` | `jdbc:mysql://db.example.com:3306/example` | `*XXX` |
| `uri` | `https://api.example.com/catalog` | `https://api.example.com/catalog` |
| `iceberg.rest.uri` | `https://user:pass@api.example.com/catalog?token=example&region=east` | `https://api.example.com/catalog?token=*XXX&region=east` |
| `hosts` | `host1.example.com:9000,host2.example.com:9000` | Unchanged |
| `endpoint` | `https://api.example.com/?X-Amz-Signature=example` | `*XXX` |

Masked output cannot recover the original secret. Use your configuration management or secret store when recreating or changing a Catalog.

## Where Masking Applies

| Output | Behavior |
|---|---|
| `SHOW CATALOG`, `SHOW CREATE CATALOG`, `catalogs()` | Apply the shared property-name and value rules. Hidden properties remain omitted. |
| CREATE / ALTER CATALOG SQL in the audit log | Replace sensitive properties in the statement text using the same rules. |
| Catalog properties in lineage metadata | Omit properties whose names are sensitive; sanitize retained properties that contain connection strings or URL credentials. |
| Typed connector property diagnostics | Fields declared sensitive by a connector render as `***`, or `<empty>` when unset. A structured URI can be sensitive in diagnostics while still using value-aware masking in Catalog output. |

The same masking-enabled property renderer is used by some resource, storage-vault and job SQL paths. This does not mean that every resource proc result, SDK diagnostic, HTTP response or application log uses this renderer.

## Property Name Rules

Doris takes the union of:

1. Built-in sensitive names and the secret aliases or namespaces registered by loaded connectors and filesystem providers.
2. Permanent connection-string, native credential and Hadoop credential name rules.
3. The configurable supplemental name expression described below.

Exact secret names are compared case-insensitively. A sensitive name takes precedence over value parsing: a harmless-looking endpoint stored under `custom.password` is still hidden when that name matches the policy. Property names themselves remain visible.

### Catalog and Metastore Credentials

The table lists representative names and special rules. Accepted aliases of a declared secret field follow the same protection; this is not a list of the only names that can be sensitive.

| Catalog or service | Whole-value masking |
|---|---|
| JDBC | `password`, `jdbc.password`, and explicit JDBC connection properties such as `jdbc_url`. An embedded password is not required for a JDBC connection string to be hidden. |
| MongoDB | `mongodb.uri` and `mongodb.password`. The MongoDB URI is always hidden, including when it has no visible password. |
| MaxCompute | `mc.access_key`, `mc.secret_key`, `mc.session_token`. |
| Iceberg REST | `iceberg.rest.oauth2.token`, `iceberg.rest.oauth2.credential`, `iceberg.rest.access-key-id`, `iceberg.rest.secret-access-key`, `iceberg.rest.session-token`. REST service URIs use the address rules below. |
| Iceberg JDBC / Paimon JDBC | `iceberg.jdbc.password`, `paimon.jdbc.password`, `jdbc.password`, and explicit JDBC URI properties. The shared `uri` alias is hidden when its value starts with `jdbc:`. |
| Paimon REST | `paimon.rest.dlf.access-key-id`, `paimon.rest.dlf.access-key-secret`, plus credential names recognized by the shared rules. |
| Glue / retained DLF properties | Glue aliases such as `glue.access_key`, `glue.secret_key`, `aws.glue.access-key`, `aws.glue.secret-key`, `aws.glue.session-token`; retained DLF aliases such as `dlf.access_key`, `dlf.secret_key`, `dlf.session_token`, `dlf.catalog.accessKeyId`, `dlf.catalog.accessKeySecret`, `dlf.catalog.sessionToken`, `dlf.catalog.securityToken`. Retaining a masking rule does not imply support for creating that metastore type. |
| Fluss | `fluss.client.security.sasl.username`, `fluss.client.security.sasl.password`, `fluss.client.security.sasl.jaas.config`. Under `fluss.lake.paimon.`, a name containing `key`, `secret`, `password`, `token` or `credential` is sensitive. |
| Trino | Under `trino.`, a name containing `key`, `secret`, `password`, `token` or `credential` is sensitive, for example `trino.keytab` or `trino.connection-password`. |
| ADBC | `password`; under `adbc.`, a name containing `key`, `secret`, `password`, `token`, `credential` or `authorization` is sensitive. Connection URIs also use the address rules. |
| Elasticsearch | Declared password aliases such as `elasticsearch.password`; endpoint values use the address rules. |
| Other Catalogs | The same global policy applies according to their metastore, filesystem and credential properties. A Catalog type alone does not make every property sensitive. |

The namespace rules for Fluss, Trino and ADBC perform case-insensitive substring matching in the name after the prefix. For example, `trino.monkey` also contains `key` and is masked. These registered rules still apply when the supplemental expression is disabled.

### Storage and Native SDK Credentials

| Property family | Sensitive fields and representative aliases |
|---|---|
| S3 | Access keys, secret keys and session tokens: `s3.access_key`, `s3.secret_key`, `s3.session_token`, `s3.access-key-id`, `s3.secret-access-key`, `s3.session-token`, and declared bare/AWS aliases. |
| GCS | `gs.access_key`, `gs.secret_key`, `gs.session_token`, and their declared S3/AWS aliases. |
| Azure | Account-name/access-key aliases, account keys and OAuth client secrets, including `azure.account_name`, `azure.access_key`, `azure.account_key`, `azure.secret_key`, `azure.oauth2_client_secret`, `AZURE_ACCOUNT_KEY`, `AZURE_CLIENT_SECRET`. An explicitly protected account identifier remains hidden even when it is not a password. |
| OSS / OSS-HDFS | Access keys, secret keys, session/security tokens, including `oss.access_key`, `oss.secret_key`, `oss.session_token`, `oss.hdfs.access_key`, `oss.hdfs.secret_key`, `oss.hdfs.security_token`, `oss.security_token`, plus `OSS_ACCESS_KEY`, `OSS_SECRET_KEY`, `OSS_SESSION_TOKEN`, `OSS_TOKEN`. |
| COS | `cos.access_key`, `cos.secret_key`, `cos.session_token`, `COS_ACCESS_KEY`, `COS_SECRET_KEY`, `COS_SESSION_TOKEN`, `COS_TOKEN`, and declared S3 aliases. |
| OBS | `obs.access_key`, `obs.secret_key`, `obs.session_token`, `OBS_ACCESS_KEY`, `OBS_SECRET_KEY`, `OBS_SESSION_TOKEN`, `OBS_TOKEN`, and declared S3 aliases. |
| MinIO | `minio.access_key`, `minio.secret_key`, `minio.session_token`, and declared S3/AWS aliases. |
| Ozone | `ozone.access_key`, `ozone.secret_key`, `ozone.session_token`, and declared S3 aliases. |
| Native SDK credentials | Bare `token`, `credential`, `credentials`, or names ending in one of these components after `.`, `_` or `-`, are always hidden. This also covers unprefixed SDK properties retained in a Catalog. |
| Other built-in secrets | Names such as `kerberos_keytab_content`, `bos_secret_accesskey` and AI API-key properties remain protected. |

Some generated storage aliases, such as exact uppercase `AWS_ACCESS_KEY`, `AWS_SECRET_KEY` and `AWS_TOKEN`, are omitted from printable maps rather than returned with a mask. Do not depend on SHOW output to enumerate or back up every stored property.

### Hadoop Credentials

These permanent rules are case-insensitive and also recognize a namespace before `fs.`, such as `hadoop.fs.s3a.secret.key`:

| Family | Whole-value masking |
|---|---|
| `fs.s3.*`, `fs.s3a.*` | `access.key`, `secret.key`, `session.token`, `encryption.key`, `server-side-encryption.key`, `proxy.password`; also `bucket.<bucket>.` scopes, including dotted bucket names. |
| `fs.azure.*` | `account.key`, `sas`, `sas.fixed.token`, `account.oauth2.client.secret`, `account.oauth2.refresh.token`, `encryption.encoded.client-provided.key`, including account/container suffixes. |
| `fs.adl.oauth2.*` | `credential`, `refresh.token`. |
| `fs.oss.*` | `accessKeyId`, `accessKeySecret`, `securityToken`. |
| `fs.cosn.*` | `secretId`, `secretKey`, including the `userInfo.` scope. |
| `fs.obs.*` | `access.key`, `secret.key`, `session.token`, `security.token`. |

A file path naming a credential file is not the file's contents. These name rules do not read or scan the referenced file.

## JDBC Strings and Address Values

### Whole Connection Strings

Names ending in a delimited JDBC URL/URI component, such as `jdbc_url`, `jdbc.jdbc_url`, `iceberg.jdbc.uri` or `paimon.jdbc.uri`, are entirely hidden. The suffixes `connectionString`, `connection_string`, `connection-string` and `connection.string` are also hidden.

Any trimmed value starting with `jdbc:` is entirely hidden, regardless of its property name or case. This covers opaque driver syntaxes such as Oracle connection strings under `uri`.

### Hosts and URLs

Doris examines names ending in a delimited `uri`, `url`, `host`, `endpoint` or `address`, including their plural forms. Hierarchical URI-shaped values are also examined under other property names, such as `warehouse`.

| Value | Result |
|---|---|
| Plain host or host:port, bracketed IPv6, comma-separated plain hosts | Visible when the form and numeric port are valid. Ports must be in 0–65535. |
| Supported URL with ordinary authentication userinfo | Remove userinfo; preserve the safe host, port and path. |
| Secret query parameters | Decode names before classification; mask every matching value, including duplicate parameters. |
| URL fragment | Remove it. |
| Authorization signature | Hide the entire URL when a parameter name contains `signature` or a delimited `sig` / `sas`. |
| Unknown scheme, opaque format, malformed authority/port/escape/query name, URL list or a URL containing commas, ambiguous matrix path or nested connection string | Hide the entire value. There is no raw-value fallback when parsing fails. |

Supported schemes are `http`, `https`, `thrift`, `hdfs`, `viewfs`, `file`, `s3`, `s3a`, `s3n`, `oss`, `cos`, `cosn`, `obs`, `gs`, `abfs`, `abfss`, `wasb` and `wasbs`.

Query-name checks include the name rules above, plus password/passwd/pwd, secret/token/credential, access/API/account/private/auth/application-key spellings, `authorization`, bare `auth` and bare `key`. Ordinary URL query separators are normalized to `&`. Nested URL/JDBC values or unreliable repeated encoding cause the whole address to be hidden.

### Native Storage and Local Paths

- In ABFS/WASB URIs, a valid `container@host` identifies storage, rather than a login. Preserve the container; reject missing, encoded, malformed or password-bearing container forms.
- Preserve valid GCS bucket authorities containing underscores, HDFS/ViewFS absolute locations with a default authority, and ViewFS logical mount names.
- Preserve unambiguous absolute POSIX local `driver_url` paths and absolute `file:/...` / `file:///...` locations. Ambiguous syntax remains hidden. This is a display rule and does not change driver-loading restrictions.
- For internal streaming S3 audit only, Doris sanitizes each selected file before assembling the escaped batch glob, using the policy effective when the audit event is emitted. It preserves literal `#`, percent spellings, `+`, spaces and non-secret query-shaped suffix separators that distinguish object keys. Signed or unsafe selected locations hide the whole batch. An ordinary Catalog URI or user-supplied URI list cannot enable this internal mode.

## Configure Additional Names

`datasource_sensitive_property_pattern` is an FE-local, mutable string configuration. Its default is:

```text
password|passwd|secret|token|credential|access[._-]?key|api[._-]?key
```

The shared property renderer searches the case-insensitive regex anywhere in a property name, including URL query parameter names. Typed diagnostics continue to follow field sensitivity declarations. It covers names such as `custom.password`, `clientSecret` and `custom.api-key`. It can also hide non-secret operational settings whose names contain these words.

| Value | Effect |
|---|---|
| Default expression | Add the common credential-name matches to all permanent rules. |
| A custom expression | Replace only the supplemental expression; built-in and registered secret rules still apply. |
| `(?!)` | Disable only supplemental name matching. |
| Empty expression | Match every name, potentially hiding all displayed properties or omitting them from lineage. |
| Invalid expression | Reject the configuration during startup, custom-config loading or runtime update; do not fall back to printing raw values. |

An administrator can first check whether the deployed build exposes the configuration:

```sql
SHOW FRONTEND CONFIG LIKE 'datasource_sensitive_property_pattern';
```

For example, after disabling the supplemental expression, `custom.password` is no longer hidden solely because of that name. Built-in `password`, native `token`, and explicit JDBC/Hadoop rules still apply.

If it returns no matching configuration, this build does not expose the supplemental regex. Do not infer the full policy from the version family alone.

To add `custom.pin` while retaining the default matches on all current FEs:

```sql
ADMIN SET ALL FRONTENDS CONFIG (
    "datasource_sensitive_property_pattern" = "password|passwd|secret|token|credential|access[._-]?key|api[._-]?key|custom[.]pin"
);
```

`custom.pin` then displays as `*XXX`. Runtime SQL updates do not persist through a restart. Configure the same expression in `fe.conf` on every FE, or use the documented persistent configuration mechanism. Newly added FEs also need the same setting. A different expression on another serving FE can produce different output.

See [FE Configuration](../admin-manual/config/fe-config.md#datasource_sensitive_property_pattern) for the parameter reference. Using `[.]` in examples avoids SQL backslash-escaping ambiguity when matching a literal dot.

## Limits and Best Practices

- Masking affects supported output copies. It does not encrypt stored Catalog metadata or change the credentials used by a client.
- A secret hidden in SHOW cannot be read back from the masked value. Set the original replacement value through ALTER CATALOG when rotating credentials.
- Ordinary URL path segments and unrecognized query parameters are not scanned for secret content. A secret placed there may remain visible. Avoid embedding secrets in paths, or add the entire property name to the supplemental rule to hide its whole value.
- Catalog comments and other free text are not generally secret-scanned. Unknown SDK containers or arbitrary values under unrelated names are not guaranteed to be recognized. Use explicit credential properties and configure additional names when necessary.
- Scope the policy to the documented output path; independently inspect custom plugins, external SDK logs and other APIs before treating their output as safe to share.
- Apply the same configuration to all serving FEs. Review SHOW output and representative audit/lineage output after an upgrade or connector change, using synthetic credentials for verification.
