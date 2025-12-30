// ==UserScript==
// @name         VULMS final login form
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Save multiple VULMS accounts and login with one click
// @author       bisma
// @match        https://vulms.vu.edu.pk/LMS_LP.aspx*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// @run-at       document-idle
// ==/UserScript==

(function () {
  "use strict";

 /* where to store */
  const state = {
    accounts: GM_getValue("vulms_accounts", {}),
    activeAccountName: null,
    isEditing: false
  };

  /* human like typing */
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  async function typeSlow(input, value) {
    input.focus();
    input.value = "";
    for (const ch of value) {
      await sleep(40 + Math.random() * 40);
      input.value += ch;
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }

  /* interface css */
  GM_addStyle(`
    #vulmsPanel {
      position: fixed;
      top: 20px;
      right: 20px;
      width: 400px;
      background: #fff;
      border-radius: 14px;
      z-index: 99999;
      box-shadow: 0 10px 30px rgba(0,0,0,.2);
      font-family: Arial, sans-serif;
    }

    #vulmsPanel h5 {
      margin: 0;
      padding: 12px;
      background: #840000;
      color: #fff;
      border-radius: 14px 14px 0 0;
      text-align: center;
      position: relative;
    }

    #vulmsClose {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      cursor: pointer;
      font-size: 18px;
      font-weight: bold;
    }

    .vulms-body {
      padding: 12px;
    }

    .vulms-item {
      padding: 8px 10px;
      margin-bottom: 6px;
      background: #f1f5f9;
      border-radius: 8px;
      cursor: pointer;
    }

    .vulms-item:hover {
      background: #e0e7ff;
    }

    .vulms-item.active {
      background: #c7d2fe;
      font-weight: bold;
    }

    input {
      width: 100%;
      margin-top: 6px;
      padding: 8px;
      border-radius: 6px;
      border: 1px solid #ccc;
    }

    .actions {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      padding: 12px;
    }

    button {
      padding: 8px;
      border-radius: 6px;
      border: none;
      cursor: pointer;
      color: #fff;
      font-size: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }

    #NewClient { background: #4f46e5; }
    #ModifyClient { background: #ef4444; }
    #DeleteClient { background: #f59e0b; }
    #saveBtn { background: #16a34a; margin: 0 12px 12px; width: calc(100% - 24px); }

    .btn-icon {
      width: 20px;
      height: 20px;
      fill: currentColor;
    }

    .icon {
      position: fixed;
      top: 28px;
      left: 28px;
      width: 45px;
      height: 45px;
      border-radius: 50%;
      cursor: pointer;
      z-index: 99999;
      box-shadow: 0 6px 20px rgba(0,0,0,.3);
      background: #fff;
    }
  `);

   /* interface */
  const panel = document.createElement("div");
  panel.id = "vulmsPanel";
  panel.innerHTML = `
    <h5>
      VULMS Login Manager
      <span id="vulmsClose">✕</span>
    </h5>

    <div class="vulms-body">
      <div id="accountList"></div>

      <input id="name" placeholder="User Name">
      <input id="username" placeholder="LMS ID">
      <input id="password" placeholder="Password" type="password">
    </div>

    <div class="actions">
      <button id="NewClient">
        <svg class="btn-icon" viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6z"/></svg>
        New
      </button>

      <button id="ModifyClient">
        <svg class="btn-icon" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.8 9.94l-3.75-3.75z"/></svg>
        Modify
      </button>

      <button id="DeleteClient">
        <svg class="btn-icon" viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6z"/></svg>
        Delete
      </button>
    </div>

    <button id="saveBtn">Save Account</button>
  `;

  document.body.appendChild(panel);
  panel.style.display = "none";
/* icon img   */
  const icon = document.createElement("img");
  icon.className = "icon";
  icon.src = "data:image/jpeg;base64,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";
  document.body.appendChild(icon);
/*form is hidden by default*/
  icon.onclick = () => {
    panel.style.display = "block";
    icon.style.display = "none";
  };

  document.getElementById("vulmsClose").onclick = () => {
    panel.style.display = "none";
    icon.style.display = "block";
  };


  const nameInput = document.getElementById("name");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");

    /* login */

    async function login(acc) {
  if (!location.pathname.toLowerCase().includes("login") &&
      !location.pathname.toLowerCase().includes("lms_lp")) {
    alert("Please open VULMS Login page");
    return;
  }

 
  let user, pass, btn;
  for (let i = 0; i < 20; i++) { 
    user = document.querySelector("#txtUsername, input[type='text']");
    pass = document.querySelector("#txtPassword, input[type='password']");
    btn  = document.querySelector("#btnLogin, button[type='submit']");
    if (user && pass && btn) break;
    await sleep(200);
  }

  if (!user || !pass) {
    alert("Login fields not found");
    return;
  }

  await typeSlow(user, acc.username);
  await typeSlow(pass, acc.password);

  if (state.autoLogin && btn) {
    btn.click(); 
  }
}


   /* render account list */
  function renderList() {
    const list = document.getElementById("accountList");
    list.innerHTML = "";

    Object.values(state.accounts).forEach(acc => {
      const div = document.createElement("div");
      div.className = "vulms-item";
      if (state.activeAccountName === acc.name) div.classList.add("active");

      div.textContent = acc.name;
div.onclick = () => {
  state.activeAccountName = acc.name;
  nameInput.value = acc.name;
  usernameInput.value = acc.username;
  passwordInput.value = acc.password;
  renderList();

  login(acc); /*LMs ki field automatically fill*/
};


      list.appendChild(div);
    });
  }

  /*3 buttons*/
  document.getElementById("NewClient").onclick = () => {
    state.isEditing = false;
    state.activeAccountName = null;
    nameInput.value = "";
    usernameInput.value = "";
    passwordInput.value = "";
  };

 /* dele */
document.getElementById("DeleteClient").onclick = () => {
    if (!state.activeAccountName) {
        alert("Select an account to delete");
        return;
    }
    if (!confirm(`Delete "${state.activeAccountName}"?`)) return;

    delete state.accounts[state.activeAccountName];
    GM_setValue("vulms_accounts", state.accounts);

     /* sab clear */
    state.activeAccountName = null;
    nameInput.value = "";
    usernameInput.value = "";
    passwordInput.value = "";

    renderList();
};

 /* modify btn*/
document.getElementById("ModifyClient").onclick = () => {
    if (!state.activeAccountName) {
        alert("Select an account first");
        return;
    }
    state.isEditing = true;
};


  document.getElementById("saveBtn").onclick = () => {
    const name = nameInput.value.trim();
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    if (!name || !username || !password) return alert("Fill all fields");

    if (state.isEditing && state.activeAccountName) {
        delete state.accounts[state.activeAccountName];
    }

    state.accounts[name] = {
        name,
        username,
        password
    };

    GM_setValue("vulms_accounts", state.accounts);
    state.isEditing = false;
    state.activeAccountName = null; // 

    nameInput.value = "";
    usernameInput.value = "";
    passwordInput.value = "";

    renderList();
};


  renderList();
})();
