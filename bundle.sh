mkdir -p .bundle/

cd .bundle
cp -a ../controllers/ controllers
cp -a ../definitions/ definitions
cp -a ../public/ public
cp -a ../resources/ resources
cp -a ../views/ views

total4 --bundle blogengine.bundle
cp blogengine.bundle ../blogengine.bundle

cd ..
rm -rf .bundle
echo "DONE"