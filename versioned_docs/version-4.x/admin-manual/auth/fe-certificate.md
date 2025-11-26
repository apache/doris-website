---
{
    "title": "FE SSL Certificate",
    "language": "en"
}
---

# Certificate Configuration

Certificate Configuration

To enable SSL function on Doris FE interface, you need to configure key certificate as follows:

1.Purchase or generate a self-signed SSL certificate. It is advised to use CA certificate in Production environment

2.Copy the SSL certificate to specified path. The default path is `${DORIS_HOME}/conf/ssl/`, and user can also specify their own path

3.Modify FE configuration file `conf/fe.conf`, and note that the following parameters are consistent with purchased or generated SSL certificate
    Set `enable_https = true` to enable https function, default is `false`
    Set certificate path `key_store_path`, default is `${DORIS_HOME}/conf/ssl/doris_ssl_certificate.keystore`
    Set certificate password `key_store_password`, default is null
    Set certificate type `key_store_type`, default is `JKS`
    Set certificate alias `key_store_alias`, default is `doris_ssl_certificate`
