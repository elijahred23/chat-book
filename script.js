document.addEventListener("DOMContentLoaded", () => {
	const promptsContainer = document.getElementById("promptsContainer");
	const responsesContainer = document.getElementById("responsesContainer");
	const addPromptBtn = document.getElementById("addPromptBtn");
	const generateBtn = document.getElementById("generateBtn");
	const printBtn = document.getElementById("printBtn");
	const numChapters = document.getElementById("numChapters");
	const updateChapters = document.getElementById("updateChapters");
	const updateSteps = document.getElementById("updateSteps");

	const progressBar = document.getElementById("progressBar");
	const progressRange = document.getElementById("progressRange");

	var prompts = [];

	const setPromptChapters = () => {
		prompts = [];
		prompts.push("Write table of contents for " + numChapters.value + " chapter book about ");

		for (let chapter = 1; chapter <= numChapters.value; chapter++) {
			prompts.push("write essay about chapter " + chapter + " from the table of contents with about 1000 words or more");
		}
		addPromptBtn.click();
	};
	const setPromptSteps = () => {
		prompts = [];
		prompts.push("Write step by step process that has " + numChapters.value + " steps total about ");

		for (let chapter = 1; chapter <= numChapters.value; chapter++) {
			prompts.push("write in detail how to execute step " + chapter + " from step by step process with about 1000 words with code if necessary or more");
		}
		addPromptBtn.click();
	}

	updateChapters.addEventListener("click", setPromptChapters);
	updateSteps.addEventListener("click", setPromptSteps);
	printBtn.addEventListener("click", () => {
		window.print();
	})


	setPromptChapters();


	const responses = [];
	var loading = false;
	var currentPromptIndex = 0;

	const setGenerateBtnState = () => {
		generateBtn.disabled = loading || currentPromptIndex >= prompts.length;
	};

	const addPrompt = () => {
		prompts.push("");
		renderPrompts();
	};

	const deletePrompt = (index) => {
		prompts.splice(index, 1);
		renderPrompts();
	};

	const updatePrompt = (index, value) => {
		prompts[index] = value;
	};

	const generateNextResponse = async (index) => {
		try {
			const prompt = prompts[index];
			currentPromptIndex = index;

			if (prompt) {
				const assistantMessage = await fetchMessageFromGpt(prompt);
				responses.push(assistantMessage);
				renderResponses();
			}
		} catch (e) {
			console.error(e);
		}
	};

	const fetchMessageFromGpt = async (newMessage) => {
		setLoading(true);
		const apiKey = '';

		const messages = [
			{ role: 'system', content: 'You are a helpful assistant.' },
			...(responses.length > 0 ? [{ role: 'system', content: responses[0] }] : []),
			{ role: 'user', content: newMessage }
		];



		try {
			const response = await fetch('https://api.openai.com/v1/chat/completions', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${apiKey}`,
				},
				body: JSON.stringify({
					messages,
					model: 'gpt-3.5-turbo',
				}),
			});

			const data = await response.json();
			const assistantMessage = data.choices[0].message.content;
			setLoading(false);
			return assistantMessage;
		} catch (error) {
			console.error(error);
			setLoading(false);
			return '';
		}
	};

	const setLoading = (value) => {
		loading = value;
		setGenerateBtnState();
	};

	const renderPrompts = () => {
		promptsContainer.innerHTML = "";
		prompts.forEach((prompt, index) => {
			const promptDiv = document.createElement("div");
			promptDiv.className = "prompt";
			promptDiv.style.backgroundColor = loading && currentPromptIndex === index ? "yellow" : "white";

			const input = document.createElement("input");
			input.type = "text";
			input.value = prompt;

			// Apply styling to the input element
			input.classList.add("input-style"); // Add the "input-style" class to the input element

			input.addEventListener("input", (e) => {
				updatePrompt(index, e.target.value);
			});

			const deleteButton = document.createElement("button");
			deleteButton.textContent = "Delete";
			deleteButton.classList.add("button");
			deleteButton.addEventListener("click", () => {
				deletePrompt(index);
			});

			promptDiv.appendChild(input);
			promptDiv.appendChild(deleteButton);
			promptsContainer.appendChild(promptDiv);
		});
	};


	const renderResponses = () => {
		responsesContainer.innerHTML = "";
		const converter = new showdown.Converter();

		responses.forEach((response, index) => {
			const responseDiv = document.createElement("div");
			responseDiv.className = "response";

			const roleDiv = document.createElement("div");
			roleDiv.className = "response-role";
			roleDiv.textContent = index % 2 === 0 ? "Assistant:" : "User:";

			const contentDiv = document.createElement("div");
			contentDiv.className = "response-content";

			// Convert Markdown to HTML using showdown
			const htmlContent = converter.makeHtml(response);
			contentDiv.innerHTML = htmlContent;

			responseDiv.appendChild(roleDiv);
			responseDiv.appendChild(contentDiv);
			responsesContainer.appendChild(responseDiv);
		});
	};

	addPromptBtn.addEventListener("click", addPrompt);

	generateBtn.addEventListener("click", async () => {
		try {
			progressBar.style.width = "0%";
			progressRange.value = 0;
			for (let index = 0; index < prompts.length; index++) {
				await generateNextResponse(index);

				const progress = ((index + 1) / prompts.length) * 100;

				// Use throttling with setTimeout for smoother updates
				setTimeout(() => {
					progressBar.style.width = `${progress}%`;
					progressRange.value = progress;
				}, index * 100); // Adjust the delay time as needed

				// Add a delay to slow down the loop (optional)
				await new Promise(resolve => setTimeout(resolve, 100));
			}


			promptsContainer.style.backgroundColor = "#D3D3D3";
		} catch (error) {
			console.error(error);
		}
	});


	setGenerateBtnState();
	renderPrompts();
});
