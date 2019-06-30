const editors = setupEditors();
let canSubmit = true;

console.log(editors);
setupLayoutButtons();

document.addEventListener("keyup", ({ keyCode, metaKey }) => {
  console.log(keyCode, metaKey);
  if (keyCode === 17 && metaKey) {
    // if cmd + ctrl
    if (!canSubmit) {
      const resultNode = document.getElementById('main-result');
      resultNode.innerHTML = `${resultNode.innerHTML}<br><span class="subdued">Can't submit while running tests.</span>`;
      return;
    }
    getResults("main", editors);
    return;
  }

  if (keyCode === 18 && metaKey) {
    // if cmd + alt
    refreshPreview('main', editors);
  }
});

function setupLayoutButtons() {
  document.addEventListener('click', ({target}) => {
    if (!target.classList.contains('layout-icon')) {
      return;
    }
    const buttonNode = target.parentNode;
    const editorId = buttonNode.getAttribute('data-layout-change');
    const action = buttonNode.getAttribute('data-layout-action');

    buttonNode.classList.toggle('button--is-active');

    if (action === 'vertical') {
      const wrapperNode = document.getElementById(editorId);
      wrapperNode.classList.toggle('editors-wrapper--vertical');
      return;
    }

    if (action === 'preview') {
      const previewNode = document.getElementById(`${editorId}-preview`);
      previewNode.classList.toggle('preview-hidden');
    }
  });
}

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

function refreshPreview(editorId, editors) {
  const previewNode = document.getElementById(`${editorId}-preview`);
  const code = editors[`${editorId}-code`];
  const encodedCodeString = encodeURI(btoa(code.getValue()));
  previewNode.src = `/preview.html?code=${encodedCodeString}`;
}

function getResults(id, editors) {
  canSubmit = false;

  const code = editors[`${id}-code`];
  const codeValue = code.getValue();
  const encodedCodeString = encodeURI(btoa(code.getValue()));

  if (!codeValue) {
    resultNode.innerHTML = "<span class='subdued'>No code provided</span>";
    canSubmit = true;
    return;
  }

  const nameMatch = code.getValue().match(/function (\w+)/);

  if (!nameMatch) {
    console.error("No function name found. Declare a function in code.");
    return;
  }

  const name = code.getValue().match(/function (\w+)/)[1];
  const resultNode = document.getElementById(`${id}-result`);
  const tests = editors[`${id}-tests`];
  const testsValue = tests.getValue();

  if (!testsValue) {
    resultNode.innerHTML = "<span class='subdued'>No tests provided</span>";
    canSubmit = true;
    return;
  }

  const data = {
    name,
    code: codeValue,
    tests: testsValue,
  };

  window.history.replaceState(
    data,
    document.title,
    `?code=${encodedCodeString}&tests=${encodeURI(
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
      canSubmit = true;

      if (status > 0) {
        const [, amountFailed] = output.match(/Tests:.+(\d+ failed)/);
        resultNode.innerHTML = `<span>❌</span> ${amountFailed}`;
        return;
      }

      const [, amountPassed] = output.match(/Tests:.+(\d+ passed)/);
      resultNode.innerHTML = `<span>✅</span> ${amountPassed}`;
    })
    .catch(error => {
      resultNode.innerHTML = `<span>❌</span> Code contains error`;
      console.error(error);
      canSubmit = true;
    });
}
