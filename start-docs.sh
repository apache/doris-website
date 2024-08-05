set -eo pipefail

echo "starting Docs..."

# clone common docs to versioned_docs
cp -rf benchmark versioned_docs/version-3.0
cp -rf ecosystem versioned_docs/version-3.0
cp -rf faq versioned_docs/version-3.0
cp -rf releasenotes versioned_docs/version-3.0
cp -rf get-starting versioned_docs/version-3.0

yarn && yarn start


echo "***************************************"
echo "Docs started success"
echo "***************************************"