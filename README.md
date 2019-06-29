# React Tests Playground

Distraction-free React tests playground that can be embedded in presentation slides for live React tests demos.

**⚠️ Warning: This project is an experiment, is extremely scrappy and insecure, and should only be used locally.**

## Setup
1. Install the dependencies using `yarn setup`.
2. Run the app using `yarn server`.
3. Navigate to `localhost:3000`.

## Good to know
- **TypeScript:** the code you write will get executed as TypeScript files.
- **Saving code:** when you run your tests the URL gets updated with a query string that represents your code. You can use this new URL to open your code again.
- **Embedding:** you can use these URLs to easily embed examples you make in your presentation. `static/iframes-example.html` contains an example of what this looks like.
- **Debugging:** when you run your tests they will be executed by the server. The app will only show if the tests passed or failed, the full output gets logged by the server.
