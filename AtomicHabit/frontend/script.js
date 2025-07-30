const API = "http://localhost:8080/habits";

const habitForm = document.getElementById("habitForm");
const habitList = document.getElementById("habitList");
const toast = document.getElementById("toast");
const modeToggle = document.getElementById("modeToggle");
const submitButton = habitForm.querySelector("button[type='submit']"); // Get the submit button

let editingHabitId = null; // To store the ID of the habit being edited

habitForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const habitData = {
    title: document.getElementById("title").value,
    description: document.getElementById("description").value,
    category: document.getElementById("category").value,
    reminderDate: document.getElementById("reminderDate").value,
    // Completed status is managed by the checkbox, not directly set on form submit for new/update
    // When adding a new habit, it's always false. When updating, the existing status is maintained by the backend.
  };

  if (editingHabitId) {
    // If editing an existing habit
    try {
      const res = await fetch(`${API}/update/${editingHabitId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(habitData)
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to update habit: ${errorText}`);
      }

      showToast("Habit Updated");
      cancelEdit(); // Reset form and state
      loadHabits();
    } catch (error) {
      showToast(`Error Updating Habit: ${error.message}`);
      console.error("Error updating habit:", error);
    }
  } else {
    // If adding a new habit
    habitData.completed = false; // New habits start as incomplete
    try {
      const res = await fetch(`${API}/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(habitData)
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to add habit: ${errorText}`);
      }

      showToast("Habit Added");
      habitForm.reset();
      loadHabits();
    } catch (error) {
      showToast(`Error Adding Habit: ${error.message}`);
      console.error("Error adding habit:", error);
    }
  }
});

async function loadHabits() {
  habitList.innerHTML = "<tr><td colspan='6'>Loading habits...</td></tr>"; // Loading indicator
  try {
    const res = await fetch(`${API}/all`);
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to fetch habits: ${errorText}`);
    }
    const habits = await res.json();

    habitList.innerHTML = ""; // Clear loading indicator
    if (habits.length === 0) {
      habitList.innerHTML = "<tr><td colspan='6'>No habits found. Add a new one!</td></tr>";
      return;
    }

    habits.forEach(habit => {
      const row = document.createElement("tr");
      if (habit.completed) row.classList.add("completed");

      row.innerHTML = `
        <td><input type="checkbox" ${habit.completed ? "checked" : ""} onchange="toggleComplete(${habit.id}, this.checked)"></td>
        <td>${habit.title}</td>
        <td>${habit.description}</td>
        <td>${habit.category || "-"}</td>
        <td>${habit.reminderDate || "-"}</td>
        <td>
          <button onclick="deleteHabit(${habit.id})" title="Delete">🗑️</button>
          <button onclick="editHabit(${habit.id})" title="Edit">✏️</button>
        </td>
      `;
      habitList.appendChild(row);
    });
  } catch (error) {
    showToast(`Error Loading Habits: ${error.message}`);
    console.error("Error loading habits:", error);
    habitList.innerHTML = `<tr><td colspan='6' style="color: red;">Failed to load habits. Please check the server.</td></tr>`;
  }
}

async function deleteHabit(id) {
  if (!confirm("Are you sure you want to delete this habit?")) {
    return; // User cancelled
  }

  try {
    const res = await fetch(`${API}/delete/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to delete habit: ${errorText}`);
    }
    showToast("Habit Deleted");
    loadHabits();
  } catch (error) {
    showToast(`Error Deleting Habit: ${error.message}`);
    console.error("Error deleting habit:", error);
  }
}

async function toggleComplete(id, completed) {
  try {
    // Fetch the specific habit to get its current state (if needed, though PUT body might suffice)
    // A direct PATCH or PUT to update only 'completed' status would be more efficient if your API supports it.
    // For now, we'll fetch the whole habit and send it back with updated completed status.
    const getRes = await fetch(`${API}/all`); // Still using /all as per your original structure
    if (!getRes.ok) {
        throw new Error(`Failed to fetch habits for toggle: ${await getRes.text()}`);
    }
    const habits = await getRes.json();
    const habitToUpdate = habits.find(h => h.id === id);

    if (!habitToUpdate) {
        throw new Error(`Habit with ID ${id} not found.`);
    }

    habitToUpdate.completed = completed; // Update the completed status locally

    const updateRes = await fetch(`${API}/update/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(habitToUpdate)
    });

    if (!updateRes.ok) {
      const errorText = await updateRes.text();
      throw new Error(`Failed to update completion status: ${errorText}`);
    }

    showToast(completed ? "Marked Complete" : "Marked Incomplete");
    loadHabits(); // Reload habits to update UI
  } catch (error) {
    showToast(`Error Toggling Habit: ${error.message}`);
    console.error("Error toggling habit completion:", error);
  }
}

async function editHabit(id) {
  try {
    // Fetch all habits to find the one to edit (still based on your /all endpoint)
    const res = await fetch(`${API}/all`);
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to fetch habits for edit: ${errorText}`);
    }
    const habits = await res.json();
    const habit = habits.find(h => h.id === id);

    if (habit) {
      document.getElementById("title").value = habit.title;
      document.getElementById("description").value = habit.description;
      document.getElementById("category").value = habit.category;
      document.getElementById("reminderDate").value = habit.reminderDate;

      editingHabitId = habit.id; // Set the ID of the habit being edited
      submitButton.textContent = "Update Habit"; // Change button text
      // Optionally add a "Cancel Edit" button
      if (!document.getElementById("cancelEditButton")) {
          const cancelButton = document.createElement("button");
          cancelButton.id = "cancelEditButton";
          cancelButton.textContent = "Cancel Edit";
          cancelButton.type = "button"; // Important: prevent it from submitting the form
          cancelButton.onclick = cancelEdit;
          // Insert after the submit button or in a dedicated spot
          submitButton.parentNode.insertBefore(cancelButton, submitButton.nextSibling);
      }
      showToast(`Editing "${habit.title}"`);
    } else {
      showToast("Habit not found for editing.");
    }
  } catch (error) {
    showToast(`Error Preparing for Edit: ${error.message}`);
    console.error("Error preparing for habit edit:", error);
  }
}

function cancelEdit() {
  editingHabitId = null;
  habitForm.reset();
  submitButton.textContent = "Add Habit";
  const cancelButton = document.getElementById("cancelEditButton");
  if (cancelButton) {
    cancelButton.remove();
  }
  showToast("Edit cancelled.");
}


function showToast(msg) {
  toast.textContent = msg;
  toast.style.display = "block";
  // Clear any existing timeout to prevent rapid toast flickering
  if (toast.timeoutId) {
    clearTimeout(toast.timeoutId);
  }
  toast.timeoutId = setTimeout(() => {
    toast.style.display = "none";
    toast.timeoutId = null;
  }, 3000); // Increased duration slightly for better readability
}

// Dark mode toggle
modeToggle.addEventListener("change", () => {
  document.body.classList.toggle("dark");
});

// Initial load of habits when the page loads
loadHabits();