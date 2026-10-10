---
{
    "title": "TLS Framework Configuration",
    "language": "en",
    "description": "Reference for the Apache Doris TLS framework configuration contract, including fixed TLS configuration names, defaults, component scope, and extension guidance.",
    "keywords": [
        "Doris TLS framework",
        "enable_tls",
        "tls_verify_mode",
        "mTLS",
        "TLS configuration"
    ]
}
---

<!-- Knowledge type: Configuration parameters / Extension contract -->
<!-- Applicable scenarios: TLS module integration / Configuration compatibility -->

This document describes the TLS framework configuration contract in Apache Doris.

The open-source Doris package contains the framework, configuration items, parser support, and extension points for TLS and certificate-based authentication. It does not include a complete TLS runtime implementation for every protocol. In the stock open-source build, enabling TLS for a protocol that has no TLS module implementation will fail with an error indicating that the TLS module is required.

The configuration names, default values, and meanings listed below are fixed by the framework. If you provide your own TLS module implementation, use this framework and these configuration items for compatibility. Implementation details such as certificate loading, TLS context creation, handshake behavior, certificate reload, and protocol-specific peer verification can be implemented by the TLS module.

## Configuration Reference

| Configuration | Components | Default | Description | Notes |
| --- | --- | --- | --- | --- |
| `enable_tls` | FE, BE, Cloud | `false` | Enables the unified TLS framework for the process. | When this is `true`, protocols not excluded by `tls_excluded_protocols` are expected to use the TLS implementation provided by the module. All related Doris components must use compatible TLS settings. |
| `tls_verify_mode` | FE, BE, Cloud | `verify_peer` | Controls certificate verification behavior. Supported values are `verify_none`, `verify_peer`, and `verify_fail_if_no_peer_cert`. | See [TLS verification modes](#tls-verification-modes). |
| `tls_certificate_path` | FE, BE, Cloud | Empty | Path to the certificate used by the component when acting as a TLS server or client. | The framework contract expects PEM certificates. A TLS module can support a leaf certificate or a full chain PEM file. |
| `tls_private_key_path` | FE, BE, Cloud | Empty | Path to the private key used with `tls_certificate_path`. | The framework contract expects a PEM private key. |
| `tls_private_key_password` | FE, BE, Cloud | Empty | Password for the private key file. | This is the plain password string, not a Base64-encoded value. |
| `tls_ca_certificate_path` | FE, BE, Cloud | Empty | Path to the CA certificate or CA bundle used for peer certificate verification. | The framework contract expects PEM CA certificates. A TLS module can also use system or JDK default trust stores when this value is empty and the scenario allows it. |
| `tls_cert_refresh_interval_seconds` | FE, BE, Cloud | `3600` | Interval, in seconds, for checking whether certificate files need to be reloaded. | The framework exposes the interval. Actual certificate reload behavior is implemented by the TLS module. |
| `tls_excluded_protocols` | FE, BE, Cloud | Empty | Comma-separated list of protocol names that should not use TLS. Matching is case-insensitive. | The applicable protocol names depend on the component and TLS module. The open-source framework reserves selectors such as `thrift`, `mysql`, `http`, `arrowflight`, `brpc`, and `bdbje`; use only selectors supported by your implementation. |
| `tls_peer_cert_required_san_dns` | FE, BE, Cloud | Empty | Peer certificate DNS Subject Alternative Name allowlist for selected private protocols. | Syntax: `<protocol>=<dns1>,<dns2>;...`. The framework reserves this contract for module implementations that need peer certificate admission control. |
| `tls_cert_based_auth_ignore_password` | FE | `false` | Allows password verification to be skipped after certificate-based authentication succeeds. | This only affects FE user authentication flows. Enabling it weakens password-based protection and should be done only by deployments whose TLS module provides the required certificate authentication behavior. |

## TLS Verification Modes

| Mode | Client role | Server role | Usage |
| --- | --- | --- | --- |
| `verify_none` | Does not verify the server certificate. | Does not verify the client certificate. | For deployments that need TLS encryption without certificate validation. |
| `verify_peer` | Verifies the server certificate. | Does not require a client certificate. | For one-way TLS verification. This value does not require mTLS. |
| `verify_fail_if_no_peer_cert` | Verifies the server certificate. | Requires and verifies the client certificate. | For mTLS deployments that need mutual certificate verification. |

## Framework Behavior in the Open-Source Build

The open-source framework provides configuration definitions and extension points, and the default providers keep the existing plaintext behavior when `enable_tls` is `false`.

When `enable_tls` is `true`, protocol startup or channel creation is routed through the TLS framework. If the corresponding TLS module is not provided, the open-source default implementation rejects TLS startup for that protocol and reports that the TLS module is required.

This means the table above is a compatibility contract, not a complete operational guide for enabling TLS in the stock open-source package.

## Implementation Guidance

If you implement a custom TLS module, follow these rules:

- Use the configuration names and semantics in this document. Do not introduce different configuration names for the same TLS behavior.
- Keep configuration behavior consistent across FE, BE, and Cloud components where the same item exists.
- Respect `tls_excluded_protocols` so users can choose which protocols are handled by the TLS module.
- Implement `tls_verify_mode` consistently for both server and client roles.
- If certificate reload is supported, use `tls_cert_refresh_interval_seconds` as the reload check interval.
- If peer certificate DNS SAN admission control is supported, use the `tls_peer_cert_required_san_dns` syntax described in the table.
- For certificate-based authentication, provide a runtime authentication implementation through the framework extension point. Without a custom implementation, the open-source default service is no-op.
