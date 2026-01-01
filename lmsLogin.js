// ==UserScript==
// @name         lms login
// @namespace    http://tampermonkey.net/
// @version      2026-01-01
// @description  try to take over the world!
// @author       You
// @match        https://vulms.vu.edu.pk/LMS_LP.aspx*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// ==/UserScript==

(function() {
    'use strict';
    const state = {
    accounts: GM_getValue("vulms_accounts", {}),
    activeAccountName: null,
    isEditing: false
  };
       /*Interface css*/
    GM_addStyle(`
     *{
        box-sizing: border-box;
        margin: 0;
     }

      #container{
        width: 400px;
        min-height: 450px;
        position: fixed;
        top: 50px;
        right: 40px;
        left: auto;
        margin-top: auto;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        z-index: 10000;
        background-color: white;
        border-radius:5px

      }

      #form{
        margin-top: 30px;
        padding: 10px;
      }

      #savedUsers {
        margin-bottom: 15px;
      }

     .userItem {
        padding: 8px;
        margin-bottom: 5px;
        background: #eee;
        border-radius: 5px;
        cursor: pointer;
      }

     .userItem:hover {
        background: #ddd;
      }


      #formbody{
        text-align: center;
        color: white;
        background: rgb(104, 5, 5);
        padding: 20px;
      }

      #username, #lmsid, #password{
        width: 100%;
        color: black;
        height: 45px;
        padding: 5px;
        font-size: 16px;
        margin-bottom: 20px;
        border-radius: 5px;
      }

      .btn-icon {
      width: 20px;
      height: 20px;
      fill: currentColor;

    }

        #buttons{
            display: flex;
            justify-content: space-around;
            padding: 5px;
        }

        #add{
            width: 100px;
            height: 40px;
            font-size: 16px;
            color: white;
            background-color: rgb(79, 79, 240);
            cursor: pointer;
            border: none;
            border-radius: 5px;
        }

        #edit{
            width: 100px;
            height: 40px;
            font-size: 16px;
            color: white;
            background-color: rgb(228, 215, 36);
            cursor: pointer;
            border: none;
            border-radius: 5px;
        }

        #deleteBtn{
            width: 100px;
            height: 40px;
            font-size: 16px;
            color: white;
            background-color: rgb(247, 36, 36);
            cursor: pointer;
            border: none;
            border-radius: 5px;
        }

        #savebutton{
            display: flex;
            justify-content: center;
        }


        #save{
            width: 150px;
            height: 50px;
            font-size: 16px;
            color: white;
            background-color: rgb(79, 79, 240);
            cursor: pointer;
            border: none;
            border-radius: 5px;
            margin-bottom: 10px;
            margin-top: 10px;
        }
        `);


    /*interface*/
    const html = `
     <div id="container">
        <div>
           <h4 id="formbody">Login Form</h4>
           <form id="form">
           <div id="savedUsers"></div>
           <input type="text" id="username" placeholder="Enter your name">
           <input type="text" id="lmsid" placeholder="LMS ID">
           <input type="password" id="password" placeholder="Enter your password">
           </form>
        </div>
        <div id="buttons">
            <button id="add"><svg class="btn-icon" viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6z"/></svg>New</button>
            <button id="edit"><svg class="btn-icon" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.8 9.94l-3.75-3.75z"/></svg>Modify</button>
            <button id="deleteBtn"><svg class="btn-icon" viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6z"/></svg>Delete</button>
        </div>
        <div id="savebutton">
            <button id="save">Save</button>
        </div>
    </div>
   `;

    const div = document.createElement('div');
    div.innerHTML = html;
    document.body.appendChild(div);

    /*js*/
    const username = document.getElementById('username');
const lmsid = document.getElementById('lmsid');
const password = document.getElementById('password');

const add = document.getElementById('add');
const edit = document.getElementById('edit');
const deleteBtn = document.getElementById('deleteBtn')
const save = document.getElementById('save');

const savedUsersDiv = document.getElementById("savedUsers");

function renderUsers() {
  savedUsersDiv.innerHTML = "";

  Object.keys(state.accounts).forEach(function (id) {
    const user = state.accounts[id];

    const userDiv = document.createElement("div");
    userDiv.classList.add("userItem");
    userDiv.textContent = user.username;

    userDiv.addEventListener("click", function () {
      username.value = user.username;
      lmsid.value = id;
      password.value = user.password;
    });

    savedUsersDiv.appendChild(userDiv);
  });
}

/*new*/
add.onclick = () =>{
  username.value = '';
  lmsid.value = '';
  password.value = '';
};
/*modify btn*/
edit.onclick = () =>{
 if(!lmsid.value){
  alert('Field is required');
  return;
 }
  const saved = state.accounts[lmsid.value];
  if(!saved){
    alert('No data found for the given LMS ID');
    return;
  }
  state.isEditing = true;
  state.activeAccountName = lmsid.value;
  username.value = saved.username;
  password.value = saved.password;
};
/*delete*/
deleteBtn.onclick = () => {
  if(!lmsid.value){
    alert('Field is required');
    return;
  }

  delete state.accounts[lmsid.value];
  GM_setValue("vulms_accounts", state.accounts);

  username.value = "";
  lmsid.value = "";
  password.value = "";

  renderUsers();
};
/*save btn*/
save.onclick = () => {
  if (!lmsid.value || !username.value || !password.value) {
    alert('All fields are required');
    return;
  }

  if (state.isEditing) {
    delete state.accounts[state.activeAccountName];
 }
  state.accounts[lmsid.value] = {
    username: username.value,
    password: password.value
  };

  GM_setValue("vulms_accounts", state.accounts);
  alert('Data saved successfully');

  renderUsers();
};
renderUsers();

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
async function autoLogin() {
  if (!lmsid.value || !password.value) return;
const usernameInput = document.querySelector("#txtUsername, input[type='text']") || lmsid;
 for (let char of lmsid.value) {
    usernameInput.value += char;
    await sleep(100 + Math.random() * 100);
  }

const passwordInput = document.querySelector("#txtPassword, input[type='password']") || password;
 for (let char of password.value) {
    passwordInput.value += char;
    await sleep(100 + Math.random() * 100);
  }

const loginBtn = document.querySelector("#btnLogin, button[type='submit']");
  if (loginBtn) loginBtn.click();
}
savedUsersDiv.addEventListener("click", () => {
    setTimeout(autoLogin, 500);
});

})();