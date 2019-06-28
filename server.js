const fs = require("fs");
const { spawnSync } = require("child_process");
const Koa = require("koa");
const mount = require("koa-mount");
const serve = require("koa-static");
const bodyParser = require("koa-bodyparser");

const playgroundPath = `${__dirname}/playground`;
const staticPath = `${__dirname}/static`;
const componentTemplatesPath = `${playgroundPath}/component-templates`;

const tempFilesDirectory = `${playgroundPath}/~build`;
const testsTemplate = fs.readFileSync(
  `${componentTemplatesPath}/Component.test.tsx`,
  "utf-8"
);
const componentTemplate = fs.readFileSync(
  `${componentTemplatesPath}/Component.tsx`,
  "utf-8"
);

const api = new Koa();
api.use(bodyParser());
api.use(async ctx => {
  const {
    request: {
      body: { name, code, tests }
    }
  } = ctx;
  if (!name || !code || !tests) {
    ctx.body = { error: "Please provide a name, code and tests." };
  } else {
    console.log({ name, code, tests });
    const { output, status } = getTestResultsForRequest(name, code, tests);
    console.log(output.toString());
    ctx.body = { output: output[2].toString(), status };
  }
});

const app = new Koa();
const port = process.env.PORT || 3000;
app.use(mount("/api", api));
app.use(mount("/", serve(staticPath)));

app.listen(port);
console.log(`Listening on port ${port}`);

function getTestResultsForRequest(name, code, tests) {
  const parsedTestsFile = testsTemplate
    .replace("{{name}}", name)
    .replace("{{tests}}", tests);
  const parsedComponentFile = componentTemplate
    .replace("{{name}}", name)
    .replace("{{code}}", code);

  if (!fs.existsSync(tempFilesDirectory)) {
    fs.mkdirSync(tempFilesDirectory);
  }

  for (const fileName of fs.readdirSync(componentTemplatesPath)) {
    fs.copyFileSync(
      `${componentTemplatesPath}/${fileName}`,
      `${tempFilesDirectory}/${fileName}`
    );
  }

  fs.writeFileSync(`${tempFilesDirectory}/Component.tsx`, parsedComponentFile);
  fs.writeFileSync(`${tempFilesDirectory}/Component.test.tsx`, parsedTestsFile);

  process.chdir(playgroundPath);
  return spawnSync("yarn", ["run", "jest", tempFilesDirectory]);
}
