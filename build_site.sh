#!/bin/bash

WORKDIR=/tmp/incubator-site
SVN_CO_DIR=/tmp/incubator-site-content
SVN_BUILD_DIR=/tmp/incubator-site-build
SVN_REPO=http://svn.apache.org/repos/asf/incubator/public/trunk/

# build the git bits
rm -rf $WORKDIR
mkdir -p $WORKDIR
./bake.sh -b . $WORKDIR

# build the svn bits
rm -rf $SVN_CO_DIR
rm -rf $SVN_BUILD_DIR
svn co $SVN_REPO $SVN_CO_DIR
(
    cd $SVN_CO_DIR
    ant docs -Ddocs.dest=$SVN_BUILD_DIR
    python3 clutch.py
    mv $SVN_BUILD_DIR/ip-clearance $WORKDIR
    mv $SVN_BUILD_DIR/projects $WORKDIR
    mv $SVN_BUILD_DIR/clutch $WORKDIR
)

# push all of the results to asf-site
git checkout asf-site
git clean -f -d
git pull origin asf-site
rm -rf *
mkdir content
cp -a $WORKDIR/* content
cp -a $WORKDIR/.htaccess content
git add .
git commit -m "Automatic Site Publish by git-site-role"
git push origin asf-site