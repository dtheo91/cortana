///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Define the functions and variables that will be used in the renderer process
const { ipcRenderer } = require('electron');
const { PythonShell } = require('python-shell');
const Prism = require('prismjs');
require('prismjs/components/prism-python');
require('prismjs/components/prism-javascript');

const messageInput = document.getElementById('message-input');
const chatBox = document.getElementById('chat-box');

const recorder = require('node-record-lpcm16');
const fs = require('fs');
let recording = null;
let pyshell = null;

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// IPC Event Listeners

messageInput.addEventListener('keydown', (event) => {
    // Check if the Enter key is pressed (key code 13)
    if (event.key === 'Enter') {
        const message = messageInput.value.trim();

        // Check if the Shift key is pressed
        if (event.shiftKey) {
            // Add a new line instead of sending the message
            messageInput.value += '\n';
        } else if (message !== '') {
            // Send the message to the main process
            ipcRenderer.send('send-message', message);

            // Clear the input field
            messageInput.value = '';
        }

        // Prevent the default behavior of the Enter key (form submission, line break)
        event.preventDefault();
    }
});

ipcRenderer.on('display-message', (event, message) => {
    // Display the message in the chat box
    show_message(message);
    // Prompt the AI to respond
    document.getElementById("generateButton").style.display = "block";
    llm(message, function(response) {
        document.getElementById("generateButton").style.display = "none";
    });
});

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Functions 

function startRecording() {
    document.getElementById("recordingButton").style.display = "block";
    const file = fs.createWriteStream('prompt.wav', { encoding: 'binary' });
    console.log('Recording started');
    recording = recorder.record({sampleRate: 16000});
    recording.stream().pipe(file);
}

// Function to stop recording
function stopRecording() {
    document.getElementById("recordingButton").style.display = "none";
    console.log('Recording stopped');
    recording.stop();
    speech_to_text();
}

// Functions 
function show_message(message) {
    const newMessage = document.createElement('div');
    newMessage.innerHTML = message.replace(/\n/g, '<br>');
    newMessage.classList.add('chat-bubble-user'); 
    chatBox.appendChild(newMessage);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function speech_to_text(){
    // Send the audio data to the Python script
    pyshell = new PythonShell('speech_to_text.py');
    let full_message = "";

    pyshell.on('message', function(message) {
        full_message += message;
    });

    pyshell.end(function (err) {
        if (err) {
            throw err;
        };
        // Display the message in the chat box
        show_message(full_message);
        // Ask the AI to respond
        // Example usage
        document.getElementById("generateButton").style.display = "block";
        llm(full_message, function(response) {
            document.getElementById("generateButton").style.display = "none";
            document.getElementById("abortButton").style.display = "block";
            text_to_speech(response);
        });
    });
}

function text_to_speech(message) {
    pyshell = new PythonShell('text_to_speech.py');

    pyshell.send(JSON.stringify(message));
    pyshell.end(function (err) {
      if (err){
        throw err;
      };
      document.getElementById("abortButton").style.display = "none";
      speech_to_avatar();
    })
}

function speech_to_avatar() {
    const options = {
        args: [
            '--checkpoint_path',
            'checkpoints/wav2lip.pth',
            '--face',
            'data/animation.mp4',
            '--audio',
            'data/output.mp3'
        ]
    };
    pyshell = new PythonShell('inference.py', options);
    pyshell.end(function (err) {
      if (err){
        throw err;
      };

    const videoPlayer = document.getElementById('videoPlayer');
    const sourceElement = videoPlayer.querySelector('source');
    const randomParam = Math.random();
    const newVideoSource = `results/result_voice.mp4?rand=${randomParam}`;
    // Set the new video source
    sourceElement.src = newVideoSource;
    // Ensure the 'loadedmetadata' event has occurred before playing
    videoPlayer.addEventListener('loadedmetadata', function() {
        videoPlayer.style.display = 'block';
        videoPlayer.style.opacity = '1';
        videoPlayer.play();

        // Listen for the 'ended' event and hide the video when it's done playing
        videoPlayer.addEventListener('ended', function() {
            videoPlayer.style.opacity = '0';
            videoPlayer.style.display = 'none';
        });
    });

    // Load the new video source
    videoPlayer.load();

    
    })
}

function llm(message, callback) {
    let full_message = "";
    let pyshell = new PythonShell('response.py');

    pyshell.send(JSON.stringify(message));
    pyshell.on('message', function(message) {
        full_message += message;
        full_message += "\n \n"
    })
    pyshell.end(function (err) {
      if (err){
        throw err;
      };
    // Display the response in the chat box
    const responseDiv = document.createElement('div');

    // Replace code blocks in the message with Prism classes
    let formattedMessage = full_message.replace(/```(python|javascript|html|css)([\s\S]*?)```/g, (match, language, code) => {
        const highlightedCode = Prism.highlight(code, Prism.languages[language], language);
        return `<pre class="language-${language}"><code class="language-${language}">${highlightedCode}</code></pre>`;
    });

    formattedMessage = formattedMessage.replace(/\n/g, '<br>');

    responseDiv.innerHTML = formattedMessage;
    responseDiv.classList.add('chat-bubble-ai');
    chatBox.appendChild(responseDiv);
    // Scroll to the bottom of the chat box to show the latest message and response
    chatBox.scrollTop = chatBox.scrollHeight;

    if (callback) {
        callback(full_message);
    }
    });
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Event Listeners 

document.addEventListener('keydown', (event) => {
    if (event.key === 'Shift') {
        startRecording();
    }
});

// Event listener for keyup (Alt released)
document.addEventListener('keyup', (event) => {
    if (event.key === 'Shift') {
        stopRecording();
    }
});

document.getElementById('abortButton').addEventListener('click', () => {
    if (pyshell) {
        pyshell.kill('SIGINT'); // You can use 'SIGTERM' or 'SIGKILL' based on your preference
    }
});

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
