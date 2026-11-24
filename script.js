
// Get HTML elements

const expenseForm = document.getElementById("expenseForm");
const titleInput = document.getElementById("title");
const amountInput = document.getElementById("amount");
const categoryInput = document.getElementById("category");
const dateInput = document.getElementById("date");

const expenseList = document.getElementById("expenseList");
const totalExpense = document.getElementById("totalExpense");
const showBudget = document.getElementById("showBudget");
const remainingBudget = document.getElementById("remainingBudget");

const budgetInput = document.getElementById("budgetInput");
const budgetBtn = document.getElementById("budgetBtn");
const filterCategory = document.getElementById("filterCategory");
const categoryReport = document.getElementById("categoryReport");

const submitBtn = document.getElementById("submitBtn");
const cancelBtn = document.getElementById("cancelBtn");
// Profile elements

const profileSelect = document.getElementById("profileSelect");
const addProfileBtn = document.getElementById("addProfileBtn");

// Load saved profiles

let profiles = JSON.parse(
    localStorage.getItem("expenseProfiles") || "[]"
);

let profileData = JSON.parse(
    localStorage.getItem("expenseProfileData") || "{}"
);

// Create default profile if none exists

if (profiles.length === 0) {

    profiles = [
        {
            id: "personal",
            name: "Personal"
        }
    ];

}

// Save profile list

function saveProfiles() {

    localStorage.setItem(
        "expenseProfiles",
        JSON.stringify(profiles)
    );

}

// Select active profile

let activeProfileId =
    localStorage.getItem("activeExpenseProfile");

if (!profiles.some(p => p.id === activeProfileId)) {

    activeProfileId = profiles[0].id;

}

// Preserve existing expenses and budget

if (!profileData[activeProfileId]) {

    profileData[activeProfileId] = {

        expenses: JSON.parse(
            localStorage.getItem("expenses") || "[]"
        ),

        budget: Number(
            localStorage.getItem("budget") || 0
        )

    };

}

let expenses = profileData[activeProfileId].expenses;

let budget = profileData[activeProfileId].budget;

let editingId = null;

// Save current profile data

function saveCurrentProfile() {

    profileData[activeProfileId] = {
        expenses: expenses,
        budget: budget
    };

    localStorage.setItem(
        "expenseProfileData",
        JSON.stringify(profileData)
    );

}

// Set today's date

dateInput.value = new Date().toLocaleDateString("en-CA");


// Save expenses

function saveExpenses() {

    saveCurrentProfile();

}

// Format amount

function formatMoney(amount) {
    return "₹" + Number(amount).toLocaleString("en-IN", {
        maximumFractionDigits: 2
    });
}


// Add or update expense

expenseForm.addEventListener("submit", function(event) {

    event.preventDefault();

    const title = titleInput.value.trim();
    const amount = Number(amountInput.value);
    const category = categoryInput.value;
    const date = dateInput.value;

    if (!title || !category || !date || !Number.isFinite(amount) || amount <= 0) {
        alert("Please enter valid expense details.");
        return;
    }

    if (editingId !== null) {

        const index = expenses.findIndex(
            expense => expense.id === editingId
        );

        if (index !== -1) {
            expenses[index] = {
                id: editingId,
                title: title,
                amount: amount,
                category: category,
                date: date
            };
        }

        editingId = null;

        submitBtn.textContent = "Add Expense";
        cancelBtn.hidden = true;

    } else {

        const newExpense = {
            id: Date.now() + Math.random(),
            title: title,
            amount: amount,
            category: category,
            date: date
        };

        expenses.push(newExpense);
    }

    saveExpenses();

    expenseForm.reset();

    dateInput.value = new Date().toLocaleDateString("en-CA");

    displayExpenses();

});


// Display all expenses

function displayExpenses() {

    expenseList.replaceChildren();

    const selectedCategory = filterCategory.value;

    const filteredExpenses = expenses.filter(expense =>
        selectedCategory === "All" ||
        expense.category === selectedCategory
    );

    if (filteredExpenses.length === 0) {

        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 5;
        cell.className = "empty-message";
        cell.textContent = "No expenses found.";

        row.appendChild(cell);
        expenseList.appendChild(row);

    } else {

        filteredExpenses.forEach(expense => {

            const row = document.createElement("tr");

            const values = [
                expense.date,
                expense.title,
                expense.category,
                formatMoney(expense.amount)
            ];

            values.forEach(value => {
                const cell = document.createElement("td");
                cell.textContent = value;
                row.appendChild(cell);
            });

            const actionCell = document.createElement("td");

            const editButton = document.createElement("button");
            editButton.textContent = "Edit";
            editButton.className = "edit-btn";

            editButton.addEventListener("click", function() {
                editExpense(expense.id);
            });

            const deleteButton = document.createElement("button");
            deleteButton.textContent = "Delete";
            deleteButton.className = "delete-btn";

            deleteButton.addEventListener("click", function() {
                deleteExpense(expense.id);
            });

            actionCell.appendChild(editButton);
            actionCell.appendChild(deleteButton);

            row.appendChild(actionCell);

            expenseList.appendChild(row);

        });

    }

    updateSummary();
    showCategoryReport();
}


// Update dashboard calculations

function updateSummary() {

    const total = expenses.reduce(
        (sum, expense) => sum + Number(expense.amount), 0
    );

    const currentMonth = new Date().toLocaleDateString("en-CA").slice(0, 7);

    const monthlyTotal = expenses
        .filter(expense => expense.date.startsWith(currentMonth))
        .reduce((sum, expense) => sum + Number(expense.amount), 0);

    totalExpense.textContent = formatMoney(total);
    showBudget.textContent = formatMoney(budget);

    remainingBudget.textContent = formatMoney(
        budget - monthlyTotal
    );

}


// Edit expense

function editExpense(id) {

    const expense = expenses.find(
        item => item.id === id
    );

    if (!expense) return;

    titleInput.value = expense.title;
    amountInput.value = expense.amount;
    categoryInput.value = expense.category;
    dateInput.value = expense.date;

    editingId = id;

    submitBtn.textContent = "Update Expense";
    cancelBtn.hidden = false;

    expenseForm.scrollIntoView({
        behavior: "smooth"
    });

}


// Cancel editing

cancelBtn.addEventListener("click", function() {

    editingId = null;

    expenseForm.reset();

    dateInput.value = new Date().toLocaleDateString("en-CA");

    submitBtn.textContent = "Add Expense";
    cancelBtn.hidden = true;

});


// Delete expense

function deleteExpense(id) {

    const answer = confirm(
        "Are you sure you want to delete this expense?"
    );

    if (answer) {

        expenses = expenses.filter(
            expense => expense.id !== id
        );

        saveExpenses();
        displayExpenses();

    }

}


// Save monthly budget

budgetBtn.addEventListener("click", function() {

    const value = budgetInput.value.trim();
    const newBudget = Number(value);

    if (value === "" || !Number.isFinite(newBudget) || newBudget < 0) {
        alert("Please enter a valid budget.");
        return;
    }

    budget = newBudget;

    saveCurrentProfile();

    budgetInput.value = "";

    updateSummary();

    alert("Budget saved successfully!");

});


// Filter expenses

filterCategory.addEventListener("change", function() {

    displayExpenses();

});


// Show category report

function showCategoryReport() {

    categoryReport.replaceChildren();

    const categoryTotals = {};

    expenses.forEach(expense => {

        if (!categoryTotals[expense.category]) {
            categoryTotals[expense.category] = 0;
        }

        categoryTotals[expense.category] += Number(expense.amount);

    });

    for (const category in categoryTotals) {

        const paragraph = document.createElement("p");

        paragraph.textContent =
            category + ": " + formatMoney(categoryTotals[category]);

        categoryReport.appendChild(paragraph);

    }

    if (Object.keys(categoryTotals).length === 0) {

        const paragraph = document.createElement("p");
        paragraph.textContent = "No report available yet.";

        categoryReport.appendChild(paragraph);

    }

}
// Display available profiles

function displayProfiles() {

    profileSelect.replaceChildren();

    profiles.forEach(profile => {

        const option = document.createElement("option");

        option.value = profile.id;
        option.textContent = profile.name;

        profileSelect.appendChild(option);

    });

    profileSelect.value = activeProfileId;

}


// Add new profile

addProfileBtn.addEventListener("click", function() {

    const name = prompt("Enter profile name:");

    if (!name || !name.trim()) {
        return;
    }

    const profileName = name.trim();

    const alreadyExists = profiles.some(
        profile =>
            profile.name.toLowerCase() === profileName.toLowerCase()
    );

    if (alreadyExists) {

        alert("This profile already exists.");
        return;

    }

    const newProfile = {

        id: "profile_" + Date.now(),

        name: profileName

    };

    profiles.push(newProfile);

    profileData[newProfile.id] = {

        expenses: [],

        budget: 0

    };

    saveProfiles();

    saveCurrentProfile();

    switchProfile(newProfile.id);

});


// Switch between profiles

function switchProfile(profileId) {

    saveCurrentProfile();

    // Cancel any ongoing editing

    editingId = null;

    expenseForm.reset();

    dateInput.value = new Date().toLocaleDateString("en-CA");

    submitBtn.textContent = "Add Expense";

    cancelBtn.hidden = true;

    // Load selected profile

    activeProfileId = profileId;

    localStorage.setItem(
        "activeExpenseProfile",
        activeProfileId
    );

    const selectedProfile = profileData[activeProfileId];

    expenses = selectedProfile.expenses;

    budget = selectedProfile.budget;

    // Refresh dashboard

    displayProfiles();

    displayExpenses();

}


// Profile dropdown event

profileSelect.addEventListener("change", function() {

    switchProfile(profileSelect.value);

});

// Show saved data when website opens

displayProfiles();

displayExpenses();
