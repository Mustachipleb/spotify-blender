#!/bin/sh
# Generate the env.js file from environment variables at runtime
echo "window.env = {" > ./build/client/env.js
echo "  BACKEND_URL: \"${BACKEND_URL:-http://127.0.0.1:4010}\"" >> ./build/client/env.js
echo "};" >> ./build/client/env.js

# Start the application
exec npm run start
