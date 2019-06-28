const editors = setupEditors();
let canSubmit = true;

console.log(editors);

window.addEventListener("keyup", ({ keyCode, metaKey }) => {
  if (keyCode !== 17 || !metaKey) {
    return;
  }
  if (!canSubmit) {
    const resultNode = document.getElementById('main-result');
    resultNode.innerHTML = `${resultNode.innerHTML}<br><span class="subdued">Can't submit while running tests.</span>`;
    return;
  }
  // if cmd + ctrl
  getResults("main", editors);
});

function setupEditors() {
  const editors = {};
  const editorElements = document.querySelectorAll("[data-code-editor]");

  for (const element of editorElements) {
    const editor = CodeMirror.fromTextArea(element, {
      lineNumbers: false,
      theme: "monokai",
      tabSize: 2,
      mode: "text/typescript-jsx"
    });
    checkEditorValueGiven("code", editor, element);
    checkEditorValueGiven("tests", editor, element);
    editors[element.getAttribute("data-code-editor")] = editor;
  }

  return editors;
}

function checkEditorValueGiven(editorName, editor, editorElement) {
  if (!editorElement.getAttribute("data-code-editor").includes(editorName)) {
    return;
  }
  const tests = getQueryParameter(editorName);
  if (!tests) {
    console.warn(
      `Warning: no ${editorName} query parameter found. Expected URI encoded code in ${editorName} parameter.`
    );
    return;
  }
  editor.getDoc().setValue(tests);
}

function getQueryParameter(name) {
  const queryMatch = location.search.match(new RegExp(`${name}=([^\\&]+)`));
  if (!queryMatch) {
    return "";
  }
  const [, encodedValue] = queryMatch;
  console.log(encodedValue);
  if (!encodedValue) {
    return "";
  }
  return decodeURI(atob(encodedValue));
}

function getResults(id, editors) {
  canSubmit = false;

  const code = editors[`${id}-code`];
  const nameMatch = code.getValue().match(/function (\w+)/);

  if (!nameMatch) {
    console.error("No function name found. Declare a function in code.");
    return;
  }

  const name = code.getValue().match(/function (\w+)/)[1];
  const resultNode = document.getElementById(`${id}-result`);
  const tests = editors[`${id}-tests`];
  const data = {
    name,
    code: code.getValue(),
    tests: tests.getValue()
  };
  console.log(data);
  window.history.replaceState(
    data,
    document.title,
    `?code=${encodeURI(btoa(code.getValue()))}&tests=${encodeURI(
      btoa(tests.getValue())
    )}`
  );
  resultNode.textContent = "Running tests...";
  window
    .fetch("/api", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(({ output, status }) => {
      if (status > 0) {
        const [, amountFailed] = output.match(/Tests:.+(\d+ failed)/);
        resultNode.innerHTML = `<span>❌</span> ${amountFailed}`;
        return;
      }

      const [, amountPassed] = output.match(/Tests:.+(\d+ passed)/);
      resultNode.innerHTML = `<span>✅</span> ${amountPassed}`;
      canSubmit = true;
    })
    .catch(error => {
      resultNode.innerHTML = `<span>❌</span> Code contains error`;
      console.error(error);
      canSubmit = true;
    });
}
