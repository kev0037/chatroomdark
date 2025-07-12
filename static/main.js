document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerForm');
    const loginForm = document.getElementById('loginForm');
    const chatForm = document.getElementById('chatForm');
    const messageInput = document.getElementById('message');
    const chatWindow = document.getElementById('chatWindow');

    window.onload = function() {
    var chatWindow = document.getElementById('chatWindow');
    chatWindow.scrollTop = chatWindow.scrollHeight;
    }


    // 连接到Socket.IO服务器
    const socket = io();

    // 处理注册表单提交
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();  // 阻止默认表单提交行为
            const username = document.getElementById('registerUsername').value;
            const password = document.getElementById('registerPassword').value;

            const response = await fetch('/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const result = await response.json();
            alert(result.message);
            if (result.success) {
                window.location.href = '/';
            }
        });
    }

    // 处理登录表单提交
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();  // 阻止默认表单提交行为
            const username = document.getElementById('loginUsername').value;
            const password = document.getElementById('loginPassword').value;

            const response = await fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const result = await response.json();
            alert(result.message);
            if (result.success) {
                window.location.href = '/';
            }
        });
    }

    // 处理聊天表单提交
    if (chatForm) {
        chatForm.addEventListener('submit', async function(e) {
            e.preventDefault();  // 阻止默认表单提交行为
            const message = messageInput.value;

            const response = await fetch('/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message }),
            });

            const result = await response.json();
            if (result.success) {
                messageInput.value = '';
            } else {
                alert(result.message);
            }
        });

        messageInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && e.ctrlKey) {
                e.preventDefault();
                chatForm.dispatchEvent(new Event('submit', { cancelable: true }));
            }
        });
    }

    // 处理接收到的新消息
  socket.on('new_message', function(data) {
    let usernameDisplay = data.username;
    if (data.username === 'raydonggs') {
        usernameDisplay = `<span class="owner-username">${data.username} <small class="owner-label">(Owner)</small></span>`;
    }

    const newMessage = document.createElement('div');
    newMessage.innerHTML = `
        <div>
            <div><strong>${usernameDisplay}</strong></div>
            <div class="chat-message">${data.message.replace(/\n/g, '<br>')}</div>
        </div>`;
    chatWindow.appendChild(newMessage);
    chatWindow.scrollTop = chatWindow.scrollHeight;
});

socket.on('chat_message', function(data) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
    messageDiv.setAttribute('data-message-id', data.id);  // Needed for tracking
    messageDiv.innerHTML = `<strong>${data.username}:</strong> ${data.message}`;

    // 👉 Right-click to delete for everyone (admins only)
    messageDiv.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        if (confirm("Delete this message for EVERYONE?")) {
            fetch(`/delete_message_global/${data.id}`, {
                method: 'POST'
            }).then(res => {
                if (!res.ok) {
                    alert("You aren't allowed to delete this message.");
                }
            });
        }
    });

    document.getElementById('chatbox').appendChild(messageDiv);
});

    
    // 处理状态消息（用户连接和断开）
    socket.on('status', function(data) {
        const statusMessage = document.createElement('div');
        statusMessage.classList.add('status-message');
        statusMessage.innerText = data.msg;
        chatWindow.appendChild(statusMessage);
        chatWindow.scrollTop = chatWindow.scrollHeight;
    });
});
const messageInput = document.getElementById('message');

messageInput.style.height = '40px'; // initial height

messageInput.addEventListener('input', () => {
  messageInput.style.height = '40px'; // reset height to min
  messageInput.style.height = messageInput.scrollHeight + 'px'; // expand height based on content
});
const socket = io();

socket.on('clear_chat', () => {
  const chatWindow = document.getElementById('chatWindow');
  if (chatWindow) {
    chatWindow.innerHTML = '';
  }
});
function clearChat() {
  fetch('/clear', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'raydonggs', password: 'HB34e69q6FE' }) // hardcoded auth
  })
  .then(res => res.json())
  .then(data => {
    if (data.status === 'success') {
      alert('Chat cleared!');
    } else {
      alert('Failed: ' + data.message);
    }
  })
  .catch(console.error);
}

socket.on('delete_message', function(data) {
    const msgElement = document.querySelector(`[data-message-id="${data.message_id}"]`);
    if (msgElement) {
        msgElement.remove();
    }
});
