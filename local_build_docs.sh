

#!/usr/bin/env bash
# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
# KIND, either express or implied.  See the License for the
# specific language governing permissions and limitations
# under the License.

##############################################################
# This is a native document format compilation check script
##############################################################

#!/bin/bash

set -eo pipefail

rm -rf doris

git clone --branch master https://github.com/apache/doris.git --depth 1

mkdir -p community
cp -R doris/docs/en/community/* community/
rm -rf sidebarsCommunity.json
mkdir -p i18n/zh-CN/docusaurus-plugin-content-docs-community/current/
cp -R doris/docs/zh-CN/community/* i18n/zh-CN/docusaurus-plugin-content-docs-community/current/
cp -R doris/docs/sidebarsCommunity.json .

# clone images
cp -R doris/docs/images static/

rm -rf doris

# Versions 1.2, 2.0, and 2.1 are frozen under archived_docs/.
# Build the active documentation from this checkout; do not reimport old versions.

npm install -g yarn
yarn cache clean
yarn && yarn build


echo "***************************************"
echo "Docs build success"
echo "***************************************"
