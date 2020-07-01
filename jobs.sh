curl --header "Content-Type: application/json" \
  --request POST \
  --data '{"repository": { "clone_url": "https://github.com/sukhiboi/test.git", "name": "test", "id": 23 }, "commits" :[{"message": "message", "author" : {"name": "me"}}] }' \
  https://linter-step.herokuapp.com/payload

  # curl --header "Content-Type: application/json" \
  # --request POST \
  # --data '{"repository": { "clone_url": "https://github.com/sukhiboi/sum.git", "name": "sum", "id": 23 }, "commits" :[{"message": "message something", "author" : {"name": "you"}}] }' \
  # https://linter-step.herokuapp.com/payload
