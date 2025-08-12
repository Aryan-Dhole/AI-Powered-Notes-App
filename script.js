const OPENROUTER_API_KEY = "YOUR_OPENROUTER_KEY_HERE"; // replace with your real key
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";


const titleInput = document.getElementById("noteTitle");
const tagInput = document.getElementById("noteTags");
const contentInput = document.getElementById("noteContent");
const addBtn = document.getElementById("addNoteBtn");
const searchInput = document.getElementById("searchInput");

let notes = JSON.parse(localStorage.getItem('notes')) || [];
// Upgrade old notes so they have tags array
notes = notes.map(note => {
  if (!Array.isArray(note.tags)) note.tags = [];
  if (typeof note.summary !== "string") note.summary = "";
  return note;
});
renderNotes();

// Add Note
addBtn.addEventListener("click", () => {
  const title = titleInput.value.trim();
  const tags = tagInput.value
    .trim()
    .split(",")
    .map(t => t.trim())
    .filter(t => t);
  const content = contentInput.value.trim();

  if (!title || !content) {
    alert("Title and content is required");
    return;
  }

  const newNote = {
    title,
    tags,
    content,
    date: new Date().toLocaleString(),
    summary: ""
  };

  notes.push(newNote);
  localStorage.setItem('notes', JSON.stringify(notes));
  renderNotes();

  // Clear inputs
  titleInput.value = "";
  tagInput.value = "";
  contentInput.value = "";
});

// Main render
function renderNotes() {
  const container = document.getElementById("notesContainer");
  container.innerHTML = "";

  notes.forEach((note, index) => {
    const noteCard = document.createElement("div");
    noteCard.className = "col-md-4 mb-3";

    const tagsHtml = (note.tags && note.tags.length)
      ? note.tags.map(tag => `<span class="badge bg-success me-1">${escapeHtml(tag)}</span>`).join("")
      : `<small class="text-muted">No tags</small>`;

    noteCard.innerHTML = `
          <div class="card h-100">
            <div class="card-body">
              <h5 class="card-title">${escapeHtml(note.title)}</h5>
              <h6 class="card-subtitle mb-2">${tagsHtml}</h6>
              <p class="card-text">${escapeHtml(note.content)}</p>
              ${note.summary ? `<p class="summary-text text-info mt-2">${escapeHtml(note.summary)}</p>` : ""}
            </div>
            <div class="card-footer d-flex justify-content-between align-items-center">
              <small class="text-muted">${note.date}</small>
              <div>
                <button class="btn btn-sm btn-info summarize-btn me-1" data-index="${index}">Summarize</button>
                <button class="btn btn-sm btn-danger delete-btn" data-index="${index}">Delete</button>
              </div>
            </div>
          </div>
        `;

    container.appendChild(noteCard);
  });

  attachNoteHandlers();
}

// Render filtered notes
function renderFilteredNotes(filteredNotes) {
  const container = document.getElementById("notesContainer");
  container.innerHTML = "";

  filteredNotes.forEach(note => {
    const noteCard = document.createElement("div");
    noteCard.className = "col-md-4 mb-3";

    const tagsHtml = (note.tags && note.tags.length)
      ? note.tags.map(tag => `<span class="badge bg-success me-1">${escapeHtml(tag)}</span>`).join("")
      : `<small class="text-muted">No tags</small>`;

    const originalIndex = notes.indexOf(note) !== -1
      ? notes.indexOf(note)
      : notes.findIndex(n =>
        n.title === note.title &&
        n.content === note.content &&
        n.date === note.date
      );

    noteCard.innerHTML = `
          <div class="card h-100">
            <div class="card-body">
              <h5 class="card-title">${escapeHtml(note.title)}</h5>
              <h6 class="card-subtitle mb-2">${tagsHtml}</h6>
              <p class="card-text">${escapeHtml(note.content)}</p>
              ${note.summary ? `<p class="summary-text text-info mt-2">${escapeHtml(note.summary)}</p>` : ""}
            </div>
            <div class="card-footer d-flex justify-content-between align-items-center">
              <small class="text-muted">${note.date}</small>
              <div>
                <button class="btn btn-sm btn-info summarize-btn me-1" data-index="${originalIndex}">Summarize</button>
                <button class="btn btn-sm btn-danger delete-btn" data-index="${originalIndex}">Delete</button>
              </div>
            </div>
          </div>
        `;

    container.appendChild(noteCard);
  });

  attachNoteHandlers();
}

// Delete handler
function attachDeleteHandlers() {
  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const idx = Number(e.currentTarget.dataset.index);
      if (isNaN(idx) || idx < 0) return;
      notes.splice(idx, 1);
      localStorage.setItem('notes', JSON.stringify(notes));
      renderNotes();
    });
  });
}

// Live search
searchInput.addEventListener("input", () => {
  const query = searchInput.value.trim().toLowerCase();

  if (!query) {
    renderNotes();
    return;
  }

  const filtered = notes.filter(note => {
    const titleMatch = note.title.toLowerCase().includes(query);
    const tagMatch = Array.isArray(note.tags) && note.tags.some(tag => tag.toLowerCase().includes(query));
    return titleMatch || tagMatch;
  });
  localStorage.setItem("searchQuery", query);

  renderFilteredNotes(filtered);
});

// Escape HTML helper
function escapeHtml(str) {
  if (!str) return "";
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// Restore last search on page load
const savedQuery = localStorage.getItem("searchQuery") || "";
if (savedQuery) {
  searchInput.value = savedQuery;
  const filtered = notes.filter(note => {
    const titleMatch = note.title.toLowerCase().includes(savedQuery);
    const tagMatch = Array.isArray(note.tags) && note.tags.some(tag => tag.toLowerCase().includes(savedQuery));
    return titleMatch || tagMatch;
  });
  renderFilteredNotes(filtered);
}


function attachNoteHandlers() {
  // Delete Handlers
  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {

      const idx = Number(e.currentTarget.dataset.index)

      if (isNaN(idx) || idx < 0) return;
      notes.splice(idx, 1)
      localStorage.setItem("notes", JSON.stringify(notes))
      renderNotes()
    })
  })

  //summarize handlers

  document.querySelectorAll(".summarize-btn").forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const idx = Number(e.currentTarget.dataset.index)
      if (isNaN(idx) || idx < 0) return;
      const noteToSummarize = notes[idx]

      const cardBody = e.currentTarget.closest(".card").querySelector(".card-body")
      let summaryEl = cardBody.querySelector(".summary-text");
      if (!summaryEl) {
        summaryEl = document.createElement("p");
        summaryEl.className = "summary-text text-info mt-2";
        cardBody.appendChild(summaryEl);
      }
      summaryEl.textContent = "Summarizing...";

      try {
        const res = await fetch(OPENROUTER_URL, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "openai/gpt-3.5-turbo",
            messages: [
              { role: "system", content: "You are a helpful assistant that summarizes notes." },
              { role: "user", content: `Summarize this note in one short sentence: ${noteToSummarize.content}` }
            ],
            max_tokens: 50
          })
        });

        const data = await res.json();
        const summary = data.choices?.[0]?.message?.content?.trim() || "No summary available.";
        summaryEl.textContent = "";
        let i = 0;
        function typeWriter() {
          if (i < summary.length) {
            summaryEl.textContent += summary[i];
            i++;
            setTimeout(typeWriter, 30); // speed in ms
          }
        }
        typeWriter();

        notes[idx].summary = summary;
        localStorage.setItem('notes', JSON.stringify(notes));
      } catch (err) {
        summaryEl.textContent = "Error summarizing note.";
        console.error(err);
      }
    })
  })
}

