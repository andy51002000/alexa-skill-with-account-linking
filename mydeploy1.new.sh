LAMBDA_FUNCTION_NAME=alexawithiot

arg = $1
size = ${#arg}

if [ $size -gt 0 ]
then
git add -A
git commit -m "$arg"
git push -u origin master
if

rm -f temp
mkdir -p temp

zip -r temp/app.zip ./ -x "*.sh" -x temp -x test -x .git -x gitignore
aws lambda update-function-code --function-name $LAMBDA_FUNCTION_NAME --zip-file fileb://temp/app.zip
