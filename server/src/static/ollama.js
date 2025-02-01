const chatMessages = document.getElementById('chatMessages');
const messageInput = document.getElementById('messageInput');
const sendMessageBtn = document.getElementById('sendMessageBtn');

function addMessage(sender, message) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    messageElement.classList.add(sender === 'user' ? 'user-message' : 'bot-message');
    messageElement.innerHTML = formatMessage(message); // Usar innerHTML aquí
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function sendMessage() {
    const message = messageInput.value.trim();
    if (message) {
        addMessage('user', message);
        messageInput.value = '';

        try {
            const response = await fetch('http://127.0.0.1:3000/ollama_message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            addMessage('bot', data.response);
        } catch (error) {
            console.error('Error:', error);
            addMessage('bot', 'Error: Could not get a response from the server.');
        }
    }
}

sendMessageBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        sendMessage();
    }
});


function formatMessage(mensaje) {
    // Expresión regular para detectar bloques de código
    // Busca patrones como `codigo` o `codigo`
    const regexCodigo = /(`([\s\S]*?)`|`([\s\S]*?)`)/g;
  
    let resultado = mensaje;
    let match;
  
    while ((match = regexCodigo.exec(mensaje)) !== null) {
      let codigo;
      if (match[2]) {
        // Bloque de código con triple backticks (```)
        codigo = match[2].trim();
        // Reemplaza el bloque completo
        resultado = resultado.replace(
          match[0],
          `<pre><code style="font-family: monospace; font-weight: bold; padding-left: 1em;">${codigo}</code></pre>`
        );
      } else if (match[3]) {
        // Código en línea con un solo backtick (`)
        codigo = match[3].trim();
        // Reemplaza solo la parte del código
        resultado = resultado.replace(
          match[0],
          `<code style="font-family: monospace; font-weight: bold;">${codigo}</code>`
        );
      }
    }
  
    // Reemplazar saltos de línea por <br> para mantener el formato en HTML
    resultado = resultado.replace(/\n/g, "<br>");
  
    return resultado;
  }