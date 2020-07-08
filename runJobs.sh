for ((i = 1 ; i <= $1 ; i++)); do
curl --header "Content-Type: application/json" \
  --request POST \
  --data '{ "repository": { "clone_url": "https://github.com/sukhiboi/test.git", "name": "test", "id": 23 }, "head_commit": { "id": '$i', "author": { "name": "foobar" }, "timestamp": "null", "message": "some" } }' \
  http://localhost:4000/payload
echo "\n"
done