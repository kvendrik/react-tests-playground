import {getQueryParameter, decodeCode, encodeCode} from '../foundation/utilities.mjs';

let canSubmit = true;
const messageNode = document.querySelector('.message');
const previewNode = document.querySelector('.preview');

setupEditors();
setupLayoutButtons();

togglePreviewMode(getQueryParameter('preview') === '1');

document.addEventListener("keyup", ({ keyCode, metaKey }) => {
  if (keyCode === 17 && metaKey) {
    // if cmd + ctrl
    if (!canSubmit) {
      setMessage(`${messageNode.innerHTML}<br><span class="subdued">Can't submit while running tests.</span>`);
      return;
    }
    getResults();
    return;
  }

  if (keyCode === 18 && metaKey) {
    // if cmd + alt
    refreshPreview();
  }
});

function getEditor(name, getInstance = false) {
  const node = document.querySelector(`[data-code-editor="${name}"]`).nextSibling;
  return getInstance ? node.CodeMirror : node;
}

function setMessage(message) {
  messageNode.innerHTML = message;
}


function togglePreviewMode(doShow) {
  const indexEditorNode = getEditor('index');
  const testsEditorNode = getEditor('tests');
  const turnPreviewModeOn = typeof doShow !== 'undefined' ? doShow : indexEditorNode.classList.contains('hidden');
  const layoutButton = document.querySelector('[data-layout-action="preview"]');

  if (turnPreviewModeOn) {
    previewNode.classList.remove('hidden');
    indexEditorNode.classList.remove('hidden');
    testsEditorNode.classList.add('hidden');
    layoutButton.classList.add('button--is-active');
    messageNode.classList.add('hidden');
    return;
  }

  previewNode.classList.add('hidden');
  indexEditorNode.classList.add('hidden');
  testsEditorNode.classList.remove('hidden');
  layoutButton.classList.remove('button--is-active');
  messageNode.classList.remove('hidden');
}

function setupLayoutButtons() {
  document.addEventListener('click', ({target}) => {
    if (!target.classList.contains('layout-menu__icon')) {
      return;
    }
    const buttonNode = target.parentNode;
    const action = buttonNode.getAttribute('data-layout-action');

    buttonNode.classList.toggle('button--is-active');

    if (action === 'vertical') {
      const wrapperNode = document.getElementById('wrapper__editors');
      wrapperNode.classList.toggle('wrapper__editors--vertical');
      return;
    }

    if (action === 'preview') {
      togglePreviewMode();
      return;
    }
  });
}

function setupEditors() {
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
  }
}

function checkEditorValueGiven(editorName, editor, editorElement) {
  if (editorElement.getAttribute("data-code-editor") !== editorName) {
    return;
  }
  const givenCode = decodeCode(getQueryParameter(editorName));
  if (!givenCode) {
    return;
  }
  editor.getDoc().setValue(givenCode);
}

function refreshPreview() {
  const code = getEditor('code', true);
  const index = getEditor('index', true);
  const encodedCodeString = encodeCode(code.getValue());
  const encodedIndexString = encodeCode(index.getValue());
  previewNode.src = `/preview?code=${encodedCodeString}&index=${encodedIndexString}`;
  togglePreviewMode(true);
}

function getResults() {
  canSubmit = false;

  const code = getEditor('code', true);
  const codeValue = code.getValue();
  const encodedCodeString = encodeCode(codeValue);

  if (!codeValue) {
    setMessage("<span class='subdued'>No code provided</span>");
    canSubmit = true;
    return;
  }

  const nameMatch = codeValue.match(/function (\w+)/);

  if (!nameMatch) {
    console.error("No function name found. Declare a function in code.");
    return;
  }

  const name = codeValue.match(/function (\w+)/)[1];
  const tests = getEditor('tests', true);
  const testsValue = tests.getValue();

  if (!testsValue) {
    setMessage("<span class='subdued'>No tests provided</span>");
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
    `?code=${encodedCodeString}&tests=${encodeCode(testsValue)}`
  );

  setMessage( "Running tests...");
  togglePreviewMode(false);

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
        setMessage(`<span>❌</span> ${amountFailed}`);
        return;
      }

      const [, amountPassed] = output.match(/Tests:.+(\d+ passed)/);
      setMessage(`<span>✅</span> ${amountPassed}`);
    })
    .catch(error => {
      setMessage(`<span>❌</span> Code contains error`);
      console.error(error);
      canSubmit = true;
    });
}
