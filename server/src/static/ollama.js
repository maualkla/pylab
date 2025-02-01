const chatMessages = document.getElementById('chatMessages');
const messageInput = document.getElementById('messageInput');
const sendMessageBtn = document.getElementById('sendMessageBtn');
const modeToggle = document.getElementById('modeToggle');
const modeLabel = document.getElementById('mode-label'); // Get the label element

function setRandomEmojiFavicon() {
  const emojis = ['😀', '😂', '😍', '🤩', '🥳', '🚀', '🌈', '🔥', '🎉', '💯'];
  const randomIndex = Math.floor(Math.random() * emojis.length);
  const randomEmoji = emojis[randomIndex];

  // Set favicon
  let faviconLink = document.querySelector("link[rel~='icon']");
  if (!faviconLink) {
    faviconLink = document.createElement('link');
    faviconLink.rel = 'icon';
    document.head.appendChild(faviconLink);
  }
  faviconLink.href = `data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>${randomEmoji}</text></svg>`;

  // Set emoji in header title
  const headerTitle = document.querySelector('.header-title h2');
  headerTitle.textContent = `${randomEmoji} Local Ollama`;
}

// ... rest of your code ...

// Call the function on page load
setRandomEmojiFavicon();

function formatearMensaje(mensaje) {
  const regexCodigo = /(`+)([\s\S]*?)\1/g;
  const regexListaNumerada = /^(\s*\d+\.\s+.*)/gm;
  const regexListaNoNumerada = /^(\s*[\*\-\+]\s+.*)/gm;
  const regexNegrita = /\*\*([^\*\*]+)\*\*/g; // **text**
  const regexNegritaCursiva = /\*\*\*([^\*]+)\*\*\*/g; // ***text***

  // Function to format lists
  function formatLists(text) {
    const lines = text.split('\n');
    let inList = false;
    let listType = null;
    let formattedText = '';

    for (let i = 0; i < lines.length; i++) {
      const isNumbered = regexListaNumerada.test(lines[i]);
      const isBulleted = regexListaNoNumerada.test(lines[i]);

      if (isNumbered || isBulleted) {
        if (!inList) {
          inList = true;
          listType = isNumbered ? 'ol' : 'ul';
          formattedText += `<${listType}>`;
        }
        formattedText += `<li>${lines[i].replace(isNumbered ? regexListaNumerada : regexListaNoNumerada, '$1').trim()}</li>`;
      } else {
        if (inList) {
          inList = false;
          formattedText += `</${listType}>`;
        }
        formattedText += lines[i] + (i < lines.length - 1 ? '<br>' : '');
      }
    }

    if (inList) {
      formattedText += `</${listType}>`;
    }

    return formattedText;
  }

  // Function to format bold and italic text
  function formatBoldItalic(text) {
    text = text.replace(regexNegritaCursiva, '<strong><em>$1</em></strong>'); // ***text*** to bold italic
    text = text.replace(regexNegrita, '<strong>$1</strong>'); // **text** to bold
    return text;
  }

  let resultado = "";
  let lastIndex = 0;
  let match;

  while ((match = regexCodigo.exec(mensaje)) !== null) {
    // Add non-code text before the current code block, formatted for lists, bold, and italics
    if (match.index > lastIndex) {
      const nonCodeText = mensaje.substring(lastIndex, match.index);
      resultado += formatBoldItalic(formatLists(nonCodeText));
    }

    let codigo = match[2].trim();
    if (match[1].length >= 3) {
      // Block code
      resultado += `<pre><code style="font-family: monospace; font-weight: bold; padding-left: 1em;">${codigo}</code></pre>`;
    } else {
      // Inline code
      resultado += `<code style="font-family: monospace; font-weight: bold;">${codigo}</code>`;
    }

    lastIndex = regexCodigo.lastIndex;
  }

  // Add any remaining non-code text after the last code block, formatted for lists, bold, and italics
  if (lastIndex < mensaje.length) {
    const remainingText = mensaje.substring(lastIndex);
    resultado += formatBoldItalic(formatLists(remainingText));
  }

  return resultado;
}

function addMessage(sender, message) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    messageElement.classList.add(sender === 'user' ? 'user-message' : 'bot-message');
    messageElement.innerHTML = formatearMensaje(message);

    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    hljs.highlightAll();
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

// Call the function on page load
setRandomEmojiFavicon();

modeToggle.addEventListener('change', () => {
  document.body.classList.toggle('dark-mode');

  // Update the label text
  if (document.body.classList.contains('dark-mode')) {
    modeLabel.textContent = 'Light';
  } else {
    modeLabel.textContent = 'Dark';
  }
});

sendMessageBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        sendMessage();
    }
});