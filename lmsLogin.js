// ==UserScript==
// @name         VULMS Login Manager (LTStore Style)
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Save multiple VULMS accounts and login with one click
// @author       LTStore
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
    accounts: GM_getValue("vulms_accounts", {})
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
      position: fixed; top: 20px; right: 20px;
      width: 400px; background: #ffffff;
      border-radius: 14px; z-index: 99999;
      box-shadow: 0 10px 30px rgba(0,0,0,.2);
      font-family: Arial, sans-serif;
    }
    #vulmsPanel h5 {
      margin: 0; padding: 12px;
      background: #840000; color: #fff;
      border-radius: 14px 14px 0 0;
      text-align: center;
    }
        #vulmsHeader {
      position: relative;
    }
    .icon {
     position: fixed;
     top: 28px;
     left: 28px;
     width: 60px;
     height: 60px;
     border-radius: 60%;
     cursor: pointer;
     z-index: 99999;
     box-shadow: 0 6px 20px rgba(0,0,0,.3);
     background: #fff;
}
.icon {
    width: 45px;
    height: 45px;
    border-radius:50%;
    }

    #vulmsClose {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      cursor: pointer;
      font-size: 18px;
      font-weight: bold;
      color: #fff;
    }

    #vulmsToggle {
      position: fixed;
      top: 20px;
      right: 20px;
      background: #4f46e5;
      color: #fff;
      padding: 10px 14px;
      border-radius: 50%;
      cursor: pointer;
      z-index: 99999;
      display: none;
      box-shadow: 0 6px 20px rgba(0,0,0,.3);
    }

    .vulms-body { padding: 12px; }
    .vulms-item {
      padding: 8px 10px; margin-bottom: 6px;
      background: #f1f5f9; border-radius: 8px;
      cursor: pointer;
    }
    .vulms-item:hover { background: #e0e7ff; }
    input, button {
      width: 100%; margin-top: 6px;
      padding: 8px; border-radius: 6px;
      border: 1px solid #ccc;
    }
    button {
      background: #4f46e5; color: white;
      border: none; cursor: pointer;
    }
  `);

  /* interface */
  const panel = document.createElement("div");
  panel.id = "vulmsPanel";
  panel.innerHTML = `
   <h5 id="vulmsHeader">
    VULMS Login Manager
    <span id="vulmsClose">✕</span>
    </h5>

    <div class="vulms-body">
      <div id="accountList"></div>

      <input id="name" placeholder="User Name">
      <input id="username" placeholder="LMS ID">
      <input id="password" placeholder="Password" type="password">

      <button id="saveBtn">Save Account</button>
    </div>
  `;
 document.body.appendChild(panel);
    /* icon img   */
const icon = document.createElement("img");
icon.src = "data:image/jpeg;base64,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"; // your base64 image
icon.className = "icon";
document.body.appendChild(icon);

/*form is hidden by default*/
panel.style.display = "none";
const closeBtn = document.getElementById("vulmsClose");

/*show form*/
icon.addEventListener("click", () => {
    panel.style.display = "block";
    icon.style.display = "none";
});

/*close*/
closeBtn.addEventListener("click", () => {
    panel.style.display = "none";
    icon.style.display = "block";
});

  /* render account list */
  function renderList() {
    const list = document.getElementById("accountList");
    list.innerHTML = "";

    Object.values(state.accounts).forEach(acc => {
      const div = document.createElement("div");
      div.className = "vulms-item";
      div.textContent = acc.name;
      div.onclick = () => login(acc);
      list.appendChild(div);
    });
  }

  /* login */
  async function login(acc) {
    if (!location.pathname.toLowerCase().includes("login") &&
        !location.pathname.toLowerCase().includes("lms_lp")) {
      alert("Please open VULMS Login page");
      return;
    }

    await sleep(300); // allow inputs to render

    const user = document.querySelector("#txtUsername, input[type='text']");
    const pass = document.querySelector("#txtPassword, input[type='password']");
    const btn  = document.querySelector("#btnLogin, button[type='submit']");

    if (!user || !pass) {
      alert("Login fields not found");
      return;
    }

    await typeSlow(user, acc.username);
    await typeSlow(pass, acc.password);

    if (btn) btn.click();
  }

  /* save account */
  const nameInput = document.getElementById("name");
  const username = document.getElementById("username");
  const password = document.getElementById("password");
  const saveBtn = document.getElementById("saveBtn");

  saveBtn.onclick = () => {
    const name = nameInput.value.trim();
    if (!name) return;

    state.accounts[name] = {
      name,
      username: username.value,
      password: password.value
    };

    GM_setValue("vulms_accounts", state.accounts);
    renderList();
  };


  renderList();
})();
