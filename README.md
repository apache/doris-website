<!-- 
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

# Doris document website

This repo is for [Apache Doris Website](https://doris.apache.org)

And it use Github Action to automatically sync content from [Apache Doris Code Repo](https://github.com/apache/doris)

There are 2 Github Actions:

1. cron-deploy-website.yml

   It will sync at 01:00 AM everyday from Doris's master branch.

2. manual-deploy-website.yml

   It can only be triggered manually, and you can specify the branch name you want to sync.

## View the website

To view the website, navigate to 
[https://doris.apache.org](https://doris.apache.org) 
or
[https://doris.apache.org](https://doris.apache.org)

## Run & Build Website

This website is built using [Docusaurus 2](https://docusaurus.io/), a modern static website generator.

### Installation

```
$ yarn
```

### Local Development

```
$ yarn start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

### Build

```
$ yarn build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

### Deployment

Using SSH:

```
$ USE_SSH=true yarn deploy
```

Not using SSH:

```
$ GIT_USER=<Your GitHub username> yarn deploy
```

If you are using GitHub pages for hosting, this command is a convenient way to build the website and push to the `gh-pages` branch.
