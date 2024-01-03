// Function to start the Python script
function startPythonScript() {
    const pythonScriptPath = path.join(__dirname, 'talk.py');

    const sudoPassword = 'fahrenheit911';

    // Construct the command to run with sudo and echo the password
    const command = `echo ${sudoPassword} | sudo -S python ${pythonScriptPath}`;

    // Spawn the sudo command
    const pythonProcess = spawn(command, [], { shell: true });

    // Handle data received from the Python process
    pythonProcess.stdout.on('data', (data) => {
        const result = JSON.parse(data.toString());

        // Display the message in the chat box
        const messageDiv = document.createElement('div');
        messageDiv.textContent = result.message;
        messageDiv.classList.add('chat-bubble-user');
        chatBox.appendChild(messageDiv);

        // Display the response in the chat box
        const responseDiv = document.createElement('div');
        responseDiv.textContent = result.response;
        responseDiv.classList.add('chat-bubble-ai');
        chatBox.appendChild(responseDiv);

        // Scroll to the bottom of the chat box to show the latest message and response
        chatBox.scrollTop = chatBox.scrollHeight;
    });

    // Handle errors from the Python process
    pythonProcess.stderr.on('data', (data) => {
        console.error(`Error from Python process: ${data}`);
    });

    // Handle the exit event of the Python process
    pythonProcess.on('exit', (code) => {
        console.log(`Python process exited with code ${code}`);
    });
}

// Call the function to start the Python script when needed
// For example, you might call it on a specific user action or event
//startPythonScript();