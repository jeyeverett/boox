const socket = io();
socket.auth = { userId: currentUserId };
socket.connect();

let connectedUsers;

socket.on("users", (users) => {
  connectedUsers = users;
});

socket.on("private message", ({ content, from }) => {
  pushMessage(content, from);
});

// Modify this error to be more useful at a later time
socket.on("connect_error", (err) => {
  if (err.message === "invalid username") {
    console.log("You must be signed in to use chat.");
  }
});

function pushMessage(message, from, to) {
  const inbox = document.getElementById("inboxMessages");
  const chatContainer = document.getElementById("messagesModal__chatContainer");
  const ids = [];

  //See if a chat exists from this user in the inbox
  for (let i = 0; i < inbox.children.length; i++) {
    ids.push(String(inbox.children[i].id));
  }

  // if (!ids.includes(String(message._id)) && message._id !== currentUserId) {
  //     let htmlObj = document.createElement('div');
  //     htmlObj.innerHTML = getInboxMessageTemplate(message);
  //     if (inbox.children[0].tagName === 'P') inbox.removeChild(inbox.children[0]);
  //     inbox.appendChild(htmlObj.children[0]);
  //     inbox.lastElementChild.addEventListener('click', openMessage);
  //     profileMsgAlert();
  //     return;
  // }
  if (jQuery("#messagesModal").data("bs.modal")?._isShown) {
    const parent = chatContainer.firstElementChild;
    // If the chat is open append the message
    if (
      connectedUsers[String(message._id)] === String(from) ||
      from === currentUsername
    ) {
      let htmlObj = document.createElement("div");
      htmlObj.innerHTML = getMsgTemplate(message);
      parent.appendChild(htmlObj.children[0]);
      parent.scrollTop = parent.scrollHeight;
    }
  } else {
    profileMsgAlert();
  }
  updateInbox(message, from, to);
  return;
}

function getInboxMessageTemplate(message) {
  return `<a class="btn list-group-item list-group-item-action py-3 px-4 lh-tight pointer" aria-current="true" id="${
    message._id
  }" name=${message.username.trim()}>
      <div class="d-flex w-100 align-items-center justify-content-between">
          <strong class="mb-1" id="${message.username.trim()}">${message.username.trim()}<span class="badge badge-secondary custom-badge ms-2">New</span></strong>
          <small id="${message._id}-date">
              ${message.timestamp.slice(0, 10).replace("T", " ")}
          </small>
      </div>
      <div class="col-10 mb-1 small mt-2">
          <strong class="mb-1" id="${message.username.trim()}-username">${message.username.trim()}:</strong>
          <span id="${message.username.trim()}-message">
              ${
                message.message.length > 51
                  ? message.message.slice(0, 50) + "..."
                  : message.message
              }
          </span>
      </div>
  </a>`;
}

function updateInbox(message, from, to) {
  let username, newMessage, newBadgeContainer;
  if (from === currentUsername) {
    username = document.getElementById(`${to}-username`);
    newMessage = document.getElementById(`${to}-message`);
  } else {
    username = document.getElementById(`${message.username}-username`);
    newMessage = document.getElementById(`${message.username}-message`);
    newBadgeContainer = document.getElementById(message.username);
    if (newBadgeContainer.childElementCount === 0) {
      newBadgeContainer.appendChild(getNewMsgIcon());
    }
  }

  username.textContent = message.username + ":";
  newMessage.textContent =
    message.message.length > 51
      ? `${message.message.slice(0, 50)}...`
      : message.message;
  return;
}

function profileMsgAlert() {
  if (profileBtn.childElementCount === 0) {
    profileBtn.appendChild(getNewMsgIcon("white"));
  }
  if (profileLink.childElementCount === 0) {
    profileLink.appendChild(getNewMsgIcon("white"));
  }
}

const inbox = document.getElementById("inboxMessages");
const inboxChildren = inbox.children;

const sendMsgBtn = document.getElementById("sendMessageButton");
sendMsgBtn.addEventListener("click", sendMessage);

const profileBtn = document.getElementById(`${currentUserId}-profileBtn`);
const profileLink = document.getElementById(`${currentUserId}-profileLink`);

if (inbox.children[0].textContent.slice(0, 11) !== "No messages") {
  for (let message of inboxChildren) {
    message.addEventListener("click", openMessage);
  }
}

window.onload = () => {
  jQuery("#messagesModal").on("show.bs.modal", () => {
    const textarea = document.getElementById("messagesModal__messageText");
    textarea.addEventListener("keypress", sendMessage);
  });

  jQuery("#messagesModal").on("hide.bs.modal", () => {
    const textarea = document.getElementById("messagesModal__messageText");
    textarea.removeEventListener("keypress", sendMessage);
  });
};

function getNewMsgIcon(color) {
  const newMessageIcon = document.createElement("span");
  newMessageIcon.className = `badge badge-secondary custom-badge ${
    color ? "custom-badge--" + color : ""
  } ms-2`;
  newMessageIcon.textContent = "New";
  return newMessageIcon;
}

function getMsgTemplate(message) {
  return `
          <span name=${message.username} class="d-flex ${
    currentUsername === message.username
      ? "justify-content-end"
      : "justify-content-start"
  } px-3">
              <span class="d-flex flex-column w-100 ${
                currentUsername === message.username
                  ? "align-items-end"
                  : "align-items-start"
              }"">
                  <div class="mb-1"><strong>${message.username}</strong></div>
                  <div class="small ${
                    currentUsername === message.username
                      ? "message__user"
                      : "message__chatPartner"
                  }">
                      ${message.message}<br>
                  </div>
              </span>
          </span>
      `;
}

async function openMessage(event) {
  const messageModalButton = document.getElementById("messageModalButton");
  const chatBox = event.target.closest("a");
  const partnerId = chatBox.id;
  const partnerUsername = chatBox.children[0].children[0].textContent.replace(
    "New",
    ""
  );
  const newBadge = document.getElementById(partnerUsername).lastElementChild;

  let htmlTemplate = "";

  const htmlObj = document.createElement("div");
  htmlObj.className = "overflow-auto custom-scrollbar--medium";
  htmlObj.style = "height: 200px;";
  htmlObj.id = `${partnerId}-chatbox`;
  htmlObj.setAttribute("name", `${partnerUsername}-chatbox`);

  try {
    const data = await fetch(`/message/${partnerId}`, {
      method: "GET",
    });

    const result = await data.json();

    result.messages.forEach((message) => {
      htmlTemplate += getMsgTemplate(message);
    });

    htmlObj.innerHTML = htmlTemplate;

    const chatContainer = document.getElementById(
      "messagesModal__chatContainer"
    );
    if (chatContainer.children.length)
      chatContainer.removeChild(chatContainer.firstElementChild);
    chatContainer.appendChild(htmlObj);

    messageModalButton.click();
    if (newBadge) newBadge.parentElement.removeChild(newBadge);
    if (profileBtn.lastElementChild)
      profileBtn.removeChild(profileBtn.lastElementChild);
    if (profileLink.lastElementChild)
      profileLink.removeChild(profileLink.lastElementChild);

    setTimeout(() => {
      chatContainer.firstElementChild.scrollTop =
        chatContainer.firstElementChild.scrollHeight;
    }, 200);
  } catch (err) {
    console.log(err);
  }
}

async function sendMessage(event) {
  const textarea = document.getElementById("messagesModal__messageText");
  const content = textarea.value;

  if (content === "") return;

  if (event.key && event.key !== "Enter") return;

  const chatContainer = document.getElementById(
    "messagesModal__chatContainer"
  ).firstElementChild;
  const partnerId = chatContainer.id.slice(0, 24);
  const partnerUsername = chatContainer.getAttribute("name").split("-")[0];
  const chatbox = document.getElementById(`${partnerId}-chatbox`);

  try {
    const data = await fetch(`/message/${partnerId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: {
          content,
          async: true,
          username: currentUsername,
        },
      }),
    });

    const result = await data.json();

    if (result.success) {
      //If user is online
      if (connectedUsers[String(partnerId)]) {
        socket.emit("private message", {
          content: result.message,
          to: connectedUsers[String(partnerId)],
        });
      }
      pushMessage(result.message, currentUsername, partnerUsername);
      textarea.value = "";
      chatbox.scrollTop = chatbox.scrollHeight;
    }
  } catch (err) {
    console.log(err);
  }
}
